import { callLLM } from "./llm";
import { Agent } from "../types/agent";
import { Meeting, Message } from "../types/meeting";
import { MeetingWorkflow, WorkflowStep, SpeakStep, ParallelSpeakStep, SummaryStep, UserInterventionStep } from "../types/workflow";
import { OutputStyle } from "../types/style";
import { getOutputStyle } from "./firestore";
import { GoogleGenerativeAI } from "@google/generative-ai"; // 🆕 これ忘れてた！

// ==========================================
// 型定義
// ==========================================

export interface ExecutionContext {
    meeting: Meeting;
    workflow: MeetingWorkflow;
    // facilitator: Facilitator;      // ❌ 削除
    agents: Map<string, Agent>;      // agent_id -> Agent
    messages: Message[];             // これまでの全発言
    whiteboard: string;              // 現在のホワイトボード
}

export interface StepResult {
    content: string;
    agent_id: string;
    agent_name: string;
    agent_role: string;
    agent_avatar_url?: string;
    usage?: {
        input_tokens: number;
        output_tokens: number;
    };
}

export interface ExecutionResult {
    success: boolean;
    status: "in_progress" | "waiting" | "completed";
    messages: StepResult[];
    total_usage?: {
        input_tokens: number;
        output_tokens: number;
    };
    error?: string;
}

/**
 * 🆕 モデル名をAPIが受け取れる形式に変換するよ！💅
 */
function normalizeModelId(modelId: string): string {
    const mapping: Record<string, string> = {
        // --- Google Gemini (2026 Feb 最新仕様) ---
        // 404エラーの正体: プレビューモデルは "-preview" が必須だよ💅
        "gemini-3-flash": "gemini-3-flash-preview",
        "gemini-3-pro": "gemini-3-pro-preview",
        "gemini-flash-latest": "gemini-3-flash-preview",

        // --- Anthropic Claude (2026 Feb 最新仕様) ---
        // 仕様書準拠: 識別子に正確な日付または最新エイリアスを指定
        "claude-4.5-sonnet": "claude-4-5-sonnet-20250929",
        "claude-4.5-opus": "claude-4-5-opus-20251101",
        "claude-4.5-haiku": "claude-4-5-haiku-20251015",

        // --- OpenAI GPT-5 (2026 Feb 最新仕様) ---
        // GPT-5.2が主流だけどAPIでは chat-latest 等が推奨
        "gpt-5": "gpt-5-chat-latest",
        "gpt-5-thinking": "gpt-5",
    };
    return mapping[modelId] || modelId;
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
    const { agents, meeting, messages, whiteboard, workflow } = context;

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
    const startPrompt = meeting.start_prompt_override || workflow.start_prompt;
    const systemPrompt = buildSystemPrompt(agent, style, startPrompt);

    // 4. ユーザーメッセージ構築
    const userMessage = buildUserMessage(
        meeting.topic,
        messages, // 💅 whiteboardを削除
        agent.role
    );

    try {
        // 5. LLM呼び出し
        const response = await callLLM(userMessage, {
            provider: agent.llm as "openai" | "anthropic" | "google",
            model: normalizeModelId(agent.model),
            systemPrompt: systemPrompt,
            cacheableContext: whiteboard || undefined, // 🆕 キャッシュ対象として渡すよ！💅
            temperature: agent.temperature ?? 0.7,
        });

        // 6. 結果を返す
        return {
            success: true,
            status: "in_progress",
            messages: [{
                content: response.content,
                agent_id: agent.id,
                agent_name: agent.name,
                agent_role: agent.role,
                agent_avatar_url: agent.avatar_url,
                usage: response.usage,
            }],
            total_usage: response.usage,
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
    const { agents, meeting, messages, whiteboard, workflow } = context;

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

            const startPrompt = meeting.start_prompt_override || workflow.start_prompt;
            const systemPrompt = buildSystemPrompt(agent, style, startPrompt);
            const userMessage = buildUserMessage(
                meeting.topic,
                messages, // 💅 whiteboardを削除
                agent.role
            );

            const response = await callLLM(userMessage, {
                provider: agent.llm as "openai" | "anthropic" | "google",
                model: normalizeModelId(agent.model),
                systemPrompt: systemPrompt,
                cacheableContext: whiteboard || undefined, // 🆕 キャッシュ対象として渡すよ！💅
                temperature: agent.temperature ?? 0.7,
            });

            return {
                content: response.content,
                agent_id: agent.id,
                agent_name: agent.name,
                agent_role: agent.role,
                agent_avatar_url: agent.avatar_url,
                usage: response.usage,
            };
        });

        const results = await Promise.allSettled(promises);

        // 成功した結果だけを抽出💅
        const successfulResults = results
            .filter((res): res is PromiseFulfilledResult<any> => res.status === "fulfilled")
            .map(res => res.value as StepResult);

        // 失敗したエージェントをログ出力
        const failedCount = results.filter(res => res.status === "rejected").length;
        if (failedCount > 0) {
            console.warn(`⚠️ ParallelSpeak: ${failedCount}人のエージェントが発言に失敗しました。会議を継続します。🛡️`);
        }

        if (successfulResults.length === 0 && (step as ParallelSpeakStep).agent_ids.length > 0) {
            throw new Error("全員の発言に失敗しました。💅💦");
        }

        // トータル使用量を計算
        const totalUsage = successfulResults.reduce(
            (acc, res) => ({
                input_tokens: acc.input_tokens + (res.usage?.input_tokens || 0),
                output_tokens: acc.output_tokens + (res.usage?.output_tokens || 0),
            }),
            { input_tokens: 0, output_tokens: 0 }
        );

        return {
            success: true,
            status: "in_progress",
            messages: successfulResults,
            total_usage: totalUsage,
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
    step: SummaryStep,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { agents, meeting, messages, whiteboard, workflow } = context;

    // 🆕 サマリー担当エージェントを取得（会議での上書きを最優先！）
    const summaryAgentId = meeting.summary_agent_id || step.agent_id;
    const agent = agents.get(summaryAgentId);
    if (!agent) {
        return {
            success: false,
            status: "in_progress",
            messages: [],
            error: `Summary agent not found: ${summaryAgentId}`,
        };
    }

    // 🆕 出力スタイル取得（議長も自分らしく！💅）
    const style = await getOutputStyle(agent.style_id);
    if (!style) {
        return {
            success: false,
            status: "in_progress",
            messages: [],
            error: `Output style not found for agent: ${agent.name}`,
        };
    }

    // 🆕 プロンプトビルダーにスタイルを渡すよ！✨
    const endPrompt = meeting.end_prompt_override || workflow.end_prompt;
    const systemPrompt = buildSummarySystemPrompt(agent, style, endPrompt);
    const userMessage = buildSummaryUserMessage(meeting.topic, messages); // 💅 whiteboardを削除

    try {
        // 🆕 サマリー作成はトークンを大量に使うから、16384トークンまで開放！🚀
        const response = await callLLM(userMessage, {
            provider: agent.llm as "openai" | "anthropic" | "google",
            model: normalizeModelId(agent.model),
            systemPrompt: systemPrompt,
            cacheableContext: whiteboard || undefined, // 🆕 キャッシュ対象として渡すよ！💅
            temperature: agent.temperature ?? 0.7,
            maxTokens: 16384, // 限界突破！💅
        });

        return {
            success: true,
            status: "completed", // サマリーが出たら会議終了！🏁
            messages: [{
                content: response.content,
                agent_id: agent.id,
                agent_name: agent.name,
                agent_role: agent.role,
                agent_avatar_url: agent.avatar_url,
                usage: response.usage,
            }],
            total_usage: response.usage,
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
            agent_role: "system", // 🆕 追加
        }],
    };
}

