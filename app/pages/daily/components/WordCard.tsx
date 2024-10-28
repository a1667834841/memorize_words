import { Volume2 } from 'lucide-react'
import { Word } from '@/lib/types/words'

interface WordCardProps {
  word: Word
  index: number
  onToggleSelection: (index: number) => void
  onPlayAudio: (word: string, type: number) => void
}

export function WordCard({ word, index, onToggleSelection, onPlayAudio }: WordCardProps) {
  return (
    <div 
      className={`bg-white rounded-lg shadow overflow-hidden transition-all duration-300 flex flex-col ${word.selected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onToggleSelection(index)}
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
            onPlayAudio(word.english, 1);
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
            onPlayAudio(word.english, 0);
          }}
        >
          <Volume2 className="h-4 w-4 inline-block" />
          <span className="text-xs ml-0.5">美</span>
        </button>
      </div>
    </div>
  )
}
