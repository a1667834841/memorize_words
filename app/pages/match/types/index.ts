import { Word } from '@/lib/types/words'

export interface DisplayWords {
  english: Word[]
  chinese: Word[]
}

export interface MatchedPair {
  english: string
  chinese: string
} 