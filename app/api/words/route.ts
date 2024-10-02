import { NextResponse } from 'next/server'
import cet4Words from '@/data/cet4-words.json'

interface RawWord {
  word: string;
  translations: Array<{
    translation: string;
    type: string;
  }>;
}

interface Word {
  english: string;
  chinese: string;
  type: string;
  difficulty?: string; // 如果没有难度信息，可以设为可选
}

// 创建一个简单的缓存对象
let cache: {
  date: string;
  words: Word[];
} | null = null;

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
  const count = parseInt(searchParams.get('count') || '100')
  const mode = searchParams.get('mode') || 'random'
  const type = searchParams.get('type') || 'all'

  const today = new Date().toDateString()

  // 检查缓存是否存在且是今天的数据
  if (cache && cache.date === today) {
    console.log('使用缓存的单词数据')
  } else {
    console.log('生成新的单词数据并缓存')
    let words = (cet4Words as RawWord[]).map(convertToWord)

    // 随机打乱单词顺序
    let seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    words = words.sort(() => {
      const x = Math.sin(seed++) * 10000
      return x - Math.floor(x)
    })

    // 更新缓存
    cache = {
      date: today,
      words: words
    }
  }

  let words = [...cache.words]

  // 根据类型筛选单词
  if (type !== 'all') {
    words = words.filter(word => word.type === type)
  }

  // 根据模式选择单词
  if (mode === 'ordered') {
    words = words.slice(0, count)
  } else {
    // 随机模式（已经在缓存时打乱过了）
    words = words.slice(0, count)
  }

  return NextResponse.json(words)
}