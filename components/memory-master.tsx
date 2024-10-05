"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Word } from '@/types/words'
import { globalCache,saveCache } from './app-router'
import ReactMarkdown from 'react-markdown'
import { storyPromptTemplate } from '@/app/utils/promptTemplates'

const storyTypes = [
  { title: "现实主义", description: "描述日常生活中的真实情感、社会问题或人物命运，着重刻画现实环境中的人性和社会现象。" },
  { title: "科幻", description: "以科学理论为基础，想象未来科技发展可能对社会、人类及宇宙产生的影响。" },
  { title: "悬疑", description: "通过巧妙的情节设计和引人入胜的悬念，营造紧张刺激的氛围，通常涉及谜题、犯罪或解密。" },
  { title: "武侠", description: "以古代江湖为背景，围绕侠义精神和武术展开，塑造英雄人物和他们的冒险经历。" },
  { title: "玄幻", description: "通过虚构的世界、超自然的力量和神秘的元素构建故事，通常有复杂的设定和强烈的幻想色彩。" },
  { title: "讽刺", description: "通过讽刺和幽默的手法，揭露社会现象、政治弊端或人性弱点，常带有批判性和戏谑性。" },
]

export function MemoryMasterComponent() {
  const [words, setWords] = useState<Word[]>([])
  const [selectedWords, setSelectedWords] = useState<Word[]>([])
  const [selectedStoryType, setSelectedStoryType] = useState<string>("")
  const [generatedStory, setGeneratedStory] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const storyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (globalCache.words && globalCache.words.length > 0) {
      setWords(globalCache.words)
      setSelectedWords(globalCache.words.filter(word => word.selected))
    } else {
      fetch('/api/daily-words')
        .then(response => response.json())
        .then((data: Word[]) => {
          setWords(data)
          globalCache.words = data
          saveCache()
        })
        .catch(error => {
          console.error('Error fetching words:', error)
        })
    }
  }, [])

  const handleWordSelection = (word: Word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word))
    } else if (selectedWords.length < 10) {
      setSelectedWords([...selectedWords, word])
    }
  }

  const handleStoryTypeSelection = (type: string) => {
    setSelectedStoryType(type === selectedStoryType ? "" : type)
  }

  const generateStory = async () => {
    setIsGenerating(true)
    setGeneratedStory("")
    const prompt = storyPromptTemplate(selectedStoryType, selectedWords.map(word => word.english+"（"+word.type+"）"), selectedWords.length * 50)

    try {
      const response = await fetch('/api/generate-story-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error('Story generation failed')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get reader from response')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        const chunk = new TextDecoder().decode(value)
        const processedChunk = chunk.replace(/[（(]([a-zA-Z]+)[）)]/g, '$1')
        .replace("{humanized_text}","").replace("```中文","").replace("```","")
        setGeneratedStory(prev => prev + processedChunk.trim())
        if (storyRef.current) {
          storyRef.current.scrollTop = storyRef.current.scrollHeight
        }
      }
    } catch (error) {
      console.error('Error generating story:', error)
      setGeneratedStory("抱歉，生成故事时出现错误。请稍后再试。")
    } finally {
      setIsGenerating(false)
    }
  }

  const highlightWords = (text: string) => {
    if (!text || text === undefined) {
      return text
    }
    // 移除开头的换行符
    text = text.trimStart();
    const regex = new RegExp(`\\b(${selectedWords.map(word => word.english).join('|')})\\b`, 'gi');
    return text.split(regex).map((part, index) => 
      regex.test(part) ? <Button key={index} className="py-0 px-1 h-auto font-bold">{part}</Button> : part
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">记忆大师</h1>
      
       {/* 生成的故事显示区域 */}
       {(generatedStory || isGenerating) && (
        <div className="mt-8">
          <div
            ref={storyRef}
            className="w-full h-auto p-2 border rounded overflow-auto text-sm font-mono tracking-wide text-left align-top whitespace-pre-wrap"
            style={{
              transition: 'all 0.5s ease',
              animation: 'fadeIn 0.5s ease-in-out'
            }}
          >
            {highlightWords(generatedStory.split('## Humanized text')[1])}
          </div>
          {isGenerating && (
            <div className="mt-4">
              <p className="text-sm">
                当前进度：
                { generatedStory.includes('## Humanized text')
                  ? <span className="animate-pulse">输出故事中<span className="inline-block animate-bounce">...</span></span>
                  : generatedStory.includes('## Rules to ensure a perfect humanized text')
                  ? <span className="animate-pulse">组织语言中<span className="inline-block animate-spin">...</span></span>
                  : <span className="animate-pulse">单词和故事类型分析中<span className="inline-block animate-spin">...</span></span>}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 生成故事按钮 */}
      { (
        <div className="mt-4 flex flex-row gap-2 w-full">
      <Button 
        className={`mt-4 ${!isGenerating && generatedStory ? 'w-1/2' : 'w-full'}`}
        disabled={selectedWords.length === 0 || !selectedStoryType || isGenerating}
        onClick={generateStory}
        
      >
        {isGenerating ? "正在生成故事..." : "生成故事"}
      </Button>
      {!isGenerating && generatedStory &&<Button 
        className="mt-4 w-1/2"
        onClick={() => setGeneratedStory("")}
      >
          复制文本
        </Button>
      }
      </div>
      )}


      {/* 单词选择区域 */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 mt-4">选择今日单词（最多10个）</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
          {words.map((word, index) => (
            <Button
              key={index}
              variant={selectedWords.includes(word) ? "default" : "outline"}
              onClick={() => handleWordSelection(word)}
              className="w-full h-auto py-3  sm:text-sm truncate"
            >
              {word.english}
              <div className="sm:text-[15px] ml-2 text-[10px]">
                {word.translations[0].chinese}
              </div>
            </Button>
          ))}
        </div>
        <div className="mt-2 text-sm">已选择 {selectedWords.length}/10 个单词</div>
      </div>

      {/* 故事类型选择区域 */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">选择故事类型</h2>
        <div className="grid grid-cols-3 sm:grid-cols-2 gap-2">
          {storyTypes.map((type, index) => (
            <Button
              key={index}
              variant={selectedStoryType === type.title ? "default" : "outline"}
              onClick={() => handleStoryTypeSelection(type.title)}
              className="w-full h-auto py-2 flex flex-col items-center justify-center text-center"
            >
              <span className="font-bold text-sm" title={type.description}>{type.title}</span>
              {/* <span className="text-[10px] mt-1 break-words w-full px-2 whitespace-normal">{type.description}</span> */}
            </Button>
          ))}
        </div>
      </div>

      
    </div>
  )
}