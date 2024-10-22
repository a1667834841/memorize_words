"use client"

import React, { useState, useEffect } from 'react';
import { useSpring } from 'react-spring';
import { useDrag } from '@use-gesture/react';
import { NovelIndexPage } from './components/NovelIndexPage';
import { NovelContentPage } from './components/NovelContentPage';
import { useNovel } from './hooks/useNovel';
import { DailyWordsProvider } from '@/components/DailyWordsContext';

function StoryPageContent() {
  const {
    votes,
    isReading,
    currentNovel,
    currentFragmentIndex,
    fragments,
    handleVote,
    startReading,
    handleNextPage,
    handlePrevPage,
    dailyWords,
    setCurrentFragmentIndex,
  } = useNovel();

  const [showSettings, setShowSettings] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
    }
  }, []);

  const toggleSettings = () => {
    setShowSettings(prev => !prev);
  };

  // 设置面板的动画
  const [{ y }, settingsApi] = useSpring(() => ({ y: 100 }));

  // 拖拽手势（设置面板）
  const bindSettings = useDrag(({ down, movement: [, my] }) => {
    settingsApi.start({ y: down ? my : 0, immediate: down });
    if (!down && my > 50) {
      setShowSettings(false);
    }
  }, {
    from: () => [0, y.get()],
    filterTaps: true,
    bounds: { top: 0 },
    rubberband: true
  });

  // 小说内容的动画
  const [{ x }, contentApi] = useSpring(() => ({ x: 0 }));

  // 拖拽手势（小说内容）
  const bindContent = useDrag(({ down, movement: [mx], direction: [dx], velocity: [vx] }) => {
    if (down) {
      contentApi.start({ x: mx, immediate: true });
    } else {
      const threshold = windowWidth / 4;
      if (Math.abs(mx) > threshold || Math.abs(vx) > 1) {
        if (dx > 0 && currentFragmentIndex > 0) {
          setCurrentFragmentIndex(prev => prev - 1);
        } else if (dx < 0 && fragments.length > currentFragmentIndex + 1) {
          setCurrentFragmentIndex(prev => prev + 1);
        }
      }
      contentApi.start({ x: 0, immediate: false });
    }
  }, {
    axis: 'x',
    bounds: { left: -windowWidth, right: windowWidth },
    rubberband: true
  });

  return (
    <div className="h-screen overflow-hidden">
      {!isReading ? (
        <NovelIndexPage
          currentNovel={currentNovel}
          votes={votes}
          handleVote={handleVote}
          startReading={startReading}
        />
      ) : (
        fragments.length > 0 && (
          <NovelContentPage
            currentFragment={fragments[currentFragmentIndex]}
            handleNextPage={handleNextPage}
            handlePrevPage={handlePrevPage}
            toggleSettings={toggleSettings}
            showSettings={showSettings}
            bindContent={bindContent}
            bindSettings={bindSettings}
            x={x}
            y={y}
            isFirstPage={currentFragmentIndex === 0}
            isLastPage={currentFragmentIndex === fragments.length - 1}
            dailyWords={dailyWords}
          />
        )
      )}
    </div>
  );
}

export default function StoryPage() {
  return (
    <DailyWordsProvider>
      <StoryPageContent />
    </DailyWordsProvider>
  );
}
