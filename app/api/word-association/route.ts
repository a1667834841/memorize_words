import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { associationPromptTemplate } from '@/app/utils/promptTemplates';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_URL
});

// 获取OpenAI联想数据
async function getOpenAIAssociation(word: string) {
  try {
    const prompt = associationPromptTemplate(word);

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    return response;
  } catch (error) {
    console.error('OpenAI API 调用失败:', error);
    throw error;
  }
}

// 保存联想数据到数据库
async function saveWordAssociation(word: string, associationData: any) {
  try {
    const association = await prisma.wordAssociations.create({
      data: {
        word: word,
        association: JSON.stringify(associationData)
      }
    });
    return association;
  } catch (error) {
    console.error('保存联想数据失败:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const word = searchParams.get('word');

    if (!word) {
      return NextResponse.json({ error: '请提供单词参数' }, { status: 400 });
    }

    // 先查询数据库
    let wordAssociation = await prisma.wordAssociations.findFirst({
      where: { word: word }
    });

    // 如果数据库中没有，则调用 OpenAI 获取并保存
    if (!wordAssociation) {
      const aiAssociation = await getOpenAIAssociation(word);
      wordAssociation = await saveWordAssociation(word, aiAssociation);
    }

    return NextResponse.json({
      word: wordAssociation.word,
      association: JSON.parse(wordAssociation.association)
    });

  } catch (error) {
    console.error('获取单词联想失败:', error);
    return NextResponse.json({ error: '获取单词联想失败' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
