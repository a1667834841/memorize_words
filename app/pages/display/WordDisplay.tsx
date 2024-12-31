'use client'

import React, { useEffect, useState } from 'react';
import styles from './WordDisplay.module.css';
import { MdOutlineConnectWithoutContact } from "react-icons/md";
import { BiBookOpen, BiSend } from "react-icons/bi";
import { BsPencilSquare } from "react-icons/bs";
import { useWords } from './hooks/words';
import { NavBar } from '@/components/NavBar';
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { AudioButton } from './components/AudioButton';
import { ExportCardParams, exportCardWithParams } from '@/app/pages/card/components/GradientConfigurableCard';
import { CardDownLoadButton } from '@/app/pages/card/components/CardDownLoader';
import gradients from '@/app/data/gradients.json'
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/app/hooks/useIsMobile';

const WordDisplay: React.FC = () => {
  const { wordAssociationDatas } = useWords();
  const [isExpanded, setIsExpanded] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const isMobile = useIsMobile();

  // 获取当前显示的单词数据
  let currentWord = wordAssociationDatas[currentWordIndex];

  useEffect(() => {
    if (!currentWord || currentWord.associate || !currentWord.originalWord.word) return;
    getWordAssociation(currentWord.originalWord.word, currentWordIndex);
    // 获取剩余的单词联想数据
    for (let i = currentWordIndex + 1; i < wordAssociationDatas.length; i++) {
      if (wordAssociationDatas[i].associate) continue;
      getWordAssociation(wordAssociationDatas[i].originalWord.word, i);
    }
  }, [currentWord]);

  const getWordAssociation = async (word: string, index: number) => {
    const association = await fetch(`/api/word-association?word=${word}`)
    const associationData = await association.json();
    const associationJson = JSON.parse(associationData.association);
    wordAssociationDatas[index].associations = associationJson.associations;
    wordAssociationDatas[index].sentence = associationJson.sentence;
    wordAssociationDatas[index].associate = true;
    currentWord = wordAssociationDatas[index];
  }

  const handleClick = async () => {
    setIsExpanded(!isExpanded);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

  };

  const handleCopy = () => {
    // 构造文案
    // 单词 今日单词：word
    // 联想 联想单词：associations
    // 句子 联想句子：sentence
    const content = `今日单词：${currentWord.originalWord.word} ${currentWord.originalWord.type}. ${currentWord.originalWord.meaning}\n\n联想单词：${currentWord.associations.map(p => `${p.part.replace('-', '')} ${p.partMeaning} → ${p.word} ${p.type} ${p.meaning}`).join('\n')}\n\n联想 句子：${currentWord.sentence}\n\n理解：${userInput}`;
    navigator.clipboard.writeText(content);
  }

  const getPartStyle = (index: number) => {
    if (!isExpanded) return {};
    const centerOffset = -((currentWord.associations.length - 1) * 2);
    const translateX = `${centerOffset + (index * 4)}em`;
    return {
      transform: `translateX(${translateX})`,
      opacity: 1,
    };
  };

  const handlePrevWord = () => {
    setCurrentWordIndex(prev =>
      prev > 0 ? prev - 1 : wordAssociationDatas.length - 1
    );
    setIsExpanded(false);
  };

  const handleNextWord = () => {
    setCurrentWordIndex(prev =>
      prev < wordAssociationDatas.length - 1 ? prev + 1 : 0
    );
    setIsExpanded(false);
  };


  if (!currentWord) {
    return <div>加载中...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <NavBar
        title="单词联想"
        subtitle=""
        className="font-bubblegum"
      />

      <main className="flex-1 flex flex-col items-center px-4 py-8 gap-8">
        <section className="w-full max-w-4xl flex flex-col items-center gap-4">
          <div className={cn(
            styles.word,
            isExpanded ? styles.expanded : '',
            'grid',
            `grid-cols-${currentWord.associations.length}`,
            'w-full'
          )}
            onClick={handleClick}>
            {currentWord.associations.map((part, index) => (
              <div
                key={index}
                className={styles.partContainer}
              >
                <div className={styles.partLetters}>
                  {part.part.split('').map((letter, letterIndex) => (
                    <span
                      key={letterIndex}
                      className={cn(
                        "inline-block",
                        isMobile ? "text-2xl" : "text-4xl",
                        "font-bold"
                      )}
                    >
                      {letter.replace('-', '')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {!isExpanded && (
              <div className={styles.wordMeaning}>
                {currentWord.originalWord.type}. {currentWord.originalWord.meaning}
              </div>
            )}
          </div>

          <div className={cn(
            "flex items-center gap-6",
            isExpanded ? 'hidden' : '',
            styles.audiobutton
          )}>
            <AudioButton
              word={currentWord.originalWord.word}
              type="uk"
              className="text-black-600 hover:text-black"
            />
            <AudioButton
              word={currentWord.originalWord.word}
              type="us"
              className="text-black-600 hover:text-black"
            />
          </div>
        </section>

        <section className={cn(
          styles.associationArea,
          isExpanded ? styles.expanded : '',
          'w-full max-w-4xl space-y-6 font-comic'
        )}>
          <div className="space-y-2 rounded-lg p-4 shadow-sm">
            <div className={cn(
              "flex items-center gap-2",
              isMobile ? "gap-1 text-xl" : "text-2xl"
            )}>
              <MdOutlineConnectWithoutContact className={cn("text-black-600")} />
              <span>联想</span>
            </div>
            <div className={cn(
              styles.associationContent,
              "bg-white p-4 rounded-lg shadow-sm"
            )}>
              {currentWord.associations.map((item, index) => (
                <span key={index} className={cn(
                  "block p-1 flex items-center gap-2 whitespace-nowrap", isMobile ? "text-sm" : "text-lg"
                )}>
                  <span className="font-medium">{item.part}</span>
                  <svg width="24" height="24" viewBox="0 0 24 24" className="text-gray-400">
                    <path fill="currentColor" d="M16.01 11H4v2h12.01v3L20 12l-3.99-4v3z" />
                  </svg>
                  <span className="font-semibold">{item.word}</span>
                  <span className="text-gray-500">({item.type})</span>
                  <span className="text-gray-600 ml-1">{item.meaning}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2  rounded-lg p-4 shadow-sm">
            <div className={cn(
              "flex items-center gap-2",
              isMobile ? "gap-1 text-xl" : "text-2xl"
            )}>
              <BiBookOpen className={cn("text-black-600")} />
              <span>联想句子</span>
            </div>
            <p className={cn(
              "text-gray-600 tracking-wide bg-white p-4 rounded-lg leading-loose",
              isMobile ? "text-sm" : "text-lg"
            )}>{currentWord.sentence}</p>
          </div>

          <div className="space-y-2  rounded-lg p-4 shadow-sm">
            <div className={cn(
              "flex items-center gap-2",
              isMobile ? "gap-1 text-xl" : "text-2xl"
            )}>
              <BsPencilSquare className={cn("text-black-600")} />
              <span>你的理解</span>
            </div>
            <div className={cn(
              styles.inputContainer,
              isExpanded ? styles.expanded : '',
              isMobile ? "px-0" : ""
            )}>
              <div className="relative flex bg-white rounded-lg mb-4">
                <textarea
                  value={userInput}
                  onChange={handleInputChange}
                  placeholder="请输入你对这个单词的理解..."
                  className={cn(
                    "w-full min-h-[100px] p-4 pr-12  rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-black-500 focus:border-transparent bg-white ",
                    isMobile ? "text-sm" : ""
                  )}
                  style={{
                    height: 'auto',
                    overflow: 'hidden'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
                <div className="absolute right-2 bottom-1 flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !userInput.trim()}
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <BiSend className={cn(
                      isLoading ? 'animate-pulse' : '',
                      userInput.trim() ? 'text-black-600' : 'text-gray-400',
                      isMobile ? "text-xl" : "text-2xl"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {!isMobile && (
          <div className="fixed inset-x-0 top-1/2 -translate-y-1/2 px-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <button
                onClick={handlePrevWord}
                className="p-3 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
              >
                <IoIosArrowBack className="text-2xl text-gray-600" />
              </button>
              <button
                onClick={handleNextWord}
                className="p-3 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
              >
                <IoIosArrowForward className="text-2xl text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {isMobile && (
          <div className=" bottom-0 left-0 right-0  px-2 py-2 flex items-center justify-end gap-2 z-50 text-sm">
            <button
              onClick={handlePrevWord}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <IoIosArrowBack className="text-xl text-gray-600" />
            </button>

            <div className="text-xs text-gray-500">
              {currentWordIndex + 1} / {wordAssociationDatas.length}
            </div>

            <button
              onClick={handleNextWord}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <IoIosArrowForward className="text-xl text-gray-600" />
            </button>
            <CardDownLoadButton
              params={{
                title: currentWord.originalWord.word,
                subtitle: currentWord.originalWord.type + '.' + currentWord.originalWord.meaning,
                guidelines: currentWord.associations.map(p =>
                  `${p.part.replace('-', '')} ${p.partMeaning} → ${p.word} ${p.type} ${p.meaning}`
                ),
                content: currentWord.sentence,
                source: '我要记单词'
              }}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              batchParams={{
                words: wordAssociationDatas.map(p => ({
                  title: p.originalWord.word,
                  subtitle: p.originalWord.type + '.' + p.originalWord.meaning,
                  guidelines: p.associations.map(p =>
                    `${p.part.replace('-', '')} ${p.partMeaning} → ${p.word} ${p.type} ${p.meaning}`
                  ),
                  content: p.sentence,
                  source: '我要记单词'
                }))
              }}
            />

          </div>
          
         )} 
         {!isMobile && (
         <div className="fixed bottom-10 right-10">
          <CardDownLoadButton
                params={{
                  title: currentWord.originalWord.word,
                  subtitle: currentWord.originalWord.type + '.' + currentWord.originalWord.meaning,
                  guidelines: currentWord.associations.map(p =>
                    `${p.part.replace('-', '')} ${p.partMeaning} → ${p.word} ${p.type} ${p.meaning}`
                  ),
                  content: currentWord.sentence,
                  source: '我要记单词'
                }}
                className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-50"
                batchParams={{
                  words: wordAssociationDatas.map(p => ({
                    title: p.originalWord.word,
                    subtitle: p.originalWord.type + '.' + p.originalWord.meaning,
                    guidelines: p.associations.map(p =>
                      `${p.part.replace('-', '')} ${p.partMeaning} → ${p.word} ${p.type} ${p.meaning}`
                    ),
                    content: p.sentence,
                    source: '我要记单词'
                  }))
                }}
            />
         </div>
         )}
         
      </main>
    </div>
  );
};

export default WordDisplay;

