import { OpenAI } from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// OpenAI 初期化
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Anthropic 初期化
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Google AI 初期化
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface ChatOptions {
    provider: "openai" | "anthropic" | "google";
    model: string;
    systemPrompt?: string;
    cacheableContext?: string;  // 🆕 追加：キャッシュ対象のコンテキスト（whiteboard等）💅
    maxTokens?: number;
    temperature?: number;
}

export interface LLMResponse {
    content: string;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}

/**
 * 🆕 指数バックオフ付きリトライ関数！🛡️
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000
): Promise<T> {
    let lastError: any;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // リトライすべきエラーか判定（429: Rate Limit, 503: Service Unavailable など）💅
            const status = error.status || error.statusCode || (error.response?.status);
            const shouldRetry = status === 429 || status === 503 || (error.message && (
                error.message.includes("rate limit") ||
                error.message.includes("timeout") ||
                error.message.includes("unavailable")
            ));

            if (!shouldRetry || i === maxRetries) break;

            const delay = initialDelay * Math.pow(2, i);
            console.warn(`⚠️ LLMリトライ中 (${i + 1}/${maxRetries}): ${delay}ms待機...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

// 統合ログ出力用のインターフェース💅
interface LLMCacheLog {
    provider: string;
    model: string;
    hasCacheableContext: boolean;
    cacheableContextLength: number;
    cacheCreationTokens?: number;  // Claude用
    cacheReadTokens?: number;      // Claude用
    cachedContentTokens?: number;  // Gemini用
    cachedTokens?: number;         // OpenAI用
    inputTokens: number;
    outputTokens: number;
}

function logCacheInfo(log: LLMCacheLog): void {
    const isDev = process.env.NODE_ENV === "development";
    const cacheHit = log.cacheReadTokens || log.cachedContentTokens || log.cachedTokens || 0;

    if (isDev) {
        console.log(`[LLM Cache Detail] ${log.provider}/${log.model}`, JSON.stringify(log, null, 2));
    }
    // 本番・開発共通のサマリーログ
    console.log(`📡 [LLM Cache] ${log.provider}/${log.model} - CacheHit: ${cacheHit > 0 ? "✅ YES" : "❌ NO"} (${cacheHit} tokens)`);
}

export async function callLLM(message: string, options: ChatOptions): Promise<LLMResponse> {
    const {
        provider,
        model,
        systemPrompt,
        cacheableContext,
        maxTokens = 4096,
        temperature = 0.7
    } = options;
    const timeout = 60000; // 60秒でタイムアウト💅
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        return await withRetry(async () => {
            switch (provider) {
                case "openai":
                    const isGpt5 = model.startsWith("gpt-5");
                    const isReasoningModel = model.startsWith("o1-") || model.startsWith("o3-") || isGpt5;

                    if (isGpt5) {
                        const input: any[] = [];
                        // 1. キャッシュ対象を先頭に配置（OpenAIは先頭一致で自動キャッシュ）
                        if (cacheableContext) {
                            input.push({ role: "developer", content: `## 参照ドキュメント\n\n${cacheableContext}` });
                        }
                        if (systemPrompt) {
                            input.push({ role: "developer", content: systemPrompt });
                        }
                        input.push({ role: "user", content: message });

                        const response = await fetch("https://api.openai.com/v1/responses", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                            },
                            body: JSON.stringify({
                                model: model,
                                input: input,
                                max_output_tokens: maxTokens,
                            }),
                            signal: controller.signal,
                        });

                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(`Responses API failed: ${JSON.stringify(errorData)}`);
                        }

                        const data = await response.json();
                        const resultText = data.output?.text || (Array.isArray(data.output) ? data.output[0]?.text : "");

                        logCacheInfo({
                            provider: "openai-responses",
                            model,
                            hasCacheableContext: !!cacheableContext,
                            cacheableContextLength: cacheableContext?.length || 0,
                            cachedTokens: data.usage?.prompt_tokens_details?.cached_tokens || 0,
                            inputTokens: data.usage?.input_tokens || 0,
                            outputTokens: data.usage?.output_tokens || 0,
                        });

                        return {
                            content: resultText,
                            usage: {
                                input_tokens: data.usage?.input_tokens || 0,
                                output_tokens: data.usage?.output_tokens || 0,
                            }
                        };
                    }

                    const messages: any[] = [];
                    if (cacheableContext) {
                        messages.push({
                            role: isReasoningModel ? "developer" : "system",
                            content: `## 参照ドキュメント\n\n${cacheableContext}`
                        });
                    }
                    if (systemPrompt) {
                        messages.push({
                            role: isReasoningModel ? "developer" : "system",
                            content: systemPrompt
                        });
                    }
                    messages.push({ role: "user", content: message });

                    const chatResponse = await openai.chat.completions.create({
                        model: model,
                        messages: messages,
                        max_completion_tokens: maxTokens,
                        ...(isReasoningModel ? {} : { temperature: temperature }),
                    }, { signal: controller.signal });

                    logCacheInfo({
                        provider: "openai",
                        model,
                        hasCacheableContext: !!cacheableContext,
                        cacheableContextLength: cacheableContext?.length || 0,
                        cachedTokens: (chatResponse.usage as any)?.prompt_tokens_details?.cached_tokens || 0,
                        inputTokens: chatResponse.usage?.prompt_tokens || 0,
                        outputTokens: chatResponse.usage?.completion_tokens || 0,
                    });

                    return {
                        content: chatResponse.choices[0].message.content || "",
                        usage: {
                            input_tokens: chatResponse.usage?.prompt_tokens || 0,
                            output_tokens: chatResponse.usage?.completion_tokens || 0,
                        }
                    };

                case "anthropic":
                    type SystemBlock = { type: "text"; text: string; cache_control?: { type: "ephemeral" } };
                    const systemBlocks: SystemBlock[] = [];

                    // 1. キャッシュ対象を先頭に配置（cache_control: ephemeral を明示）💅
                    if (cacheableContext) {
                        systemBlocks.push({
                            type: "text",
                            text: `## 参照ドキュメント\n\n${cacheableContext}`,
                            cache_control: { type: "ephemeral" }
                        });
                    }
                    if (systemPrompt) {
                        systemBlocks.push({ type: "text", text: systemPrompt });
                    }

                    const anthropicResponse = await anthropic.messages.create({
                        model: model,
                        system: systemBlocks.length > 0 ? systemBlocks : undefined,
                        messages: [{ role: "user", content: message }],
                        max_tokens: maxTokens,
                        temperature: temperature,
                    }, { signal: controller.signal });

                    logCacheInfo({
                        provider: "anthropic",
                        model,
                        hasCacheableContext: !!cacheableContext,
                        cacheableContextLength: cacheableContext?.length || 0,
                        cacheCreationTokens: (anthropicResponse.usage as any).cache_creation_input_tokens || 0,
                        cacheReadTokens: (anthropicResponse.usage as any).cache_read_input_tokens || 0,
                        inputTokens: anthropicResponse.usage.input_tokens,
                        outputTokens: anthropicResponse.usage.output_tokens,
                    });

                    return {
                        content: anthropicResponse.content[0].type === "text" ? anthropicResponse.content[0].text : "",
                        usage: {
                            input_tokens: anthropicResponse.usage.input_tokens,
                            output_tokens: anthropicResponse.usage.output_tokens,
                        }
                    };

                case "google":
                    const geminiModel = genAI.getGenerativeModel({
                        model: model,
                        systemInstruction: systemPrompt || undefined,
                    });

                    const contents: any[] = [];
                    // 1. キャッシュ対象を先頭に配置（Geminiは暗黙的キャッシュ）
                    if (cacheableContext) {
                        contents.push({
                            role: "user",
                            parts: [{ text: `## 参照ドキュメント\n\n以下のドキュメントを参照して議論に貢献してください：\n\n${cacheableContext}` }]
                        });
                        contents.push({ role: "model", parts: [{ text: "ドキュメントを確認しました。内容を把握した上で回答します。" }] });
                    }
                    contents.push({ role: "user", parts: [{ text: message }] });

                    const result = await geminiModel.generateContent({
                        contents: contents,
                        generationConfig: {
                            maxOutputTokens: maxTokens,
                            temperature: temperature,
                        },
                    });

                    const usage = result.response.usageMetadata;
                    logCacheInfo({
                        provider: "google",
                        model,
                        hasCacheableContext: !!cacheableContext,
                        cacheableContextLength: cacheableContext?.length || 0,
                        cachedContentTokens: usage?.cachedContentTokenCount || 0,
                        inputTokens: usage?.promptTokenCount || 0,
                        outputTokens: usage?.candidatesTokenCount || 0,
                    });

                    return {
                        content: result.response.text(),
                        usage: {
                            input_tokens: usage?.promptTokenCount || 0,
                            output_tokens: usage?.candidatesTokenCount || 0,
                        }
                    };

                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }
        });
    } catch (error: any) {
        if (error.name === "AbortError") {
            console.error(`❌ LLMリクエストがタイムアウトしました (${timeout}ms):`, provider);
            throw new Error(`LLMリクエストがタイムアウトしました。しばらく待ってから再試行してください。💅`);
        }
        console.error(`LLM call failed (${provider}):`, error);
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}


