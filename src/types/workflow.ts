import { Timestamp } from "firebase/firestore";

export type WorkflowStepType = "speak" | "parallel_speak" | "summary" | "user_intervention";

export interface SpeakStep {
    type: "speak";
    agent_id: string;
}

export interface ParallelSpeakStep {
    type: "parallel_speak";
    agent_ids: string[];
}

export interface SummaryStep {
    type: "summary";
}

export interface UserInterventionStep {
    type: "user_intervention";
    label?: string;
}

export type WorkflowStep = SpeakStep | ParallelSpeakStep | SummaryStep | UserInterventionStep;

export interface MeetingWorkflow {
    id: string;
    name: string;
    description: string;
    facilitator_id: string; // 使用する議長
    agent_ids: string[];    // 使用するエージェント一覧（バリデーション用）
    steps: WorkflowStep[];
    is_active: boolean;
    created_at: Timestamp;
}

export type MeetingWorkflowInput = Omit<MeetingWorkflow, "id" | "created_at">;
