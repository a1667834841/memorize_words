import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Word } from '@/types/words';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * pageSize;

    // 查询总数
    const totalCount = await prisma.words.count({
      where: {
        word: {
          contains: search,
        },
      },
    });

    // 查询单词
    const rawWords = await prisma.words.findMany({
      where: {
        word: {
          contains: search,
        },
      },
      skip,
      take: pageSize,
      orderBy: {
        word: 'asc',
      },
    });

    // 获取单词的短语
    const phrasesMap = await getPhrasesMap(rawWords);

    // 转换为Word对象
    const words: Word[] = rawWords.map((word) => ({
      english: word.word,
      chinese: word.translation,
      type: word.type || '',
      translations: [{
        chinese: word.translation,
        type: word.type || '',
      }],
      phrases: phrasesMap.get(word.word) || [],
    }));

    return NextResponse.json({
      words,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('获取单词列表失败:', error);
    return NextResponse.json({ error: '获取单词列表失败' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

async function getPhrasesMap(rawWords: any) {
  const phrases = await prisma.phrases.findMany({
    where: {
      word: {
        in: rawWords.map((word: any) => word.word),
      },
    },
  });

  const phrasesMap = new Map<string, { phrase: string; chinese: string }[]>();
  phrases.forEach((phrase) => {
    if (phrasesMap.has(phrase.word)) {
      phrasesMap.get(phrase.word)?.push({
        phrase: phrase.phrase,
        chinese: phrase.translation,
      });
    } else {
      phrasesMap.set(phrase.word, [{
        phrase: phrase.phrase,
        chinese: phrase.translation,
      }]);
    }
  });
  return phrasesMap;
}