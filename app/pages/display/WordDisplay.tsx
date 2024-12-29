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
      opacity: 1
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

  const handleExport = () => {
    if (!currentWord) return;

    const params: ExportCardParams = {
      title: currentWord.originalWord.word + ' ' + currentWord.originalWord.type + '.' + currentWord.originalWord.meaning,
      subtitle: currentWord.associations.map(p => `${p.part}: ${p.partMeaning}`).join('\n'),
      content: currentWord.sentence,
      source: '单词助记'
    };
    exportCardWithParams(params);
  };

  if (!currentWord) {
    return <div>加载中...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa]">
      <NavBar
        title="单词联想"
        subtitle=""
        className="font-bubblegum"
      />

      <div className={cn(
        "relative w-full flex items-center justify-center",
        isMobile ? "px-2" : "px-4"
      )}>
        <button
          onClick={handleNextWord}
          className={cn(
            "absolute p-3 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors duration-200 z-10 hover:scale-110 transform",
            isMobile ? "left-2" : "left-4 lg:left-20"
          )}
          aria-label="上一个单词"
        >
          <IoIosArrowBack className={cn("text-gray-600", isMobile ? "text-xl" : "text-2xl")} />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                styles.word,
                isExpanded ? styles.expanded : isMobile ? 'text-4xl sm:text-5xl' : 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl',
                'ml-2 font-extrabold text-gray-800',
                !currentWord.associate ? 'cursor-not-allowed' : 'cursor-pointer',
                'font-comic hover:text-gold transition-colors duration-300'
              )}
              onClick={handleClick}
            >
              {currentWord.associations.map((part, index) => (
                <>
                  <div
                    key={index}
                    className={styles.partContainer}
                    style={getPartStyle(index)}
                  >
                    <div className={styles.partLetters} style={{ fontSize: isMobile ? '1rem' : '2rem' }}>
                      {part.part.split('').map((letter, letterIndex) => (
                        <span
                          key={letterIndex}
                          className={styles.letter}
                        >
                          {letter.replace('-', '')}
                        </span>
                      ))}
                    </div>
                    <span
                      className={styles.meaning}
                      style={{ transitionDelay: isExpanded ? '0.6s' : '0.6s' }}
                    >
                      {part.meaning}
                    </span>
                  </div>
                  {index < currentWord.associations.length - 1 && isExpanded && (
                    <span className={styles.letter}></span>
                  )}
                </>
              ))}
              <span className={cn(
                isExpanded ? styles.expanded : '',
                styles.wordMeaning,
                'font-comic',
                isMobile ? "text-sm" : "text-lg"
              )} >
                {currentWord.originalWord.type}. {currentWord.originalWord.meaning}
              </span>
            </div>

            <div className={cn(
              "flex items-center gap-6",
              isExpanded ? styles.expanded : '',
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
          </div>

          <div className={cn(
            styles.associationArea,
            isExpanded ? styles.expanded : '',
            'space-y-6 font-comic',
            isMobile ? 'w-full ' : 'max-w-[80%] p-6'
          )}>
            <div className="space-y-4">
              <div className={cn(styles.associationTitle, "flex items-center gap-2")}>
                <MdOutlineConnectWithoutContact className={cn("text-black-600", isMobile ? "text-xl" : "text-2xl")} />
                <span className={isMobile ? "text-base" : ""}>联想</span>
              </div>
              <div className={cn(
                styles.associationContent,
                "bg-white p-4 rounded-lg shadow-sm"
              )}>
                {currentWord.associations.map((item, index) => (
                  <span key={index} className={cn(
                    "block p-1 flex items-center gap-2",
                    isMobile ? "text-sm" : "text-lg"
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

            <div className="space-y-4">
              <div className={cn(styles.associationTitle, "flex items-center gap-2")}>
                <BiBookOpen className={cn("text-black-600", isMobile ? "text-xl" : "text-2xl")} />
                <span>联想句子</span>
              </div>
              <div className={cn(
                styles.sentence,
                styles.associationContent,
                "bg-white p-4 rounded-lg shadow-sm",
                isMobile ? "text-sm" : ""
              )}>
                {currentWord.sentence}
              </div>
            </div>

            <div className="space-y-4">
              <div className={cn(styles.associationTitle, "flex items-center gap-2")}>
                <BsPencilSquare className={cn("text-black-600", isMobile ? "text-xl" : "text-2xl")} />
                <span>你的理解</span>
              </div>
              <div className={cn(
                styles.inputContainer,
                isExpanded ? styles.expanded : '',
                isMobile ? "px-0" : ""
              )}>
                <div className="relative flex">
                  <textarea
                    value={userInput}
                    onChange={handleInputChange}
                    placeholder="请输入你对这个单词的理解..."
                    className={cn(
                      "w-full min-h-[100px] p-4 pr-12 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-black-500 focus:border-transparent bg-white shadow-sm",
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
                    <button onClick={handleCopy} className={cn(
                      "px-4 py-2 text-gray-600 bg-white/80 hover:bg-white/90 rounded-md shadow-sm transition-colors",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      复制文案
                    </button>
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
          </div>
        </div>

        <button
          onClick={handleNextWord}
          className={cn(
            "absolute p-3 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors duration-200 z-10 hover:scale-110 transform",
            isMobile ? "right-2" : "right-4 lg:right-20"
          )}
          aria-label="下一个单词"
        >
          <IoIosArrowForward className={cn("text-gray-600", isMobile ? "text-xl" : "text-2xl")} />
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
          className={cn(
           "absolute p-3 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors duration-200 z-10 hover:scale-110 transform",
            isMobile ? "right-2" : "right-4 lg:right-20"
          )}
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

        <div className={cn(
          "absolute bottom-4 left-1/2 transform -translate-x-1/2 font-comic",
          isExpanded ? "opacity-0" : "",
          isMobile ? "text-xs" : "text-sm",
          "text-gray-500"
        )}>
          {currentWordIndex + 1} / {wordAssociationDatas.length}
        </div>
      </div>

    </div>
  );
};

export default WordDisplay;

