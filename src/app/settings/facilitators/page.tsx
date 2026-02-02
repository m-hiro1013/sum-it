"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { getFacilitators, deleteFacilitator } from "@/lib/firestore";
import { Facilitator } from "@/types/facilitator";
import { Plus, Edit2, Trash2, Loader2, Settings, UserCheck, CheckCircle2, XCircle, Play, Flag } from "lucide-react";
import Link from "next/link";

export default function FacilitatorsPage() {
    const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFacilitators = async () => {
        setIsLoading(true);
        try {
            const data = await getFacilitators(false);
            setFacilitators(data);
        } catch (error) {
            console.error("Failed to fetch facilitators", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFacilitators();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`議長「${name}」を引退させても大丈夫？😭`)) return;
        try {
            await deleteFacilitator(id);
            setFacilitators(facilitators.filter((f) => f.id !== id));
        } catch (error) {
            console.error("Failed to delete facilitator", error);
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
                        <h1 className="text-4xl font-extrabold tracking-tight">議長の管理</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">会議の進行ロジックとサマリーのスタイルを管理します。</p>
                    </div>
                    <Link href="/settings/facilitators/new">
                        <Button className="h-12 px-6 rounded-full shadow-lg shadow-blue-500/20">
                            <Plus className="mr-2 h-5 w-5" /> 議長を追加
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    </div>
                ) : facilitators.length === 0 ? (
                    <Card className="border-dashed border-2 py-20 text-center">
                        <p className="text-gray-500">議長が登録されていません。</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {facilitators.map((fac) => (
                            <Card key={fac.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all dark:bg-zinc-900/50">
                                <CardHeader className="pb-4 border-b border-gray-50 dark:border-zinc-800">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-inner">
                                                <UserCheck size={28} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CardTitle className="text-2xl">{fac.name}</CardTitle>
                                                    {fac.is_active ? (
                                                        <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full dark:bg-green-900/20">
                                                            <CheckCircle2 size={10} className="mr-1" /> ACTIVE
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full dark:bg-zinc-800">
                                                            <XCircle size={10} className="mr-1" /> INACTIVE
                                                        </span>
                                                    )}
                                                </div>
                                                <CardDescription className="text-sm">{fac.description}</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/settings/facilitators/${fac.id}/edit`}>
                                                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-gray-200 dark:border-zinc-700">
                                                    <Edit2 size={18} />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-10 w-10 rounded-full text-red-500 border-red-100 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
                                                onClick={() => handleDelete(fac.id, fac.name)}
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            <Play size={12} className="text-green-500" /> Start Logic
                                        </h4>
                                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-zinc-800">
                                            <p className="text-xs font-mono text-gray-500 line-clamp-4 leading-relaxed italic">
                                                &quot;{fac.start_prompt}&quot;
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            <Flag size={12} className="text-red-500" /> End Logic
                                        </h4>
                                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-zinc-800">
                                            <p className="text-xs font-mono text-gray-500 line-clamp-4 leading-relaxed italic">
                                                &quot;{fac.end_prompt}&quot;
                                            </p>
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
