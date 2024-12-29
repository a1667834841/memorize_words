import { IoVolumeHighOutline } from "react-icons/io5";

interface AudioButtonProps {
  word: string
  type: 'uk' | 'us'
  className?: string
}

export function AudioButton({ word, type, className = '' }: AudioButtonProps) {
  const playAudio = async () => {
    try {
      const audio = new Audio(`https://dict.youdao.com/dictvoice?audio=${word}&type=${type === 'uk' ? 1 : 2}`);
      await audio.play();
    } catch (error) {
      console.error('播放音频失败:', error);
    }
  };

  return (
    <button
      onClick={playAudio}
      className={`inline-flex items-center gap-1 px-2 py-1 text-sm rounded-md hover:bg-gray-100 transition-colors ${className}`}
    >
      <IoVolumeHighOutline className="text-lg" />
      <span>{type === 'uk' ? '英' : '美'}</span>
    </button>
  );
} 