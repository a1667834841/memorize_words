"use client"

import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useVocabulary } from '../hooks/useVocabulary'
import { WordCard } from './WordCard'
import { NavBar } from '@/components/NavBar'

export function VocabularyBook() {
  const { words, loading, handleWordSelect } = useVocabulary()

  if (loading) {
    return (
        <LoadingSpinner/>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <NavBar title="单词本" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {words.map((word, index) => (
          <WordCard 
            key={index}
            word={word}
            onSelect={() => handleWordSelect(index)}
          />
        ))}
      </div>
    </div>
  )
} 