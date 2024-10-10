"use client"

import { useState, useEffect } from 'react'
import { Word } from '@/lib/types/words'
import { globalCache, saveCache } from './app-router'
import { Volume2 } from 'lucide-react'

export function DailyVocabularyComponent() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (globalCache.words && globalCache.words.length > 0) {
      // 清空选中状态
      globalCache.words.forEach(word => {
        word.selected = false
      })
      setWords(globalCache.words)
      setLoading(false)
    } else {
      fetch('/api/daily-words')
        .then(response => response.json())
        .then((data: Word[]) => {
          setWords(data)
          setLoading(false)
          globalCache.words = data
          saveCache()
        })
        .catch(error => {
          console.error('Error fetching words:', error)
          setLoading(false)
        })
    }
  }, [])

  useEffect(() => {
    globalCache.words = words
    saveCache()
  }, [words])
    

  const playAudio = (word: string, type: number) => {
    const audio = new Audio(`http://dict.youdao.com/dictvoice?type=${type}&audio=${encodeURIComponent(word)}`)
    audio.play()
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  }

  return (
    <div className="container mx-auto px-2 py-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-1 text-gray-800">今日单词本</h1>
      <div className="text-sm text-gray-500 text-center mb-4">
        {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        {words.map((word, index) => (
          <div 
            key={index} 
            className={`bg-white rounded-lg shadow overflow-hidden transition-all duration-300 flex flex-col ${word.selected ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => {
              setWords(prevWords => prevWords.map((w, i) => 
                i === index ? {...w, selected: !w.selected} : w
              ));
            }}
          >
            <div className="p-3 flex-grow">
              <h2 className="text-lg font-semibold mb-1 text-gray-800">{word.english}</h2>
              <div className="text-xs text-gray-600 space-y-0.5">
                {Object.entries(word.translations.reduce<Record<string, string[]>>((acc, t) => {
                  (acc[t.type] = acc[t.type] || []).push(t.chinese);
                  return acc;
                }, {})).map(([type, translations]) => (
                  <p key={type} className="line-clamp-1">
                    <span className="font-medium text-gray-700">{type}:</span>
                    {translations.map((translation, index) => (
                      <span key={index} className="ml-1 inline-block bg-gray-100 rounded px-1 py-0.5 text-xs">{translation}</span>
                    ))}
                  </p>
                ))}
              </div>
            </div>
            <div className="bg-gray-100 px-3 py-2 flex justify-between items-center mt-auto">
              <button 
                className="text-gray-600 hover:text-blue-500 transition-colors duration-200"
                title="英式发音"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(word.english, 1);
                }}
              >
                <Volume2 className="h-4 w-4 inline-block" />
                <span className="text-xs ml-0.5">英</span>
              </button>
              <button 
                className="text-gray-600 hover:text-blue-500 transition-colors duration-200"
                title="美式发音"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(word.english, 0);
                }}
              >
                <Volume2 className="h-4 w-4 inline-block" />
                <span className="text-xs ml-0.5">美</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}