import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(request: Request) {
    try {
        const { message } = await request.json();

        const chatCompletion = await client.chat.completions.create({
            messages: [{ role: "user", content: `You are a helpful assistant. Answer the message forwarded by user, if user asks anything illigal or unethical or something that would take toooo much time generating, then straight up deny it in a few words. Answer in the least words possible by you, simple, precise, and gives answer. Like very short answer. This is message by user : ${message}` }],
            model: "openai/gpt-oss-120b",
        });

        return NextResponse.json({
            output_text: chatCompletion.choices[0]?.message?.content || ""
        });
    } catch (error) {
        console.error("Error calling Groq API:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
