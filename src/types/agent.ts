export interface Agent {
    id: string;
    name: string;
    role: string;
    avatar_url?: string;
    persona: string;
    prompt: string;
    style_id: string; // 🆕 output_style から style_id に変更！
    llm: string;
    model: string;
    temperature: number; // 🆕 追加（0〜1.0、デフォルト0.7）
    created_at: any;
    updated_at: any;
}

export type AgentInput = Omit<Agent, "id" | "created_at" | "updated_at">;
