import { useState, useRef, useEffect } from 'react'
import { Message, Word } from '../types'
import { chatPromptTemplate } from '@/app/utils/promptTemplates'

export function useChat(words: Word[], setWords: React.Dispatch<React.SetStateAction<Word[]>>) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isWaitingAiChat, setIsWaitingAiChat] = useState(false)
  const [shouldSend, setShouldSend] = useState(false)
  
  const messagesRef = useRef<Message[]>([])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const addMessage = (text: string, requestTime: number, role: string): number => {
    if (!text || !text.trim()) {
      return -1
    }

    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, { role, parts: [{ text }], requestTime }]
      return updatedMessages
    })

    return messages.length - 1
  }

  const updateMessage = (index: number, text: string, requestTime: number) => {
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages]
      updatedMessages[index].parts[0].text = text
      updatedMessages[index].requestTime = requestTime
      return updatedMessages
    })
  }

  const messagesPostToAi = async (messages: Message[]): Promise<string> => {
    try {
      const response = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages,
          systemPrompt: chatPromptTemplate()
        }),
      })

      if (!response.ok) {
        throw new Error('API 请求失败')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullMessage = ''
      
      while (true) {
        const { done, value } = await reader?.read() ?? { done: true, value: undefined }
        if (done) break
        fullMessage += decoder.decode(value, { stream: true })
      }

      return fullMessage
    } catch (error) {
      console.error('发送消息时出错:', error)
      return ''
    }
  }

  const typeWriter = async (fullMessage: string, responseTime: number) => {
    const firstMessageIndex = await addMessage(fullMessage.substring(0, 1), responseTime, 'model')
    if (firstMessageIndex === -1) return

    for (let i = 1; i < fullMessage.length; i++) {
      updateMessage(firstMessageIndex, fullMessage.substring(0, i + 1), responseTime)
      if (['，', '。', '？', '！'].includes(fullMessage[i])) {
        await new Promise(resolve => setTimeout(resolve, 150))
      } else {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }

    updateMessage(firstMessageIndex, fullMessage, responseTime)
  }

  const handleSend = async () => {
    if (input && input.trim()) {
      await addMessage(input, 0, 'user')
      setInput('')
      setShouldSend(true)
    }
  }

  const clearMessages = () => {
    setMessages(messages.slice(0, 1))
  }

  useEffect(() => {
    if (messages.length > 1 && shouldSend) {
      const sendMessage = async () => {
        const startTime = Date.now()
        setIsWaitingAiChat(true)

        let initWords = words.map(word => ({
          word: word.english,
          mentionedTimes: word.hitCount
        }))

        let realMessages = JSON.parse(JSON.stringify(messages))
        realMessages[0].parts[0].text += ` learnSituations:${JSON.stringify(initWords)}`

        const fullMessage = await messagesPostToAi(realMessages)
        setIsWaitingAiChat(false)
        const responseTime = Date.now() - startTime
        setShouldSend(false)

        await typeWriter(fullMessage, responseTime)

        // 更新单词出现次数
        setWords(prevWords => 
          prevWords.map(word => {
            if (fullMessage.includes(word.english)) {
              return { ...word, hitCount: (word.hitCount || 0) + 1 }
            }
            return word
          })
        )
      }

      sendMessage()
    }
  }, [shouldSend, messages, words])

  return {
    messages,
    input,
    setInput,
    isWaitingAiChat,
    addMessage,
    updateMessage,
    handleSend,
    clearMessages
  }
} 