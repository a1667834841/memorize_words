"use client"

import { useState } from 'react'

// 申明game类型
type Game = {
  name: string
  route: string
  enable: boolean
  description?: string
}

const games: Game[] = [
  { name: "今日单词本", route: 'dailyVocabulary', enable: true, description: "查看今日单词进行学习" },
  { name: "记忆大师", route: 'memoryGame', enable: true, description: "ai根据今日单词生成故事" },
  { name: "单词消消乐", route: 'wordMatchingGame', enable: true, description: "通过匹配单词和释义来得分" },
  { name: "错题本", route: 'errorBook', enable: false, description: "敬请期待" },
  { name: "未知 1", route: '', enable: false, description: "未知 1" },
  { name: "未知 2", route: '', enable: false, description: "未知 2" },

  // ... 其他游戏
]

export default function Home({ navigateTo }: { navigateTo: (page: 'wordMatchingGame' | 'dailyVocabulary' | 'memoryGame' | 'errorBook') => void }) {
  const [hoverCardIndex, setHoverCardIndex] = useState<number | null>(null)

  return (
    <main className="flex max-h-screen flex-col items-center justify-center p-2 sm:p-2 mx-2 md:p-5 mx-2 mt-20">
      {/* 标题 */}
      <div className="text-4xl font-bold mb-10 mt-5">
        我要记单词!
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-[600px]">
        {games.map((game, index) => (
          <div
            onMouseEnter={() => setHoverCardIndex(index)}
            onMouseLeave={() => setHoverCardIndex(null)}
            key={index}
            className={`aspect-square flex items-center justify-center font-bold text-base sm:text-lg md:text-xl transition-all duration-300 mx-2hover:rounded-lg relative ${
              game.enable 
                ? "bg-black text-white cursor-pointer hover:bg-white hover:text-black hover:border-4 hover:border-black" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            onClick={() => game.enable && game.route && navigateTo(game.route as any)}
          >
            {hoverCardIndex === index ? (
              <div className="text-center">
                {game.description?.match(/.{1,6}/g)?.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            ) : (
              <div className="text-center">
                {game.name.match(/.{1,5}/g)?.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}