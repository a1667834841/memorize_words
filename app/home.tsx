"use client"

import { useState } from 'react'
import { Page, pages } from '@/components/app-router'

interface HomeProps {
  navigateTo: (page: Page) => void
}

export default function Home({ navigateTo }: HomeProps) {
  const [hoverCardIndex, setHoverCardIndex] = useState<number | null>(null)

  return (
    <main className="flex max-h-screen flex-col items-center justify-center p-2 sm:p-2 mx-2 mt-20 md:p-5 mx-2 mt-20 ">
      <div className="text-4xl font-bold mb-10 mt-5">
        我要记单词!
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-[600px]">
        {pages.map((game, index) => (
          game.display && (
            <div
              key={index}
              onMouseEnter={() => setHoverCardIndex(index)}
              onMouseLeave={() => setHoverCardIndex(null)}
              className={`aspect-square flex items-center justify-center font-bold text-base sm:text-lg md:text-xl transition-all duration-300 mx-2 hover:rounded-lg relative ${
                game.enable 
                  ? "bg-black text-white cursor-pointer hover:bg-white hover:text-black hover:border-4 hover:border-black" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              onClick={() => game.enable && navigateTo(game)}
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
          )
        ))}
      </div>
    </main>
  )
}