import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mic, Send, Volume2, Copy, Check } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { isMobileDevice } from '@/hooks/use-media-query';
import { Word } from '@/types/words';
import { globalCache, Page,pages } from './app-router';
import { Switch } from './ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface Message {
  role: string;
  parts: Part[];
}
interface Part {
  text: string;
}

interface TodayDialogProps {
  navigateTo: (page: Page) => void;
}

const TodayDialogComponent: React.FC<TodayDialogProps> = ({ navigateTo }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(isMobileDevice());
  const [words, setWords] = useState<Word[]>([])
  const [currentAiMessage, setCurrentAiMessage] = useState('');
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [audioCache, setAudioCache] = useState<{[key: string]: string}>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

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
  }, [messages, currentAiMessage]);

  useEffect(() => {
    setIsLeftPanelCollapsed(isMobileDevice());
  }, []);

  useEffect(() => {
    const isStop = currentAiMessage.includes('@stop@')

    if (currentAiMessage) {
        setMessages(prevMessages => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          if (lastMessage.role === 'user') {
              return [...prevMessages, { role: 'model', parts: [{ text: currentAiMessage.replace('@stop@', '') }] }];
          } else if (lastMessage.role === 'model' && lastMessage.parts[0].text !== currentAiMessage) {
              return [...prevMessages.slice(0, -1), { role: 'model', parts: [{ text: currentAiMessage.replace('@stop@', '') }] }];
          } else {
              return prevMessages;
          }
      });
    }
  

    
    // console.log('currentAiMessage', currentAiMessage,"isStop", isStop)
    if (textToSpeechEnabled && !isPlaying && isStop) {
      // 移除结束符，和表情符合
      const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2700-\u27BF]/g;
      const cleanedText = currentAiMessage.replace('@stop@', '').replace(emojiRegex, '');
      textToSpeech(cleanedText);
    }

    if (isStop) {
      setIsWaiting(false);
    }
  }, [currentAiMessage, textToSpeechEnabled]);

  const textToSpeech = async (text: string) => {
    if (playingAudio === text) return; // 如果正在播放，则不做任何操作
    setPlayingAudio(text);
    try {
      let audioUrl: string;
      if (audioCache[text]) {
        audioUrl = audioCache[text];
      } else {
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error('文本转语音请求失败');
        }

        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        setAudioCache(prev => ({ ...prev, [text]: audioUrl }));
      }
      
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingAudio(null);
      audio.play();
    } catch (error) {
      console.error('文本转语音出错:', error);
      setPlayingAudio(null);
    }
  };

  const handleSend = async () => {
    if (input.trim()) {
      const newUserMessage = { role: 'user', parts: [{ text: input }] };
      setMessages(prevMessages => [...prevMessages, newUserMessage]);
      setInput('');
      setCurrentAiMessage('');
      setIsWaiting(true);

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
          // console.log('done', done, 'value', value)
          if (done) {
            setCurrentAiMessage(prev => prev + '@stop@')
            break;
          } 
          const chunk = decoder.decode(value);
          setCurrentAiMessage(prev => prev + chunk);
        }
      } catch (error) {
        console.error('发送消息时出错:', error);
        setMessages(prevMessages => [
          ...prevMessages,
          { role: 'model', parts: [{ text: '抱歉，我遇到了一些问题。请稍后再试。' }] }
        ]);
      } finally {
        setIsWaiting(false);
      }
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(true);
  };

  const handleVoiceStop = () => {
    setIsRecording(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 1000);
    });
  };

  const leftPanelContent = (
    <div className="h-auto p-4 bg-gray-100">
      <h2 className="text-lg font-bold mb-4">今日单词</h2>
      {!isLeftPanelCollapsed && words.map((word, index) => (
        <div key={index} className="mb-2 sm:text-sm text-xs">
          <span className="font-bold text-gray-800">{word.english}</span> - <span className="text-gray-600">{word.chinese}</span>
        </div>
      ))}
    </div>
  );

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
    
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      const observer = new MutationObserver(scrollToBottom);
      observer.observe(chatContainer, { childList: true, subtree: true });
      
      return () => observer.disconnect();
    }
  }, [scrollToBottom]);

  return (
    <ResizablePanelGroup direction="horizontal" className=" ">
      <ResizablePanel
        defaultSize={25}
        collapsible={isLeftPanelCollapsed}
        collapsedSize={5}
        minSize={20}
        maxSize={40}
        onCollapse={() => setIsLeftPanelCollapsed(true)}
        onExpand={() => setIsLeftPanelCollapsed(false)}
        className={ 'bg-gray-100 sm:max-[0px] md:max-[0px] ' + (isLeftPanelCollapsed ? "max-w-[0px]" : "")}
      >
        <div className="h-full mt-[20%] p-4">
          {!isLeftPanelCollapsed && leftPanelContent}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <div className="flex flex-col">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
            <div className="flex flex-col justify-center items-left h-[80vh]">
              <div className="w-full h-full p-5 overflow-y-auto">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                    <div className="flex ">
                      <div className={` p-3 items-right rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                        {message.parts[0].text}
                      </div>
                      {message.role === 'model' && (
                        <div className="flex flex-col mt-1 space-y-2">
                          <div className="flex space-x-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button 
                                    className={`text-gray-500 hover:text-gray-700 ${playingAudio === message.parts[0].text ? 'animate-pulse-fast' : ''}`}
                                    onClick={() => textToSpeech(message.parts[0].text)}
                                    disabled={playingAudio !== null}
                                  >
                                    <Volume2 size={16} />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{playingAudio === message.parts[0].text ? '正在播放' : '播放'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button 
                                    className="text-gray-500 hover:text-gray-700"
                                    onClick={() => handleCopy(message.parts[0].text)}
                                  >
                                    {copiedText === message.parts[0].text ? (
                                      <Check size={16} className="text-green-500" />
                                    ) : (
                                      <Copy size={16} />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{copiedText === message.parts[0].text ? '已复制' : '复制'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isWaiting && !currentAiMessage && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-[90%] p-3 items-right rounded-lg bg-gray-200">
                      <div className="animate-pulse flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end items-center space-x-2 mx-4 mt-2">
              <Switch
                id="text-to-speech"
                checked={textToSpeechEnabled}
                onCheckedChange={setTextToSpeechEnabled}
              />
              <label htmlFor="text-to-speech" className="ml-2 text-sm">
                文字转语音
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMessages([]);
                  setInput('');
                }}
                className="ml-auto "
              >
                清除对话
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigateTo(pages[0]);
                }}
                className="ml-auto border-red-500 text-red-500 hover:bg-red-300 hover:text-white"
              >
                返回首页
              </Button>
            </div>
          <div className="p-2">
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