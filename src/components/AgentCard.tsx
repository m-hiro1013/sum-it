import { Agent } from "@/types/agent";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/Card";
import { Button } from "./ui/Button";
import { Edit2, Trash2, Bot } from "lucide-react";

interface AgentCardProps {
    agent: Agent;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
    return (
        <Card className="overflow-hidden transition-all hover:shadow-lg dark:bg-zinc-900/50">
            <CardHeader className="flex flex-row items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    {agent.avatar_url ? (
                        <img src={agent.avatar_url} alt={agent.name} className="h-full w-full object-cover" />
                    ) : (
                        <Bot size={24} className="text-gray-400" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{agent.name}</CardTitle>
                    <CardDescription className="font-mono text-[10px] uppercase tracking-wider">
                        {agent.role}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
                    {agent.persona || "性格設定なし"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-zinc-800 dark:text-gray-400">
                        {agent.llm}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-zinc-800 dark:text-gray-400">
                        {agent.model}
                    </span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-neutral-800">
                <Button variant="ghost" size="sm" onClick={() => onEdit(agent.id)}>
                    <Edit2 size={16} className="mr-2" />
                    編集
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onDelete(agent.id)}>
                    <Trash2 size={16} className="mr-2" />
                    削除
                </Button>
            </CardFooter>
        </Card>
    );
}
