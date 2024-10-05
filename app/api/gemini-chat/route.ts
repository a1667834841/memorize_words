import { StreamingTextResponse } from 'ai'
import { GoogleGenerativeAI } from '@fuyun/generative-ai'
import { prefixPromptTemplate } from '@/app/utils/promptTemplates'
import { json } from 'stream/consumers'

const baseUrl = 'https://gemini.baipiao.io'
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: Request) {
  const { messages } = await request.json()

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set')
    return new Response('API key is not configured', { status: 500 })
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' },{baseUrl})
    const result = await model.generateContentStream({
        contents: messages,
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.5
        },
      })
    //   const chat = model.startChat(
    //     {
    //       history: history,
    //     }
    //   )
    // const result = await chat.sendMessageStream(currentPart)

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream ) {
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