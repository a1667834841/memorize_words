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
}