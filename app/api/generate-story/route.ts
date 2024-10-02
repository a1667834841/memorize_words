import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// 初始化 Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
    const { prompt } = await request.json()

    try {
        // 使用 Gemini 模型
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

        // 创建流式生成
        const result = await model.generateContentStream(prompt);

        // 创建一个 ReadableStream
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    controller.enqueue(chunkText);
                }
                controller.close();
            }
        });

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return NextResponse.json({ error: 'Failed to generate story' }, { status: 500 });
    }
}