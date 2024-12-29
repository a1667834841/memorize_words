import { useState, useEffect, useCallback } from 'react'
import { Word } from '@/lib/types/words'
import { globalCache, saveCache } from '@/components/app-router'
import { DisplayWords, MatchedPair } from '../types'

export function useWordMatchGame() {
  const [words, setWords] = useState<Word[]>([])
  const [gameWords, setGameWords] = useState<Word[]>([])
  const [displayWords, setDisplayWords] = useState<DisplayWords>({ english: [], chinese: [] })
  const [selectedEnglish, setSelectedEnglish] = useState<string | null>(null)
  const [selectedChinese, setSelectedChinese] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameOver, setGameOver] = useState(false)
  const [matchedPair, setMatchedPair] = useState<MatchedPair | null>(null)
  const [fadingOutWords, setFadingOutWords] = useState<MatchedPair[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [matchedWords, setMatchedWords] = useState<Word[]>([])
  const [misMatchedWords, setMisMatchedWords] = useState<Word[]>([])
  const [hiddenWords, setHiddenWords] = useState<MatchedPair[]>([])
  const [mismatchedPair, setMismatchedPair] = useState<MatchedPair | null>(null)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    fetch('/api/daily-words')
        .then(response => response.json())
        .then((data: Word[]) => {
          setWords(data)
          setGameWords(data)
        })
  }, [])

  const updateDisplayWords = () => {
    
    if (matchedWords == undefined || gameWords == undefined || matchedWords.length % 4 !== 0 || gameWords.length == 0) {
      return
    }
    
    const availableWords = gameWords.filter(word => !matchedWords.includes(word))
    const englishWords = availableWords.slice(0, 4)
    const chineseWords = [...englishWords].sort(() => 0.5 - Math.random())
    setDisplayWords({ english: englishWords, chinese: chineseWords })
  }

  useEffect(() => {
    updateDisplayWords()
  },[gameWords, matchedWords])



  function handleSelect(language: 'english' | 'chinese', word: string) {
    if (language === 'english') {
      if (selectedEnglish === word) {
        setSelectedEnglish(null)
      } else {
        setSelectedEnglish(word)
      }
    } else {
      if (selectedChinese === word) {
        setSelectedChinese(null)
      } else {
        setSelectedChinese(word)
      }
    }
  }

  const hideWord = (word: MatchedPair) => {
    setHiddenWords(prev => [...prev, word])
  }

  const startGame = () => {
    setGameStarted(true)
    updateDisplayWords()
  }

  const endGame = (completed: boolean) => {
    setGameOver(true)
    if (completed) {
      setShowConfetti(true)
    }
  }

  const restartGame = useCallback(() => {
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
  }, [words])

  const handleSelection = () => {
    if (selectedEnglish && selectedChinese) {
      const matchedWord = gameWords.find(
        word => word.english === selectedEnglish && word.chinese === selectedChinese
      );

      if (matchedWord) {
        // 匹配成功
        setMatchedPair(matchedWord);

        // 延迟1秒后执行消失动画
        setTimeout(() => {
          setFadingOutWords(prev => [...prev, matchedWord]);
          setScore(prev => prev + 1);
          setMatchedWords(prev => [...prev, matchedWord]);
          setGameWords(prev => prev.filter(word => word !== matchedWord));
          // 重置状态
          setMatchedPair(null);
          setSelectedEnglish(null);
          setSelectedChinese(null);
        }, 100);
      } else {
        // 匹配失败
        setMismatchedPair({ english: selectedEnglish, chinese: selectedChinese });
        const wrongWord = words.find(word => word.english === selectedEnglish);
        if (wrongWord && !misMatchedWords.find(word => word.english === wrongWord.english)) {
          setMisMatchedWords(prev => [...prev, wrongWord]);
        }

        // 延迟1秒后重置状态
        setTimeout(() => {
          setMismatchedPair(null);
          setSelectedEnglish(null);
          setSelectedChinese(null);
        }, 1000);
      }
    }
  }

  // 在选择单词时调用 handleSelection
  useEffect(() => {
    handleSelection();
  }, [selectedEnglish, selectedChinese]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(prev => Number((prev - 0.01).toFixed(2))), 10)
      return () => clearTimeout(timer)
    } else if (timeLeft <= 0 && !gameOver) {
      endGame(false)
    }
  }, [timeLeft, gameOver, gameStarted, endGame])

  return {
    gameState: {
      words,
      gameWords,
      displayWords,
      selectedEnglish,
      selectedChinese,
      score,
      timeLeft,
      gameOver,
      matchedPair,
      showConfetti,
      gameStarted,
      mismatchedPair,
      fadingOutWords,
      hiddenWords
    },
    actions: {
      startGame,
      restartGame,
      handleSelect,
      hideWord,
      endGame
    }
  }
} 