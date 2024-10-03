import { NextResponse } from 'next/server'
import cet4Words from '@/data/cet4-words.json'
import { Word,WordCache } from '@/types/words'
interface RawWord {
  word: string;
  translations: Array<{
    translation: string;
    type: string;
  }>;
}
// 创建一个简单的缓存对象
let cache: WordCache | null = null

function convertToWord(rawWord: RawWord): Word {
  return {
    english: rawWord.word,
    chinese: rawWord.translations[0].translation,
    type: rawWord.translations[0].type,
    // 如果有难度信息，可以在这里添加
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const count = parseInt(searchParams.get('count') || '10')
  const mode = searchParams.get('mode') || 'random' || 'ordered'
  const type = searchParams.get('type') || 'all'

  const today = new Date().toDateString()
  // 检查缓存是否存在且是今天的数据
  if (cache && cache.date === today) {
    console.log('使用缓存的单词数据')
  } else {
    console.log('生成新的单词数据并缓存')
    let words = (cet4Words as RawWord[]).map(convertToWord)

    
    // 根据类型筛选单词
    if (type !== 'all') {
      words = words.filter(word => word.type === type)
    }

    // 根据模式选择单词
    if (mode === 'ordered') {
      words = words.slice(0, count)
    } else {
        // 随机选取count个单词
      words = words.sort(() => Math.random() - 0.5).slice(0, count)
      words = words.slice(0, count)
    }

    // 更新缓存
    cache = {
      date: today,
      words: words
    }
  }

  return NextResponse.json(cache?.words || [])
}