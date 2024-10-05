"use client"

import { useState, useEffect } from 'react'
import { Word,Pagination } from '@/types/words'


export function VocabularyBookComponent() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    pageSize: 30,
    totalCount: 0,
  })

  useEffect(() => {
   
      fetch(`/api/words?page=${pagination.currentPage}&pageSize=${pagination.pageSize}`)
        .then(response => response.json())
        .then((data: {words: Word[], pagination: Pagination}) => {
          setWords(data.words)
          setPagination(data.pagination)
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
    return (
      <div className="flex justify-center items-center h-screen">
        <svg className="animate-spin h-10 w-10 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-lg">加载中...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">单词本</h1>
      <div className=" text-gray-500 text-center mb-4">
        {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {words.map((word, index) => (
          <div 
            key={index} 
            className={`border p-4 rounded-lg shadow relative cursor-pointer transition-colors duration-300`}
            onClick={() => {
              setWords(prevWords => prevWords.map((w, i) => 
                i === index ? {...w, selected: !w.selected} : w
              ));
            }}
          >
            <div className="mb-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">{word.english}</h2>
              <div className="text-sm sm:text-base">
                {Object.entries(word.translations.reduce<Record<string, string[]>>((acc, t) => {
                  (acc[t.type] = acc[t.type] || []).push(t.chinese);
                  return acc;
                }, {})).map(([type, translations]) => (
                  <p key={type}>
                    <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      
                    }}
                    className="font-medium">{type}:
                    {translations.map((translation, index) => (
                      <span className={`ml-2 p-0.5 border-b-2 border-dotted my-1 border-black`}>
                        {translation}
                      </span>
                    ))}
                      </span> 
                 
                  </p>
                ))}
              </div>
            </div>
            <div className="absolute bottom-2 left-2 flex space-x-2">
              <button 
                className={`hover:text-gray-700 flex items-center`}
                title="英式发音"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(word.english, 1);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.414a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0" />
                </svg>
                <span className="ml-1 text-sm sm:text-base">英</span>
              </button>
              <button 
                className={`hover:text-gray-700 flex items-center`}
                title="美式发音"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(word.english, 0);
                }}
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