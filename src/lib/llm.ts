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
    maxTokens?: number;
    temperature?: number;
}

export async function callLLM(message: string, options: ChatOptions): Promise<string> {
    const { provider, model, systemPrompt, maxTokens = 4096, temperature = 0.7 } = options;

    try {
        switch (provider) {
            case "openai":
                // 🆕 OpenAIの最先端「推論モデル」シリーズの判定！⚖️
                const isGpt5 = model.startsWith("gpt-5");
                const isReasoningModel = model.startsWith("o1-") || model.startsWith("o3-") || isGpt5;

                // 🚀 GPT-5シリーズは「Responses API」を直接叩くのが2026年の正解！💅
                if (isGpt5) {
                    const response = await fetch("https://api.openai.com/v1/responses", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                        },
                        body: JSON.stringify({
                            model: model,
                            input: [
                                ...(systemPrompt ? [{ role: "developer", content: systemPrompt }] : []),
                                { role: "user", content: message }
                            ],
                            max_output_tokens: maxTokens,
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Responses API failed: ${JSON.stringify(errorData)}`);
                    }

                    const data = await response.json();

                    // 🆕 デバッグ用にレスポンス構造を解析するよ！🔍
                    // 2026年のResponses規格はネストが深い場合があるから、柔軟に抽出！💅
                    const output = data.output;
                    let extractedText = "";

                    if (output) {
                        if (typeof output.text === "string") {
                            extractedText = output.text;
                        } else if (Array.isArray(output.content)) {
                            extractedText = output.content[0]?.text || "";
                        } else if (Array.isArray(output) && output[0]?.content) {
                            extractedText = output[0].content[0]?.text || "";
                        } else if (Array.isArray(output) && output[0]?.text) {
                            extractedText = output[0].text;
                        }
                    }

                    if (!extractedText) {
                        console.warn("⚠️ GPT-5 Response extraction failed path. Full data:", JSON.stringify(data));
                    }

                    return extractedText;
                }

                // --- 通常のモデル（o1/o3/gpt-4など）は Chat API を使用 ---
                const messages: any[] = [];
                if (systemPrompt) {
                    // 最新推論モデルは 'developer'、それ以外は 'system' 💅
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
                });

                return chatResponse.choices[0].message.content || "";

            case "anthropic":
                const anthropicResponse = await anthropic.messages.create({
                    model: model,
                    system: systemPrompt,
                    messages: [{ role: "user", content: message }],
                    max_tokens: maxTokens,
                    temperature: temperature,
                });
                return anthropicResponse.content[0].type === "text" ? anthropicResponse.content[0].text : "";

            case "google":
                const geminiModel = genAI.getGenerativeModel({ model: model });
                const result = await geminiModel.generateContent({
                    contents: [
                        ...(systemPrompt ? [{ role: "user", parts: [{ text: `System Instructions: ${systemPrompt}` }] }] : []),
                        { role: "user", parts: [{ text: message }] },
                    ],
                    generationConfig: {
                        maxOutputTokens: maxTokens,
                        temperature: temperature,
                    },
                });
                return result.response.text();

            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    } catch (error) {
        console.error(`LLM call failed (${provider}):`, error);
        throw error;
    }
}
