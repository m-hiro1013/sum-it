import { NextRequest, NextResponse } from "next/server";
import { callLLM, ChatOptions } from "@/lib/llm";

export async function POST(req: NextRequest) {
    try {
        const { message, agent, context } = await req.json();

        if (!message || !agent) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 会議の文脈（これまでの発言）を含めるためのプロンプト構築
        const fullPrompt = context
            ? `これまで以下の発言がありました:\n${context}\n\nこれを受けて、あなたの役割（${agent.role}）として発言してください。\n議題: ${message}`
            : message;

        const options: ChatOptions = {
            provider: agent.llm,
            model: agent.model,
            systemPrompt: agent.prompt || `あなたは${agent.name}という名前の${agent.role}です。${agent.persona}`,
        };

        const response = await callLLM(fullPrompt, options);

        return NextResponse.json({ content: response });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
