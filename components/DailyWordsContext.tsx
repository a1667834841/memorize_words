import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Word } from '@/lib/types/words';


interface DailyWordsContextType {
  dailyWords: Word[];
  updateDailyWord: (word: Word, updates: Partial<Word>) => void;
}

const DailyWordsContext = createContext<DailyWordsContextType | undefined>(undefined);

export const useDailyWords = () => {
  const context = useContext(DailyWordsContext);
  if (context === undefined) {
    throw new Error('useDailyWords must be used within a DailyWordsProvider');
  }
  return context;
};

export const DailyWordsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dailyWords, setDailyWords] = useState<Word[]>([]);
  const fetchedRef = useRef(false);

  const updateDailyWord = (word: Word, updates: Partial<Word>) => {
    setDailyWords(prevWords =>
      prevWords.map(w => w.english === word.english ? { ...w, ...updates } : w)
    );
  };

  useEffect(() => {
    const fetchDailyWords = async () => {
      if (fetchedRef.current) return; // 如果已经获取过数据，直接返回
      fetchedRef.current = true; // 标记已经开始获取数据

      try {
        const response = await fetch('/api/daily-words');
        const data: Word[] = await response.json();
        setDailyWords(data);
      } catch (error) {
        console.error('获取每日单词失败:', error);
        fetchedRef.current = false; // 如果获取失败，重置标记以允许重试
      }
    };

    fetchDailyWords();
  }, []);

  return (
    <DailyWordsContext.Provider value={{ dailyWords, updateDailyWord }}>
      {children}
    </DailyWordsContext.Provider>
  );
};
