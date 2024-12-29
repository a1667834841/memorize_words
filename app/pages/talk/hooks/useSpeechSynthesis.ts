import { useState } from 'react'
import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk'
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk'

let globalSpeechSynthesizer: speechsdk.SpeechSynthesizer | null = null
let player: speechsdk.SpeakerAudioDestination | null = null
let tokenExpirationTime: number = 0

export function useSpeechSynthesis(setPlayingAudio: (audio: string | null) => void) {
  const [audioCache, setAudioCache] = useState<{[key: string]: string}>({})
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(true)

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

  const initializeSpeechSynthesizer = (token: string, region: string): speechsdk.SpeechSynthesizer => {
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(token, region)
    player = new speechsdk.SpeakerAudioDestination()
    speechConfig.speechSynthesisVoiceName = 'zh-CN-XiaochenMultilingualNeural'
    const audioConfig = speechsdk.AudioConfig.fromSpeakerOutput(player)
    return new speechsdk.SpeechSynthesizer(speechConfig, audioConfig)
  }

  const refreshTokenIfNeeded = async () => {
    const currentTime = Date.now()
    if (currentTime >= tokenExpirationTime) {
      const speechToken = await getSpeechToken()
      if (speechToken?.token && speechToken?.region) {
        if (globalSpeechSynthesizer) {
          globalSpeechSynthesizer.authorizationToken = speechToken.token
        }
        tokenExpirationTime = currentTime + 9 * 60 * 1000
        return { token: speechToken.token, region: speechToken.region }
      }
      throw new Error('无法获取新的语音令牌')
    }
    return null
  }

  const tts = async (message: string, messageIndex: number) => {
    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2700-\u27BF]/g
    const realMessage = message.replace(emojiRegex, '')

    if (audioCache[realMessage]) {
      setPlayingAudio(realMessage)
      const audio = new Audio(audioCache[realMessage])
      audio.play()
      audio.onended = () => setPlayingAudio(null)
      return
    }

    if (!textToSpeechEnabled) return

    try {
      const refreshedToken = await refreshTokenIfNeeded()
      if (refreshedToken) {
        if (globalSpeechSynthesizer) {
          globalSpeechSynthesizer.close()
        }
        globalSpeechSynthesizer = initializeSpeechSynthesizer(refreshedToken.token, refreshedToken.region)
      } else if (!globalSpeechSynthesizer) {
        const speechToken = await getSpeechToken()
        if (speechToken?.token && speechToken?.region) {
          globalSpeechSynthesizer = initializeSpeechSynthesizer(speechToken.token, speechToken.region)
          tokenExpirationTime = Date.now() + 9 * 60 * 1000
        } else {
          throw new Error('无法获取语音令牌')
        }
      }

      setPlayingAudio(realMessage)
      globalSpeechSynthesizer.speakTextAsync(
        realMessage,
        result => {
          if (result) {
            if (result.reason === ResultReason.SynthesizingAudioCompleted) {
              setAudioCache(prev => {
                const newCache = { 
                  [realMessage]: URL.createObjectURL(
                    new Blob([result.audioData], { type: 'audio/mpeg' })
                  ), 
                  ...prev 
                }
                const cacheEntries = Object.entries(newCache)
                if (cacheEntries.length > 10) {
                  const [oldestKey] = cacheEntries[10]
                  const { [oldestKey]: _, ...rest } = newCache
                  return rest
                }
                return newCache
              })
            }
            globalSpeechSynthesizer?.close()
            globalSpeechSynthesizer = null
            setPlayingAudio(null)
          }
        },
        error => {
          console.error(error)
          globalSpeechSynthesizer?.close()
          globalSpeechSynthesizer = null
          setPlayingAudio(null)
        }
      )
    } catch (error) {
      console.error('TTS error:', error)
      setPlayingAudio(null)
    }
  }

  const stopAudioPlayback = () => {
    if (player) {
      player.pause()
    }
    setPlayingAudio(null)
  }

  return {
    audioCache,
    textToSpeechEnabled,
    setTextToSpeechEnabled,
    tts,
    stopAudioPlayback
  }
} 