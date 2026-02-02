"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import { AgentInput } from "@/types/agent";
import { LLMModel } from "@/types/model";
import { OutputStyle } from "@/types/style"; // 🆕 追加
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import { Card } from "./ui/Card";
import { storage } from "@/lib/firebase";
import { getLLMModels, getOutputStyles } from "@/lib/firestore"; // 🆕 追加
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Loader2, Save, X, Upload, Camera, Sparkles, MessageSquareQuote } from "lucide-react";
import Link from "next/link"; // 🆕 これ忘れてた！猛省！！😭

interface AgentFormProps {
    initialData?: Partial<AgentInput>;
    onSubmit: (data: AgentInput) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export default function AgentForm({ initialData, onSubmit, onCancel, isLoading }: AgentFormProps) {
    const [formData, setFormData] = useState<AgentInput>({
        name: initialData?.name || "",
        role: initialData?.role || "",
        avatar_url: initialData?.avatar_url || "",
        persona: initialData?.persona || "",
        prompt: initialData?.prompt || "",
        style_id: initialData?.style_id || "", // 🔧 変更: output_style から style_id へ
        llm: initialData?.llm || "openai",
        model: initialData?.model || "",
        temperature: initialData?.temperature ?? 0.7, // 🆕 追加（デフォルト0.7）
    });

    // --- 外部データ管理 (Models & Styles) 🆕 ---
    const [allModels, setAllModels] = useState<LLMModel[]>([]);
    const [allStyles, setAllStyles] = useState<OutputStyle[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [models, styles] = await Promise.all([getLLMModels(), getOutputStyles(true)]);
                setAllModels(models);
                setAllStyles(styles);

                // デフォルト値のセット
                if (!formData.model && models.length > 0) {
                    const firstVisible = models.find(m => m.provider === formData.llm);
                    if (firstVisible) setFormData(prev => ({ ...prev, model: firstVisible.model_id }));
                }
                if (!formData.style_id && styles.length > 0) {
                    setFormData(prev => ({ ...prev, style_id: styles[0].id }));
                }
            } catch (e) {
                console.error("Failed to fetch data", e);
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchData();
    }, [formData.llm]);

    const getTierLabel = (tier: string) => {
        switch (tier) {
            case "recommended": return "🟢 推奨";
            case "expensive": return "🔴 高額・高性能";
            case "cheap": return "🔵 安価・爆速";
            case "latest": return "✨ 最新/最強";
            default: return "";
        }
    };

