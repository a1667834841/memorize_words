import { WordCardProps } from '../types'
import { AudioButton } from './AudioButton'

export function WordCard({ word, onSelect }: WordCardProps) {
  return (
    <div 
      className="border p-4 rounded-lg shadow relative cursor-pointer transition-colors duration-300"
      onClick={() => onSelect(word)}
    >
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold">{word.english}</h2>
        <div className="text-sm sm:text-base">
          {Object.entries(word.translations.reduce<Record<string, string[]>>((acc, t) => {
            (acc[t.type] = acc[t.type] || []).push(t.chinese)
            return acc
          }, {})).map(([type, translations]) => (
            <p key={type}>
              <span 
                onClick={(e) => e.stopPropagation()}
                className="font-medium"
              >
                {type}:
                {translations.map((translation) => (
                  <span className="ml-2 p-0.5 border-b-2 border-dotted my-1 border-black">
                    {translation}
                  </span>
                ))}
              </span>
            </p>
          ))}
        </div>
      </div>
      <div className="absolute bottom-2 left-2 flex space-x-2">
        <AudioButton word={word.english} type={1} label="英" />
        <AudioButton word={word.english} type={0} label="美" />
      </div>
    </div>
  )
} 