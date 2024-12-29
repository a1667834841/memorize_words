import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Keyboard, Phone } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'

interface InputAreaProps {
  input: string
  showInput: boolean
  isRecording: boolean
  isListening: boolean
  onInputChange: Dispatch<SetStateAction<string>>
  onSend: () => void
  onToggleInput: () => void
  onRecordSwitch: () => void
}

export function InputArea({
  input,
  showInput,
  isRecording,
  isListening,
  onInputChange,
  onSend,
  onToggleInput,
  onRecordSwitch
}: InputAreaProps) {
  return (
    <div className="p-2">
      <div className="flex items-center space-x-2 relative">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleInput}
          className={`z-10 ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isRecording}
        >
          {showInput ? <Phone className="w-5 h-5" /> : <Keyboard className="w-5 h-5" />}
        </Button>

        <div className="flex-grow">
          <div className={`flex transition-all duration-300 ease-in-out ${
            showInput ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none transition-opacity duration-500'
          }`}>
            <Input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="输入消息..."
              onKeyPress={(e) => e.key === 'Enter' && onSend()}
              className="flex-grow px-3 py-2 rounded-md bg-gray-200"
            />
            {input && (
              <Button onClick={onSend} className="ml-2">
                <Send className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        <div className={`absolute inset-y-0 left-10 right-0 transition-all duration-300 ease-in-out ${
          showInput ? 'translate-x-full' : 'translate-x-0'
        }`}>
          <Button
            variant={isListening ? "destructive" : "default"}
            className={`w-full h-full transition-all duration-300 ease-in-out text-white
              ${showInput ? 'opacity-0 pointer-events-none' : 'opacity-100'}
              ${isRecording ? 'shadow-inner transform scale-95 bg-red-500' : 'shadow-md'}
            `}
            onClick={onRecordSwitch}
          >
            <div className="relative w-full h-full overflow-hidden">
              <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${
                isRecording ? 'translate-y-full' : ''
              }`}>
                按住说话 
              </div>
              <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${
                isRecording ? '' : '-translate-y-full'
              }`}>
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
  )
} 