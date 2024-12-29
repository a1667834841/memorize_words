import { Word } from '../types'

interface WordListProps {
  words: Word[]
  isCollapsed: boolean
}

export function WordList({ words, isCollapsed }: WordListProps) {
  if (isCollapsed) return null

  return (
    <div className="h-auto p-4 bg-gray-100">
      <h2 className="text-lg font-bold mb-4">今日单词</h2>
      {words.map((word, index) => (
        <div key={index} className="mb-2 sm:text-sm text-xs">
          <span className="font-bold text-gray-800">{word.english}</span>
          <span className="text-gray-600"> - {word.chinese}</span>
        </div>
      ))}
    </div>
  )
} 