    // --- 画像アップロード & トリム関連 ---
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", () => setImageSrc(reader.result as string));
            reader.readAsDataURL(file);
        }
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous");
            image.src = url;
        });

    const handleUpload = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        setIsUploading(true);
        try {
            const image = await createImage(imageSrc);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            canvas.width = croppedAreaPixels.width;
            canvas.height = croppedAreaPixels.height;
            ctx.drawImage(image, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9);
            });
            if (blob) {
                const storageRef = ref(storage, `avatars/${Date.now()}.jpg`);
                await uploadBytes(storageRef, blob);
                const url = await getDownloadURL(storageRef);
                setFormData((prev) => ({ ...prev, avatar_url: url }));
                setImageSrc(null);
            }
        } catch (e) {
            console.error(e);
            alert("画像のアップロードに失敗しました。");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-10">
            {/* アバター選択セクション */}
            <div className="flex flex-col items-center gap-6 py-6 border-b border-gray-100 dark:border-neutral-800">
                <div className="relative h-40 w-40 overflow-hidden rounded-full border-8 border-white shadow-2xl dark:border-zinc-800 bg-gray-100 flex items-center justify-center group">
                    {formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="Avatar" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                    ) : (
                        <Camera size={48} className="text-gray-400" />
                    )}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        <Upload className="text-white" />
                    </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <p className="text-xs text-gray-500 font-medium">エージェントの顔写真を選んでね✨</p>

                {/* トリムモーダル */}
                {imageSrc && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
                        <Card className="w-full max-w-xl overflow-hidden border-none shadow-2xl">
                            <div className="relative h-[450px] w-full bg-black border-b">
                                <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
                            </div>
                            <div className="p-6 space-y-6 bg-white dark:bg-zinc-900">
                                <div className="flex items-center gap-6">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Zoom</span>
                                    <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setImageSrc(null)}>キャンセル</Button>
                                    <Button className="flex-1 h-12 rounded-xl shadow-lg shadow-blue-500/20" onClick={handleUpload} disabled={isUploading}>
                                        {isUploading ? <Loader2 className="animate-spin" /> : "切り抜き完了！✨"}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">エージェント名 *</label>
                    <Input name="name" value={formData.name} onChange={handleChange} required className="h-12 text-lg rounded-xl" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">役割 *</label>
                    <Input name="role" value={formData.role} onChange={handleChange} placeholder="例: 戦略的アドバイザー" required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">LLMプロバイダー *</label>
                    <Select name="llm" value={formData.llm} onChange={handleChange} required className="h-12 rounded-xl">
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="google">Google AI</option>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">使用モデル *</label>
                    <Select name="model" value={formData.model} onChange={handleChange} required disabled={isDataLoading} className="h-12 rounded-xl">
                        {isDataLoading ? (<option>読み込み中...</option>) : (
                            allModels.filter(m => m.provider === formData.llm).map((m) => (
                                <option key={m.id} value={m.model_id}>{m.name} ({getTierLabel(m.tier)})</option>
                            ))
                        )}
                    </Select>
                </div>

                {/* 🆕 LLM Temperature 設定 */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">創造性 (Temperature)</label>
                        <span className="text-lg font-mono font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800">
                            {formData.temperature.toFixed(1)}
                        </span>
                    </div>
                    <div className="px-1 py-2">
                        <input
                            type="range"
                            name="temperature"
                            min="0"
                            max="1"
                            step="0.1"
                            value={formData.temperature}
                            onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                            className="w-full h-2 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">
                            <span>Precise (堅実)</span>
                            <span>Creative (創造)</span>
                        </div>
                    </div>
                </div>

                {/* 🆕 動的出力形式セレクター */}
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 uppercase tracking-tight">
                        <MessageSquareQuote size={16} className="text-blue-500" />
                        出力形式 *
                    </label>
                    <Select name="style_id" value={formData.style_id} onChange={handleChange} required disabled={isDataLoading} className="h-12 rounded-xl">
                        {isDataLoading ? (<option>読み込み中...</option>) : (
                            allStyles.map((s) => (
                                <option key={s.id} value={s.id}>{s.name} — {s.description}</option>
                            ))
                        )}
                    </Select>
                    <p className="text-[10px] text-gray-400 px-1 italic">
                        形式の追加・編集は <Link href="/settings/styles" className="text-blue-500 hover:underline">こちら</Link> から行えます。
                    </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">性格・設定</label>
                    <Textarea name="persona" value={formData.persona} onChange={handleChange} className="h-28 rounded-2xl p-4" placeholder="どんな性格で、どんな立ち振る舞いをしてほしい？" />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 uppercase tracking-tight">
                        <Sparkles size={16} className="text-blue-500" />
                        詳細システムプロンプト (Override)
                    </label>
                    <Textarea name="prompt" value={formData.prompt} onChange={handleChange} className="h-36 font-mono text-xs rounded-2xl p-4 bg-gray-50 dark:bg-black/40" placeholder="特定の指示を上書きしたい場合に記入（通常は空でOK）" />
                </div>
            </div>

            <div className="flex gap-4 pt-6">
                <Button variant="outline" className="flex-1 h-14 rounded-2xl text-lg font-bold" onClick={onCancel} disabled={isLoading}>キャンセル</Button>
                <Button type="submit" className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/20" disabled={isLoading || isUploading || isDataLoading}>
                    {(isLoading || isUploading) ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> エージェントを保存</>}
                </Button>
            </div>
        </form>
    );
}
