import { AudioButtonProps } from '../types'

export function AudioButton({ word, type, label }: AudioButtonProps) {
  const playAudio = () => {
    const audio = new Audio(`http://dict.youdao.com/dictvoice?type=${type}&audio=${encodeURIComponent(word)}`)
    audio.play()
  }

  return (
    <button 
      className="hover:text-gray-700 flex items-center"
      title={`${label}式发音`}
      onClick={(e) => {
        e.stopPropagation()
        playAudio()
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.414a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0" />
      </svg>
      <span className="ml-1 text-sm sm:text-base">{label}</span>
    </button>
  )
} 