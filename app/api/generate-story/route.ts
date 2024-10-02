import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { prompt } = await request.json()

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error('DeepSeek API request failed')
    }

    const data = await response.json()
    const generatedStory = data.choices[0].message.content

    return NextResponse.json({ story: generatedStory })
  } catch (error) {
    console.error('Error calling DeepSeek API:', error)
    return NextResponse.json({ error: 'Failed to generate story' }, { status: 500 })
  }
}