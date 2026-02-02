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
    getAgents,
    getFacilitators,
    subscribeToMessages,
    addMessage,
    updateMeeting,
    deleteMeeting
} from "@/lib/firestore";
import { Meeting, Message } from "@/types/meeting";
import { Agent } from "@/types/agent";
import { Facilitator } from "@/types/facilitator";
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
    UserCheck
} from "lucide-react";

export default function MeetingRoomPage() {
    const { id } = useParams();
    const router = useRouter();
    const [meeting, setMeeting] = useState<Meeting | null>(null);

    // マスタデータ
    const [allAgents, setAllAgents] = useState<Agent[]>([]);
    const [allFacilitators, setAllFacilitators] = useState<Facilitator[]>([]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    // 編集用ステート
    const [editTitle, setEditTitle] = useState("");
    const [editWhiteboard, setEditWhiteboard] = useState("");
    const [editFacilitatorId, setEditFacilitatorId] = useState("");
    const [editAgentIds, setEditAgentIds] = useState<string[]>([]);

    // リアルタイム・メッセージ購読
    useEffect(() => {
        if (typeof id !== "string") return;

        const fetchData = async () => {
            const [meetingData, agentsData, facilitatorsData] = await Promise.all([
                getMeeting(id),
                getAgents(),
                getFacilitators(false)
            ]);

            if (!meetingData) {
                router.push("/meetings");
                return;
            }

            setMeeting(meetingData);
            setAllAgents(agentsData);
            setAllFacilitators(facilitatorsData);

            // 編集用初期値
            setEditTitle(meetingData.title);
            setEditWhiteboard(meetingData.whiteboard);
            setEditFacilitatorId(meetingData.facilitator_id);
            setEditAgentIds(meetingData.agent_ids);

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
                facilitator_id: editFacilitatorId,
                agent_ids: editAgentIds
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

    const handleToggleAgent = (agentId: string) => {
        setEditAgentIds(prev =>
            prev.includes(agentId)
                ? prev.filter(id => id !== agentId)
                : [...prev, agentId]
        );
    };

    const handleStartMeeting = async () => {
        if (!meeting) return;
        setIsProcessing(true);
        try {
            await updateMeeting(meeting.id, { status: "in_progress" });
            setMeeting({ ...meeting, status: "in_progress" });
            const currentFacilitator = allFacilitators.find(f => f.id === editFacilitatorId);
            await addMessage({
                meeting_id: meeting.id,
                agent_id: "system",
                agent_name: "SYSTEM",
                content: `会議を開始しました。議題: ${meeting.topic}\n議長(${currentFacilitator?.name})の指示に基づいて議論を進めてください。`,
            });
        } catch (error) {
            console.error(error);
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

    const selectedAgentsCount = editAgentIds.length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white flex flex-col">
            <Header />

            <div className="flex-1 flex overflow-hidden">
                {/* サイドバー: フルCRUD対応版💅🛡️ */}
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
                                <UserCheck size={14} /> 議長スタイルを選択
                            </h3>
                            <select
                                value={editFacilitatorId}
                                onChange={(e) => setEditFacilitatorId(e.target.value)}
                                className="w-full h-12 rounded-xl bg-gray-50 dark:bg-black border-none text-sm font-bold focus:ring-2 ring-blue-500/20 px-4 transition-all"
                            >
                                {allFacilitators.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            <p className="text-[11px] text-gray-500 italic px-2">
                                {allFacilitators.find(f => f.id === editFacilitatorId)?.description}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                    <Users size={14} /> 参加メンバー管理
                                </h3>
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md uppercase">
                                    {selectedAgentsCount} Selected
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {allAgents.map(agent => (
                                    <div
                                        key={agent.id}
                                        onClick={() => handleToggleAgent(agent.id)}
                                        className={`
                      flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border-2
                      ${editAgentIds.includes(agent.id)
                                                ? "bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30"
                                                : "bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800"
                                            }
                    `}
                                    >
                                        <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-zinc-800">
                                            {agent.avatar_url ? (
                                                <img src={agent.avatar_url} alt={agent.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-400"><Bot size={18} /></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${editAgentIds.includes(agent.id) ? "text-blue-600 dark:text-blue-400" : ""}`}>
                                                {agent.name}
                                            </p>
                                            <p className="text-[10px] text-gray-500 truncate uppercase tracking-tighter">{agent.role}</p>
                                        </div>
                                        {editAgentIds.includes(agent.id) ? (
                                            <CheckCircle size={18} className="text-blue-600" />
                                        ) : (
                                            <div className="h-[18px] w-[18px] rounded-full border-2 border-gray-200 dark:border-zinc-700" />
                                        )}
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
                            const agent = allAgents.find(a => a.id === m.agent_id);
                            const isSystem = m.agent_id === "system";
                            return (
                                <div key={m.id} className={`flex gap-4 ${isSystem ? "justify-center" : ""}`}>
                                    {!isSystem && (
                                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
                                            {agent?.avatar_url ? <img src={agent.avatar_url} alt={m.agent_name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-gray-400"><Bot size={24} /></div>}
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] ${isSystem ? "w-full" : ""}`}>
                                        {!isSystem && <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{m.agent_name} • {agent?.role}</p>}
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
                                <Button onClick={handleGenerateSummary} disabled={isProcessing} className="h-14 px-8 rounded-full text-lg font-black bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <><Flag size={20} className="mr-2" /> まとめる</>}
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
                                {isProcessing ? <Loader2 className="animate-spin" /> : <><Save size={24} /> 保存・一括更新</>}
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

// 🆕 カスタムアイコンコンポーネント
function CheckCircle({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}

function CheckCircle2({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
