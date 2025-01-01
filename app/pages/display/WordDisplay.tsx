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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-500">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <NavBar
        title="单词联想"
        subtitle=""
        className="font-bubblegum bg-white/80 backdrop-blur-sm shadow-sm"
      />

      <main className="flex-1 flex flex-col items-center px-4 py-8 gap-8">
        <section className="w-full max-w-4xl flex flex-col items-center gap-4">
          <div className={cn(
            styles.word,
            isExpanded ? styles.expanded : '',
            'grid',
            `grid-cols-${currentWord.associations.length}`,
            'w-full bg-white rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl',
            'border border-gray-100'
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
          isExpanded ? styles.expanded : 'hidden',
          'w-full max-w-4xl space-y-6 font-comic'
        )}>
          <div className="space-y-2 bg-white rounded-xl p-6 shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl">
            <div className={cn(
              "flex items-center gap-2",
              isMobile ? "gap-1 text-xl" : "text-2xl",
              "text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            )}>
              <MdOutlineConnectWithoutContact className={cn("text-blue-600")} />
              <span>联想</span>
            </div>
            <div className={cn(
              styles.associationContent,
              "bg-gray-50/50 p-6 rounded-lg shadow-sm"
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

          <div className="space-y-2 bg-white rounded-xl p-6 shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl">
            <div className={cn(
              "flex items-center gap-2",
              isMobile ? "gap-1 text-xl" : "text-2xl",
              "text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            )}>
              <BiBookOpen className={cn("text-blue-600")} />
              <span>联想句子</span>
            </div>
            <p className={cn(
              "text-gray-600 tracking-wide bg-gray-50/50 p-4 rounded-lg leading-loose letter-spacing-2",
              isMobile ? "text-sm" : "text-lg"
            )}>{currentWord.sentence}</p>
          </div>

          <div className="space-y-2 bg-white rounded-xl p-6 shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl">
            <div className={cn(
              "flex items-center gap-2",
              isMobile ? "gap-1 text-xl" : "text-2xl",
              "text-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            )}>
              <BsPencilSquare className={cn("text-blue-600")} />
              <span>你的理解</span>
            </div>
            <div className={cn(
              styles.inputContainer,
              isExpanded ? styles.expanded : '',
              isMobile ? "px-0" : ""
            )}>
              <div className="relative flex bg-white rounded-lg">
                <textarea
                  value={userInput}
                  onChange={handleInputChange}
                  placeholder="请输入你对这个单词的理解..."
                  className={cn(
                    "w-full min-h-[100px] p-4 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-black-500 focus:border-transparent bg-white",
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
                <div className={styles['button-container']}>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !userInput.trim()}
                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <BiSend className={cn(
                      isLoading ? 'animate-pulse' : '',
                      userInput.trim() ? 'text-blue-600' : 'text-blue-400',
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
                className="p-4 rounded-full bg-white shadow-lg hover:bg-blue-50 transition-all duration-300 hover:shadow-xl border border-gray-100 group"
              >
                <IoIosArrowBack className="text-2xl text-blue-600 group-hover:scale-110 transition-transform duration-300" />
              </button>
              <button
                onClick={handleNextWord}
                className="p-4 rounded-full bg-white shadow-lg hover:bg-blue-50 transition-all duration-300 hover:shadow-xl border border-gray-100 group"
              >
                <IoIosArrowForward className="text-2xl text-blue-600 group-hover:scale-110 transition-transform duration-300" />
              </button>
            </div>
          </div>
        )}

        {isMobile && (
          <>
            <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center gap-4 mb-4 z-[10] px-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-gray-100 p-2 flex items-center gap-4">
                <button
                  onClick={handlePrevWord}
                  className="p-3 rounded-full hover:bg-blue-50 transition-all duration-300 group"
                >
                  <IoIosArrowBack className="text-xl text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                </button>

                <div className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">
                  {currentWordIndex + 1} / {wordAssociationDatas.length}
                </div>

                <button
                  onClick={handleNextWord}
                  className="p-3 rounded-full hover:bg-blue-50 transition-all duration-300 group"
                >
                  <IoIosArrowForward className="text-xl text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                </button>
              </div>
            </div>

            <div className="fixed bottom-5 right-4 z-[10]">
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
                className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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
          </>
        )}
        {!isMobile && (
          <div className="fixed bottom-10 right-10 z-[10]">
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
              className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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

