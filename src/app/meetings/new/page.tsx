"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
    getAgents,
    getFacilitators,
    createMeeting,
    getMeetingTemplates,
    createMeetingTemplate
} from "@/lib/firestore";
import { Agent } from "@/types/agent";
import { Facilitator } from "@/types/facilitator";
import { MeetingTemplate } from "@/types/template";
import {
    Loader2,
    Users,
    Terminal,
    Bot,
    CheckCircle,
    Sparkles,
    ArrowRight,
    Bookmark,
    Layout,
    Info,
    Save,
    MessageSquare,
    Edit3
} from "lucide-react";

export default function NewMeetingPage() {
    const router = useRouter();

    // マスタデータ
    const [agents, setAgents] = useState<Agent[]>([]);
    const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
    const [templates, setTemplates] = useState<MeetingTemplate[]>([]);

    // フォームステート
    const [title, setTitle] = useState("");
    const [topic, setTopic] = useState("");
    const [whiteboard, setWhiteboard] = useState("");
    const [facilitatorId, setFacilitatorId] = useState("");
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

    // 補助ステート
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);
    const [templateName, setTemplateName] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            const [agentsData, facilitatorsData, templatesData] = await Promise.all([
                getAgents(),
                getFacilitators(),
                getMeetingTemplates()
            ]);
            setAgents(agentsData);
            setFacilitators(facilitatorsData);
            setTemplates(templatesData);

            // デフォルト値設定
            if (facilitatorsData.length > 0) setFacilitatorId(facilitatorsData[0].id);

            setIsLoading(false);
        };
        fetchData();
    }, []);

    const handleApplyTemplate = (template: MeetingTemplate) => {
        setFacilitatorId(template.facilitator_id);
        setSelectedAgentIds(template.agent_ids);
        // テンプレート適用を視覚的にフィードバックしたいならここ
    };

    const handleToggleAgent = (id: string) => {
        setSelectedAgentIds(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !topic || !facilitatorId || selectedAgentIds.length === 0) {
            alert("全項目入力してね！エージェントも最低1人は必要だよ！💅");
            return;
        }

        setIsSubmitting(true);
        try {
            // テンプレートとして保存がチェックされている場合
            if (saveAsTemplate && templateName) {
                await createMeetingTemplate({
                    name: templateName,
                    description: `「${title}」から作成`,
                    facilitator_id: facilitatorId,
                    agent_ids: selectedAgentIds,
                    is_active: true
                });
            }

            const meetingId = await createMeeting({
                title,
                topic,
                whiteboard,
                facilitator_id: facilitatorId,
                agent_ids: selectedAgentIds,
                status: "pending"
            });
            router.push(`/meetings/${meetingId}`);
        } catch (error) {
            console.error(error);
            alert("作成に失敗しちゃった😭");
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white pb-20">
            <Header />

            <main className="container mx-auto py-12 px-4 max-w-5xl">
                <div className="mb-12">
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <MessageSquare className="text-blue-600" size={36} /> Setup New Meeting
                    </h1>
                    <p className="mt-3 text-gray-500 font-medium">議論の目的、議長、そして最高の参加者を選びましょう。💅✨</p>
                </div>

                {/* 🚀 テンプレート選択セクション */}
                {templates.length > 0 && (
                    <section className="mb-12 bg-white dark:bg-zinc-900/50 p-8 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                            <Bookmark size={14} className="text-blue-500" /> Start from Template (Recommended)
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {templates.map(tmp => (
                                <button
                                    key={tmp.id}
                                    onClick={() => handleApplyTemplate(tmp)}
                                    className="px-6 py-4 rounded-2xl bg-gray-50 dark:bg-black hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 transition-all text-left group"
                                >
                                    <p className="text-sm font-black group-hover:text-blue-600 mb-1">{tmp.name}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">{tmp.agent_ids.length} Agents • {facilitators.find(f => f.id === tmp.facilitator_id)?.name}</p>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* 基本情報設定 */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-6 bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Info size={14} /> Basic Information
                            </h2>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold ml-1 text-gray-500 uppercase">Meeting Title</label>
                                    <Input
                                        placeholder="例: プロジェクトα コンセプト会議"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="h-14 rounded-2xl bg-gray-50 dark:bg-black/40 border-none font-bold text-lg px-6 focus-visible:ring-2 ring-blue-500/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold ml-1 text-gray-500 uppercase">Topic / Purpose</label>
                                    <Textarea
                                        placeholder="何について議論し、どんな結論を得たいですか？"
                                        value={topic}
                                        onChange={e => setTopic(e.target.value)}
                                        className="h-40 rounded-2xl bg-gray-50 dark:bg-black/40 border-none px-6 py-4 text-sm leading-relaxed focus:ring-2 ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Edit3 size={14} /> Initial Whiteboard
                            </h2>
                            <Textarea
                                placeholder="前提条件や共有しておきたい資料があればここに足しておきましょう。"
                                value={whiteboard}
                                onChange={e => setWhiteboard(e.target.value)}
                                className="h-[254px] rounded-2xl bg-gray-50 dark:bg-black/40 border-none px-6 py-4 text-sm leading-relaxed focus:ring-2 ring-blue-500/20"
                            />
                        </div>
                    </section>

                    {/* 💎 議長 ＆ エージェント セット構成セクション (ユーザー要望) */}
                    <section className="bg-white dark:bg-zinc-900 p-8 md:p-12 rounded-[40px] border border-gray-100 dark:border-zinc-800 shadow-2xl shadow-blue-500/5 space-y-10">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-gray-50 dark:border-zinc-800 pb-8">
                            <div>
                                <h2 className="text-2xl font-black flex items-center gap-3">
                                    <Layout className="text-blue-500" size={24} /> Configuration
                                </h2>
                                <p className="text-sm text-gray-500 mt-1 font-medium">議長と参加エージェントの組み合わせが、議論の質を決定します。</p>
                            </div>
                            <div className="flex items-center gap-2 h-12 bg-blue-50 dark:bg-blue-900/20 px-4 rounded-full border border-blue-100 dark:border-blue-900/30">
                                <span className="text-xs font-black text-blue-600 uppercase tracking-tighter">Current Setup:</span>
                                <span className="text-xs font-mono font-bold text-blue-500">{selectedAgentIds.length} Agents</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            {/* 議長選択 (Left: 4 cols) */}
                            <div className="lg:col-span-5 space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-2">
                                    <Terminal size={14} /> Facilitator Style
                                </h3>
                                <div className="grid grid-cols-1 gap-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                                    {facilitators.map(f => (
                                        <div
                                            key={f.id}
                                            onClick={() => setFacilitatorId(f.id)}
                                            className={`
                        p-5 rounded-3xl cursor-pointer transition-all border-2
                        ${facilitatorId === f.id
                                                    ? "bg-blue-50/50 border-blue-500 dark:bg-blue-900/10 shadow-lg shadow-blue-500/10"
                                                    : "bg-gray-50 dark:bg-black/40 border-transparent hover:bg-gray-100 dark:hover:bg-zinc-800"
                                                }
                      `}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <p className={`font-black text-base ${facilitatorId === f.id ? "text-blue-600" : ""}`}>{f.name}</p>
                                                {facilitatorId === f.id && <CheckCircle size={18} className="text-blue-500" />}
                                            </div>
                                            <p className="text-xs text-gray-500 leading-relaxed italic">{f.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* エージェント選択 (Right: 7 cols) */}
                            <div className="lg:col-span-1 border-r border-gray-100 dark:border-zinc-800 hidden lg:block" />

                            <div className="lg:col-span-6 space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-2">
                                    <Users size={14} /> Participants (Agents)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                                    {agents.map(agent => (
                                        <div
                                            key={agent.id}
                                            onClick={() => handleToggleAgent(agent.id)}
                                            className={`
                        p-4 rounded-3xl cursor-pointer transition-all border-2 flex items-center gap-4
                        ${selectedAgentIds.includes(agent.id)
                                                    ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-900/30 shadow-md shadow-indigo-500/5 rotate-[-1deg]"
                                                    : "bg-gray-50 dark:bg-black/40 border-transparent hover:bg-gray-100 dark:hover:bg-zinc-800"
                                                }
                      `}
                                        >
                                            <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-white shadow-sm">
                                                {agent.avatar_url ? (
                                                    <img src={agent.avatar_url} alt={agent.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-300 bg-gray-50"><Bot size={20} /></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-black truncate ${selectedAgentIds.includes(agent.id) ? "text-indigo-600" : ""}`}>{agent.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight truncate">{agent.role}</p>
                                            </div>
                                            {selectedAgentIds.includes(agent.id) && <CheckCircle size={16} className="text-indigo-500" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 💾 テンプレートとして保存オプション */}
                        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-zinc-800">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={saveAsTemplate}
                                                onChange={e => setSaveAsTemplate(e.target.checked)}
                                                className="peer hidden"
                                            />
                                            <div className="w-6 h-6 rounded-lg border-2 border-gray-200 dark:border-zinc-700 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all" />
                                            <CheckCircle size={14} className="absolute left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-500 group-hover:text-blue-600 transition-colors uppercase tracking-tight">このセットをテンプレートとして保存</span>
                                    </label>

                                    {saveAsTemplate && (
                                        <Input
                                            placeholder="テンプレート名 (例: 定例MTG用)"
                                            value={templateName}
                                            onChange={e => setTemplateName(e.target.value)}
                                            className="h-12 w-64 rounded-xl bg-gray-50 dark:bg-black/40 border-none font-bold text-sm px-4 focus-visible:ring-2 ring-blue-500/20"
                                        />
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-16 px-12 rounded-full text-xl font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] w-full md:w-auto"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="animate-spin" size={24} />
                                    ) : (
                                        <>CREATE MEETING <ArrowRight className="ml-2" size={24} /></>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </section>
                </form>
            </main>
        </div>
    );
}
