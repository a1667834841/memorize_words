"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Settings, Home as HomeIcon, Book, MessageCircle, BookOpen, Gamepad } from 'lucide-react'
import Home from '@/app/home'
import { WordMatchingGameComponent } from '@/components/word-matching-game'
import { DailyVocabularyComponent } from '@/components/daily-vocabulary'
import { MemoryMasterComponent } from '@/components/memory-master'
import { BackButton } from '@/components/BackButton'
import { NextButton } from '@/components/NextButton'
import { VocabularyBookComponent } from '@/components/vocabulary-book'
import { Word } from '@/lib/types/words'
import TodayDialogComponent from './today-dialog';
import StoryPage from '@/app/pages/story/page';

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

// 修改 Page 类型
export type Page = {
  name: string
  route: string
  enable: boolean,
  display: boolean,
  description?: string
  component: React.ComponentType<any> | null,
  icon: React.ReactNode,
  hasBackButton?: boolean,
  hasNextButton?: boolean
}

// 更新 pages 数组
export const pages: Page[] = [
  { name: "首页", route: 'home', enable: true, display:false, description: "首页", component: Home, icon: <HomeIcon />, hasBackButton: false, hasNextButton: false },
  { name: "今日单词", route: 'dailyVocabulary', enable: true, display:true, description: "查看今日单词进行学习", component: DailyVocabularyComponent, icon: <Book />, hasBackButton: true, hasNextButton: true },
  { name: "24小时便利店", route: 'memoryGame', enable: true, display:true, description: "cici日常便利店兼职故事", component: StoryPage, icon: <MessageCircle />, hasBackButton: true, hasNextButton: false },
  { name: "情景对话", route: "todayDialog", enable: true, display:true, description: "与超自然ai对话", component: TodayDialogComponent, icon: <MessageCircle />, hasBackButton: true, hasNextButton: false },
  { name: "消消乐", route: 'wordMatchingGame', enable: true, display:true, description: "通过匹配单词和释义来得分", component: WordMatchingGameComponent, icon: <Gamepad />, hasBackButton: true, hasNextButton: false },
  { name: "单词本", route: 'vocabularyBook', enable: true, display:true, description: "查看单词本", component: VocabularyBookComponent, icon: <BookOpen />, hasBackButton: true, hasNextButton: false },
  { name: "设置", route: 'settings', enable: true, display:true, description: "应用设置", component: null, icon: <Settings />, hasBackButton: true, hasNextButton: false },
]



// 修改 AppRouter 组件
export function AppRouter() {
  const [currentPage, setCurrentPage] = useState<Page>(pages[0])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCache()
    setIsLoading(false)
  }, [])
  const navigateTo = (page: Page) => {
    if(!page.enable) return
    setCurrentPage(page)
  }

  const renderPage = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Settings className="w-10 h-10 text-gray-500" />
          </motion.div>
          <span className="ml-3 text-lg">加载中...</span>
        </div>
      )
    }

    if (currentPage.route === 'home') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="p-4 min-h-screen pt-20"
        >
          <h1 className="text-2xl font-bold mb-6 text-center justify-center items-center">我要记单词</h1>
          <p className="text-xs text-gray-600 text-center mb-6">每天一点点，英语进步大步跳 🚀</p>
          <div className="grid grid-cols-2 gap-4 mt-5 ">
            {pages.filter(page => page.display).map((page) => (
              <motion.div
                key={page.route}
                whileHover={{ backgroundColor: '#f0f0f0' }}
                whileTap={{ scale: 0.95 }}
                className="bg-white p-4 mt-4 rounded-lg shadow-md flex items-center justify-between cursor-pointer text-xs xs:text-md"
                onClick={() => navigateTo(page)}
              >
                <div className="flex items-center">
                  {page.icon}
                  <span className="ml-2">{page.name}</span>
                </div>
                <ChevronRight className="text-gray-400" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )
    } else if (currentPage.component) {
      const PageComponent = currentPage.component
      return (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {currentPage.hasBackButton && 
            <BackButton page={pages[0]} navigateTo={navigateTo} />
          }
          <PageComponent navigateTo={navigateTo} />
          {currentPage.hasNextButton && 
            <NextButton page={pages[pages.indexOf(currentPage) + 1]} navigateTo={navigateTo} />
          }
        </motion.div>
      )
    } else {
      return <div>404</div>
    }
  }

  return (
    <div className=" mx-auto bg-gray-100 min-h-screen  items-center justify-center">
      <AnimatePresence mode="wait">
        {renderPage()}
      </AnimatePresence>
    </div>
  )
}