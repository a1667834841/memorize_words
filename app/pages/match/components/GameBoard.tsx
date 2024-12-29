import { motion } from "framer-motion"
import { Button } from '@/components/ui/button'
import { DisplayWords, MatchedPair } from '../types'
import { Word } from '@/lib/types/words'
import { useEffect } from "react"

const ButtonWrapper = motion(Button)

interface GameBoardProps {
  displayWords: DisplayWords
  selectedEnglish: string | null
  selectedChinese: string | null
  matchedPair: MatchedPair | null
  mismatchedPair: MatchedPair | null
  fadingOutWords: MatchedPair[]
  hiddenWords: MatchedPair[]
  onSelect: (language: 'english' | 'chinese', word: string) => void
  onHideWord: (word: MatchedPair) => void
}



export function GameBoard({
  displayWords,
  selectedEnglish,
  selectedChinese,
  matchedPair,
  mismatchedPair,
  fadingOutWords,
  hiddenWords,
  onSelect,
  onHideWord
}: GameBoardProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        {displayWords.english.map((word, index) => (
          <motion.div
            key={`english-${word.english}-${index}`}
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              opacity: fadingOutWords.some(w => w.english === word.english) ? 0 : 1,
              scale: fadingOutWords.some(w => w.english === word.english) ? 0.8 : 1,
            }}
            transition={{ duration: 0.5 }}
            onAnimationComplete={() => {
              if (fadingOutWords.some(w => w.english === word.english)) {
                onHideWord(word)
              }
            }}
            style={{ visibility: hiddenWords.some(w => w.english === word.english) ? 'hidden' : 'visible' }}
          >
            <ButtonWrapper
              onClick={(e) => {
                e.preventDefault()
                onSelect('english', word.english)
              }}
              className={`w-full mb-4 py-6 transition-all duration-300 ${
                selectedEnglish === word.english ? 'bg-blue-600 hover:bg-blue-400' : ''
              } ${matchedPair?.english === word.english ? 'bg-green-500 hover:bg-green-500' : ''}
                ${mismatchedPair?.english === word.english ? 'bg-red-500 hover:bg-red-500' : ''}`}
              whileTap={{ scale: 0.95 }}
              initial={{ boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}
              whileHover={{ boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.15)" }}
            >
              {word.english}
            </ButtonWrapper>
          </motion.div>
        ))}
      </div>
      <div className="space-y-2">
        {displayWords.chinese.map((word, index) => (
          <motion.div
            key={`chinese-${word.chinese}-${index}`}
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              opacity: fadingOutWords.some(w => w.chinese === word.chinese) ? 0 : 1,
              scale: fadingOutWords.some(w => w.chinese === word.chinese) ? 0.8 : 1,
            }}
            transition={{ duration: 0.5 }}
            onAnimationComplete={() => {
              if (fadingOutWords.some(w => w.chinese === word.chinese)) {
                onHideWord(word)
              }
            }}
            style={{ visibility: hiddenWords.some(w => w.chinese === word.chinese) ? 'hidden' : 'visible' }}
          >
            <ButtonWrapper
              onClick={(e) => {
                e.preventDefault()
                onSelect('chinese', word.chinese)
              }}
              className={`w-full mb-4 py-6 transition-all duration-300 ${
                selectedChinese === word.chinese ? 'bg-blue-600 hover:bg-blue-400' : ''
              } ${matchedPair?.chinese === word.chinese ? 'bg-green-500 hover:bg-green-500' : ''}
                ${mismatchedPair?.chinese === word.chinese ? 'bg-red-500 hover:bg-red-500' : ''}`}
              whileTap={{ scale: 0.95 }}
              initial={{ boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}
              whileHover={{ boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.15)" }}
            >
              {word.type}: {word.chinese.split(/[；,，;]/, 1)[0]}
            </ButtonWrapper>
          </motion.div>
        ))}
      </div>
    </div>
  )
} 