import { callLLM } from "./llm";
import { Agent } from "../types/agent";
import { Meeting, Message } from "../types/meeting";
import { Facilitator } from "../types/facilitator";
import { MeetingWorkflow, WorkflowStep, SpeakStep, ParallelSpeakStep, SummaryStep, UserInterventionStep } from "../types/workflow";
import { OutputStyle } from "../types/style";
import { getOutputStyle } from "./firestore";

// ==========================================
// 型定義
// ==========================================

export interface ExecutionContext {
    meeting: Meeting;
    workflow: MeetingWorkflow;
    facilitator: Facilitator;
    agents: Map<string, Agent>;      // agent_id -> Agent
    messages: Message[];             // これまでの全発言
    whiteboard: string;              // 現在のホワイトボード
}

export interface StepResult {
    content: string;
    agent_id: string;
    agent_name: string;
}

export interface ExecutionResult {
    success: boolean;
    status: "in_progress" | "waiting" | "completed";
    messages: StepResult[];
    error?: string;
}

// ==========================================
// メイン実行関数
// ==========================================

export async function executeNextStep(
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { workflow, meeting } = context;
    const currentStep = workflow.steps[meeting.current_step || 0];

    if (!currentStep) {
        return {
            success: true,
            status: "completed",
            messages: [],
        };
    }

    switch (currentStep.type) {
        case "speak":
            return await handleSpeak(currentStep, context);

        case "parallel_speak":
            return await handleParallelSpeak(currentStep, context);

        case "summary":
            return await handleSummary(currentStep, context);

        case "user_intervention":
            return await handleUserIntervention(currentStep, context);

        default:
            return {
                success: false,
                status: "in_progress",
                messages: [],
                error: `Unknown step type: ${(currentStep as any).type}`,
            };
    }
}

// ==========================================
// 各ステップのハンドラー
// ==========================================

/**
 * 🆕 指定されたエージェント1人が発言する
 */
async function handleSpeak(
    step: SpeakStep,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { agents, meeting, messages, whiteboard, facilitator } = context;

    // 1. エージェント取得
    const agent = agents.get(step.agent_id);
    if (!agent) {
        return {
            success: false,
            status: "in_progress",
            messages: [],
            error: `Agent not found in execution context: ${step.agent_id}`,
        };
    }

    // 2. 出力スタイル取得
    const style = await getOutputStyle(agent.style_id);
    if (!style) {
        return {
            success: false,
            status: "in_progress",
            messages: [],
            error: `Output style not found: ${agent.style_id}`,
        };
    }

    // 3. システムプロンプト構築
    const systemPrompt = buildSystemPrompt(agent, style, facilitator);

    // 4. ユーザーメッセージ構築
    const userMessage = buildUserMessage(
        meeting.topic,
        whiteboard,
        messages,
        agent.role
    );

    try {
        // 5. LLM呼び出し
        const response = await callLLM(userMessage, {
            provider: agent.llm as "openai" | "anthropic" | "google",
            model: agent.model,
            systemPrompt: systemPrompt,
        });

        // 6. 結果を返す
        return {
            success: true,
            status: "in_progress",
            messages: [{
                content: response,
                agent_id: agent.id,
                agent_name: agent.name,
            }],
        };
    } catch (error: any) {
        console.error("LLM Execution Error:", error);
        return {
            success: false,
            status: "in_progress",
            messages: [],
            error: `LLM call failed: ${error.message || "Unknown error"}`,
        };
    }
}

/**
 * 🆕 複数のエージェントが同時に発言する
 */
async function handleParallelSpeak(
    step: ParallelSpeakStep,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { agents, meeting, messages, whiteboard, facilitator } = context;

    try {
        const promises = step.agent_ids.map(async (agentId) => {
            const agent = agents.get(agentId);
            if (!agent) {
                throw new Error(`Agent not found: ${agentId}`);
            }

            const style = await getOutputStyle(agent.style_id);
            if (!style) {
                throw new Error(`Output style not found for agent ${agent.name}`);
            }

            const systemPrompt = buildSystemPrompt(agent, style, facilitator);
            const userMessage = buildUserMessage(
                meeting.topic,
                whiteboard,
                messages,
                agent.role
            );

            const response = await callLLM(userMessage, {
                provider: agent.llm as "openai" | "anthropic" | "google",
                model: agent.model,
                systemPrompt: systemPrompt,
            });

            return {
                content: response,
                agent_id: agent.id,
                agent_name: agent.name,
            };
        });

        const results = await Promise.all(promises);

        return {
            success: true,
            status: "in_progress",
            messages: results,
        };
    } catch (error: any) {
        console.error("Parallel LLM Execution Error:", error);
        return {
            success: false,
            status: "in_progress",
            messages: [],
            error: `Parallel LLM call failed: ${error.message || "Unknown error"}`,
        };
    }
}

