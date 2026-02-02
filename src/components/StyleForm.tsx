"use client";

import { useState } from "react";
import { OutputStyleInput } from "@/types/style";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Save, Loader2, MessageSquareQuote } from "lucide-react";

interface StyleFormProps {
    initialData?: Partial<OutputStyleInput>;
    onSubmit: (data: OutputStyleInput) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function StyleForm({ initialData, onSubmit, onCancel, isLoading }: StyleFormProps) {
    const [formData, setFormData] = useState<OutputStyleInput>({
        name: initialData?.name || "",
        description: initialData?.description || "",
        prompt_segment: initialData?.prompt_segment || "",
        is_active: initialData?.is_active ?? true,
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        const finalValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
        setFormData((prev) => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">形式名 *</label>
                    <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="例: 爆速・箇条書き"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">説明文</label>
                    <Input
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="例: 要点だけを3つの箇条書きで伝えます"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <MessageSquareQuote size={16} className="text-blue-500" />
                        プロンプト断片 *
                    </label>
                    <Textarea
                        name="prompt_segment"
                        value={formData.prompt_segment}
                        onChange={handleChange}
                        className="h-40 font-mono text-sm"
                        placeholder="AIに指示する出力形式の指示を詳しく書いてね"
                        required
                    />
                    <p className="text-[10px] text-gray-400">※ この文章がエージェントのシステムプロンプトの最後に結合されます。</p>
                </div>

                <div className="flex items-center gap-2 py-2">
                    <input
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        この形式を有効にする（エージェント作成画面に表示する）
                    </label>
                </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
                <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={onCancel} disabled={isLoading}>
                    キャンセル
                </Button>
                <Button type="submit" className="flex-1 rounded-xl h-12 shadow-lg shadow-blue-500/20" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" /> 保存する
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
