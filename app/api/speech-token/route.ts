import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
      return NextResponse.json({ error: '语音服务配置缺失' }, { status: 500 });
    }

    const response = await axios.post(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      null,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.status === 200) {
      const token = response.data;
      return NextResponse.json({ token: token, region: speechRegion });
    } else {
      return NextResponse.json({ error: '获取令牌失败' }, { status: response.status });
    }
  } catch (error) {
    console.error('获取语音令牌时出错:', error);
    return NextResponse.json({ error: '内部服务器错误' }, { status: 500 });
  }
}
