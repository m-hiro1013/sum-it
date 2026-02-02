"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import AgentCard from "@/components/AgentCard";
import { Button } from "@/components/ui/Button";
import { getAgents, deleteAgent } from "@/lib/firestore";
import { Agent } from "@/types/agent";
import { Plus, Loader2 } from "lucide-react";

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAgents = async () => {
        try {
            const data = await getAgents();
            setAgents(data);
        } catch (error) {
            console.error("Failed to fetch agents:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm("このエージェントを削除してもよろしいですか？")) {
            try {
                await deleteAgent(id);
                setAgents(agents.filter((a) => a.id !== id));
            } catch (error) {
                alert("削除に失敗しました。");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black">
            <Header />
            <main className="container mx-auto py-12 px-4 sm:px-8">
                <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                            エージェント一覧
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            会議に参加するAIエージェントの作成と管理を行います。
                        </p>
                    </div>
                    <Link href="/agents/new">
                        <Button className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            新規作成
                        </Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : agents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 dark:border-neutral-800">
                        <p className="text-gray-500 dark:text-gray-400">エージェントがまだ登録されていません。</p>
                        <Link href="/agents/new" className="mt-4">
                            <Button variant="outline">最初のエージェントを作成する</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {agents.map((agent) => (
                            <AgentCard
                                key={agent.id}
                                agent={agent}
                                onEdit={(id) => (window.location.href = `/agents/${id}/edit`)}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
