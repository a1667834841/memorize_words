import { StreamingTextResponse } from 'ai'
import { GoogleGenerativeAI } from '@fuyun/generative-ai'
import { prefixPromptTemplate } from '@/app/utils/promptTemplates'

const baseUrl = process.env.GEMINI_API_URL || ''
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: Request) {
  const { prompt } = await request.json()

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set')
    return new Response('API key is not configured', { status: 500 })
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' },{baseUrl})
    const result = await model.generateContentStream({
        contents: [
          { role: 'model', parts: [{ text:  prefixPromptTemplate()}] },
          { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.5
        },
      })

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text()
          controller.enqueue(new TextEncoder().encode(chunkText))
        }
        controller.close()
      },
    })

    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    return new Response('Error generating content', { status: 500 })
  }
}