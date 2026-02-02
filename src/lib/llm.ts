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
                const openaiResponse = await openai.chat.completions.create({
                    model: model,
                    messages: [
                        ...(systemPrompt ? [{ role: "system", content: systemPrompt } as const] : []),
                        { role: "user", content: message },
                    ],
                    max_tokens: maxTokens,
                    temperature: temperature,
                });
                return openaiResponse.choices[0].message.content || "";

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
