import { NextRequest, NextResponse } from "next/server";
import {
    getMeeting,
    getMeetingWorkflow,
    getFacilitator,
    getAgent,
    addMessage,
    updateMeeting,
    getMessages
} from "@/lib/firestore";
import { executeNextStep, ExecutionContext } from "@/lib/workflow-engine";
import { Agent } from "@/types/agent";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const meetingId = params.id;

    try {
        // 1. 各種データの取得（並列で爆速化！🚀）
        const meeting = await getMeeting(meetingId);
        if (!meeting) {
            return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
        }

        if (meeting.status === "completed") {
            return NextResponse.json({ error: "Meeting already completed" }, { status: 400 });
        }

        if (meeting.status === "waiting") {
            return NextResponse.json({ error: "Meeting is waiting for user intervention" }, { status: 400 });
        }

        if (!meeting.workflow_id) {
            return NextResponse.json({ error: "Workflow not configured for this meeting" }, { status: 400 });
        }

        const workflow = await getMeetingWorkflow(meeting.workflow_id);
        if (!workflow) {
            return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
        }

        const facilitator = await getFacilitator(meeting.facilitator_id);
        if (!facilitator) {
            return NextResponse.json({ error: "Facilitator not found" }, { status: 404 });
        }

        // 2. エージェントの収集（Map形式に変換）
        const agentsMap = new Map<string, Agent>();
        const agentPromises = meeting.agent_ids.map(async (id) => {
            const agent = await getAgent(id);
            if (agent) agentsMap.set(id, agent);
        });
        await Promise.all(agentPromises);

        // 3. メッセージ履歴の取得
        // ※ lib/firestore.ts に getMessages が必要そうなので追加する想定
        // とりあえず、ここでは最新のメッセージを取得する
        const messages = await getMessages(meetingId);

        // 4. 実行コンテキストの構築
        const context: ExecutionContext = {
            meeting,
            workflow,
            facilitator,
            agents: agentsMap,
            messages,
            whiteboard: meeting.whiteboard,
        };

        // 5. 実行エンジンで次のステップを処理！🔥
        const result = await executeNextStep(context);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // 6. 結果の保存
        // 生成されたメッセージを一つずつ保存（並列でドーン！）
        const messagePromises = result.messages.map(msg =>
            addMessage({
                meeting_id: meetingId,
                agent_id: msg.agent_id,
                agent_name: msg.agent_name,
                content: msg.content,
            })
        );
        await Promise.all(messagePromises);

        // ステップ番号の更新とステータス変更
        const nextStepNumber = (meeting.current_step || 0) + 1;
        const isLastStep = nextStepNumber >= workflow.steps.length;

        const updateData: any = {
            current_step: nextStepNumber,
            status: result.status, // in_progress | waiting | completed
        };

        // もし最後のメッセージが議長（Summary）なら結果を格納
        if (result.status === "completed" && result.messages.length > 0) {
            updateData.final_conclusion = result.messages[0].content;
            updateData.completed_at = new Date();
        }

        await updateMeeting(meetingId, updateData);

        // 7. レスポンスを返却💅
        return NextResponse.json({
            success: true,
            current_step: nextStepNumber,
            total_steps: workflow.steps.length,
            status: result.status,
            executed_step: workflow.steps[meeting.current_step || 0],
            messages: result.messages
        });

    } catch (error: any) {
        console.error("API Error (/run/next):", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
