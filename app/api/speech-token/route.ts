import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
      return NextResponse.json({ error: '语音服务配置缺失' }, { status: 500 });
    }

    const headers = {
      'Ocp-Apim-Subscription-Key': speechKey,
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    const response = await fetch(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: headers,
        next: {revalidate:600} // 保证nextjs路由数据 在vercle上10分钟后失效
      }
    );

    if (response.ok) {
      const token = await response.text();
      return NextResponse.json({ token: token, region: speechRegion });
    } else {
      return NextResponse.json({ error: '获取令牌失败' }, { status: response.status });
    }
  } catch (error) {
    console.error('获取语音令牌时出错:', error);
    return NextResponse.json({ error: '内部服务器错误' }, { status: 500 });
  }
}
