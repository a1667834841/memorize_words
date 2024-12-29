import { useState, useEffect } from 'react'
import { Word, Pagination } from '@/lib/types/words'
import { VocabularyState } from '../types'

export function useVocabulary() {
  const [state, setState] = useState<VocabularyState>({
    words: [],
    loading: true,
    pagination: {
      currentPage: 1,
      pageSize: 30,
      totalCount: 0,
    }
  })

  useEffect(() => {
    fetch(`/api/words?page=${state.pagination.currentPage}&pageSize=${state.pagination.pageSize}`)
      .then(response => response.json())
      .then((data: {words: Word[], pagination: Pagination}) => {
        setState(prev => ({
          ...prev,
          words: data.words,
          pagination: data.pagination,
          loading: false
        }))
      })
      .catch(error => {
        console.error('Error fetching words:', error)
        setState(prev => ({ ...prev, loading: false }))
      })
  }, [])

  const handleWordSelect = (index: number) => {
    setState(prev => ({
      ...prev,
      words: prev.words.map((w, i) => 
        i === index ? {...w, selected: !w.selected} : w
      )
    }))
  }

  return {
    ...state,
    handleWordSelect
  }
} 