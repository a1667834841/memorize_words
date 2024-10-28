import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { MoreVertical, ChevronLeft } from 'lucide-react';
import { useSpring, animated } from 'react-spring';
import { NovelFragment } from '../types/novel';
import { Word } from '@/lib/types/words';
import { useDailyWords } from '@/components/DailyWordsContext';

interface NovelContentPageProps {
  currentFragment: NovelFragment;
  handleNextPage: (word: string) => void;
  handlePrevPage: () => void;
  toggleSettings: () => void;
  showSettings: boolean;
  bindSettings: any;
  bindContent: any;
  x: any;
  y: any;
  isFirstPage: boolean;
  isLastPage: boolean;
  dailyWords: Word[];
}

export const NovelContentPage: React.FC<NovelContentPageProps> = ({
  currentFragment,
  handleNextPage,
  handlePrevPage,
  toggleSettings,
  showSettings,
  bindSettings,
  bindContent,
  x,
  y,
  isFirstPage,
  isLastPage
}) => {
  const settingsAnimation = useSpring({
    transform: showSettings ? 'translateY(0%)' : 'translateY(100%)',
    opacity: showSettings ? 1 : 0,
  });

  const { dailyWords, updateDailyWord } = useDailyWords();

  const [showTags, setShowTags] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = contentElement;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setShowTags(true);
      } else {
        setShowTags(false);
      }
    };

    contentElement.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => contentElement.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTagClick = (tag: Word) => {
    updateDailyWord(tag, { showdNovel: true });
    handleNextPage(tag.english);
  };

  if (!currentFragment) {
    return (
      <div className="relative w-full h-screen bg-gray-100 text-gray-800 flex-shrink-0 overflow-hidden flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mb-4"></div>
          <p className="text-lg text-blue-500">正在加载精彩内容，请稍候...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-100 text-gray-800 flex-shrink-0 overflow-hidden">
      <div className="flex items-center justify-between p-2 shadow-md">
        <Button variant="ghost" onClick={handlePrevPage}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
  
        <Button variant="ghost" size="icon" onClick={toggleSettings}>
          <MoreVertical className="h-6 w-6" />
        </Button>
      </div>

      <animated.div
        style={{ x, touchAction: 'pan-y' }} // 确保允许垂直滚动
        className="h-full w-full overflow-y-auto"
      >
        <div 
          ref={contentRef}
          className="max-w-2xl mx-auto rounded-lg shadow-md p-8"
        >
          <span className="text-5xl font-mono font-bold block mb-4">{currentFragment.englishWord}
            <span className="text-sm text-gray-500 ml-4 block mt-2">| {currentFragment.title}</span>
          </span>
  
          <p className="text-lg leading-relaxed">
            {currentFragment.content && currentFragment.content.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </p>
          
          {currentFragment.done && (
            <div className="mt-8 font-mono mb-8">
              <hr className="border-t-2 border-gray-300 my-4" />
              <p className="text-sm text-gray-500 mb-2 text-xs">请从下方三个单词中，选择其中一个单词<br/>ai将生成对应单词内容的章节，影响故事走向</p>
              <div className="mt-4 flex flex-col items-center">
                <div className="flex justify-around w-full">
                  {dailyWords.filter(tag => !tag.showdNovel).slice(0, 3).map((tag, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <button className="px-3 py-1 bg-gray-200 text-gray-700 text-sm hover:bg-gray-300 transition-colors duration-200 shadow-md"
                        onClick={() => handleTagClick(tag)}
                      >
                        {tag.english} 
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </animated.div>

      <animated.div
        style={settingsAnimation}
        className="absolute bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-xl h-1/2 w-full z-50"
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="w-16 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-4">设置</h3>
          <p>这里是设置选项的占位符。您可以添加字体大小、背景颜色等设置。</p>
        </div>
      </animated.div>

      <animated.div
        style={{
          opacity: settingsAnimation.opacity,
          pointerEvents: showSettings ? 'auto' : 'none',
        }}
        className="absolute inset-0 bg-black bg-opacity-50 z-40"
        onClick={toggleSettings}
      />
    </div>
  );
};
