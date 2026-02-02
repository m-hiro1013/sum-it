"use client";

import { useState } from "react";
import { FacilitatorInput } from "@/types/facilitator";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";
import { Save, Loader2, Play, Flag, Info } from "lucide-react";

interface FacilitatorFormProps {
    initialData?: Partial<FacilitatorInput>;
    onSubmit: (data: FacilitatorInput) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function FacilitatorForm({ initialData, onSubmit, onCancel, isLoading }: FacilitatorFormProps) {
    const [formData, setFormData] = useState<FacilitatorInput>({
        name: initialData?.name || "",
        description: initialData?.description || "",
        start_prompt: initialData?.start_prompt || "",
        end_prompt: initialData?.end_prompt || "",
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
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                        <Info size={14} className="text-blue-500" />
                        議長スタイル名 *
                    </label>
                    <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="例: 要旨まとめ型・意思決定重視"
                        required
                        className="h-12 rounded-xl"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">説明文</label>
                    <Input
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="例: 会議の要点を整理し、ネクストアクションを明確にします"
                        className="h-12 rounded-xl"
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 uppercase tracking-wider">
                            <div className="p-1.5 rounded-md bg-green-500 text-white">
                                <Play size={14} />
                            </div>
                            会議開始プロンプト (開始・進行ルール) *
                        </label>
                        <Textarea
                            name="start_prompt"
                            value={formData.start_prompt}
                            onChange={handleChange}
                            className="h-40 font-mono text-sm rounded-2xl p-4 bg-gray-50 dark:bg-black/40"
                            placeholder="会議が始まった時にエージェントたちに守らせるルールを書いてね"
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 uppercase tracking-wider">
                            <div className="p-1.5 rounded-md bg-red-500 text-white">
                                <Flag size={14} />
                            </div>
                            結論作成プロンプト (まとめの指示) *
                        </label>
                        <Textarea
                            name="end_prompt"
                            value={formData.end_prompt}
                            onChange={handleChange}
                            className="h-40 font-mono text-sm rounded-2xl p-4 bg-gray-50 dark:bg-black/40"
                            placeholder="最後にサマリーを作成する時の具体的な指示を書いてね"
                            required
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 py-4 border-t border-gray-100 dark:border-neutral-800">
                    <input
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="h-5 w-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-600"
                    />
                    <label htmlFor="is_active" className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        この議長スタイルを有効にする
                    </label>
                </div>
            </div>

            <div className="flex gap-4 pt-6">
                <Button variant="outline" className="flex-1 h-14 rounded-2xl text-lg font-bold" onClick={onCancel} disabled={isLoading}>
                    キャンセル
                </Button>
                <Button type="submit" className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/20" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>
                            <Save className="mr-2 h-5 w-5" /> 保存する
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
