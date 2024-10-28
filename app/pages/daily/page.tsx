"use client"

import { useDailyVocabulary } from './hooks/useDailyVocabulary'
import { LoadingSpinner } from './components/LoadingSpinner'
import { WordCard } from './components/WordCard'
import { NavBar } from './components/NavBar'

export default function DailyPage() {
  const { words, loading, toggleWordSelection, playAudio } = useDailyVocabulary()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <NavBar 
        title="今日单词"
        subtitle=""
      />

      {/* 主要内容区域 */}
      <div className="container mx-auto px-2 py-4 pt-20">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {words.map((word, index) => (
            <WordCard
              key={index}
              word={word}
              index={index}
              onToggleSelection={toggleWordSelection}
              onPlayAudio={playAudio}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
