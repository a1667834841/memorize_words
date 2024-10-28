import { chatPromptTemplate } from '@/app/utils/promptTemplates';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 创建 OpenAI 客户端实例
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_URL
});

export async function POST(req: Request) {
  const { messages,systemPrompt,jsonMode } = await req.json();
  const openaiMessages = messages.map((message: any) => ({
    role: message.role === 'user' ? 'user' : 'assistant',
    content: message.parts.map((part: any) => part.text).join(''),
  }));
  // 添加system消息
  const realMessages = [
    {
      role: 'system',
      content: systemPrompt
    },
    ...openaiMessages
  ]

  const stream = new ReadableStream({
    async start(controller) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        stream: true,
        messages: realMessages,
        // 设置温度
        temperature: 1,
        response_format: { type: jsonMode ? 'json_object' : 'text' }
      });

      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          // 检查队列大小
          while (controller.desiredSize !== null && controller.desiredSize <= 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          controller.enqueue(content);
        }
      }
      controller.close();
    },
  }, { highWaterMark: 1 });

  return new NextResponse(stream);
}

