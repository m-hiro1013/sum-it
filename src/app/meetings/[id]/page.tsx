"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
    getMeeting,
    getMeetingWorkflow,
    subscribeToMessages,
    addMessage,
    updateMeeting,
    deleteMeeting
} from "@/lib/firestore";
import { Meeting, Message } from "@/types/meeting";
import { Agent } from "@/types/agent";
import { MeetingWorkflow } from "@/types/workflow";
import {
    Loader2,
    Play,
    Flag,
    Download,
    Save,
    ArrowLeft,
    Users,
    Edit3,
    Monitor,
    MessageSquare,
    Bot,
    Trash2,
    Type,
    Zap,
    RefreshCw
} from "lucide-react";

export default function MeetingRoomPage() {
    const { id } = useParams();
    const router = useRouter();
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [workflow, setWorkflow] = useState<MeetingWorkflow | null>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    // 編集用ステート
    const [editTitle, setEditTitle] = useState("");
    const [editWhiteboard, setEditWhiteboard] = useState("");

    // リアルタイム・メッセージ購読
    useEffect(() => {
        if (typeof id !== "string") return;

        const fetchData = async () => {
            const meetingData = await getMeeting(id);

            if (!meetingData) {
                router.push("/meetings");
                return;
            }

            const workflowData = await getMeetingWorkflow(meetingData.workflow_id);

            setMeeting(meetingData);
            setWorkflow(workflowData);

            // 編集用初期値
            setEditTitle(meetingData.title);
            setEditWhiteboard(meetingData.whiteboard);

            setIsLoading(false);
        };

        fetchData();

        const unsubscribe = subscribeToMessages(id, (newMessages) => {
            setMessages(newMessages);
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 100);
        });

        return () => unsubscribe();
    }, [id, router]);

    const handleSaveChanges = async () => {
        if (!meeting) return;
        setIsProcessing(true);
        try {
            const updateData = {
                title: editTitle,
                whiteboard: editWhiteboard,
            };

            await updateMeeting(meeting.id, updateData);
            setMeeting({ ...meeting, ...updateData });
            alert("会議情報を更新しました！✨💅🛡️");
        } catch (error) {
            console.error(error);
            alert("保存に失敗しちゃった😭");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteMeeting = async () => {
        if (!meeting) return;
        if (!confirm(`「${meeting.title}」を削除してもいい？😭`)) return;
        setIsProcessing(true);
        try {
            await deleteMeeting(meeting.id);
            router.push("/meetings");
        } catch (error) {
            console.error(error);
            alert("削除に失敗😭");
            setIsProcessing(false);
        }
    };

    const handleStartMeeting = async () => {
        if (!meeting || !workflow) return;
        setIsProcessing(true);
        try {
            await updateMeeting(meeting.id, { status: "in_progress" });
            setMeeting({ ...meeting, status: "in_progress" });
            await addMessage({
                meeting_id: meeting.id,
                agent_id: "system",
                agent_name: "SYSTEM",
                agent_role: "system", // 🆕 追加
                step_number: 0,      // 🆕 追加
                content: `会議を開始しました。議題: ${meeting.topic}\nワークフロー「${workflow.name}」に従って進行します。💅✨`,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNextStep = async () => {
        if (!meeting) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`/api/meetings/${meeting.id}/run/next`, {
                method: "POST",
            });
            const result = await response.json();
            if (!result.success) {
                alert(`エラー発生: ${result.error}😭`);
            } else {
                setMeeting({
                    ...meeting,
                    current_step: result.current_step,
                    status: result.status
                });
            }
        } catch (error) {
            console.error(error);
            alert("通信エラーになっちゃった😭");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleResumeMeeting = async () => {
        if (!meeting) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`/api/meetings/${meeting.id}/run/resume`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ whiteboard: editWhiteboard }),
            });
            const result = await response.json();
            if (!result.success) {
                alert(`再開エラー: ${result.error}😭`);
            } else {
                setMeeting({
                    ...meeting,
                    whiteboard: editWhiteboard,
                    current_step: result.current_step,
                    status: result.status
                });
            }
        } catch (error) {
            console.error(error);
            alert("通信エラーになっちゃった😭");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerateSummary = async () => {
        if (!meeting) return;
        setIsProcessing(true);
        try {
            const summary = `## 結論サマリー\n議論の結果、これまでの内容が集約されました。💅🚀🌈`;
            await updateMeeting(meeting.id, { status: "completed", final_conclusion: summary, completed_at: new Date() });
            setMeeting({ ...meeting, status: "completed", final_conclusion: summary });
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExportMarkdown = () => {
        if (!meeting) return;
        const content = `# 会議議事録: ${meeting.title}\n\n## 議題\n${meeting.topic}\n\n## ホワイトボード\n${meeting.whiteboard}\n\n## 議論ログ\n${messages.map(m => `### ${m.agent_name}\n${m.content}`).join("\n\n")}\n\n## 結論\n${meeting.final_conclusion || "まだ結論は出ていません。"}`;
        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${meeting.title}_minutes.md`;
        a.click();
    };

    if (isLoading || !meeting) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex flex-col">
            <Header />

            <div className="flex-1 flex overflow-hidden">
                {/* サイドバー: ワークフローベースに簡素化💅 */}
                <aside className="w-80 lg:w-[400px] border-r border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto hidden md:block custom-scrollbar">
                    <div className="p-6 space-y-8">
                        <div className="space-y-4">
                            <Button variant="ghost" onClick={() => router.push("/meetings")} className="px-0 hover:bg-transparent">
                                <ArrowLeft size={18} className="mr-2" /> 一覧に戻る
                            </Button>

                            <div className="space-y-2">
                                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                    <Type size={14} /> 会議タイトル
                                </h3>
                                <Input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="text-2xl font-black tracking-tight leading-tight border-none focus-visible:ring-1 p-0 h-auto bg-transparent"
                                />
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full w-fit uppercase tracking-tighter">
                                <Monitor size={12} /> Status: {meeting.status}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                <Zap size={14} className="text-yellow-500" /> 実行中ワークフロー
                            </h3>
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-zinc-800">
                                <p className="text-sm font-black text-gray-800 dark:text-gray-200">{workflow?.name || "---"}</p>
                                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{workflow?.description}</p>
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {workflow?.steps.map((step, idx) => (
                                        <span key={idx} className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${meeting.current_step === idx ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-400"}`}>
                                            {step.type.charAt(0)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                <Users size={14} /> 参加メンバー
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {workflow?.agent_ids.map(agentId => (
                                    <div key={agentId} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800">
                                        <Bot size={14} className="text-blue-500" />
                                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">{agentId}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                <Edit3 size={14} /> ホワイトボード
                            </h3>
                            <Textarea
                                value={editWhiteboard}
                                onChange={(e) => setEditWhiteboard(e.target.value)}
                                className="h-64 rounded-2xl p-4 bg-gray-50 dark:bg-black/40 text-sm leading-relaxed focus:ring-2 ring-blue-500/10"
                                placeholder="共通認識をここに..."
                            />
                        </div>

                        <div className="pt-8 border-t border-gray-100 dark:border-zinc-800">
                            <Button
                                variant="outline"
                                onClick={handleDeleteMeeting}
                                disabled={isProcessing}
                                className="w-full h-12 rounded-xl text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600 transition-all gap-2"
                            >
                                <Trash2 size={18} /> 会議自体を削除
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* メイン: メッセージフィード */}
                <main className="flex-1 flex flex-col bg-gray-50 dark:bg-black relative">
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-gray-400">
                                <div className="p-6 rounded-full bg-gray-100 dark:bg-zinc-900"><MessageSquare size={48} /></div>
                                <p className="text-lg font-medium italic">議論を開始してください。💅✨</p>
                            </div>
                        )}
                        {messages.map((m) => {
                            const isSystem = m.agent_id === "system";
                            return (
                                <div key={m.id} className={`flex gap-4 ${isSystem ? "justify-center" : ""}`}>
                                    {!isSystem && (
                                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 flex items-center justify-center text-gray-400">
                                            <Bot size={24} />
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] ${isSystem ? "w-full" : "relative group"}`}>
                                        {!isSystem && (
                                            <div className="flex items-center justify-between mb-1 ml-1 px-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{m.agent_name}</p>
                                                    {m.agent_role && (
                                                        <span className="text-[8px] font-black px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-500 rounded uppercase tracking-tighter border border-gray-200 dark:border-zinc-700">
                                                            {m.agent_role}
                                                        </span>
                                                    )}
                                                </div>
                                                {m.step_number !== undefined && (
                                                    <span className="text-[9px] font-mono text-gray-300 dark:text-gray-600 font-bold">
                                                        #{m.step_number}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className={`p-5 rounded-3xl shadow-sm text-sm ${isSystem ? "bg-gray-100 dark:bg-zinc-900/50 text-gray-500 italic text-center text-xs" : "bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800"}`}>
                                            {m.content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-6 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex gap-2">
                            {meeting.status === "pending" && (
                                <Button onClick={handleStartMeeting} disabled={isProcessing} className="h-14 px-8 rounded-full text-lg font-black bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20">
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <><Play size={20} className="mr-2" /> 開始</>}
                                </Button>
                            )}
                            {meeting.status === "in_progress" && (
                                <div className="flex gap-2">
                                    <Button onClick={handleNextStep} disabled={isProcessing} className="h-14 px-8 rounded-full text-lg font-black bg-yellow-500 hover:bg-yellow-600 shadow-lg shadow-yellow-500/20 text-white">
                                        {isProcessing ? <Loader2 className="animate-spin" /> : <><Zap size={20} className="mr-2" /> 次のステップ</>}
                                    </Button>
                                </div>
                            )}
                            {meeting.status === "waiting" && (
                                <Button onClick={handleResumeMeeting} disabled={isProcessing} className="h-14 px-8 rounded-full text-lg font-black bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <><RefreshCw size={20} className="mr-2" /> 再開する</>}
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-3 h-14">
                            <Button variant="outline" onClick={handleExportMarkdown} title="Markdown出力" className="w-14 h-14 rounded-full p-0 flex items-center justify-center">
                                <Download size={24} />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleSaveChanges}
                                disabled={isProcessing}
                                className="h-14 px-8 rounded-full text-lg font-black flex items-center gap-3 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" /> : <><Save size={24} /> 会議情報を保存</>}
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

// 🆕 カスタムアイコンコンポーネント (CheckCircleはLucideにもあるが、カスタム版を維持)
function MyCheckCircle({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}
