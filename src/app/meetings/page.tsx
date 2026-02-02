"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { getMeetings, getFacilitators } from "@/lib/firestore";
import { Meeting } from "@/types/meeting";
import { Facilitator } from "@/types/facilitator";
import { Plus, MessageSquare, Calendar, Clock, ChevronRight, Loader2, Monitor, CheckCircle2, PlayCircle, AlertCircle, Terminal } from "lucide-react";
import Link from "next/link";

export default function MeetingsPage() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [meetingsData, facilitatorsData] = await Promise.all([
                    getMeetings(),
                    getFacilitators(false)
                ]);
                setMeetings(meetingsData);
                setFacilitators(facilitatorsData);
            } catch (error) {
                console.error("Failed to fetch meetings", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed": return <CheckCircle2 size={16} className="text-green-500" />;
            case "in_progress": return <PlayCircle size={16} className="text-blue-500 animate-pulse" />;
            case "error": return <AlertCircle size={16} className="text-red-500" />;
            default: return <Clock size={16} className="text-gray-400" />;
        }
    };

    const getFacilitatorName = (id: string) => {
        return facilitators.find(f => f.id === id)?.name || "不明な議長";
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "---";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat("ja-JP", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
            <Header />
            <main className="container mx-auto py-12 px-4 sm:px-8 max-w-5xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">Meetings</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">過去の議論や進行中のセッションを管理します。</p>
                    </div>
                    <Link href="/meetings/new">
                        <Button className="h-14 px-8 rounded-full shadow-xl shadow-blue-500/20 text-lg font-bold bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-6 w-6" /> 新しい会議
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    </div>
                ) : meetings.length === 0 ? (
                    <Card className="border-dashed border-2 py-32 text-center bg-transparent">
                        <div className="flex flex-col items-center gap-4 text-gray-400">
                            <div className="p-6 rounded-full bg-gray-100 dark:bg-zinc-900">
                                <MessageSquare size={48} />
                            </div>
                            <div>
                                <p className="text-xl font-bold">まだ会議がありません</p>
                                <p className="text-sm">最初の一歩を踏み出しましょう！💅✨</p>
                            </div>
                            <Link href="/meetings/new" className="mt-4">
                                <Button variant="outline" className="rounded-full">会議を作成する</Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {meetings.map((meeting) => (
                            <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                                <Card className="group border-none shadow-sm hover:shadow-md transition-all dark:bg-zinc-900/50 overflow-hidden relative active:scale-[0.99]">
                                    <div className="flex items-center p-6 gap-6">
                                        <div className={`
                      h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors
                      ${meeting.status === "completed" ? "bg-green-50 text-green-600 dark:bg-green-900/20" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20"}
                    `}>
                                            <Monitor size={32} />
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(meeting.status)}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{meeting.status}</span>
                                            </div>
                                            <h3 className="text-xl font-bold truncate group-hover:text-blue-600 transition-colors">{meeting.title || "無題の会議"}</h3>
                                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Terminal size={12} className="text-gray-400" />
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">{getFacilitatorName(meeting.facilitator_id)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    <span>{formatDate(meeting.created_at)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Plus size={12} className="rotate-45" />
                                                    <span>{meeting.agent_ids.length} Agents</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0 text-gray-300 group-hover:text-blue-500 transition-colors">
                                            <ChevronRight size={24} />
                                        </div>
                                    </div>

                                    {/* 装飾用のボーダー（ホバー時のみ） */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform" />
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
