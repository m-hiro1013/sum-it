"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { getMeetingWorkflows, deleteMeetingWorkflow } from "@/lib/firestore";
import { MeetingWorkflow } from "@/types/workflow";
import { Plus, Edit2, Trash2, Loader2, Settings, Terminal, CheckCircle2, XCircle, Zap } from "lucide-react";
import Link from "next/link";

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<MeetingWorkflow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchWorkflows = async () => {
        setIsLoading(true);
        try {
            // 管理画面なので非アクティブなものも全取得
            const data = await getMeetingWorkflows(false);
            setWorkflows(data);
        } catch (error) {
            console.error("Failed to fetch workflows", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`「${name}」を削除してもいい？このワークフローを使ってる会議が困っちゃうかも！😭`)) return;
        try {
            await deleteMeetingWorkflow(id);
            setWorkflows(workflows.filter((w) => w.id !== id));
        } catch (error) {
            console.error("Failed to delete workflow", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white pb-20">
            <Header />
            <main className="container mx-auto py-12 px-4 sm:px-8 max-w-5xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div>
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                            <Settings size={18} />
                            <span className="text-sm font-bold tracking-widest uppercase">System Settings</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight">ワークフローの管理</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">会議の進行ロジック（ステップ構成）を管理します。</p>
                    </div>
                    <Link href="/settings/workflows/new">
                        <Button className="h-12 px-6 rounded-full shadow-lg shadow-blue-500/20">
                            <Plus className="mr-2 h-5 w-5" /> 新規作成
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    </div>
                ) : workflows.length === 0 ? (
                    <Card className="border-dashed border-2 py-20 text-center rounded-[32px] bg-white/50 dark:bg-zinc-900/30">
                        <p className="text-gray-500 font-medium">ワークフローが登録されていません。</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {workflows.map((workflow) => (
                            <Card key={workflow.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all dark:bg-zinc-900/50 rounded-[32px]">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-2xl bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                                                <Zap size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CardTitle className="text-2xl font-black tracking-tight">{workflow.name}</CardTitle>
                                                    {workflow.is_active ? (
                                                        <span className="flex items-center text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full dark:bg-green-900/20 tracking-widest">
                                                            <CheckCircle2 size={10} className="mr-1" /> ACTIVE
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full dark:bg-zinc-800 tracking-widest">
                                                            <XCircle size={10} className="mr-1" /> INACTIVE
                                                        </span>
                                                    )}
                                                </div>
                                                <CardDescription className="font-medium text-gray-500">{workflow.description}</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/settings/workflows/${workflow.id}/edit`}>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600">
                                                    <Edit2 size={18} />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-zinc-800 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={() => handleDelete(workflow.id, workflow.name)}
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                                <Terminal size={12} /> Steps Configuration
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {workflow.steps.map((step, idx) => (
                                                    <div key={idx} className="flex items-center bg-white dark:bg-black/40 border border-gray-100 dark:border-zinc-800 px-3 py-2 rounded-xl">
                                                        <span className="text-[10px] font-black text-gray-400 mr-2 opacity-50">{idx + 1}</span>
                                                        <span className="text-xs font-bold uppercase tracking-tighter">
                                                            {step.type === 'speak' ? `Speak (${step.agent_id})`
                                                                : step.type === 'parallel_speak' ? `Parallel (${step.agent_ids.length})`
                                                                    : step.type === 'summary' ? 'Summary'
                                                                        : 'Intervention'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-zinc-800">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Start Prompt</p>
                                                <p className="text-xs text-gray-500 line-clamp-2 italic font-medium leading-relaxed">
                                                    &quot;{workflow.start_prompt}&quot;
                                                </p>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-zinc-800">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">End Prompt</p>
                                                <p className="text-xs text-gray-500 line-clamp-2 italic font-medium leading-relaxed">
                                                    &quot;{workflow.end_prompt}&quot;
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
