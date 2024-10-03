"use client"

import { useState, useEffect } from 'react'
import Home from '@/app/home'
import { WordMatchingGameComponent } from '@/components/word-matching-game'
import { DailyVocabularyComponent } from '@/components/daily-vocabulary'
import { MemoryMasterComponent } from '@/components/memory-master'
import { BackButton } from '@/components/BackButton'
import { NextButton } from '@/components/NextButton'
import { VocabularyBookComponent } from '@/components/vocabulary-book'
import { Word } from '@/types/words'


// 定义 GlobalCache 接口
export interface GlobalCache {
  words?: Word[];
  [key: string]: any;
}

// 创建全局缓存对象
export const globalCache: GlobalCache = {}

// 从 localStorage 加载缓存
export const loadCache = () => {
  if (typeof window !== 'undefined') {
    const savedCache = localStorage.getItem('globalCache')
    if (savedCache) {
      Object.assign(globalCache, JSON.parse(savedCache))
    }
  }
}

// 保存缓存到 localStorage
export const saveCache = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('globalCache', JSON.stringify(globalCache))
  }
}

// 申明game类型
export type Page = {
  name: string
  route: string
  enable: boolean,
  display: boolean,
  description?: string
  component: React.ComponentType<any> | null
}

export const pages: Page[] = [
  { name: "首页", route: 'home', enable: true, display:false, description: "首页" ,component: Home},
  { name: "今日单词", route: 'dailyVocabulary', enable: true,display:true, description: "查看今日单词进行学习" ,component: DailyVocabularyComponent},
  { name: "记忆大师", route: 'memoryGame', enable: true, display:true, description: "ai根据今日单词生成故事" ,component: MemoryMasterComponent},
  { name: "单词消消乐", route: 'wordMatchingGame', enable: true, display:true, description: "通过匹配单词和释义来得分" ,component: WordMatchingGameComponent  },
  { name: "单词本", route: 'vocabularyBook', enable: true,display:true, description: "查看单词本" ,component: VocabularyBookComponent},
  { name: "错题本", route: 'errorBook', enable: false, display:true, description: "敬请期待" ,component: null},
]

// 定义页面类
export function AppRouter() {
  const [currentPage, setCurrentPage] = useState<Page>(pages[0])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCache()
    setIsLoading(false)
  }, [])

  // 页面切换函数
  const navigateTo = (page: Page) => {
    if(!page.enable) return
    setCurrentPage(page)
  }

  // 返回首页函数
  const goHome = () => {
    setCurrentPage(pages[0])
  }

  // 渲染当前页面
  const renderPage = () => {
    if (isLoading) {
      return <div>加载中...</div>
    }
    if (currentPage.route === 'home') {
      return <Home navigateTo={navigateTo} />
    } else if (currentPage != null && currentPage.component != null) {
      const PageComponent = currentPage.component
      return (
        <div className="relative">
          <BackButton page={pages[0]} navigateTo={navigateTo} />
          <PageComponent navigateTo={navigateTo} />
          <NextButton page={pages.indexOf(currentPage) == pages.length - 1 ? currentPage: pages[pages.indexOf(currentPage)+1] } navigateTo={navigateTo} />
        </div>
      )
    } else {
      return <div>404</div>
    }
  }

  return (
    <div>
      {renderPage()}
    </div>
  )
}