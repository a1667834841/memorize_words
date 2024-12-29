"use client"

import { useChat } from './hooks/useChat'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis'
import { useWords } from './hooks/useWords'
import { ChatMessage } from './components/ChatMessage'
import { InputArea } from './components/InputArea'
import { WordList } from './components/WordList'
import { NavBar } from './components/NavBar'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { useEffect, useRef, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { isMobileDevice } from '@/hooks/use-media-query'

export default function TalkPage() {
    const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(isMobileDevice())
    const [showInput, setShowInput] = useState(false)
    const [copiedText, setCopiedText] = useState<string | null>(null)
    const [playingAudio, setPlayingAudio] = useState<string | null>(null)

    const chatContainerRef = useRef<HTMLDivElement>(null)

    const { words, setWords } = useWords()

    const {
        messages,
        input,
        setInput,
        isWaitingAiChat,
        addMessage,
        updateMessage,
        handleSend,
        clearMessages
    } = useChat(words, setWords)

    const {
        isListening,
        isRecording,
        startRecording,
        stopRecording
    } = useSpeechRecognition(addMessage, updateMessage, messages)

    const {
        textToSpeechEnabled,
        setTextToSpeechEnabled,
        tts,
        stopAudioPlayback
    } = useSpeechSynthesis(setPlayingAudio)

    useEffect(() => {
        if (!messages.some(message => message.parts[0].text === "你好呀！我是你的今天的英语老师！") && words.length > 0 && messages.length === 0) {
            addMessage("你好呀！我是你的今天的英语老师！今天咱们学了以下单词，有" + words.length + "个单词诶！那你想从哪个单词开始聊起呢？", 0, 'model')
        }
    }, [words])

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedText(text)
            setTimeout(() => setCopiedText(null), 1000)
        })
    }

    const handleRecordSwitch = () => {
        if (!isRecording) {
            startRecording()
        } else {
            stopRecording()
        }
    }

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [messages])

    useEffect(() => {
        return () => {
            stopRecording()
        }
    }, [])

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
                className={`bg-gray-100 hidden xs:block ${isLeftPanelCollapsed ? "xs:block" : ""}`}
            >
                <WordList
                    words={words}
                    isCollapsed={isLeftPanelCollapsed}
                />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={75}>
                <div className="flex flex-col">
                    <NavBar />

                    <div className="overflow-y-auto p-4 space-y-4 bg-gray-100">
                        <div className="flex flex-col justify-center items-left h-[70vh]">
                            <div ref={chatContainerRef} className="w-full h-full overflow-y-auto text-sm">
                                {messages.map((message, index) => (
                                    <ChatMessage
                                        key={index}
                                        message={message}
                                        index={index}
                                        onPlayAudio={tts}
                                        onCopy={handleCopy}
                                        copiedText={copiedText}
                                        playingAudio={playingAudio}
                                    />
                                ))}
                                {isWaitingAiChat && (
                                    <div className="flex justify-start mb-4">
                                        <div className="p-3 items-right rounded-lg bg-gray-200">
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
                                        ? 'bg-yellow-400 animate-[pulse_1s_ease-in-out]'
                                        : 'bg-gray-300'
                                    }`}
                                title={word.english}
                            />
                        ))}
                    </div>

                    <div className="flex justify-end items-center space-x-2 mx-4 mt-2">
                        <Switch
                            id="text-to-speech"
                            checked={textToSpeechEnabled}
                            onCheckedChange={(checked) => {
                                setTextToSpeechEnabled(checked)
                                if (!checked) {
                                    stopAudioPlayback()
                                }
                            }}
                        />
                        <label htmlFor="text-to-speech" className="ml-2 text-sm">
                            自动回复语音
                        </label>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearMessages}
                            className="ml-auto"
                        >
                            清除对话
                        </Button>
                    </div>

                    <InputArea
                        input={input}
                        showInput={showInput}
                        isRecording={isRecording}
                        onInputChange={setInput}
                        onSend={handleSend}
                        onToggleInput={() => setShowInput(!showInput)}
                        onRecordSwitch={handleRecordSwitch}
                        isListening={isListening}
                    />
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
} 