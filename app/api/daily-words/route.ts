import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Phrase, Word } from '@/types/words';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 获取当前日期的种子
    const today = new Date().toISOString().split('T')[0];

    // 检查今天是否已经记录过单词
    const existingWords = await prisma.dailyWords.findMany({
      where: {
        date: today,
      },
    });

    let rawWords = [];
    if (existingWords.length > 0) {
      rawWords = existingWords;
    } else {
      rawWords = await getRandomWords(today);
      await saveDailyWords(rawWords,today)
    }

    // 获取单词的短语
    const phrasesMap = await getPhrasesMap(rawWords);

    // randomWords 转Word对象
    const words:Word[] = [];
    rawWords.forEach((word:any) => {
      const wordObj = words.find((w ) => w.english === word.word)
      if (wordObj) {
        const existingTranslation = wordObj.translations.find(t => t.chinese.trim().replace(" ", "") === word.translation.trim().replace(" ", "") && t.type === word.type);
        if (!existingTranslation) {
          const translation = word.translation.trim().replace(" ", "").split(/[,;，；]/)[0];
          wordObj.translations.push({
            chinese: translation,
            type: word.type,
          });
        }
      } else {
        const translation = word.translation.trim().replace(" ", "").split(/[,;，；]/)[0];
        words.push({
          english: word.word,
          chinese: word.translation,
          type: word.type,
          translations: [{
            chinese: translation,
            type: word.type,
          }],
          phrases: phrasesMap.get(word.word) || [],
        })
      }

    });

    return NextResponse.json(words);
  } catch (error) {
    console.error('获取随机单词失败:', error);
    return NextResponse.json({ error: '获取随机单词失败' }, { status: 500 });
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
  // console.log(phrases)
  // phrases转map
  const phrasesMap = new Map<string, Phrase[]>();
  phrases.forEach((phrase) => {
    if (phrasesMap.has(phrase.word)) {
      const existingPhrases = phrasesMap.get(phrase.word) || [];
      const isDuplicate = existingPhrases.some(
        existingPhrase => existingPhrase.phrase === phrase.phrase && existingPhrase.chinese === phrase.translation
      );
      if (!isDuplicate) {
        existingPhrases.push({
          phrase: phrase.phrase,
          chinese: phrase.translation,
        });
        phrasesMap.set(phrase.word, existingPhrases);
      }
    } else {
      phrasesMap.set(phrase.word, [{
        phrase: phrase.phrase,
        chinese: phrase.translation,
      }]);
    }
  });
  return phrasesMap;
}

// 
async function getRandomWords(date: string): Promise<any> {
  const seed = parseInt(date.replace(/-/g, ''), 10);

  // 使用种子随机选择12个单词
  const randomWords = await prisma.$queryRaw`
    SELECT DISTINCT word FROM words
    ORDER BY RAND(${seed})
    LIMIT 12
  `;
  // 再查询12个单词在words表的记录
  const randomWordRecords = await prisma.words.findMany({
    where: {
      word: {
        in: (randomWords as { word: string }[]).map((word) => word.word),
      },
    },
  });
  return randomWordRecords;
}

async function saveDailyWords(rawWords:any,today:string) {
  await prisma.dailyWords.createMany({
    data: rawWords.map((word:any) => ({
      word: word.word,
      translation: word.translation,
      type: word.type,
      date: today,
    })),
  });
  
}
