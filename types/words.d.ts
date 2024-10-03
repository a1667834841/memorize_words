declare module '@/data/cet4-words.json' {
  const value: Array<{
    word: string;
    translations: Array<{
      translation: string;
      type: string;
    }>;
  }>
  export default value
}


// 添加新的类型声明
export interface Word {
  english: string;
  chinese: string;
  type: string;
  difficulty?: string;
  selected?: boolean; // 添加选中状态属性
  hitCount?: number; // 添加命中次数属性
}

export interface WordCache {
  date: string;
  words: Word[];
}