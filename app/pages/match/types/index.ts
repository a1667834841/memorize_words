import { Word } from '@/lib/types/words'
import { Page } from '@/components/app-router'

export interface WordButtonProps {
  page: Page
  navigateTo: (page: Page) => void
}

export interface DisplayWords {
  english: Word[]
  chinese: Word[]
}

export interface MatchedPair {
  english: string
  chinese: string
} 