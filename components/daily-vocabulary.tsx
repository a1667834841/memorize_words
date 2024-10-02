"use client"

import { useState, useEffect } from 'react'
import { Word } from '@/types/words'


export function DailyVocabularyComponent() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/words')
      .then(response => response.json())
      .then((data: Word[]) => {
        setWords(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching words:', error)
        setLoading(false)
      })
  }, [])

  const playAudio = (word: string, type: number) => {
    const audio = new Audio(`http://dict.youdao.com/dictvoice?type=${type}&audio=${encodeURIComponent(word)}`)
    audio.play()
  }

  if (loading) {
    return <div className="text-center">加载中...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">今日单词本</h1>
      <div className=" text-gray-500 text-center mb-4">
        {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
        {words.map((word, index) => (
          <div key={index} className="border p-4 rounded-lg shadow relative">
            <div className="mb-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">{word.english}</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600">{word.chinese}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">类型: {word.type}</p>
            </div>
            <div className="absolute bottom-2 left-2 flex space-x-2">
              <button 
                className="text-gray-500 hover:text-gray-700 flex items-center" 
                title="英式发音"
                onClick={() => playAudio(word.english, 1)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.414a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0" />
                </svg>
                <span className="ml-1 text-sm sm:text-base">英</span>
              </button>
              <button 
                className="text-gray-500 hover:text-gray-700 flex items-center" 
                title="美式发音"
                onClick={() => playAudio(word.english, 0)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.414a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0" />
                </svg>
                <span className="ml-1 text-sm sm:text-base">美</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}