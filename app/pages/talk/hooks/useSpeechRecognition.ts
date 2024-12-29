import { useState, useRef, useEffect } from 'react'
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk'
import { Message } from '@/lib/types/message'

let globalRecognizer: speechsdk.SpeechRecognizer | null = null
let tokenExpirationTime: number = 0

export function useSpeechRecognition(
  addMessage: (text: string, requestTime: number, role: string) => number,
  updateMessage:  (index: number, text: string, requestTime: number) => void,
  messages: Message[]
) {
  const [isListening, setIsListening] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [startrecognizing,setStartrecognizing] = useState(false)
  const [firstAddMes,setFirstAddMes] = useState(false)
  const isMounted = useRef(true)

  const startRecognizingRef = useRef(false);
  const firstAddMesRef = useRef(false)

  useEffect(() => {
    startRecognizingRef.current = startrecognizing;
  }, [startrecognizing]);
  useEffect(() => {
    firstAddMesRef.current = firstAddMes
  },[firstAddMes])

  const getSpeechToken = async () => {
    try {
      const response = await fetch(`/api/speech-token?timestamp=${new Date().getTime()}`, {
        next: { revalidate: 600 },
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      if (response.ok) {
        return await response.json()
      }
      console.error('获取语音令牌失败')
      return null
    } catch (error) {
      console.error('获取语音令牌时出错:', error)
      return null
    }
  }

  const initializeRecognizer = (token: string, region: string): speechsdk.SpeechRecognizer => {
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(token, region)
    speechConfig.speechRecognitionLanguage = 'zh-CN'
    const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput()
    return new speechsdk.SpeechRecognizer(speechConfig, audioConfig)
  }

  const refreshTokenIfNeeded = async () => {
    const currentTime = Date.now()
    if (currentTime >= tokenExpirationTime) {
      const speechToken = await getSpeechToken()
      if (speechToken?.token && speechToken?.region) {
        if (globalRecognizer) {
          globalRecognizer.authorizationToken = speechToken.token
        }
        tokenExpirationTime = currentTime + 9 * 60 * 1000
        return { token: speechToken.token, region: speechToken.region }
      }
      throw new Error('无法获取新的语音令牌')
    }
    return null
  }

  const setupRecognizerCallbacks = () => {


    if (!globalRecognizer) return

    globalRecognizer.sessionStarted = () => {
      console.log('sessionStarted')
      setStartrecognizing(true)
    }

    globalRecognizer.recognizing = async (s, e) => {
        
      // 使用 ref 来检查状态
      if (!firstAddMesRef.current) {
        await addMessage(e.result.text, 0, 'user')
        setFirstAddMes(true)
      } 
      if (firstAddMesRef.current) {
        await updateMessage(messages.length-1, e.result.text, 0)
      }


    }

    globalRecognizer.recognized = async (s, e) => {
      if (!isMounted.current || !e.result.text || !e.result.text.trim()) return
      // 结束识别，则开始识别结束
      setStartrecognizing(false)
      setFirstAddMes(false)
    //   await addMessage(e.result.text, 0, 'user')
    }

    globalRecognizer.canceled = (s, e) => {
      if (!isMounted.current) return
      console.log(`Canceled, reason=${e.reason}`)
      if (e.reason === speechsdk.CancellationReason.Error) {
        console.error(`Error: ${e.errorDetails}`)
      }
      setIsListening(false)
      setIsRecording(false)
    }

    globalRecognizer.sessionStopped = (s, e) => {
      if (!isMounted.current) return
      console.log('Session stopped')
      setIsListening(false)
      setIsRecording(false)
      globalRecognizer?.stopContinuousRecognitionAsync()
    }
  }

  const startRecording = async () => {
    setIsTransitioning(true)
    setIsRecording(true)
    setIsListening(true)

    try {
      const refreshedToken = await refreshTokenIfNeeded()
      if (refreshedToken) {
        if (globalRecognizer) {
          globalRecognizer.close()
        }
        globalRecognizer = initializeRecognizer(refreshedToken.token, refreshedToken.region)
      } else if (!globalRecognizer) {
        const speechToken = await getSpeechToken()
        if (speechToken?.token && speechToken?.region) {
          globalRecognizer = initializeRecognizer(speechToken.token, speechToken.region)
          tokenExpirationTime = Date.now() + 9 * 60 * 1000
        } else {
          throw new Error('无法获取语音令牌')
        }
      }

      setupRecognizerCallbacks()
      await globalRecognizer.startContinuousRecognitionAsync()
    } catch (error) {
      console.error('启动语音识别时出错:', error)
      setIsListening(false)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (globalRecognizer) {
      globalRecognizer.stopContinuousRecognitionAsync()
      setIsRecording(false)
      setIsListening(false)
    }
  }

  return {
    isListening,
    isRecording,
    isTransitioning,
    startRecording,
    stopRecording
  }
} 