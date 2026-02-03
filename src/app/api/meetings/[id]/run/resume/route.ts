import { NextRequest, NextResponse } from "next/server";
import {
    getMeeting,
    getMeetingWorkflow,
    // getFacilitator,  // ❌ 削除
    getAgent,
    addMessage,
    updateMeeting,
    getMessages
} from "@/lib/firestore";
import { executeNextStep, ExecutionContext } from "@/lib/workflow-engine";
import { Agent } from "@/types/agent";

/**
 * 🆕 ユーザー介入後に会議を再開するAPI
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const meetingId = params.id;

    try {
        const body = await request.json().catch(() => ({}));
        const { whiteboard: newWhiteboard } = body;

        // 1. 会議データの取得
        const meeting = await getMeeting(meetingId);
        if (!meeting) {
            return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        // 2. ステータスチェック（待機中以外はエラー）💅
        if (meeting.status !== "waiting") {
            return NextResponse.json({ error: "Meeting is not waiting for user intervention" }, { status: 400 });
        }

        // 3. ホワイトボードの更新（もしあれば）🛡️
        if (newWhiteboard !== undefined) {
            await updateMeeting(meetingId, { whiteboard: newWhiteboard });
            meeting.whiteboard = newWhiteboard; // コンテキスト用にも反映
        }

        // 4. ステータスを "in_progress" に戻して実行準備
        // ※ 実行エンジンを呼ぶ直前に meeting オブジェクトを最新ステータスにしておく
        meeting.status = "in_progress";

        // --- 以下、/run/next と同等の実行ロジック ---

        if (!meeting.workflow_id) {
            return NextResponse.json({ error: "Workflow not configured for this meeting" }, { status: 400 });
        }

        const workflow = await getMeetingWorkflow(meeting.workflow_id);
        if (!workflow) {
            return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
        }

        // ❌ 削除: facilitator取得
        // const facilitator = await getFacilitator(meeting.facilitator_id);
        // if (!facilitator) {
        //     return NextResponse.json({ error: "Facilitator not found" }, { status: 404 });
        // }

        // エージェントの収集
        const agentsMap = new Map<string, Agent>();
        const uniqueAgentIds = new Set([
            ...workflow.agent_ids,
            ...(meeting.summary_agent_id ? [meeting.summary_agent_id] : [])
        ]);

        const agentPromises = Array.from(uniqueAgentIds).map(async (id) => {
            const agent = await getAgent(id);
            if (agent) agentsMap.set(id, agent);
        });
        await Promise.all(agentPromises);

        // メッセージ履歴の取得
        const messages = await getMessages(meetingId);

        // 実行コンテキストの構築
        const context: ExecutionContext = {
            meeting,
            workflow,
            // facilitator,  // ❌ 削除
            agents: agentsMap,
            messages,
            whiteboard: meeting.whiteboard,
        };

        // 次のステップを処理！🔥
        const result = await executeNextStep(context);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // 結果の保存
        const nextStepNumber = (meeting.current_step || 0) + 1;

        const messagePromises = result.messages.map(msg => {
            const messageData: any = {
                meeting_id: meetingId,
                agent_id: msg.agent_id,
                agent_name: msg.agent_name,
                agent_role: msg.agent_role,
                step_number: nextStepNumber,
                content: msg.content,
            };

            if (msg.agent_avatar_url) {
                messageData.agent_avatar_url = msg.agent_avatar_url;
            }

            return addMessage(messageData);
        });
        await Promise.all(messagePromises);

        const updateData: any = {
            current_step: nextStepNumber,
            status: result.status,
        };

        if (result.status === "completed" && result.messages.length > 0) {
            updateData.final_conclusion = result.messages[0].content;
            updateData.completed_at = new Date();
        }

        await updateMeeting(meetingId, updateData);

        return NextResponse.json({
            success: true,
            current_step: nextStepNumber,
            total_steps: workflow.steps.length,
            status: result.status,
            executed_step: workflow.steps[meeting.current_step || 0],
            messages: result.messages
        });

    } catch (error: any) {
        console.error("API Error (/run/resume):", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
