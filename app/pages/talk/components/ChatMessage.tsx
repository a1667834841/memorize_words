import { Volume2, Copy, Check } from 'lucide-react'
import { Message } from '../types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ChatMessageProps {
  message: Message
  index: number
  onPlayAudio: (text: string, index: number) => void
  onCopy: (text: string) => void
  copiedText: string | null
  playingAudio: string | null
}

export function ChatMessage({
  message,
  index,
  onPlayAudio,
  onCopy,
  copiedText,
  playingAudio
}: ChatMessageProps) {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="flex flex-col">
        <div className={`p-3 rounded-lg ${
          message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
        }`}>
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
                      onClick={() => onPlayAudio(message.parts[0].text, index)}
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
                    <button onClick={() => onCopy(message.parts[0].text)}>
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
  )
} 