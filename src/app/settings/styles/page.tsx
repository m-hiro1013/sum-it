"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { getOutputStyles, deleteOutputStyle } from "@/lib/firestore";
import { OutputStyle } from "@/types/style";
import { Plus, Edit2, Trash2, Loader2, Settings, MessageSquareQuote, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function StylesPage() {
    const [styles, setStyles] = useState<OutputStyle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStyles = async () => {
        setIsLoading(true);
        try {
            // 管理画面なので非アクティブなものも全取得
            const data = await getOutputStyles(false);
            setStyles(data);
        } catch (error) {
            console.error("Failed to fetch styles", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStyles();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`「${name}」を削除してもいい？この形式を使ってるエージェントが困っちゃうかも！😭`)) return;
        try {
            await deleteOutputStyle(id);
            setStyles(styles.filter((s) => s.id !== id));
        } catch (error) {
            console.error("Failed to delete style", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
            <Header />
            <main className="container mx-auto py-12 px-4 sm:px-8 max-w-5xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div>
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                            <Settings size={18} />
                            <span className="text-sm font-bold tracking-widest uppercase">System Settings</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight">出力形式の管理</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">エージェントの話し方を規定するプロンプトパーツを管理します。</p>
                    </div>
                    <Link href="/settings/styles/new">
                        <Button className="h-12 px-6 rounded-full shadow-lg shadow-blue-500/20">
                            <Plus className="mr-2 h-5 w-5" /> 新規作成
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    </div>
                ) : styles.length === 0 ? (
                    <Card className="border-dashed border-2 py-20 text-center">
                        <p className="text-gray-500">出力形式が登録されていません。</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {styles.map((style) => (
                            <Card key={style.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all dark:bg-zinc-900/50">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                <MessageSquareQuote size={20} />
                                            </div>
                                            {style.is_active ? (
                                                <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full dark:bg-green-900/20">
                                                    <CheckCircle2 size={10} className="mr-1" /> ACTIVE
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full dark:bg-zinc-800">
                                                    <XCircle size={10} className="mr-1" /> INACTIVE
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/settings/styles/${style.id}/edit`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Edit2 size={16} />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={() => handleDelete(style.id, style.name)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl mt-4">{style.name}</CardTitle>
                                    <CardDescription className="line-clamp-1">{style.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="mt-2 p-4 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-zinc-800">
                                        <p className="text-xs font-mono text-gray-500 line-clamp-3 italic">
                                            &quot;{style.prompt_segment}&quot;
                                        </p>
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
