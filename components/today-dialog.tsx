import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Phone, Send, Volume2, Copy, Check, PhoneOff, ArrowLeft } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { isMobileDevice } from '@/hooks/use-media-query';
import { Word } from '@/lib/types/words';
import { globalCache, Page,pages } from './app-router';
import { Switch } from './ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import {  audioToWav, saveAudioToFile } from '@/app/utils/audio';
import { useWebSocket } from '@/hooks/use-websocket';
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import { getSpeechToken } from '@/hooks/use-websocket';

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
  const [audioQueue, setAudioQueue] = useState<Blob[]>([]);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [userCurrentMessage,setUserCurrentMessage] = useState('')

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 在消息更新时滚动到顶部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight  ;
    }
  }, [messages]); // 假设 messages 是存储对话消息的状态

  useEffect(() => {
    
    fetch('/api/daily-words')
    .then(response => response.json())
    .then((data: Word[]) => {
      setWords(data);
      setMessages([{ 
        role: 'model', 
        parts: [{ 
          text: `你好呀！我是你的今天的英语老师！今天咱们学了以下单词，有12个单词诶！那你想从哪个单词开始聊起呢？`
        }] 
      }]);
    })
    .catch(error => {
      console.error('获取单词时出错:', error)
    })
  }, []);

  useEffect(() => {

    // 当对话中的model的message的text中包含words中的一个，则将单词的hitCount+1
    messages.forEach(message => {
      if (message.role === 'model') {
        words.forEach(word => {
          if (message.parts[0].text.includes(word.english)) {
            setWords(prevWords => prevWords.map(w => w.english === word.english ? { ...w, hitCount: (w.hitCount || 0) + 1 } : w));
          }
        });
      }
    });
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

    if (isStop) {
      setIsWaiting(false);
    }
  }, [currentAiMessage, textToSpeechEnabled]);

  const textToSpeech = async (text: string, messageIndex: number) => {
    if (playingAudio === text) return;
    if (!textToSpeechEnabled || isPlaying) return;
    
    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2700-\u27BF]/g;
    text = text.replace('@stop@', '').replace(emojiRegex, '');
    setPlayingAudio(text);
    setCurrentMessageIndex(messageIndex);

    try {
      const audioStartTime = Date.now();
      if (audioCache[text]) {
        playAudio(audioCache[text], messageIndex);
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

        const reader = response.body?.getReader();
        const ctx = new AudioContext();
        setAudioContext(ctx);

        const streamAudio = async () => {
          const chunks: Uint8Array[] = [];
          while (true) {
            const { done, value } = await reader?.read() ?? { done: true, value: undefined };
            if (done) break;
            chunks.push(value);
            
            const audioBuffer = await ctx.decodeAudioData(value.buffer);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            setSourceNode(source);
            source.start();
            
            await new Promise(resolve => source.onended = resolve);
          }
          const fullAudio = new Blob(chunks, { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(fullAudio);
          setAudioCache(prev => ({ ...prev, [text]: audioUrl }));
        };

        await streamAudio();
      }
      const audioEndTime = Date.now();
      
      setMessages(prevMessages => prevMessages.map((msg, index) => 
        index === messageIndex
          ? { ...msg, audioRequestTime: audioEndTime - audioStartTime, audioResponseTime: Date.now() - audioEndTime }
          : msg
      ));
    } catch (error) {
      console.error('文本转语音出错:', error);
      setPlayingAudio(null);
      setCurrentMessageIndex(null);
    }
  };

  async function sttFromMic() {
    const speechToken = await getSpeechToken()
    if (speechToken?.token && speechToken?.region) {
      const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(speechToken.token, speechToken.region);
      speechConfig.speechRecognitionLanguage = 'zh-CN';
      
      const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);


      recognizer.recognizeOnceAsync(result => {
          
          if (result.reason === ResultReason.RecognizedSpeech) {
              setUserCurrentMessage(result.text)
              setInput(result.text);
              // setIsCallActive(false)
              setTimeout(() => {
                handleSend();
              }, 1000);
          } else {
            setUserCurrentMessage(result.text);
            setInput('')
            setIsCallActive(false)
          }
      });
    } else {
      console.error('语音令牌或区域未定义');
      // 在这里处理错误情况
    }
  }


  const playAudio = (url: string, messageIndex: number): Promise<void> => {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.onended = () => {
        setIsAudioPlaying(false);
        setPlayingAudio(null);
        setCurrentMessageIndex(null);
        URL.revokeObjectURL(url); // 释放 URL 对象
        resolve();
      };
      audio.play();
    });
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
      realMessages[0].parts[0].text += `今天咱们学了以下单词，有12个单词！那你想从哪个单词开始聊起呢？learnSituations:`+JSON.stringify(learnSituations)

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
        let fullMessage = '';
        let isDataReceived = false;

        // 接收数据
        try {
          while (true) {
            const { done, value } = await reader?.read() ?? { done: true, value: undefined };
            if (done) {
              isDataReceived = true;
              break;
            }
            fullMessage += decoder.decode(value, { stream: true });
          }
        } catch (error) {
          console.error('接收消息时出错:', error);
          setCurrentAiMessage('抱歉，我遇到了一些问题。请稍后再试。');
          setIsWaiting(false);
          return;
        }

        // 实现打字机效果
        if (isDataReceived) {
          // 开始播放音频
          textToSpeech(fullMessage  , messages.length - 1);
          for (let i = 0; i < fullMessage.length; i++) {
            setCurrentAiMessage(prev => prev + fullMessage[i]);
            // 检查是否为标点符号
            if (['，', '。', '？', '！'].includes(fullMessage[i])) {
              await new Promise(resolve => setTimeout(resolve, 150));
            } else {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          setCurrentAiMessage(prev => prev + '@stop@');
        }

        setIsWaiting(false);
      }
     catch (error) {
      console.error('发送消息时出错:', error);
      setCurrentAiMessage('抱歉，我遇到了一些问题。请稍后再试。');
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
    if (sourceNode) {
      sourceNode.stop();
      setSourceNode(null);
    }
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    setPlayingAudio(null);
    setCurrentMessageIndex(null);
  };



  const startRecording = async () => {
    sttFromMic()
    // try {
    //   const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    //   const recorder = new MediaRecorder(stream);
    //   setMediaRecorder(recorder);

    //   recorder.ondataavailable = (event) => {
    //     if (event.data.size > 0 && isConnected) {
    //       event.data.arrayBuffer().then((arrayBuffer) => {
    //         console.log("客户端发送 arrayBuffer type:",typeof arrayBuffer)

    //         sendMessage(arrayBuffer);
    //       });
    //     }
    //   };

    //   recorder.start(100); // 每100ms发送一次数据
      setIsCallActive(true);
    // } catch (error) {
    //   console.error('无法访问麦克风:', error);
    // }
  };

  const stopRecording = () => {
    setIsCallActive(false);
    // if (mediaRecorder) {
    //   mediaRecorder.stop();
    //   setIsCallActive(false);
    //   if (isConnected) {
    //     sendMessage('END_OF_STREAM');
    //   }
    // }
  };

  // useEffect(() => {
  //   if (lastMessage) {
  //     const { text } = lastMessage;
  //     if (text) {
  //       setInput(text);
  //       handleSend();
  //     }
  //   }
  // }, [lastMessage]);

  const handleCallStart = () => {
    startRecording();
  };

  const handleCallEnd = () => {
    stopRecording();
  };

  // 模拟音频级别变化
  useEffect(() => {
    if (isCallActive && mediaRecorder) {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(mediaRecorder.stream);
      microphone.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
        setAudioLevel(average / 128);  // 归一化到0-1范围
        if (isCallActive) {
          requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();

      return () => {
        microphone.disconnect();
        audioContext.close();
      };
    }
  }, [isCallActive, mediaRecorder]);



  return (
    <ResizablePanelGroup direction="horizontal" className="relative">
      <ResizablePanel
        defaultSize={25}
        collapsible={isLeftPanelCollapsed}
        collapsedSize={5}
        minSize={20}
        maxSize={40}
        onCollapse={() => setIsLeftPanelCollapsed(true)}
        onExpand={() => setIsLeftPanelCollapsed(false)}
        className={ 'bg-gray-100 hidden xs:block ' + (isLeftPanelCollapsed ? "xs:block" : "")}
      >
        <div className="h-full mt-[20%] p-4">
          {!isLeftPanelCollapsed && leftPanelContent}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <div className="flex flex-col">
        <nav className="flex items-center justify-between bg-white p-4 shadow-md">
              <button className="text-gray-600 hover:text-gray-800" onClick={() => navigateTo(pages[0])}>
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold text-center">
              <span role="img" aria-label="可爱女生表情">👧</span> copi 
              </h1>
              <div className="w-8"></div> {/* 这是为了保持导航栏的平衡 */}
            </nav>
          <div  className="overflow-y-auto p-4 space-y-4 bg-gray-100">
            
            <div className="flex flex-col justify-center items-left h-[70vh]">
              <div ref={chatContainerRef} className="w-full h-full overflow-y-auto text-sm">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                    <div className="flex flex-col ">
                      <div className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                        {message.parts[0].text}
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
                    <div className=" p-3 items-right rounded-lg bg-gray-200">
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
          <div className="flex justify-center items-center space-x-2 mx-4 mt-2">
            {words.map((word, index) => (
              <button
                key={index}
                className={`w-4 h-2 rounded-sm transition-all duration-1500 ease-in-out
                  ${word.hitCount && word.hitCount > 0 
                    ? 'bg-yellow-400  animate-[pulse_1s_ease-in-out]' 
                    : 'bg-gray-300'
                  }`}
                title={word.english}
              ></button>
            ))}
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
                  setMessages(messages.slice(0, 1));
                  setInput('');
                }}
                className="ml-auto "
              >
                清除对话
              </Button>
            </div>
          <div className="p-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleCallStart}
              >
                <Phone className={isCallActive ? 'text-green-500' : ''} />
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

      {isCallActive && (
        <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex flex-col items-center justify-center">
          <div className="w-64 h-32 bg-white rounded-lg flex items-center justify-center">
            <svg width="200" height="60" viewBox="0 0 200 60">
              <path
                d={`M 0 30 Q 50 ${30 - audioLevel * 20} 100 30 Q 150 ${30 + audioLevel * 20} 200 30`}
                fill="none"
                stroke="blue"
                strokeWidth="2"
              />
            </svg>
          </div>
          <Button
            variant="destructive"
            size="lg"
            className="mt-4"
            onClick={handleCallEnd}
          >
            <PhoneOff />
          </Button>
        </div>
      )}
    </ResizablePanelGroup>
  );
};

export default TodayDialogComponent;