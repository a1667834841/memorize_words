"use client"

import { useState, useEffect } from 'react'
import { WordMatchingGameComponent } from '@/components/word-matching-game'
import { DailyVocabularyComponent } from '@/components/daily-vocabulary'
import dynamic from 'next/dynamic'
import { MemoryMasterComponent } from '@/components/memory-master'

// 动态导入 Home 组件
const Home = dynamic(() => import('@/app/home'), { 
  loading: () => <p>加载中...</p>,
  ssr: false 
})

// 定义页面类型
type Page = 'home' | 'wordMatchingGame' | 'dailyVocabulary' | 'memoryGame'

export function AppRouter() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  // 页面切换函数
  const navigateTo = (page: Page) => {
    setCurrentPage(page)
  }

  // 返回首页函数
  const goHome = () => {
    setCurrentPage('home')
  }

  // 渲染当前页面
  const renderPage = () => {
    if (isLoading) {
      return <div>加载中...</div>
    }

    switch (currentPage) {
      case 'home':
        return <Home navigateTo={(page: 'wordMatchingGame' | 'dailyVocabulary' | 'memoryGame' | 'errorBook') => navigateTo(page as Page)} />
      case 'wordMatchingGame':
        return (
          <div className="relative">
            <BackButton goHome={goHome} />
            <WordMatchingGameComponent />
          </div>
        )
      case 'dailyVocabulary':
        return (
          <div className="relative">
            <BackButton goHome={goHome} />
            <DailyVocabularyComponent />
          </div>
        )
      case 'memoryGame':
        return (
          <div className="relative">
            <BackButton goHome={goHome} />
            <MemoryMasterComponent />
          </div>
        )
      default:
        return <div>页面不存在</div>
    }
  }

  return (
    <div>
      {renderPage()}
    </div>
  )
}

// 返回按钮组件
const BackButton = ({ goHome }: { goHome: () => void }) => {
  return (
    <button 
      onClick={goHome}
      className="absolute top-4 left-4 p-2 bg-gray-200 hover:bg-gray-300 rounded-full"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </button>
  )
}