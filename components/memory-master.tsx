"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Word } from '@/types/words'

const storyTypes = [
  { title: "现实主义", description: "描述日常生活中的真实情感、社会问题或人物命运，着重刻画现实环境中的人性和社会现象。" },
  { title: "科幻", description: "以科学理论为基础，想象未来科技发展可能对社会、人类及宇宙产生的影响。" },
  { title: "魔幻现实主义", description: "将魔幻元素融入现实背景中，通过奇幻情节反映现实生活中的荒诞和复杂性。" },
  { title: "悬疑", description: "通过巧妙的情节设计和引人入胜的悬念，营造紧张刺激的氛围，通常涉及谜题、犯罪或解密。" },
  { title: "爱情", description: "聚焦人物之间的情感关系，描绘爱情中的甜蜜、冲突、误解与成长。" },
  { title: "历史", description: "以历史事件或人物为背景，讲述历史中的某一段经历，探索时代背景下的人性和命运。" },
  { title: "武侠", description: "以古代江湖为背景，围绕侠义精神和武术展开，塑造英雄人物和他们的冒险经历。" },
  { title: "玄幻", description: "通过虚构的世界、超自然的力量和神秘的元素构建故事，通常有复杂的设定和强烈的幻想色彩。" },
  { title: "心理", description: "侧重人物的内心世界，深入剖析人物的心理活动、情感波动及心灵成长。" },
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
    fetch('/api/words')
      .then(response => response.json())
      .then((data: Word[]) => {
        setWords(data)
      })
      .catch(error => {
        console.error('Error fetching words:', error)
      })
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
    const prompt = `请创作一个充满荒诞但合情合理的${selectedStoryType}风格短故事。故事需要包含指定的单词：${selectedWords.map(word => word.english).join(", ")}，且每个单词只出现一次。故事情节要夸张、荒诞，让人印象深刻，出乎意料又合乎逻辑，最重要的是结尾需要反转，引人深思。要求如下：
1.模仿这几位作家的手法：阿加莎·克里斯蒂、欧·亨利 (O. Henry)、乔治·R·R·马丁 、吉莉安·弗琳、 东野圭吾、斯蒂芬·金 
2.输出内容使用中文。
3.使用到的单词左边用<标记，右边用>标记
4.单词需要在故事中用到贴切，切不可滥用
5.总字数应控制在${selectedWords.length * 80}字左右。`

    try {
      const response = await fetch('/api/generate-story', {
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
        setGeneratedStory(prev => prev + chunk)
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">记忆大师</h1>
      
      {/* 单词选择区域 */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">选择今日单词（最多10个）</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
          {words.map((word, index) => (
            <Button
              key={index}
              variant={selectedWords.includes(word) ? "default" : "outline"}
              onClick={() => handleWordSelection(word)}
              className="w-full h-10  sm:text-sm"
            >
              {word.english}
              <br className="sm:hidden" />
              <span className="text-[10px] sm:text-xs text-gray-500 sm:ml-1 ml-1 whitespace-normal">{word.chinese}</span>
            </Button>
          ))}
        </div>
        <div className="mt-2 text-sm">已选择 {selectedWords.length}/10 个单词</div>
      </div>

      {/* 故事类型选择区域 */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">选择故事类型</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {storyTypes.map((type, index) => (
            <Button
              key={index}
              variant={selectedStoryType === type.title ? "default" : "outline"}
              onClick={() => handleStoryTypeSelection(type.title)}
              className="w-full h-auto py-2 flex flex-col items-center justify-center text-center"
            >
              <span className="font-bold text-sm">{type.title}</span>
              {/* <span className="text-[10px] mt-1 break-words w-full px-2 whitespace-normal">{type.description}</span> */}
            </Button>
          ))}
        </div>
      </div>

      {/* 生成故事按钮 */}
      <Button 
        className="mt-8 w-full"
        disabled={selectedWords.length === 0 || !selectedStoryType || isGenerating}
        onClick={generateStory}
      >
        {isGenerating ? "正在生成故事..." : "生成故事"}
      </Button>

      {/* 生成的故事显示区域 */}
      {(generatedStory || isGenerating) && (
        <div className="mt-8">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">生成的故事</h2>
          <div
            ref={storyRef}
            className="w-full h-64 p-2 border rounded overflow-auto whitespace-pre-wrap text-sm font-mono tracking-wide"
          >
            {generatedStory.split(/(<[^>]+>)/).map((part, index) => {
              if (part.startsWith('<') && part.endsWith('>')) {
                const word = part.slice(1, -1);
                const matchedWord = words.find(w => w.english.toLowerCase() === word.toLowerCase());
                if (matchedWord) {
                  return (
                    <span key={index}>
                      <span 
                        className="inline-block bg-black text-white px-1 py-0.5 rounded cursor-pointer"
                        onClick={() => {/* 这里可以添加点击事件处理逻辑 */}}
                        title={matchedWord.chinese}
                      >
                        {matchedWord.english} 
                      </span>
                      <span className="text-gray-500 text-xs">（{matchedWord.chinese}）</span>
                    </span>
                  );
                }
              }
              return part;
            })}
            {isGenerating && <span className="animate-pulse">|</span>}
          </div>
        </div>
      )}
    </div>
  )
}