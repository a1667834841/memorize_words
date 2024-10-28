import { useState, useEffect } from 'react'
import { Word } from '@/lib/types/words'

export function useDailyVocabulary() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/daily-words')
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

  const toggleWordSelection = (index: number) => {
    setWords(prevWords => prevWords.map((w, i) => 
      i === index ? {...w, selected: !w.selected} : w
    ))
  }

  const playAudio = (word: string, type: number) => {
    const audio = new Audio(`http://dict.youdao.com/dictvoice?type=${type}&audio=${encodeURIComponent(word)}`)
    audio.play()
  }

  return {
    words,
    loading,
    toggleWordSelection,
    playAudio
  }
}
