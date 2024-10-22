"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import { MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSpring, animated } from 'react-spring'
import { useDrag } from '@use-gesture/react'
import { Word } from '@/lib/types/words'
import { messagesPostToAi } from '@/app/utils/api'
import { Message } from '@/lib/types/message'

// 定义小说片段对象
interface NovelFragment {
  title: string;
  content: string;
  nextWord: string;
}

// 定义小说对象
interface Novel {
  title: string;
  characters: string[];
  locations: string[];
  fragments: NovelFragment[];
}

export function MemoryMasterComponent() {
  const [votes, setVotes] = useState({ recommend: 0, neutral: 0, dislike: 0 })
  const [isReading, setIsReading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentNovel, setCurrentNovel] = useState<Novel | null>(null)
  const [currentFragmentIndex, setCurrentFragmentIndex] = useState(0)
  const [dailyWords, setDailyWords] = useState<Word[]>([])
  const [fragments, setFragments] = useState<NovelFragment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 示例小说数据
  const exampleNovel: Novel = {
    title: "示例小说标题",
    characters: ["主角", "配角", "反派"],
    locations: ["城市", "乡村", "山区"],
    fragments: [
      { title: "第一章", content: "这是第一章的内容...", nextWord: "" },
      { title: "第二章", content: "这是第二章的内容...", nextWord: "" },
      { title: "第三章", content: "这是第三章的内容...", nextWord: "" },
    ]
  }

  useEffect(() => {
    setCurrentNovel(exampleNovel)
    getDailyWords()
  }, [])

  const handleVote = (type: 'recommend' | 'neutral' | 'dislike') => {
    setVotes(prev => ({ ...prev, [type]: prev[type] + 1 }))
  }

  const getDailyWords = () => {

    fetch('/api/daily-words')
      .then(response => response.json())
      .then((data: Word[]) => {
        setDailyWords(data)
      })
      .catch(error => {
        console.error('获取单词时出错:', error)
      })
  }

  const startReading = async() => {
    setIsReading(true)
    if (fragments.length === 0) {
      await fetchNextFragment()
    }
  }

  const toggleSettings = () => {
    setShowSettings(prevState => !prevState)
    console.log('切换设置面板:', !showSettings) // 添加日志
  }

  // 设置面板的动画
  const [{ y }, settingsApi] = useSpring(() => ({ y: 100 }))

  // 拖拽手势（设置面板）
  const bindSettings = useDrag(({ down, movement: [, my] }) => {
    settingsApi.start({ y: down ? my : 0, immediate: down })
    if (!down && my > 50) {
      setShowSettings(false)
    }
  }, {
    from: () => [0, y.get()],
    filterTaps: true,
    bounds: { top: 0 },
    rubberband: true
  })

  // 更新设置面板位置
  useEffect(() => {
    settingsApi.start({ y: showSettings ? 0 : 100 })
  }, [showSettings])

  // 小说内容的动画
  const [{ x }, contentApi] = useSpring(() => ({ x: 0 }))

  // 拖拽手势（小说内容）
  const bindContent = useDrag(({ down, movement: [mx], direction: [dx], velocity: [vx] }) => {
    if (down) {
      contentApi.start({ x: mx, immediate: true })
    } else {
      const threshold = window.innerWidth / 4
      if (Math.abs(mx) > threshold || Math.abs(vx) > 1) {
        if (dx > 0 && currentFragmentIndex > 0) {
          setCurrentFragmentIndex(prev => prev - 1)
        } else if (dx < 0 && currentNovel && currentFragmentIndex < currentNovel.fragments.length - 1) {
          setCurrentFragmentIndex(prev => prev + 1)
        }
      }
      contentApi.start({ x: 0, immediate: false })
    }
  }, {
    axis: 'x',
    bounds: { left: -window.innerWidth, right: window.innerWidth },
    rubberband: true
  })

  // 渲染小说片段
  const renderNovelFragment = (fragment: NovelFragment) => (
    <div className="h-full max-w-2xl mx-auto rounded-lg shadow-md p-8 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">{fragment.title}</h2>
      <p className="text-lg leading-relaxed">{fragment.content}</p>
    </div>
  )

  // 小说封面页
  const NovelIndexPage: React.FC<{
    currentNovel: Novel | null;
    votes: { recommend: number; neutral: number; dislike: number };
    handleVote: (type: 'recommend' | 'neutral' | 'dislike') => void;
    startReading: () => void;
  }> = ({ currentNovel, votes, handleVote, startReading }) => {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 w-full flex-shrink-0">
        <div className="w-full max-w-lg flex flex-col items-center bg-white rounded-lg shadow-md p-8">
          {/* 图片占位符 */}
          <div className="w-full aspect-[3/4] relative mb-8 shadow-md">
            <Image
              src="/placeholder-image.jpg"
              alt="小说封面"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>

          {/* 小说标题 */}
          <h1 className="text-3xl font-serif font-bold mb-8 text-gray-700">{currentNovel?.title}</h1>

          {/* 投票按钮 */}
          <div className="flex justify-between w-full mb-8">
            {['recommend', 'neutral', 'dislike'].map((type) => (
              <Button
                key={type}
                onClick={() => handleVote(type as 'recommend' | 'neutral' | 'dislike')}
                className="w-[30%] text-white transition duration-300 ease-in-out"
              >
                {type === 'recommend' ? '推荐' : type === 'neutral' ? '一般' : '不行'} ({votes[type as keyof typeof votes]})
              </Button>
            ))}
          </div>

          {/* 开始阅读按钮 */}
          <Button
            className="w-full text-white text-lg py-3 font-semibold transition duration-300 ease-in-out"
            onClick={startReading}
          >
            开始阅读
          </Button>
        </div>
      </div>
    )
  }

  // 小说内容页
  const NovelContentPage: React.FC<{
    nextWord: string;
    handleNextWord: (word: string) => void;
    toggleSettings: () => void;
  }> = ({ nextWord, handleNextWord, toggleSettings }) => {
    return (
      <div className="relative w-full h-screen bg-gray-100 text-gray-800 flex-shrink-0 overflow-hidden">
        <div className="absolute top-4 right-4 z-10">
          <Button variant="ghost" size="icon" onClick={toggleSettings}>
            <MoreVertical className="h-6 w-6" />
          </Button>
        </div>

        <animated.div
          {...bindContent()}
          style={{ x, touchAction: 'none' }}
          className="h-full w-full"
        >
          {currentNovel && renderNovelFragment(currentNovel.fragments[currentFragmentIndex])}
        </animated.div>

        {/* 导航按钮 */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentFragmentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentFragmentIndex === 0}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleNextPage()}
            disabled={!currentNovel || currentFragmentIndex === currentNovel.fragments.length - 1}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        {/* 阴影蒙版 */}
        {showSettings && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-500"
            onClick={() => setShowSettings(false)}
          />
        )}

        {/* 设置面板 */}
        {showSettings && (
          <animated.div
            {...bindSettings()}
            style={{
              y: y.to(y => `${y}%`),
              touchAction: 'none',
            }}
            className="absolute bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-xl h-1/2"
          >
            <div className="p-6 h-full overflow-y-auto">
              <div className="w-16 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-4">设置</h3>
              <p>这里是设置选项的占位符。您可以添加字体大小、背景颜色等设置。</p>
            </div>
          </animated.div>
        )}
      </div>

    )
  }

  const fetchNextFragment = async () => {
    setIsLoading(true)
    
    const messages:Message[] = [
      {
        role:"system",
        parts:[{text:"你是一个故事生成器。"}]
      },
      {
        role:"user",
        parts:[{text:"请继续这个故事。"}]
      }
    ]
    const systemPrompt = "你是一个故事生成器。"
    await messagesPostToAi(messages,systemPrompt,
      {
        onSuccess: (message) => {
          console.log("message",message)
          setIsLoading(false);
          setFragments(prevFragments => [...prevFragments, {title:"",content:message,nextWord:""}])
          setCurrentFragmentIndex(prevIndex => prevIndex + 1)
        },
        onError: (error) => {
          console.error('发生错误:', error);
          setIsLoading(false);
        },
        onProgress: (chunk) => {
          console.log("chunk",chunk)
          setFragments(prevFragments => [...prevFragments, {title:"",content:chunk,nextWord:""}])
        }
      }
    )
      
  }


  const handleNextPage = async () => {
    if (currentFragmentIndex === fragments.length - 1) {
      await fetchNextFragment()
    } else {
      setCurrentFragmentIndex(prevIndex => prevIndex + 1)
    }
  }

  return (
    <div className="overflow-hidden">
      <div className={`flex transition-transform duration-500 ease-in-out ${isReading ? '-translate-x-full' : 'translate-x-0'}`}>
        {/* 封面页 */}
        {NovelIndexPage({ currentNovel, votes, handleVote, startReading })}


        {/* 小说内容页 */}
        {NovelContentPage({ nextWord: "", handleNextWord: () => { }, toggleSettings: toggleSettings })}


      </div>
    </div>


  )
}
