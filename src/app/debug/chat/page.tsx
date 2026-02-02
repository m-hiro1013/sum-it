"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getAgents } from "@/lib/firestore";
import { Agent } from "@/types/agent";
import { Loader2, Send, Bot } from "lucide-react";

export default function DebugChatPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState("");
    const [topic, setTopic] = useState("");
    const [response, setResponse] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const data = await getAgents();
                setAgents(data);
                if (data.length > 0) setSelectedAgentId(data[0].id);
            } catch (error) {
                console.error("Failed to load agents", error);
            } finally {
                setIsPageLoading(false);
            }
        };
        fetchAgents();
    }, []);

    const handleTestChat = async () => {
        if (!topic || !selectedAgentId) return;

        setIsLoading(true);
        setResponse("");

        const agent = agents.find((a) => a.id === selectedAgentId);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: topic,
                    agent: agent,
                }),
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResponse(data.content);
        } catch (error: any) {
            console.error(error);
            alert("エラーが発生しました: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isPageLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
            <Header />
            <main className="container mx-auto py-12 px-4 max-w-2xl">
                <h1 className="text-3xl font-bold mb-8">AI発言テストモニター</h1>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-lg">1. 発言させるエージェントを選択</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select
                            value={selectedAgentId}
                            onChange={(e) => setSelectedAgentId(e.target.value)}
                        >
                            {agents.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name} ({a.role})
                                </option>
                            ))}
                        </Select>
                        {agents.length === 0 && (
                            <p className="text-sm text-red-500">
                                エージェントが登録されていないよ！まずは
                                <Link href="/agents/new" className="underline ml-1">作成画面</Link>
                                から作ってね！
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-lg">2. 議題（トピック）を入力</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="何について意見を聞きたい？"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="h-24"
                        />
                        <Button
                            onClick={handleTestChat}
                            disabled={isLoading || !topic || !selectedAgentId}
                            className="w-full"
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            エージェントに意見を求める
                        </Button>
                    </CardContent>
                </Card>

                {response && (
                    <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <Bot className="text-blue-600" size={24} />
                            <CardTitle className="text-lg">応答結果</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                                {response}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}

// 簡易的なLinkの代わり
function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return (
        <a href={href} className={className}>
            {children}
        </a>
    );
}
