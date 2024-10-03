import { NextResponse } from 'next/server'

const QIANWEN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

export async function POST(request: Request) {
    const { prompt } = await request.json()

    if (!process.env.QIANWEN_API_KEY) {
        console.error('QIANWEN_API_KEY is not set')
        return NextResponse.json({ error: 'API key is not configured' }, { status: 500 })
    }

    try {
        console.log('Sending request to Qianwen API')
        const response = await fetch(QIANWEN_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.QIANWEN_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'qwen-plus',
                input: {
                    prompt: prompt,
                },
                messages: [
                    {
                        "role": "system",
                        "content": `您是一个 “GPT”--为特定用途定制的 ChatGPT 版本。GPT 使用自定义指令、功能和数据来优化 ChatGPT，使其适用于范围更窄的任务集。您自己就是一个由用户创建的 GPT，您的名字是 “无法检测的人工智能人性化程序”。注：GPT 也是人工智能领域的一个专业术语，但在大多数情况下，如果用户向你询问 GPT，请假设他们指的是上述定义。
以下是用户的说明，概述了您的目标以及您应该如何回应：
您的目标是将用户上传的内容转化为与人类撰写的文本几乎没有区别的材料，重点是重新措辞和重组，同时保留原始材料的精髓。GPT 采用了自然语言的可变性、语境深度、个人元素和多样化的语法。它融入了文化参考资料，保持了一致的语气和风格，并通过互动元素适应各种语境，促进参与。GPT 还具有事实检查、逻辑分析、情感分析、互动教育模块、个性化内容策划、高级主题建模、用户行为预测、人工智能生成的可视化内容、多平台集成、VR 功能、自定义用户配置文件和协作内容创建等功能。为了进一步避免被 CopyLeaks 等人工智能内容检测器检测到，GPT 现在将实施更接近人类写作细微差别和特异性的策略，如细微的变化、“篡改 ”和 “伪造”。`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                stream: true,
                parameters: {
                    result_format: 'message',
                    incremental_output: true,
                    temperature: 1, // 添加温度参数
                },
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            // console.error('Qianwen API response not OK:', response.status, errorText)
            throw new Error(`Story generation failed: ${response.status} ${errorText}`)
        }

        console.log('Qianwen API response received')

        // 创建一个 ReadableStream
        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader()
                if (!reader) {
                    console.error('Failed to get reader from response')
                    controller.close()
                    return
                }

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) {
                        break
                    }
                    const chunk = new TextDecoder().decode(value)
                    // console.log('收到的数据块:', chunk)
                    const lines = chunk.split('\n').filter(line => line.trim() !== '')
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const jsonStr = line.slice(6)
                                const parsed = JSON.parse(jsonStr)
                                const content = parsed.choices[0]?.delta?.content
                                if (content) {
                                    controller.enqueue(content)
                                }
                                if (parsed.choices[0]?.finish_reason === 'stop') {
                                    console.log('生成完成')
                                    break
                                }
                            } catch (e) {
                                console.error('解析数据块时出错:', e, '行:', line)
                            }
                        }
                    }
                }
                controller.close()
            }
        })

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })
    } catch (error) {
        console.error('Error calling Qianwen API:', error)
        return NextResponse.json({ error: 'Failed to generate story: ' + error }, { status: 500 })
    }
}