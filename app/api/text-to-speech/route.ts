import { NextResponse } from 'next/server';

const SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

// 声音枚举
interface Voice {
    name: string
}
const XiaoxiaoNeural: Voice = {
    name: 'zh-CN-XiaoxiaoMultilingualNeural'
}
const XiaochenMultilingualNeural: Voice = {
    name: 'zh-CN-XiaochenMultilingualNeural'
}
const XiaoyuMultilingualNeural:Voice = {
  name: 'zh-CN-XiaoyuMultilingualNeural'
}

async function getAccessToken(): Promise<string> {
  const tokenResponse = await fetch(
    `https://${SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': SPEECH_KEY!,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (!tokenResponse.ok) {
    throw new Error('获取访问令牌失败');
  }

  return tokenResponse.text();
}

async function getAudioForSentence(sentence: string, voice: string, accessToken: string): Promise<ArrayBuffer> {
  const ssml = `
    <speak version='1.0' xml:lang='zh-CN'>
      <voice name='${voice}'>
        ${sentence}
      </voice>
    </speak>
  `;

  const audioResponse = await fetch(
    `https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      },
      body: ssml,
    }
  );

  if (!audioResponse.ok) {
    throw new Error('获取音频失败');
  }

  return audioResponse.arrayBuffer();
}

export async function POST(request: Request) {
  try {
    const { text, voice = XiaochenMultilingualNeural.name } = await request.json();

    if (!text) {
      return NextResponse.json({ error: '缺少文本参数' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    // 使用正则表达式分割句子
    const sentences = text.split(/(?<=[。！？])/);

    // 创建一个 ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        // 先处理第一句
        console.log('处理第一句：', sentences[0].trim());
        let startTime = Date.now();
        const firstSentenceAudio = await getAudioForSentence(sentences[0].trim(), voice, accessToken);
        let endTime = Date.now();
        console.log(`处理第一句用时: ${endTime - startTime}ms`);
        controller.enqueue(new Uint8Array(firstSentenceAudio));

        // 处理剩余的句子
        const remainingSentences = sentences.slice(1);
        const audioPromises = remainingSentences.map((sentence: string) => getAudioForSentence(sentence.trim(), voice, accessToken));
        const audioBuffers = await Promise.all(audioPromises);

        // 合并剩余的音频缓冲区
        const totalLength = audioBuffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
        const mergedBuffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const buffer of audioBuffers) {
          mergedBuffer.set(new Uint8Array(buffer), offset);
          offset += buffer.byteLength;
        }
        endTime = Date.now();
        console.log(`处理剩余句子用时: ${endTime - startTime}ms`);

        controller.enqueue(mergedBuffer);
        controller.close();
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked'
      },
    });
  } catch (error) {
    console.error('文本转语音出错:', error);
    return NextResponse.json({ error: '文本转语音失败' }, { status: 500 });
  }
}