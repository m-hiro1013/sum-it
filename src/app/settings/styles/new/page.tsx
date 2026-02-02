"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import StyleForm from "@/components/StyleForm";
import { createOutputStyle } from "@/lib/firestore";
import { OutputStyleInput } from "@/types/style";
import { ChevronLeft, MessageSquareQuote } from "lucide-react";
import Link from "next/link";

export default function NewStylePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (data: OutputStyleInput) => {
        setIsLoading(true);
        try {
            await createOutputStyle(data);
            router.push("/settings/styles");
        } catch (error) {
            console.error("Failed to create style", error);
            alert("出力形式の作成に失敗しました。");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
            <Header />
            <main className="container mx-auto py-12 px-4 sm:px-8 max-w-2xl">
                <div className="mb-10 flex items-center gap-4">
                    <Link
                        href="/settings/styles"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    >
                        <ChevronLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">出力形式の新規登録</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">新しいプロンプト断片を定義しましょう。</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl shadow-blue-500/5 border border-gray-100 dark:border-neutral-800">
                    <StyleForm onSubmit={handleSubmit} onCancel={() => router.push("/settings/styles")} isLoading={isLoading} />
                </div>
            </main>
        </div>
    );
}
