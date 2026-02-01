export interface Agent {
    id: string;
    name: string;
    role: string;
    persona: string;
    prompt: string;
    output_style: string;
    llm: string;
    model: string;
    created_at: any; // Firestore Timestamp
    updated_at: any; // Firestore Timestamp
}

export type AgentInput = Omit<Agent, "id" | "created_at" | "updated_at">;
