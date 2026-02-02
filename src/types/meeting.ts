export interface Meeting {
    id: string;
    title: string;
    topic: string; // 議題
    whiteboard: string; // 共通認識
    facilitator_id: string; // 使用する議長のID
    agent_ids: string[]; // 参加エージェントのID一覧
    status: "pending" | "in_progress" | "completed" | "error";
    final_conclusion?: string; // 議長の総評（サマリー）
    created_at: any;
    completed_at?: any;
}

export type MeetingInput = Omit<Meeting, "id" | "created_at" | "completed_at">;

export interface Message {
    id: string;
    meeting_id: string;
    agent_id: string;
    agent_name: string;
    agent_avatar_url?: string; // 🆕 アイコンも出したい！
    content: string;
    created_at: any;
}

export type MessageInput = Omit<Message, "id" | "created_at">;
