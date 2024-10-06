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
  requestTime?: number;
  responseTime?: number;
  audioRequestTime?: number;
  audioResponseTime?: number;
}
interface Part {
  text: string;
  words?: string[];
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
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number | null>(null);
  const [requestTime, setRequestTime] = useState(0);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    
    fetch('/api/daily-words')
    .then(response => response.json())
    .then((data: Word[]) => {
      setWords(data);
      setMessages([{ 
        role: 'model', 
        parts: [{ 
          text: `你好呀！我是你的今天的英语老师！今天咱们学了以下单词，有12个单词诶！那你想从哪个单词开始聊起呢？`,
          words: data.map(word => word.english)
        }] 
      }]);
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
    if (messages.length > 1 && isWaiting ) {
      messageSend(messages);
    }
  }, [isWaiting]);

  useEffect(() => {
    setIsLeftPanelCollapsed(isMobileDevice());
  }, []);

  useEffect(() => {
    const isStop = currentAiMessage.includes('@stop@')

    if (currentAiMessage) {
        setMessages(prevMessages => {
          const endResponseTime = Date.now();
          const lastMessage = prevMessages[prevMessages.length - 1];
          if (lastMessage.role === 'user') {
              return [...prevMessages, { role: 'model', parts: [{ text: currentAiMessage.replace('@stop@', '') }],requestTime }];
          } else if (lastMessage.role === 'model' && lastMessage.parts[0].text !== currentAiMessage) {
              return [...prevMessages.slice(0, -1), { role: 'model', parts: [{ text: currentAiMessage.replace('@stop@', '') }] ,requestTime}];
          } else {
              return prevMessages;
          }
      });
    }
  
    if (!textToSpeechEnabled) {
      stopAudioPlayback();
    }

    
    // console.log('currentAiMessage', currentAiMessage,"isStop", isStop)
    if (textToSpeechEnabled && !isPlaying && isStop) {
      // 移除结束符，和表情符合
      const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2700-\u27BF]/g;
      const cleanedText = currentAiMessage.replace('@stop@', '').replace(emojiRegex, '');
      textToSpeech(cleanedText, messages.length - 1);
    }

    if (isStop) {
      setIsWaiting(false);
    }
  }, [currentAiMessage, textToSpeechEnabled]);

  const textToSpeech = async (text: string, messageIndex: number) => {
    if (playingAudio === text) return;
    setPlayingAudio(text);
    setCurrentMessageIndex(messageIndex);
    try {
      const audioStartTime = Date.now();
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
      const audioEndTime = Date.now();
      
      setMessages(prevMessages => prevMessages.map((msg, index) => 
        index === messageIndex
          ? { ...msg, audioRequestTime: audioEndTime - audioStartTime, audioResponseTime: Date.now() - audioEndTime }
          : msg
      ));
      
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setPlayingAudio(null);
        setCurrentMessageIndex(null);
      };
      audio.play();
    } catch (error) {
      console.error('文本转语音出错:', error);
      setPlayingAudio(null);
      setCurrentMessageIndex(null);
    }
  };

  const messageSend = async (messages: Message[]) => {
  
      const startTime = Date.now();

      const learnSituations = words.map(word => {
        return {
          word: word.english,
          mentionedTimes: word.hitCount
        }
      })

      // clone messages
      let realMessages = JSON.parse(JSON.stringify(messages))
      // 将第一条的message的text添加上learnSituations
      realMessages[0].parts[0].text += `今天咱们学了以下单词，有12个单词诶！那你想从哪个单词开始聊起呢？learnSituations:`+JSON.stringify(learnSituations)

      try {
        const response = await fetch('/api/openai-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages: realMessages }),
        });

        const endRequestTime = Date.now();
        setRequestTime(endRequestTime - startTime);

        if (!response.ok) {
          throw new Error('API 请求失败');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader?.read() ?? { done: true, value: undefined };
          if (done) {
            if (buffer) {
              setCurrentAiMessage(prev => prev + buffer);
            }
            setCurrentAiMessage(prev => prev + '@stop@');
           
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          while (buffer.length > 0) {
            const char = buffer[0];
            buffer = buffer.slice(1);

            setCurrentAiMessage(prev => prev + char);
            await new Promise(resolve => setTimeout(resolve, 20));
          }

          if (isWaiting) {
            setIsWaiting(false);
          }
        }
      } catch (error) {
        console.error('发送消息时出错:', error);
        setCurrentAiMessage('抱歉，我遇到了一些问题。请稍后再试。');
      } finally {
        setIsWaiting(false);

      }
    
  }

  const handleSend = async () => {
    if (input.trim()) {
      const newUserMessage = { role: 'user', parts: [{ text: input }] };
      setInput('');
      setCurrentAiMessage('');
      setIsWaiting(true);
      setMessages(prevMessages => [...prevMessages, newUserMessage]);
     
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

  const stopAudioPlayback = () => {
    if (playingAudio) {
      const audio = new Audio(audioCache[playingAudio]);
      audio.pause();
      audio.currentTime = 0;
      setPlayingAudio(null);
      setCurrentMessageIndex(null);
    }
  };

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
                    <div className="flex flex-col max-w-[70%]">
                      <div className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                        {message.parts[0].text}
                        {message.parts[0].words && (
                          <div>
                            {message.parts[0].words.map((word, i) => (
                              <Button size={"sm"} variant={"outline"} className="m-1" key={i}>{word}</Button>
                            ))}
                          </div>
                        )}
                      </div>
                      {message.role === 'model' && (
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                          <div className="flex space-x-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button 
                                    className={`${playingAudio === message.parts[0].text ? 'animate-pulse-fast' : ''}`}
                                    onClick={() => textToSpeech(message.parts[0].text, index)}
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
                          <div className="flex flex-col space-y-1 text-right">
                            {message.requestTime !== undefined && (
                              <span>请求: {message.requestTime / 1000}秒</span>
                            )}
                            {message.responseTime !== undefined && (
                              <span>响应: {message.responseTime / 1000}秒</span>
                            )}
                            {message.audioRequestTime !== undefined && (
                              <span>音频请求: {message.audioRequestTime / 1000}秒</span>
                            )}
                            {message.audioResponseTime !== undefined && (
                              <span>音频响应: {message.audioResponseTime / 1000}秒</span>
                            )}
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
                onCheckedChange={(checked) => {
                  setTextToSpeechEnabled(checked);
                  if (!checked) {
                    stopAudioPlayback();
                  }
                }}
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