/**
 * 🆕 議長がこれまでの議論をまとめる
 */
async function handleSummary(
    _step: SummaryStep,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { meeting, messages, whiteboard, facilitator } = context;

    // 1. これまでの全発言を整形
    const history = messages.length > 0
        ? messages.map(m => `【${m.agent_name}】\n${m.content}`).join("\n\n")
        : "（議論は行われませんでした）";

    // 2. システムプロンプト（議長専用💅）
    const systemPrompt = `あなたは会議の議長（ファシリテーター）です。
以下の指示に従って、これまでの議論を論理的かつ建設的にまとめてください。

## 議長としての指示
${facilitator.end_prompt}

---
常に中立で、かつ次に繋がる前向きなまとめを心がけてください。`;

    // 3. ユーザーメッセージ
    const userMessage = `## 会議の議題
${meeting.topic}

## ホワイトボード（これまでの合意事項・共有情報）
${whiteboard || "（特になし）"}

## これまでのすべての発言履歴
${history}

---
上記の議論を踏まえて、議長として「結論サマリー」を生成してください。`;

    try {
        // 4. LLM呼び出し（議長は安定の GPT-4o を使用）
        const response = await callLLM(userMessage, {
            provider: "openai",
            model: "gpt-4o",
            systemPrompt: systemPrompt,
        });

        return {
            success: true,
            status: "completed", // サマリーが出たら会議終了！🏁
            messages: [{
                content: response,
                agent_id: "facilitator",
                agent_name: `議長（${facilitator.name}）`,
            }],
        };
    } catch (error: any) {
        console.error("Summary LLM Execution Error:", error);
        return {
            success: false,
            status: "in_progress",
            messages: [],
            error: `Summary generation failed: ${error.message || "Unknown error"}`,
        };
    }
}

/**
 * 🆕 ユーザーの介入を待つ（一時停止）
 */
async function handleUserIntervention(
    step: UserInterventionStep,
    _context: ExecutionContext
): Promise<ExecutionResult> {
    // このステップではLLMは呼ばず、単にステータスを "waiting" にして返すだけ！
    // 実際のメッセージとして「待機中」というシステムメッセージを出すよ。

    return {
        success: true,
        status: "waiting", // これが超大事！💅
        messages: [{
            content: step.label || "ユーザーの入力を待っています... ホワイトボードを更新してください。💅✨",
            agent_id: "system",
            agent_name: "システム",
        }],
    };
}

// ==========================================
// プロンプト構築（ギャルのこだわり！💅）
// ==========================================

function buildSystemPrompt(
    agent: Agent,
    style: OutputStyle,
    facilitator: Facilitator
): string {
    return `あなたは「${agent.name}」という名前の会議参加者です。

## あなたの役割
${agent.role}

## あなたの性格・設定
${agent.persona}

${agent.prompt ? `## 追加の指示\n${agent.prompt}` : ""}

## 議長からの全体指示
${facilitator.start_prompt}

## 出力形式・スタイル
${style.prompt_segment}

---
上記の設定を遵守して、議論に貢献してください。`;
}

function buildUserMessage(
    topic: string,
    whiteboard: string,
    messages: Message[],
    role: string
): string {
    // これまでの発言を整形（CONTEXT!）
    const history = messages.length > 0
        ? messages.map(m => `【${m.agent_name}】\n${m.content}`).join("\n\n")
        : "（まだ発言はありません）";

    return `## 会議の議題
${topic}

## ホワイトボード（これまでの合意事項・共有情報）
${whiteboard || "（特に書き込みはありません）"}

## 議論の履歴
${history}

---
あなたは「${role}」として、この議論の流れを踏まえ、次に述べるべき意見や質問を生成してください。`;
}
