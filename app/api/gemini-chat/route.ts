import { StreamingTextResponse } from 'ai'
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@fuyun/generative-ai'
import { chatPromptTemplate } from '@/app/utils/promptTemplates'

const baseUrl = process.env.GEMINI_API_URL || ''
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: Request) {
  const { messages } = await request.json()

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    }
  ];  

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set')
    return new Response('API key is not configured', { status: 500 })
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' ,safetySettings},{baseUrl})
    const result = await model.generateContentStream({
        contents: messages,
        systemInstruction: chatPromptTemplate(),
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 1,
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
          console.log('chunkText', chunkText)
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