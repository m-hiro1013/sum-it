"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import AgentForm from "@/components/AgentForm";
import { createAgent } from "@/lib/firestore";
import { AgentInput } from "@/types/agent";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NewAgentPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (data: AgentInput) => {
        setIsLoading(true);
        try {
            await createAgent(data);
            router.push("/agents");
            router.refresh(); // 最新のデータを取得するためにリフレッシュ
        } catch (error) {
            console.error("Failed to create agent:", error);
            alert("エージェントの作成に失敗しました。");
        } finally {
            setIsLoading(false);
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
                        <h1 className="text-3xl font-bold tracking-tight">新規エージェント作成</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            会議で活躍する新しいエージェントの個性を設定しましょう。
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-900/50 border border-gray-100 dark:border-neutral-800">
                    <AgentForm onSubmit={handleSubmit} onCancel={() => router.push("/agents")} isLoading={isLoading} />
                </div>
            </main>
        </div>
    );
}
