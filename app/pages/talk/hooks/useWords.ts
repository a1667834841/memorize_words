import { useState, useEffect } from 'react'
import { Word } from '../types'

export function useWords() {
  const [words, setWords] = useState<Word[]>([])

  useEffect(() => {
    fetchWords()
  }, [])

  const fetchWords = async () => {
    try {
      const response = await fetch('/api/daily-words')
      const data: Word[] = await response.json()
      setWords(data)
      return data
    } catch (error) {
      console.error('获取单词时出错:', error)
      return []
    }
  }

  const updateWordHitCount = (word: string) => {
    setWords(prevWords => 
      prevWords.map(w => 
        w.english === word ? { ...w, hitCount: (w.hitCount || 0) + 1 } : w
      )
    )
  }

  return {
    words,
    setWords,
    fetchWords,
    updateWordHitCount
  }
} 