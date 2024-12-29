import { useState, useEffect } from 'react'
import { Word } from '@/lib/types/words'
import { WordAssociationData } from '../types'
export function useWords() {
    const [words, setWords] = useState<Word[]>([])
    const [loading, setLoading] = useState(true)
    const [wordAssociationDatas, setWordAssociationDatas] = useState<WordAssociationData[]>([])
  
    useEffect(() => {
      fetch('/api/daily-words')
        .then(response => response.json())
        .then((data: Word[]) => {
          setWords(data)
          setLoading(false)

        })
        .catch(error => {
          console.error('Error fetching words:', error)
          setLoading(false)
        })
    }, [])

    useEffect(() => {
        setWordAssociationDatas(wrodToWordAssociationData(words))
    }, [words])

    return {
        words,
        loading,
        wordAssociationDatas
    }
}

function wrodToWordAssociationData(words: Word[]): WordAssociationData[] {
    return words.map((word) => {
        return {
            originalWord: {
                word: word.english,
                type: word.type,
                meaning: word.chinese
            },
            associations: word.english.split('').map((part) => {
                return {
                    part: part,
                    partMeaning: '',
                    word: '',
                    type: '',
                    meaning: ''
                }
            }),
            sentence: '',
            associate: false
        }
    })
}