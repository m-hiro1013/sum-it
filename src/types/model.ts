export type LLMProvider = "openai" | "anthropic" | "google";

export type LLMTier = "recommended" | "expensive" | "cheap" | "latest";

export interface LLMModel {
    id: string;
    provider: LLMProvider;
    model_id: string; // API呼び出しで使用する実際のID (例: gpt-5.2)
    name: string; // 表示用 (例: GPT-5.2 Flagship)
    tier: LLMTier;
    description: string;
    is_active: boolean;
}
