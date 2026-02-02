"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { createMeetingWorkflow, getAgents } from "@/lib/firestore";
import { MeetingWorkflowInput, WorkflowStep, WorkflowStepType } from "@/types/workflow";
import { Agent } from "@/types/agent";
import {
    Loader2,
    Plus,
    Trash2,
    ArrowLeft,
    Zap,
    MessageSquare,
    Users,
    Settings,
    ChevronDown,
    ChevronUp,
    Terminal,
    GripVertical,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function NewWorkflowPage() {
    const router = useRouter();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // フォームステート
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startPrompt, setStartPrompt] = useState("");
    const [endPrompt, setEndPrompt] = useState("");
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
    const [steps, setSteps] = useState<WorkflowStep[]>([]);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        const fetchAgents = async () => {
            const data = await getAgents();
            setAgents(data);
            setIsLoading(false);
        };
        fetchAgents();
    }, []);

    const handleAddStep = (type: WorkflowStepType) => {
        let newStep: WorkflowStep;
        if (type === "speak") {
            newStep = { type: "speak", agent_id: selectedAgentIds[0] || "" };
        } else if (type === "parallel_speak") {
            newStep = { type: "parallel_speak", agent_ids: [] };
        } else if (type === "summary") {
            newStep = { type: "summary" };
        } else {
            newStep = { type: "user_intervention", label: "ユーザーの介入待ち" };
        }
        setSteps([...steps, newStep]);
    };

    const handleRemoveStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const handleUpdateStep = (index: number, updates: Partial<WorkflowStep>) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], ...updates } as WorkflowStep;
        setSteps(newSteps);
    };

    const toggleAgentSelection = (agentId: string) => {
        if (selectedAgentIds.includes(agentId)) {
            setSelectedAgentIds(selectedAgentIds.filter(id => id !== agentId));
        } else {
            setSelectedAgentIds([...selectedAgentIds, agentId]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || steps.length === 0) {
            alert("名前と少なくとも1つのステップは必須だよ！💅");
            return;
        }

        setIsSubmitting(true);
        try {
            const workflowData: MeetingWorkflowInput = {
                name,
                description,
                start_prompt: startPrompt,
                end_prompt: endPrompt,
                agent_ids: selectedAgentIds,
                steps,
                is_active: isActive
            };
            await createMeetingWorkflow(workflowData);
            router.push("/settings/workflows");
        } catch (error) {
            console.error(error);
            alert("作成に失敗しちゃった😭");
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white pb-20">
            <Header />

            <main className="container mx-auto py-12 px-4 max-w-4xl">
                <Link href="/settings/workflows" className="flex items-center gap-2 text-gray-400 hover:text-blue-600 font-bold transition-colors mb-8 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Workflows</span>
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <Zap className="text-yellow-500" size={36} /> New Workflow
                    </h1>
                    <p className="mt-3 text-gray-500 font-medium tracking-tight">会議の進行ロジックをデザインしましょう。💅✨</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* 1. 基本設定 */}
                    <Card className="p-8 md:p-10 rounded-[40px] border-none shadow-xl shadow-blue-500/5 space-y-8 dark:bg-zinc-900">
                        <div className="space-y-6">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Settings size={14} className="text-blue-500" /> 1. Workflow Metadata
                            </h2>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Workflow Name</label>
                                    <Input
                                        placeholder="例: 戦略的ディスカッション"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="h-14 rounded-2xl bg-gray-50 dark:bg-black border-none font-bold text-lg px-6 focus-visible:ring-2 ring-blue-500/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Description</label>
                                    <Textarea
                                        placeholder="このワークフローの目的や特徴を教えてね"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="h-24 rounded-2xl bg-gray-50 dark:bg-black border-none px-6 py-4 text-sm font-medium focus:ring-2 ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 参加エージェントの事前選択 */}
                        <div className="space-y-6 pt-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Users size={14} className="text-blue-500" /> 2. Participants
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {agents.map(agent => (
                                    <div
                                        key={agent.id}
                                        onClick={() => toggleAgentSelection(agent.id)}
                                        className={`
                                            p-4 rounded-2xl cursor-pointer transition-all border-2 text-center
                                            ${selectedAgentIds.includes(agent.id)
                                                ? "bg-blue-50 border-blue-500 dark:bg-blue-900/10"
                                                : "bg-gray-50 dark:bg-black/40 border-transparent hover:bg-gray-100 dark:hover:bg-zinc-800"
                                            }
                                        `}
                                    >
                                        <p className="font-bold text-sm truncate">{agent.name}</p>
                                        <p className="text-[10px] text-gray-400 font-bold truncate mt-1 uppercase tracking-tighter">{agent.role}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* 2. プロンプト設定 */}
                    <Card className="p-8 md:p-10 rounded-[40px] border-none shadow-xl shadow-blue-500/5 space-y-8 dark:bg-zinc-900">
                        <div className="space-y-6">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Terminal size={14} className="text-blue-500" /> 3. Global Instructions
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Meeting Start Instructions</label>
                                    <Textarea
                                        placeholder="会議開始時にエージェント全員が遵守すべきルールを記述してください。"
                                        value={startPrompt}
                                        onChange={e => setStartPrompt(e.target.value)}
                                        className="h-32 rounded-3xl bg-gray-50 dark:bg-black border-none px-6 py-4 text-xs font-mono leading-relaxed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Final Summary Instructions</label>
                                    <Textarea
                                        placeholder="最終的なまとめ（サマリー）を作成する際の具体的な指示を記述してください。"
                                        value={endPrompt}
                                        onChange={e => setEndPrompt(e.target.value)}
                                        className="h-32 rounded-3xl bg-gray-50 dark:bg-black border-none px-6 py-4 text-xs font-mono leading-relaxed"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 3. ステップ編集 🔥 */}
                    <Card className="p-8 md:p-10 rounded-[40px] border-none shadow-xl shadow-blue-500/5 space-y-8 dark:bg-zinc-900">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Zap size={14} className="text-yellow-500" /> 4. Workflow Steps
                            </h2>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => handleAddStep("speak")} className="h-8 rounded-full text-[10px] font-black uppercase">
                                    + Speak
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => handleAddStep("parallel_speak")} className="h-8 rounded-full text-[10px] font-black uppercase">
                                    + Parallel
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => handleAddStep("user_intervention")} className="h-8 rounded-full text-[10px] font-black uppercase">
                                    + Intervention
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => handleAddStep("summary")} className="h-8 rounded-full text-[10px] font-black uppercase">
                                    + Summary
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {steps.map((step, index) => (
                                <div key={index} className="flex items-center gap-4 bg-gray-50 dark:bg-black/40 p-4 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-zinc-800 transition-all group">
                                    <div className="bg-white dark:bg-zinc-800 h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
                                        {index + 1}
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-3 w-16 italic">{step.type}</span>

                                            {/* ステップ種別ごとの入力 */}
                                            {step.type === 'speak' && (
                                                <select
                                                    value={step.agent_id}
                                                    onChange={e => handleUpdateStep(index, { agent_id: e.target.value })}
                                                    className="bg-transparent border-none text-sm font-bold focus:ring-0 w-full"
                                                >
                                                    <option value="">エージェントを選択...</option>
                                                    {agents.filter(a => selectedAgentIds.includes(a.id)).map(a => (
                                                        <option key={a.id} value={a.id}>{a.name}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {step.type === 'parallel_speak' && (
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedAgentIds.map(id => (
                                                        <div
                                                            key={id}
                                                            onClick={() => {
                                                                const currentIds = step.agent_ids;
                                                                const nextIds = currentIds.includes(id)
                                                                    ? currentIds.filter(cid => cid !== id)
                                                                    : [...currentIds, id];
                                                                handleUpdateStep(index, { agent_ids: nextIds });
                                                            }}
                                                            className={`text-[9px] px-2 py-0.5 rounded-full border cursor-pointer font-bold ${step.agent_ids.includes(id) ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 dark:bg-zinc-800 border-transparent text-gray-400'}`}
                                                        >
                                                            {agents.find(a => a.id === id)?.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {step.type === 'user_intervention' && (
                                                <Input
                                                    value={step.label}
                                                    onChange={e => handleUpdateStep(index, { label: e.target.value })}
                                                    className="h-8 bg-transparent border-none text-sm font-bold focus-visible:ring-0 p-0"
                                                    placeholder="介入内容のラベル"
                                                />
                                            )}

                                            {step.type === 'summary' && (
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Final Summary & End Meeting</span>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveStep(index)}
                                        className="h-8 w-8 text-gray-300 hover:text-red-500 group-hover:opacity-100 opacity-0 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            ))}

                            {steps.length === 0 && (
                                <div className="text-center py-10 border-2 border-dashed rounded-3xl border-gray-100 dark:border-zinc-800">
                                    <p className="text-gray-400 text-sm font-medium">ステップを上に追加してワークフローを組んでね！💅</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="flex items-center justify-between pt-8">
                        <div className="flex items-center gap-3">
                            <div
                                onClick={() => setIsActive(!isActive)}
                                className={`h-6 w-11 rounded-full cursor-pointer transition-all relative ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-1 left-1 bg-white h-4 w-4 rounded-full transition-all ${isActive ? 'translate-x-5' : ''}`} />
                            </div>
                            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Active</span>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-16 px-12 rounded-full text-xl font-black bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all hover:scale-[1.05] active:scale-[0.95]"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "SAVE WORKFLOW"}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}
