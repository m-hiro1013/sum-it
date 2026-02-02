export interface OutputStyle {
    id: string;
    name: string;
    prompt_segment: string;
    description: string;
    is_active: boolean;
    created_at: any;
}

export type OutputStyleInput = Omit<OutputStyle, "id" | "created_at">;