// ==========================================
// 履歴フォーマッター
// ==========================================

/**
 * メッセージ履歴を構造化フォーマットに変換
 */
function formatMessageHistory(messages: Message[]): string {
    if (messages.length === 0) {
        return "（まだ発言はありません）";
    }

    return messages.map(m => {
        // 後方互換性：古いデータにはagent_role, step_numberがない可能性
        const role = m.agent_role || "不明";
        const step = m.step_number !== undefined ? m.step_number : "?";

        return `【発言者】${m.agent_name}
【発言者の役割】${role}
【発言ステップ】${step}
【内容】
${m.content}`;
    }).join("\n\n---\n\n");
}

// ==========================================
// サマリー用プロンプトビルダー
// ==========================================

/**
 * サマリー生成用のシステムプロンプトを構築
 */
function buildSummarySystemPrompt(
    agent: Agent,
    style: OutputStyle,
    endPrompt: string
): string {
    return `あなたは「${agent.name}」という名前の会議参加者です。
今回、あなたは会議のまとめ役を担当します。

## あなたの性格・設定
${agent.persona}

${agent.prompt ? `## 追加の指示\n${agent.prompt}` : ""}

## まとめ作成の指示
${endPrompt}

## 出力形式・スタイル
${style.prompt_segment}

## 出力の長さについて
出力の長さに制限はありません。議論の内容を網羅的にまとめてください。

---
上記の設定を遵守して、議論のまとめを作成してください。`;
}

/**
 * サマリー生成用のユーザーメッセージを構築
 */
function buildSummaryUserMessage(
    topic: string,
    messages: Message[]
): string {
    const history = formatMessageHistory(messages);

    return `## 会議の議題
${topic}

## これまでの会議記録
${history}

---
上記の議論を踏まえて、まとめを作成してください。`;
}

// ==========================================
// プロンプト構築（ギャルのこだわり！💅）
// ==========================================

function buildSystemPrompt(
    agent: Agent,
    style: OutputStyle,
    startPrompt: string
): string {
    return `あなたは「${agent.name}」という名前の会議参加者です。

## あなたの役割
${agent.role}

## あなたの性格・設定
${agent.persona}

${agent.prompt ? `## 追加の指示\n${agent.prompt}` : ""}

## 会議の進行ルール
${startPrompt}

## 出力形式・スタイル
${style.prompt_segment}

## 出力の長さについて
出力の長さに制限はありません。議論に必要な内容を過不足なく記述してください。

---
上記の設定を遵守して、議論に貢献してください。`;
}

function buildUserMessage(
    topic: string,
    messages: Message[],
    role: string
): string {
    // 🆕 新しいフォーマッターを使用
    const history = formatMessageHistory(messages);

    return `## 会議の議題
${topic}

## 議論の履歴
${history}

---
あなたは「${role}」として、この議論の流れを踏まえ、次に述べるべき意見や質問を生成してください。
出力の長さに制限はありません。必要に応じて詳細に記述してください。`;
}
