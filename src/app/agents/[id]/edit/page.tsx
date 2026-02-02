"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import AgentForm from "@/components/AgentForm";
import { getAgent, updateAgent } from "@/lib/firestore";
import { AgentInput, Agent } from "@/types/agent";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditAgentPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [agent, setAgent] = useState<Agent | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const data = await getAgent(id);
                if (data) {
                    setAgent(data);
                } else {
                    alert("エージェントが見つかりませんでした。");
                    router.push("/agents");
                }
            } catch (error) {
                console.error("Failed to fetch agent:", error);
            } finally {
                setIsFetching(false);
            }
        };
        fetchAgent();
    }, [id, router]);

    const handleSubmit = async (data: AgentInput) => {
        setIsUpdating(true);
        try {
            await updateAgent(id, data);
            router.push("/agents");
            router.refresh();
        } catch (error) {
            console.error("Failed to update agent:", error);
            alert("エージェントの更新に失敗しました。");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
            <Header />
            <main className="container mx-auto py-12 px-4 sm:px-8 max-w-3xl">
                <div className="mb-8 flex items-center gap-4">
                    <Link
                        href="/agents"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-100 transition-colors dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">エージェント編集</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            エージェントの設定を更新して、より良い会議を実現しましょう。
                        </p>
                    </div>
                </div>

                {isFetching ? (
                    <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-xl dark:bg-zinc-900/50">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-900/50 border border-gray-100 dark:border-neutral-800">
                        <AgentForm
                            initialData={agent || undefined}
                            onSubmit={handleSubmit}
                            onCancel={() => router.push("/agents")}
                            isLoading={isUpdating}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
