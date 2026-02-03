export interface Meeting {
    id: string;
    title: string;
    topic: string; // 議題
    whiteboard: string; // 共通認識

    // ワークフロー関連
    workflow_id: string; // 使用するワークフローのID
    current_step: number; // 現在のステップ番号

    // プロンプト上書き（オプション）
    start_prompt_override?: string; // 🆕 会議開始時の全体指示を上書き
    end_prompt_override?: string;   // 🆕 サマリー作成時の指示を上書き
    summary_agent_id?: string;      // 🆕 サマリー担当エージェントを上書き（旧議長/Facilitator）

    // 削除
    // facilitator_id: string;  // ❌ 削除
    // agent_ids: string[];     // ❌ 削除（workflowから取得）

    status: "pending" | "in_progress" | "waiting" | "completed" | "error";
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
    agent_role: string; // 🆕 追加
    step_number: number; // 🆕 追加
    agent_avatar_url?: string; // 🆕 アイコンも出したい！
    content: string;
    created_at: any;
}

export type MessageInput = Omit<Message, "id" | "created_at">;
