import { Timestamp } from "firebase/firestore";

export interface MeetingTemplate {
    id: string;
    name: string;
    description: string;
    facilitator_id: string;
    agent_ids: string[];
    is_active: boolean;
    created_at: Timestamp | Date;
}

export type MeetingTemplateInput = Omit<MeetingTemplate, "id" | "created_at">;
