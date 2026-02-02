export interface Facilitator {
    id: string;
    name: string;
    description: string;
    start_prompt: string; // 会議開始時のルール指示
    end_prompt: string;   // 結論（サマリー）作成時の指示
    is_active: boolean;
    created_at: any;
}

export type FacilitatorInput = Omit<Facilitator, "id" | "created_at">;
