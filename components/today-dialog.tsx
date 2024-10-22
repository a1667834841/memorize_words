import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Phone, Send, Volume2, Copy, Check, PhoneOff, ArrowLeft, Keyboard } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { isMobileDevice } from '@/hooks/use-media-query';
import { Word } from '@/lib/types/words';
import { globalCache, Page,pages } from './app-router';
import { Switch } from './ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import {  AudioPlayer, audioToWav,  MicrophoneSoundDetector } from '@/app/utils/audio';
import { ResultReason, SpeechSynthesizer } from 'microsoft-cognitiveservices-speech-sdk';
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';
import { chatPromptTemplate, englishGrammaticalTeacherTemplate } from '@/app/utils/promptTemplates';
import { Message } from '@/lib/types/message';


let globalRecognizer: speechsdk.SpeechRecognizer | null = null;
let globalSpeechSynthesizer: speechsdk.SpeechSynthesizer | null = null;
let tokenExpirationTime: number = 0;




interface TodayDialogProps {
  navigateTo: (page: Page) => void;
}

const USER_ROLE = "user"
const MODEL_ROLE = "model"

const TodayDialogComponent: React.FC<TodayDialogProps> = ({ navigateTo }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(isMobileDevice());
  const [words, setWords] = useState<Word[]>([])
  // const [currentAiMessage, setCurrentAiMessage] = useState('');
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(true);
  // const [isWaiting, setIsWaiting] = useState(false);
  const [audioCache, setAudioCache] = useState<{[key: string]: string}>({});
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [currentUserMessageIndex, setCurrentUserMessageIndex] = useState<number | 1>(1);
  const [currentModelMessageIndex, setCurrentModelMessageIndex] = useState<number | 0>(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [shouldSend, setShouldSend] = useState(false);
  const [isWaitingAiChat, setIsWaitingAiChat] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
   // 新增：使用 useRef 来跟踪最新的 messages
   const messagesRef = useRef<Message[]>([]);

   // 更新 messagesRef 当 messages 改变时
   useEffect(() => {
     messagesRef.current = messages;
   }, [messages]);

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      setIsTransitioning(false)
    } 
  }, [isListening])



  useEffect(() => {
    // 初始化 globalRecognizer
    async function initializeGlobalRecognizer() {
      try {
        const speechToken = await getSpeechToken();
        if (speechToken?.token && speechToken?.region) {
          globalRecognizer = initializeRecognizer(speechToken.token, speechToken.region);
          tokenExpirationTime = Date.now() + 9 * 60 * 1000;
          console.log('语音识别器初始化成功');
        } else {
          throw new Error('无法获取语音令牌');
        }
      } catch (error) {
        console.error('初始化语音识别器时出错:', error);
      }
    }
    initializeGlobalRecognizer();

    
    // 返回一个清理函数，它会在组件卸载时执行
    return () => {
      if (globalRecognizer) {
        console.log('Closing speech recognizer...');
        globalRecognizer.close();
        globalRecognizer = null;
      }
      if (globalSpeechSynthesizer) {
        console.log('Closing speech synthesizer...');
        globalSpeechSynthesizer.close();
        globalSpeechSynthesizer = null;
      }
    };
  }, []); // 空依赖数组意味着这个效果只在组件挂载和卸载时运行


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
    if (messages.length > 1 && shouldSend ) {
      messageSend(messages);
    }
  }, [shouldSend]);

  useEffect(() => {
    setIsLeftPanelCollapsed(isMobileDevice());
  }, []);


  const getSpeechToken = async () => {
    try {
        const response = await fetch(`/api/speech-token?timestamp=${new Date().getTime()}`, {
            next: {
              revalidate: 600, // 10 min
            },
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error('获取语音令牌失败');
            return null;
        }
    } catch (error) {
        console.error('获取语音令牌时出错:', error);
        return null;
    }
};



  // 新增：初始化 recognizer 的函数
  function initializeRecognizer(token: string, region: string): speechsdk.SpeechRecognizer {
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(token, region);
    speechConfig.speechRecognitionLanguage = 'zh-CN';
    
    const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
    return new speechsdk.SpeechRecognizer(speechConfig, audioConfig);
  }

  // 新增一个· speechSynthesizer 函数
  function initializeSpeechSynthesizer(token: string, region: string): speechsdk.SpeechSynthesizer {
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(token, region);
    // zh-CN-XiaoyuMultilingualNeural
    // zh-CN-XiaoxiaoMultilingualNeural
    speechConfig.speechSynthesisVoiceName = 'zh-CN-XiaochenMultilingualNeural'
    const audioConfig = speechsdk.AudioConfig.fromDefaultSpeakerOutput();
    

    return new SpeechSynthesizer(speechConfig, audioConfig);
  }


  async function refreshTokenIfNeeded() {
    const currentTime = Date.now();
    if (currentTime >= tokenExpirationTime) {
      const speechToken = await getSpeechToken();
      if (speechToken?.token && speechToken?.region) {
        if (globalRecognizer) {
          globalRecognizer.authorizationToken = speechToken.token;
        }
        // 设置新的过期时间（9分钟后，留出一分钟的缓冲时间）
        tokenExpirationTime = currentTime + 9 * 60 * 1000;
        return { token: speechToken.token, region: speechToken.region };
      } else {
        throw new Error('无法获取新的语音令牌');
      }
    }
    return null; // 令牌仍然有效
  }

  async function tts (message :string,messageIndex:number) {

    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2700-\u27BF]/g;
    const realMessage = message.replace(emojiRegex,"")

    // 如果有缓存，则直接播放
    if (audioCache[realMessage]) {
      const audio = new Audio(audioCache[realMessage]);
      audio.play();
      return
    }

    if (!textToSpeechEnabled) {
      return
    }
    const refreshedToken = await refreshTokenIfNeeded();
    if (refreshedToken) {
      if (globalSpeechSynthesizer) {
        globalSpeechSynthesizer.close();
      }
      globalSpeechSynthesizer = initializeSpeechSynthesizer(refreshedToken.token, refreshedToken.region)
    } else if (!globalSpeechSynthesizer) {
      // 如果recognizer不存在，使用当前令牌初始化
      const speechToken = await getSpeechToken();
      if (speechToken?.token && speechToken?.region) {
        globalSpeechSynthesizer = initializeSpeechSynthesizer(speechToken.token, speechToken.region);
        tokenExpirationTime = Date.now() + 9 * 60 * 1000;
      } else {
        throw new Error('无法获取语音令牌');
      }
    }

    globalSpeechSynthesizer.speakTextAsync(realMessage,
      result => {
        if (result) {
          if (result.reason === ResultReason.SynthesizingAudioCompleted) {
            // console.log('SynthesizingAudioCompleted')
          } else if (result.reason === ResultReason.Canceled) {
            console.error(`Speech synthesis canceled: ${result.errorDetails}`);
          }
          globalSpeechSynthesizer?.close();
          globalSpeechSynthesizer = null;
          // 保存音频cache
          setAudioCache(prev => {
            const newCache = { [realMessage]: URL.createObjectURL(new Blob([result.audioData], { type: 'audio/mpeg' })), ...prev };
            const cacheEntries = Object.entries(newCache);
            if (cacheEntries.length > 10) {
              const [oldestKey] = cacheEntries[10];
              const { [oldestKey]: _, ...rest } = newCache;
              return rest;
            }
            return newCache;
          });
      }
      },error => {
        console.log(error);
        globalSpeechSynthesizer?.close();
      }
    )
   
  }

  async function sttFromMic() {
    setIsTransitioning(true)
    setIsRecording(true)
    setIsListening(true)
    try {
      const refreshedToken = await refreshTokenIfNeeded();
      
      if (refreshedToken) {
        // 如果令牌被刷新，重新初始化recognizer
        if (globalRecognizer) {
          globalRecognizer.close();
        }
        globalRecognizer = initializeRecognizer(refreshedToken.token, refreshedToken.region);
      } else if (!globalRecognizer) {
        // 如果recognizer不存在，使用当前令牌初始化
        const speechToken = await getSpeechToken();
        if (speechToken?.token && speechToken?.region) {
          globalRecognizer = initializeRecognizer(speechToken.token, speechToken.region);
          tokenExpirationTime = Date.now() + 9 * 60 * 1000;
        } else {
          throw new Error('无法获取语音令牌');
        }
      }

      if (globalRecognizer) {
        setupRecognizerCallbacks();
        globalRecognizer.startContinuousRecognitionAsync();
      }
    } catch (error) {
      console.error('启动语音识别时出错:', error);
      setIsListening(false);
    } 
  }


  
  function setupRecognizerCallbacks() {
    if (globalRecognizer) {

      globalRecognizer.sessionStarted = async (s,e) => {
      }

  


      globalRecognizer.recognizing = async (s, e) => {
        
        const currentMessages = messagesRef.current;
        const lastUserMessageIndex = currentMessages.findLastIndex(m => m.role === USER_ROLE);
        if (lastUserMessageIndex !== -1 && (currentMessages.length-1) == lastUserMessageIndex) {
          // 更新最后一条用户消息
          updateMessage(lastUserMessageIndex, e.result.text, 0);
        } else {
          // 如果没有用户消息，添加新消息
          await addMessage(e.result.text, 0, USER_ROLE);
        }
        
      };

      globalRecognizer.recognized = async (s, e) => {
        if (!e.result.text || !e.result.text.trim()) {
          return
        }
        // 立即更新输入
        // await addMessage(e.result.text, 0,USER_ROLE)
        setShouldSend(true)
      };

      globalRecognizer.canceled = (s, e) => {
        console.log(`canceled reason=${e.reason}`);
        if (e.reason == speechsdk.CancellationReason.Error) {
          console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
          console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
          console.log("CANCELED: Did you set the speech resource key and region values?");
        }
        setIsListening(false);
        setIsRecording(false)
      };

      globalRecognizer.sessionStopped = (s, e) => {
        console.log("Session stopped event");
        setIsListening(false);
        setIsRecording(false)
        globalRecognizer?.stopContinuousRecognitionAsync()
      };
    }
  }



  const messagesPostToAi = async (messages: Message[],systemPrompt:string): Promise<string> => {


    try {
      const response = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messages,systemPrompt:systemPrompt }),
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
        fullMessage += decoder.decode(value, { stream: true });
      }

      return fullMessage
    } catch (error) {
      console.error('发送消息时出错:', error);
      // addMessage('抱歉，我遇到了一些问题。请稍后再试。',0,MODEL_ROLE);
    } 
  return ''
}


  const messageSend = async (messages: Message[]) => {
  
    // 发送消息到AI
    const startTime = Date.now();
    setIsWaitingAiChat(true)
    
    let initWords = JSON.parse(JSON.stringify(words.map(word => {
      return {
        word: word.english,
        mentionedTimes: word.hitCount
      }
    })))
    // clone messages
    let realMessages = JSON.parse(JSON.stringify(messages));
    // 将第一条的message的text添加上learnSituations
    realMessages[0].parts[0].text += ` learnSituations:`+JSON.stringify(initWords)
    
    const fullMessage = await messagesPostToAi(realMessages,chatPromptTemplate())
    // const picketMessage = await messagesPostToAi([realMessages[realMessages.length-1]],englishGrammaticalTeacherTemplate())
    // console.log("picketMessage:{}",picketMessage)
    setIsWaitingAiChat(false)
    const responseTime = Date.now() - startTime
    setShouldSend(false);

    // 开始播放音频
    if (textToSpeechEnabled) {
      tts(fullMessage, messages.length - 1)
    }

    // 实现打字机效果
    await typeWriter(fullMessage, responseTime)
    }

  // 实现打字机效果
  const typeWriter = async (fullMessage: string, responseTime: number) => {

    const firstMessageIndex = await addMessage(fullMessage.substring(0, 1), responseTime,MODEL_ROLE)
    if (firstMessageIndex === -1) {
      return
    }
    
    for (let i = 1; i < fullMessage.length; i++) {
      // 检查是否为标点符号
      updateMessage(firstMessageIndex,fullMessage.substring(0, i+1), responseTime)
      if (['，', '。', '？', '！'].includes(fullMessage[i])) {
        await new Promise(resolve => setTimeout(resolve, 150));
      } else {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    updateMessage(firstMessageIndex,fullMessage, responseTime)
  }

  const addMessage = (text: string, requestTime: number,role: string,show:boolean = true): Promise<number> => {
    if (!text || !text.trim()) {
      return Promise.resolve(-1)
    }


    return new Promise((resolve) => {
      setMessages(prevMessages => {
        const newRole = role
        const updatedMessages = [...prevMessages, { role: newRole, parts: [{ text }], requestTime }];
        if (role == USER_ROLE) {
          setCurrentUserMessageIndex(updateMessage.length-1)
        } else{
          setCurrentModelMessageIndex(updateMessage.length-1)
        }
        messagesRef.current = updatedMessages;
        resolve(updatedMessages.length - 1);
        return updatedMessages;
      });
    });
  };

  const updateMessage = (index: number, text: string, requestTime: number) => {
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages];
      updatedMessages[index].parts[0].text = text;
      updatedMessages[index].requestTime = requestTime;
      return updatedMessages;
    });
  };

    
  const handleClickSend = async () => {
    if (input && input.trim()) {
      await addMessage(input,0,USER_ROLE)
      setShouldSend(true)
      setInput('')
    }
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
  };



  const startRecording = async () => {
    // setIsCallActive(true);
    sttFromMic()
  };

  const stopRecording = () => {    
    globalRecognizer?.stopContinuousRecognitionAsync();
  };



  const handleCallStart = () => {
    startRecording();
  };

  const handleCallEnd = () => {
    setIsRecording(false);
    stopRecording();
  };

  const handleRecordSwitch = () => {
    if (!isRecording) {
      startRecording()
    } else {
      stopRecording();
    }
  };


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
                                    onClick={() => tts(message.parts[0].text, index)}
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
                {isWaitingAiChat  && (
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
                自动回复语音
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
            <div className="flex items-center space-x-2 relative "> {/* 添加 overflow-hidden */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowInput(!showInput)}
                className={`z-10 ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isRecording}
              >
                {showInput ? <Phone className="w-5 h-5" /> : <Keyboard className={`w-5 h-5`} />}
              </Button>
              <div className="flex-grow ">
                <div className={`flex transition-all duration-300 ease-in-out ${showInput ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none transition-opacity duration-500'}`}>
                  <Input
                    value={input}
                    onChange={(e:any) => setInput(e.target.value)}
                    placeholder="输入消息..."
                    onKeyPress={(e:any) => e.key === 'Enter' && handleClickSend()}
                    className={`flex-grow   px-3 py-2 rounded-md bg-gray-200` }
                    />
                  {input && (
                    <Button onClick={handleClickSend} className="ml-2">
                      <Send className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
              <div className={`absolute inset-y-0 left-10 right-0 transition-all duration-300 ease-in-out ${showInput ? 'translate-x-full' : 'translate-x-0'}`}>
              <Button
                variant={isListening ? "destructive" : "default"}
                className={`w-full h-full transition-all duration-300 ease-in-out text-white
                  ${showInput ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                  ${isRecording 
                    ? 'shadow-inner transform scale-95 bg-red-500' 
                    : 'shadow-md'
                  }
                `}
                onClick={handleRecordSwitch}
              >
                <div className="relative w-full h-full overflow-hidden">
                  <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${isRecording ? 'translate-y-full' : ''}`}>
                    按住说话 
                  </div>
                  <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${isRecording ? '' : '-translate-y-full'}`}>
                    <span className="flex items-center justify-center">
                      对话中
                      <span className="ml-1 flex">
                        <span className="animate-bounce-dot">.</span>
                        <span className="animate-bounce-dot animation-delay-200">.</span>
                        <span className="animate-bounce-dot animation-delay-400">.</span>
                      </span>
                    </span>
                  </div>
                </div>
              </Button>
              </div>
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