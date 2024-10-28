"use client"

import { useState, useEffect, useRef } from 'react';
import { Novel, NovelFragment } from '../types/novel';
import { messagesPostToAi } from '@/app/utils/api';
import { Message } from '@/lib/types/message';
import { completeJson } from '@/app/utils/json';
import { useDailyWords } from '@/components/DailyWordsContext';
import { novelPromptTemplate } from '@/app/utils/promptTemplates';



export function useNovel() {
  const { updateDailyWord,dailyWords } = useDailyWords();
  const [votes, setVotes] = useState({ recommend: 0, neutral: 0, dislike: 0 });
  const [isReading, setIsReading] = useState(false);
  const [currentNovel, setCurrentNovel] = useState<Novel | null>(null);
  const [currentFragmentIndex, setCurrentFragmentIndex] = useState(-1);
  const [fragments, setFragments] = useState<NovelFragment[]>([]);
  const [currentWord, setCurrentWord] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingWord, setPendingWord] = useState<string | null>(null);

  const isLoadingRef = useRef(false);
  const processedWords = useRef(new Set<string>());

  const isInitialized = useRef(false);
  useEffect(() => {
    // 初始化小说数据
    if (!isInitialized.current) {
      const exampleNovel: Novel = {
      title: "24小时便利店",
      description: "一个关于便利店的故事",
      coverImage: "/hreo.webp?w=512",
      hero: "cici",
      summary: "Cici是一名大学生，在24小时便利店打夜班维持生活。一天深夜，劫匪刘哥的到来打破了便利店的宁静，展开了一段紧张、刺激、啼笑皆非的故事。",
      type: "悬疑",
      tags: ["悬疑", "便利店", "搞笑", "成长"],
      characters: [
        {
          name: "cici",
          details: "她性格坚韧，面对压力也能保持冷静。在便利店工作时，她一边专注于学业，一边处理形形色色的顾客。虽然外表甜美，但她有自己坚持的原则，面对不合理的要求时不会轻易妥协。",
          background: "Cici来自一个普通的工薪家庭，父母工作繁忙，生活并不富裕。她从小就习惯了自立自强，考上大学后，为了减轻家里的负担，Cici选择在24小时便利店兼职。她在学校学习成绩优异，但压力也随之而来。白天上课，晚上值夜班"
        },
        {
          name: "劫匪刘哥",
          details: "刘哥表面上看似狠厉，但实际上是个小人物。他曾经有过一段“光辉岁月”，但如今的生活让他越来越看不到希望。因为债主的逼债，房东的欠钱，使他走上了犯罪的道路，但他自己也清楚这不过是无奈之举。其实刘哥不是真正的坏人，他对兄弟义气深重，心软，尤其对傻春有一种保护欲。",
          background: "刘哥年轻时也有梦想，想要通过做生意发家致富，但几次生意失败后，他失去了生活方向。房东的债务让他彻底崩溃，从而走上了抢劫这条不归路。虽然表面上他是“劫匪”，但内心深处对命运的不满与无奈常常流露出来。"
        },
        {
          name: "房东",
          details: "房东是一个泼辣、霸道的寡妇，她不在乎别人怎么看她，喜欢掌控一切。她总是尖酸刻薄，特别是对刘哥这样欠债的人。她爱打麻将，烟不离手，是那种会为了赢一局麻将不惜大喊大叫的人。她对刘哥无情催债，却对自己的生活潇洒随意。",
          background: "房东年轻时过得艰难，丈夫早逝后她靠自己打拼出了一些家底。但她的性格因此变得强硬，从不轻易放过欠她钱的人。她的强硬和刘哥的窘境形成了直接对立。"
        },
        {
          name: "挑刺的顾客",
          details: "挑刺的顾客是一个有强迫症性格的人，凡事都要挑剔。在他看来，任何事情都有改进的空间，且不分场合地发表自己的不满。他说话刻薄，爱吹毛求疵，经常让便利店的工作人员疲于应付。在刘哥“假扮”营业员时，他的刁难更是让刘哥感到极度不爽。",
          background: "他是一个中年白领，生活不顺心的他将压力发泄到便利店的琐事上。他总觉得便利店服务不到位，喜欢纠结商品的价格标签、折扣信息和店内陈设，甚至对员工操作的细节也要指手画脚。"
        },
        {
          name: "傻春",
          details: "傻春是一个心地善良但智商略低的人，虽然身材强壮，但他很依赖刘哥，视刘哥为人生榜样。尽管如此，他在抢劫行动中总是闹出笑话，帮倒忙的同时也展现了他单纯的一面。傻春不懂得复杂的道理，但他对刘哥的忠诚从不动摇。",
          background: "傻春从小在农村长大，没什么文化，跟着刘哥一起混日子。他一直觉得刘哥是个有本事的人，所以只要刘哥说什么，他就跟着做什么。尽管如此，他的行为经常让刘哥哭笑不得。"
        }

      ],
      chapters: [
        {
          summary: "Cici如常整理货架，心中期待即将到来的下班时间。挑刺的顾客走进来，开始习惯性地对商品价格和排列提出抱怨。Cici耐心解释，可他的挑剔让她越来越烦躁。这时，刘哥和傻春也进来了，低着头，似乎有意隐藏身份。",
          conflict: "Cici察觉到刘哥和傻春的行为异常，心生警觉。与此同时，挑刺顾客开始对新来的人评头论足。刘哥和傻春的目光交错，似乎在商量什么",
          suspense: "刘哥突然从口袋里掏出一把匕首，站到了Cici面前，便利店内的气氛瞬间变得紧张起来。"
        },
        {
          summary: "刘哥举起匕首，沉声命令Cici把收银台里的钱交出来。便利店瞬间陷入了混乱。",
          conflict: "Cici开始思考如何应对眼前的状况，是否应该顺从劫匪的要求还是另谋脱身之策。与此同时，傻春笨拙地走向货架，试图“帮忙”寻找值钱的东西，却闹出笑话，把一整排零食弄得满地都是。",
          suspense: "就在Cici准备打开收银机时，门外传来房东的大嗓门，她拎着一袋零食正准备进店。"
        },
        {
          summary: "房东一进门，看到混乱的局面，立刻指着刘哥大骂：“你个废物，还敢抢我的钱？”她走近了Cici的收银台。",
          conflict: "房东对刘哥的态度显得轻蔑而无所畏惧，她丝毫不觉得自己面前的刘哥是个危险的劫匪，反而像是在训斥一个欠债不还的无赖。刘哥的手微微发抖，内心对房东的恐惧混杂着愤怒。傻春见状，慌乱中想帮刘哥，却不小心踢翻了垃圾桶，场面更加滑稽。",
          suspense: "房东命令刘哥把匕首放下，而刘哥开始犹豫。他内心的挣扎越来越明显，想要继续抢劫却又不敢对房东下手。这让Cici看出了刘哥并不是真的冷血无情。"
        },
        {
          summary: "突然，便利店的报警器响起，警报声刺耳，店内的每个人都被惊得愣住了。",
          conflict: "刘哥彻底慌了，开始责怪自己选择了这个便利店，也责怪傻春的不靠谱。",
          suspense: "警报声继续响个不停，刘哥内心的紧张情绪到达极点，他开始怀疑自己这次行动的可行性。"
        },
        {
          summary: "刘哥咬牙下定决心，要在警察到来之前解决问题。他冲向Cici，试图逼她交出最后一批现金。",
          conflict: "Cici目不转睛地盯着刘哥，保持冷静。就在刘哥准备动手的那一刻，门外传来了警车的刺耳刹车声。",
          suspense: "警察的脚步声越来越近，刘哥将匕首紧握在手中，眼神中闪过一丝疯狂的决绝。"
        },
        {
          summary: "房东突然走到刘哥面前，拍拍他的肩膀，冷笑道：“还不如自首，说不定还能少判几年。”",
          conflict: "刘哥几乎崩溃，房东的冷嘲热讽让他失去了最后的理智。傻春在一旁瑟瑟发抖，完全不知道该做什么。",
          suspense: "刘哥的理智和愤怒交织，他对着房东咆哮，但内心已经意识到自己没有胜算。"
        },
        {
          summary: "傻春看着刘哥投降，愣愣地说：“刘哥，咱们不是要发财吗？”场面一片寂静。",
          conflict: "傻春不明白为什么刘哥会放弃，一直在问“我们不是要抢钱吗？”但刘哥一句话也不说，默默低下了头。",
          suspense: "傻春无奈地看着刘哥，被警察带走。整个抢劫行动彻底失败，他心中充满了困惑与失落。"
        },
        {
          summary: "警察开始对便利店的人员进行询问，Cici是关键证人。",
          conflict: "挑刺的顾客继续抱怨店内服务不周，甚至还向警察建议便利店应该改善安全措施。所有人都对他的无理取闹感到无奈。",
          suspense: "Cici看着警察将刘哥带上警车，心中充满复杂的情感。"
        },
        {
          summary: "便利店恢复了平静，Cici看着门外的雨渐渐停下，心情却久久不能平静。",
          conflict: "她意识到，生活中的突发事件往往是无法避免的，而她必须学会面对。她不再只是那个单纯的收银员，而是一个见证并应对过危机的人。",
          suspense: "Cici看着远去的警车，内心渐渐平静，但也开始期待自己未来的生活是否会因为这次事件发生改变。"
        }
      ],
    };
      setCurrentNovel(exampleNovel);
      isInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    // 当 dailyWords 加载完成后，预加载第一个 fragment
    if (dailyWords.length > 0 && fragments.length === 0 && currentNovel) {
      preloadFirstFragment();
    }
  }, [dailyWords, currentNovel]);

  const handleVote = (type: 'recommend' | 'neutral' | 'dislike') => {
    setVotes(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };


  const preloadFirstFragment = async () => {
      await fetchNextFragment(dailyWords[0].english);
  };

  const startReading = async () => {
    setIsReading(true);
  };

  const handlePrevPage = () => {
    setCurrentFragmentIndex(prev => {
      if (prev === 0) {
        setIsReading(false);
        return 0;
      }
      return Math.max(0, prev - 1);
    });
  };

  useEffect(() => {
    if (pendingWord && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user' && lastMessage.parts[0].text.includes(pendingWord)) {
        callMessagesPostToAi(pendingWord);
        setPendingWord(null);
      }
    }
  }, [messages, pendingWord]);

  const fetchNextFragment = async (word: string) => {
    if (isLoadingRef.current) {
      return;
    }
    isLoadingRef.current = true;
    
    const currentChapter = currentNovel?.chapters[currentFragmentIndex === undefined ? 0 : currentFragmentIndex + 1];

    if (messages.length === 0) {
      const newMessage = {
      role: "user",
      parts: [{ text: `请编写一个以"${word}"为关键词,
        故事大纲:${currentChapter?.summary},
        故事冲突:${currentChapter?.conflict},
        悬念:${currentChapter?.suspense},
        小说章节` }]
      };
      setMessages([newMessage]);
    } else {
      const newMessage = {
        role: "user",
        parts: [{ text: `请继续承接上面的内容，编写一个以"${word}"
          故事大纲:${currentChapter?.summary},
          故事冲突:${currentChapter?.conflict},
          悬念:${currentChapter?.suspense},
          小说章节` }]
      };
      setMessages([...messages, newMessage]);
    }
    setPendingWord(word);
  };

  const callMessagesPostToAi = async (word: string) => {
    setCurrentFragmentIndex(prevIndex => prevIndex + 1);

    if (!currentNovel) {
      return;
    }

    await messagesPostToAi(messages, novelPromptTemplate(currentNovel), true, {
      onSuccess: (message) => {
        if (message.startsWith('{') && message.endsWith('}')) {
          const jsonData = JSON.parse(message);
          const { content, summary } = jsonData;
          setFragments(prevFragments => prevFragments.map(f => 
            f.englishWord === word ? { ...f, content, done: true, summary } : f
          ));
          updateDailyWord(dailyWords.find(w => w.english === word) ?? dailyWords[0], { showdNovel: true });
          setMessages(prevMessages => [...prevMessages, {
            role: "assistant",
            parts: [{ text: summary }]
          }]);
        }
        isLoadingRef.current = false;
      },
      onError: (error) => {
        console.error('发生错误:', error);
        isLoadingRef.current = false;
      },
      onProgress: (chunk) => {
        const jsonData = completeJson(chunk);
        if (!jsonData) {
          return;
        }
        const { title, content, summary } = jsonData;

        setFragments(prevFragments => {
          const existingFragmentIndex = prevFragments.findIndex(f => f.englishWord === word);
          if (existingFragmentIndex === -1) {
            return [...prevFragments, { title, content, englishWord: word, done: false, summary }];
          } else {
            return prevFragments.map((f, index) => 
              index === existingFragmentIndex ? { ...f, title, content, summary, done: false } : f
            );
          }
        });
      }
    });
  };

  const handleNextPage = async (word: string) => {
    if (currentFragmentIndex === fragments.length - 1) {
      await fetchNextFragment(word);
    } else {
      setCurrentFragmentIndex(prevIndex => prevIndex + 1);
    }
  };

  return {
    votes,
    isReading,
    currentNovel,
    currentFragmentIndex,
    dailyWords,
    fragments,
    handleVote,
    startReading,
    handleNextPage,
    handlePrevPage,
    setCurrentFragmentIndex,
    messages,
    fetchNextFragment,
    setCurrentWord
  };
}
