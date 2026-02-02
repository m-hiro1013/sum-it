"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
    createMeeting,
    getMeetingWorkflows
} from "@/lib/firestore";
import { MeetingWorkflow } from "@/types/workflow";
import {
    Loader2,
    Terminal,
    CheckCircle,
    ArrowRight,
    Info,
    MessageSquare,
    Edit3,
    Zap,
    ChevronDown,
    ChevronUp,
    Settings2
} from "lucide-react";

export default function NewMeetingPage() {
    const router = useRouter();

    // マスタデータ
    const [workflows, setWorkflows] = useState<MeetingWorkflow[]>([]);

    // フォームステート
    const [title, setTitle] = useState("");
    const [topic, setTopic] = useState("");
    const [whiteboard, setWhiteboard] = useState("");
    const [workflowId, setWorkflowId] = useState("");

    // 詳細設定（オプションの上書き）💅
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [startPromptOverride, setStartPromptOverride] = useState("");
    const [endPromptOverride, setEndPromptOverride] = useState("");

    // 補助ステート
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const workflowsData = await getMeetingWorkflows();
            setWorkflows(workflowsData);

            // デフォルトで最初のワークフローを選択
            if (workflowsData.length > 0) {
                const first = workflowsData[0];
                setWorkflowId(first.id);
                setStartPromptOverride(first.start_prompt);
                setEndPromptOverride(first.end_prompt);
            }

            setIsLoading(false);
        };
        fetchData();
    }, []);

    const handleWorkflowSelect = (w: MeetingWorkflow) => {
        setWorkflowId(w.id);
        // 詳細設定のデフォルト値も更新！💅
        setStartPromptOverride(w.start_prompt);
        setEndPromptOverride(w.end_prompt);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const selectedWorkflow = workflows.find(w => w.id === workflowId);
        if (!title || !topic || !workflowId || !selectedWorkflow) {
            alert("タイトル、議題、ワークフローは必須だよ！💅");
            return;
        }

        setIsSubmitting(true);
        try {
            // プロンプトが初期値から変更されている場合のみ、上書き用として送信
            const sOverride = startPromptOverride !== selectedWorkflow.start_prompt ? startPromptOverride : undefined;
            const eOverride = endPromptOverride !== selectedWorkflow.end_prompt ? endPromptOverride : undefined;

            const meetingId = await createMeeting({
                title,
                topic,
                whiteboard,
                workflow_id: workflowId,
                current_step: 0,
                start_prompt_override: sOverride,
                end_prompt_override: eOverride,
                status: "pending"
            });
            router.push(`/meetings/${meetingId}`);
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
                <div className="mb-12">
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <MessageSquare className="text-blue-600" size={36} /> Setup New Meeting
                    </h1>
                    <p className="mt-3 text-gray-500 font-medium">議題を入力して、ワークフローを選ぶだけの超シンプル設定！💅✨</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* 1. 基本情報設定 */}
                    <section className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
                                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Info size={14} className="text-blue-500" /> 1. Basic Information
                                </h2>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold ml-1 text-gray-500 uppercase tracking-tighter">Meeting Title</label>
                                        <Input
                                            placeholder="例: 次世代AIエージェントの要件検討"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            className="h-14 rounded-2xl bg-gray-50 dark:bg-black/40 border-none font-bold text-lg px-6 focus-visible:ring-2 ring-blue-500/20"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold ml-1 text-gray-500 uppercase tracking-tighter">Topic / Purpose</label>
                                        <Textarea
                                            placeholder="何について議論し、どんな結論を得たいですか？"
                                            value={topic}
                                            onChange={e => setTopic(e.target.value)}
                                            className="h-32 rounded-2xl bg-gray-50 dark:bg-black/40 border-none px-6 py-4 text-sm leading-relaxed focus:ring-2 ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-6">
                                <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Edit3 size={14} className="text-blue-500" /> 2. Initial Whiteboard (Optional)
                                </h2>
                                <Textarea
                                    placeholder="前提条件や共有しておきたい情報をここに記入してください。"
                                    value={whiteboard}
                                    onChange={e => setWhiteboard(e.target.value)}
                                    className="h-32 rounded-2xl bg-gray-50 dark:bg-black/40 border-none px-6 py-4 text-sm leading-relaxed focus:ring-2 ring-blue-500/20"
                                />
                            </div>
                        </div>
                    </section>

                    {/* 2. ワークフロー選択 🔥 */}
                    <section className="bg-white dark:bg-zinc-900 p-8 md:p-10 rounded-[40px] border border-gray-100 dark:border-zinc-800 shadow-xl shadow-blue-500/5 space-y-8">
                        <div className="flex justify-between items-center gap-4">
                            <h2 className="text-2xl font-black flex items-center gap-3">
                                <Zap className="text-yellow-500" size={28} /> 3. Select Workflow
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {workflows.map(w => (
                                <div
                                    key={w.id}
                                    onClick={() => handleWorkflowSelect(w)}
                                    className={`
                                        p-6 rounded-3xl cursor-pointer transition-all border-2
                                        ${workflowId === w.id
                                            ? "bg-yellow-50/50 border-yellow-500 dark:bg-yellow-900/10 shadow-lg shadow-yellow-500/10"
                                            : "bg-gray-50 dark:bg-black/40 border-transparent hover:bg-gray-100 dark:hover:bg-zinc-800"
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className={`font-black text-lg ${workflowId === w.id ? "text-yellow-600" : ""}`}>{w.name}</p>
                                            <p className="text-sm text-gray-500 font-medium leading-relaxed">{w.description}</p>
                                        </div>
                                        {workflowId === w.id && (
                                            <div className="bg-yellow-500 text-white p-1 rounded-full">
                                                <CheckCircle size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-4">
                                        {w.steps.map((step, idx) => (
                                            <span key={idx} className="text-[10px] bg-white dark:bg-black/60 px-3 py-1 rounded-full border border-gray-100 dark:border-zinc-700 text-gray-400 font-black uppercase tracking-tighter">
                                                {step.type === 'speak' ? 'Speak' : step.type === 'parallel_speak' ? 'Parallel' : step.type === 'summary' ? 'Summary' : 'Intervention'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 3. 詳細設定（折りたたみ）💅 */}
                    <section className="bg-white dark:bg-zinc-900/50 rounded-[32px] border border-gray-100 dark:border-zinc-800 overflow-hidden transition-all">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Settings2 size={18} className="text-gray-400" />
                                <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Advanced Settings (Overrides)</span>
                            </div>
                            {showAdvanced ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                        </button>

                        {showAdvanced && (
                            <div className="p-8 pt-0 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <Terminal size={12} /> Start Instruction Override
                                    </label>
                                    <Textarea
                                        value={startPromptOverride}
                                        onChange={e => setStartPromptOverride(e.target.value)}
                                        className="h-24 rounded-2xl bg-gray-50 dark:bg-black/40 border-none px-5 py-3 text-xs leading-relaxed focus:ring-2 ring-blue-500/20 font-mono"
                                    />
                                    <p className="text-[10px] text-gray-400 italic">各エージェントへの進行上の指示を上書きできます。</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <Edit3 size={12} /> Summary Instruction Override
                                    </label>
                                    <Textarea
                                        value={endPromptOverride}
                                        onChange={e => setEndPromptOverride(e.target.value)}
                                        className="h-24 rounded-2xl bg-gray-50 dark:bg-black/40 border-none px-5 py-3 text-xs leading-relaxed focus:ring-2 ring-blue-500/20 font-mono"
                                    />
                                    <p className="text-[10px] text-gray-400 italic">最終サマリー作成時のロジックを上書きできます。</p>
                                </div>
                            </div>
                        )}
                    </section>

                    <div className="mt-12 flex justify-center">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-20 px-16 rounded-full text-2xl font-black bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all hover:scale-[1.03] active:scale-[0.97] w-full md:w-auto min-w-[320px]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={32} />
                            ) : (
                                <>CREATE MEETING <ArrowRight className="ml-3" size={28} /></>
                            )}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}
