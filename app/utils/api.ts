import { Message } from "@/lib/types/message";

interface CallbackOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (chunk: string) => void;
}

export const messagesPostToAi = async (
  messages: Message[],
  systemPrompt: string,
  callbacks?: CallbackOptions
): Promise<void> => {
  try {
    const response = await fetch('/api/openai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: messages, systemPrompt: systemPrompt }),
    });

    if (!response.ok) {
      throw new Error('API 请求失败');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullMessage = '';

    // 接收数据
    while (true) {
      const { done, value } = await reader?.read() ?? { done: true, value: undefined };
      if (done) {
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      fullMessage += chunk;
      callbacks?.onProgress?.(fullMessage);
    }

    callbacks?.onSuccess?.(fullMessage);
  } catch (error) {
    console.error('发送消息时出错:', error);
    callbacks?.onError?.(error instanceof Error ? error : new Error('未知错误'));
  }
};
