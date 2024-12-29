import { Word, Pagination } from '@/lib/types/words'

export interface WordCardProps {
  word: Word
  onSelect: (word: Word) => void
}

export interface AudioButtonProps {
  word: string
  type: number
  label: string
}

export interface VocabularyState {
  words: Word[]
  loading: boolean
  pagination: Pagination
} 