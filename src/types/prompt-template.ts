import { Timestamp } from "firebase/firestore";

export type PromptTemplateType = "start" | "end";

export interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    type: PromptTemplateType;
    content: string;
    is_active: boolean;
    created_at: Timestamp;
}

export type PromptTemplateInput = Omit<PromptTemplate, "id" | "created_at">;
