"use client"

import { AppRouter } from '@/components/app-router'
import { DailyWordsProvider } from '@/components/DailyWordsContext'

export default function App() {
  return <DailyWordsProvider><AppRouter /></DailyWordsProvider>
}