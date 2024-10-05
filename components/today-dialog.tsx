import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mic, Send } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { useMediaQuery } from '@/hooks/use-media-query';
import { DailyVocabularyComponent } from './daily-vocabulary';
import { Word } from '@/types/words';
import { globalCache } from './app-router';

interface Message {
  role: string;
  parts: Part[];
}
interface Part {
  text: string;
}

const TodayDialogComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(!isDesktop);
  const [words, setWords] = useState<Word[]>([])
  const [currentAiMessage, setCurrentAiMessage] = useState('');

  useEffect(() => {
    setMessages([{ role: 'model', parts: [{ text: '你好！今天想聊些什么呢？' }] }]);
    
    fetch('/api/daily-words')
    .then(response => response.json())
    .then((data: Word[]) => {
      setWords(data);
    })
    .catch(error => {
      console.error('获取单词时出错:', error)
    })
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (currentAiMessage) {
        //   如果最后一个消息是用户消息，则添加，如果是model消息，则替换
        setMessages(prevMessages => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            if (lastMessage.role === 'user') {
                return [...prevMessages, { role: 'model', parts: [{ text: currentAiMessage }] }];
            } else if (lastMessage.role === 'model' && lastMessage.parts[0].text !== currentAiMessage) {
                return [...prevMessages.slice(0, -1), { role: 'model', parts: [{ text: currentAiMessage }] }];
            } else {
                return prevMessages;
            }
        });
 
    }
  }, [currentAiMessage]);





 

   // 更新handleSend函数
   const handleSend = async () => {
    if (input.trim()) {
      const newUserMessage = { role: 'user', parts: [{ text: input }] };
      setMessages(prevMessages => [...prevMessages, newUserMessage]);
      setInput('');
      setCurrentAiMessage(''); // 重置当前 AI 消息

      try {
        const response = await fetch('/api/gemini-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages: [...messages, newUserMessage] }),
        });

        if (!response.ok) {
          throw new Error('API 请求失败');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader?.read() ?? { done: true, value: undefined };
          if (done) break;
          const chunk = decoder.decode(value);
          setCurrentAiMessage(prev => prev + chunk);
        }

        setCurrentAiMessage(''); // 重置当前 AI 消息
      } catch (error) {
        console.error('发送消息时出错:', error);
        setMessages(prevMessages => [
          ...prevMessages,
          { role: 'model', parts: [{ text: '抱歉，我遇到了一些问题。请稍后再试。' }] }
        ]);
      }
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(true);
  };

  const handleVoiceStop = () => {
    setIsRecording(false);
  };

  const leftPanelContent = (
    <div className="h-full p-4 bg-gray-100">
      <h2 className="text-lg font-bold mb-4">今日单词</h2>
      {!isLeftPanelCollapsed && words.map((word, index) => (
        <div key={index} className="mb-2">
          <span className="font-bold text-gray-800">{word.english}</span> - <span className="text-gray-600">{word.chinese}</span>
        </div>
      ))}
    </div>
  );

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full ">
      <ResizablePanel
        defaultSize={25}
        collapsible={true}
        collapsedSize={5}
        minSize={20}
        maxSize={40}
        onCollapse={() => setIsLeftPanelCollapsed(true)}
        onExpand={() => setIsLeftPanelCollapsed(false)}
        className={ 'bg-gray-100 ' + (isLeftPanelCollapsed ? "min-w-[50px]" : "")}
      >
        <div className="h-full mt-[20%] p-4">
          {!isLeftPanelCollapsed && leftPanelContent}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <div className="flex flex-col h-full">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto mt-10 p-4 space-y-4">
            <div className="flex flex-col justify-center items-left h-[80vh]">
              <div className="w-full  h-full p-10 overflow-y-auto">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                    <div className={`max-w-[70%] p-3 items-right rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                      {message.parts[0].text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onMouseDown={handleVoiceRecord}
                onMouseUp={handleVoiceStop}
                onTouchStart={handleVoiceRecord}
                onTouchEnd={handleVoiceStop}
              >
                <Mic className={isRecording ? 'text-red-500' : ''} />
              </Button>
              <Input
                value={input}
                onChange={(e:any) => setInput(e.target.value)}
                placeholder="输入消息..."
                onKeyPress={(e:any) => e.key === 'Enter' && handleSend()}
              />
              {input.trim() && (
                <Button onClick={handleSend}>
                  <Send />
                </Button>
              )}
            </div>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default TodayDialogComponent;