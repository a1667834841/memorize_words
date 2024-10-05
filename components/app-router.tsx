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
import TodayDialogComponent from './today-dialog';

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
  component: React.ComponentType<any> | null,
  hasBackButton?: boolean,
  hasNextButton?: boolean

}

export const pages: Page[] = [
  { name: "首页", route: 'home', enable: true, display:false, description: "首页" ,component: Home,hasBackButton:false,hasNextButton:false},
  { name: "今日单词", route: 'dailyVocabulary', enable: true,display:true, description: "查看今日单词进行学习" ,component: DailyVocabularyComponent,hasBackButton:true,hasNextButton:true},
  { name: "故事大王", route: 'memoryGame', enable: true, display:true, description: "ai根据今日单词生成故事" ,component: MemoryMasterComponent,hasBackButton:true,hasNextButton:false},
  {name:"今日对话",route:"todayDialog",enable:true,display:true,description:"与超自然ai对话",component:TodayDialogComponent,hasBackButton:false,hasNextButton:false},
  { name: "单词消消乐", route: 'wordMatchingGame', enable: true, display:true, description: "通过匹配单词和释义来得分" ,component: WordMatchingGameComponent ,hasBackButton:true,hasNextButton:false},
  { name: "单词本", route: 'vocabularyBook', enable: true,display:true, description: "查看单词本" ,component: VocabularyBookComponent,hasBackButton:true,hasNextButton:false},
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
    return (
      <div className="flex justify-center items-center h-screen">
        <svg className="animate-spin h-10 w-10 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-lg">加载中...</span>
      </div>
    )
  }
    if (currentPage.route === 'home') {
      return <Home navigateTo={navigateTo} />
    } else if (currentPage != null && currentPage.component != null) {
      const PageComponent = currentPage.component
      return (
        <div className="relative">
          {currentPage.hasBackButton && 
          <BackButton page={pages[0]} navigateTo={navigateTo} />
          }
          <PageComponent navigateTo={navigateTo} />
          {currentPage.hasNextButton && 
          <NextButton page={pages.indexOf(currentPage) == pages.length - 1 ? currentPage: pages[pages.indexOf(currentPage)+1] } navigateTo={navigateTo} />
          }
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