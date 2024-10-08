"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from 'next/link'
import Confetti from 'react-confetti'
import { globalCache, Page, saveCache,pages } from '@/components/app-router'
import { Word } from '@/lib/types/words'

const ButtonWrapper = motion(Button)

interface WordButtonProps {
  page:Page
  navigateTo: (page: Page) => void;
}


export function WordMatchingGameComponent(props:WordButtonProps) {
  const [words, setWords] = useState<Word[]>([])
  const [gameWords, setGameWords] = useState<Word[]>([])
  const [displayWords, setDisplayWords] = useState<{english: Word[], chinese: Word[]}>({ english: [], chinese: [] })
  const [selectedEnglish, setSelectedEnglish] = useState<string | null>(null)
  const [selectedChinese, setSelectedChinese] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30) // 将初始时间设置为60秒
  const [gameOver, setGameOver] = useState(false)
  const [matchedPair, setMatchedPair] = useState<{ english: string; chinese: string } | null>(null)
  const [fadingOutWords, setFadingOutWords] = useState<{ english: string; chinese: string }[] | []>([])

  const [showConfetti, setShowConfetti] = useState(false)
  const [matchedWords, setMatchedWords] = useState<Word[]>([])
  const [misMatchedWords, setMisMatchedWords] = useState<Word[]>([])
  const [hiddenWords, setHiddenWords] = useState<{ english: string; chinese: string }[]>([])
  const [mismatchedPair, setMismatchedPair] = useState<{ english: string; chinese: string } | null>(null)


  // 新增一个状态来控制游戏是否已开始
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    // 检查缓存中是否有单词
    if (globalCache.words && globalCache.words.length > 0) {
      setWords(globalCache.words)
      setGameWords(globalCache.words)
    } else {
      // 如果缓存中没有单词，则从API获取
      fetch('/api/words?count=10')
        .then(response => response.json())
        .then((data: Word[]) => {
          setWords(data)
          setGameWords(data)
          // 将获取的单词存入全局缓存
          globalCache.words = data
          saveCache()
          setTimeLeft(gameWords.length)
        })
    }
  }, [])

  useEffect(() => {
    // 检查是否所有单词都已匹配
    if (gameWords.length === 0 && !gameOver && gameStarted) {
      endGame(true)
    }
  }, [gameWords])

  useEffect(() => {
    // 只有在游戏开始后才开始倒计时
    if (gameStarted && timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(prevTime => Number((prevTime - 0.01).toFixed(2))), 10)
      return () => clearTimeout(timer)
    } else if (timeLeft <= 0 && !gameOver) {
      endGame(false)
    }
  }, [timeLeft, gameOver, gameStarted])

  const endGame = (completed: boolean) => {
    setGameOver(true)
    if (completed) {
      setShowConfetti(true)
    }
  }

  const goBack = () => {
    props.navigateTo(pages[0])
  }

  useEffect(() => {
    updateDisplayWords()
  }, [matchedWords])

  const updateDisplayWords = () => {

    if (matchedWords.length % 4 != 0) {
      return
    }
    
    const availableWords = gameWords.filter(word => !matchedWords.includes(word))
    const englishWords = availableWords.slice(0, 4)
    const chineseWords = [...englishWords].sort(() => 0.5 - Math.random())
    setDisplayWords({ english: englishWords, chinese: chineseWords })

  }

  const handleSelect = (language: 'english' | 'chinese', word: string) => {
    if (language === 'english') {
      setSelectedEnglish(prevSelected => prevSelected === word ? null : word)
    } else {
      setSelectedChinese(prevSelected => prevSelected === word ? null : word)
    }
  }

  useEffect(() => {
    if (selectedEnglish && selectedChinese) {
      const matchedWord = gameWords.find(
        word => word.english === selectedEnglish && word.chinese === selectedChinese
      )
      if (matchedWord) {
        setMatchedPair(matchedWord)
        setFadingOutWords(prevFadingOutWords => [...prevFadingOutWords, matchedWord])
        setScore(prevScore => prevScore + 1)
          setMatchedWords(prevMatchedWords => [...prevMatchedWords, matchedWord])
          setGameWords(prevWords => prevWords.filter(word => word !== matchedWord))
          setSelectedEnglish(null)
          setSelectedChinese(null)
      } else {
        setMismatchedPair({ english: selectedEnglish, chinese: selectedChinese })
        // 添加匹配错误的word,去重
        const wrongWord = words.find(word => word.english === selectedEnglish)
        console.log(wrongWord)
        if (wrongWord && misMatchedWords.find(word => word.english === wrongWord.english)) {
          return
        }
        setMisMatchedWords(prevMisMatchedWords => wrongWord? [...prevMisMatchedWords, wrongWord] : prevMisMatchedWords)

      }

      // 为了只显示一次且时间为0.5秒的错误提示，这里使用setTimeout
      setTimeout(() => {
        setSelectedEnglish(null)
        setSelectedChinese(null)
      }, 500)
    }
  }, [selectedEnglish, selectedChinese, gameWords])

  useEffect(() => {
    if (mismatchedPair) {
      setTimeout(() => {
        setMismatchedPair(null)
        setSelectedEnglish(null)
        setSelectedChinese(null)
      }, 500)
    }
  }, [mismatchedPair])

  const restartGame = () => {
    const shuffled = [...words].sort(() => 0.5 - Math.random())
    setGameWords(shuffled.slice(0, 60))
    setScore(0)
    setTimeLeft(30.00)
    setGameOver(false)
    setSelectedEnglish(null)
    setSelectedChinese(null)
    setMatchedPair(null)
    setShowConfetti(false)
    setFadingOutWords([])
    setMatchedWords([])
    setHiddenWords([])
    setGameStarted(true)
    saveCache()
  }

  const hideWord = useCallback((word: { english: string; chinese: string }) => {
    setHiddenWords(prev => [...prev, word])
  }, [])

  const startGame = () => {
    setGameStarted(true)
    updateDisplayWords()
  }

  return (
    <div className="container mx-auto p-4">
      {showConfetti && <Confetti />}
      <h1 className="text-3xl font-bold text-center mb-4 mt-10">单词匹配游戏</h1>
      <div className="flex justify-between mb-4">
        <div className="text-xl">得分: {score}</div>
        {/* <div className='text-xl'>单词错误数: {misMatchedWords.length}</div> */}
        <div className="text-xl">时间: 
          <span className={`${timeLeft < 10 ? 'text-red-500' : ''} w-16 inline-block text-center`}>{timeLeft}</span>s
        </div>
      </div>
      {!gameStarted ? (
        <div className="text-center">
          <Button onClick={startGame}>开始游戏</Button>
          <div className="flex justify-center mb-4 mt-4 w-full">
            <div className="text-center border border-gray-300 rounded-lg p-4 ">
              <p className="text-gray-500 text-left ">
                游戏说明：点击"开始游戏"后，你将有60秒的时间来匹配英文单词和中文释义。选择一个英文单词和一个中文释义，如果匹配正确，它们将消失并得分。尽可能在时间内匹配更多单词！祝你好运吧！
              </p>
            </div>
          </div>
        </div>
        
      ) : gameOver ? (
        <div className="text-center">
          <h2 className="text-2xl mb-4">游戏结束！</h2>
          <p className="text-xl mb-4">你的得分是: {score}</p>
          {showConfetti && <p className="text-xl mb-4">恭喜你提前完成所有单词匹配！</p>}
          <div className="flex justify-center space-x-4">
            <Button onClick={restartGame}>重新开始</Button>
            <Button asChild>
              <Link href="/" onClick={(e) => {
                e.preventDefault();
                goBack()
              }}>
                返回首页
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            {displayWords.english.map((word, index) => (
              <motion.div
                key={`english-${word.english}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: fadingOutWords.some(w => w.english === word.english) ? 0 : 1,
                  scale: fadingOutWords.some(w => w.english === word.english) ? 0.8 : 1,
                }}
                transition={{ duration: 0.2 }}
                onAnimationComplete={() => {
                  if (fadingOutWords.some(w => w.english === word.english)) {
                    hideWord(word)
                  }
                }}
                style={{ visibility: hiddenWords.some(w => w.english === word.english) ? 'hidden' : 'visible' }}
              >
                <ButtonWrapper
                  onClick={(e) => {
                    e.preventDefault()
                    handleSelect('english', word.english)
                  }}
                  className={`w-full mb-4 py-6 transition-all duration-150 ${
                    selectedEnglish === word.english ? 'bg-blue-600 hover:bg-blue-400' : ''
                  } ${matchedPair?.english === word.english ? 'bg-green-600' : ''}
                    ${mismatchedPair?.english === word.english ? 'bg-red-400 hover:bg-red-400' : ''}`}
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: fadingOutWords.some(w => w.chinese === word.chinese) ? 0 : 1,
                  scale: fadingOutWords.some(w => w.chinese === word.chinese) ? 0.8 : 1,
                }}
                transition={{ duration: 0.3 }}
                onAnimationComplete={() => {
                  if (fadingOutWords.some(w => w.chinese === word.chinese)) {
                    hideWord(word)
                  }
                }}
                style={{ visibility: hiddenWords.some(w => w.chinese === word.chinese) ? 'hidden' : 'visible' }}
              >
                <ButtonWrapper
                  onClick={(e) => {
                    e.preventDefault()
                    handleSelect('chinese', word.chinese)
                  }}
                  className={`w-full mb-4 py-6 transition-all duration-150 ${
                    selectedChinese === word.chinese ? 'bg-blue-500 hover:bg-blue-600' : ''
                  } ${matchedPair?.chinese === word.chinese ? 'bg-green-500 hover:bg-green-600' : ''}
                    ${mismatchedPair?.chinese === word.chinese ? 'bg-red-400 hover:bg-red-400' : ''}`}
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
      )}
    </div>
  )
}