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
  translations: Translation[];
  phrases: Phrase[];
  difficulty?: string;
  selected?: boolean; // 添加选中状态属性
  hitCount?: number; // 添加命中次数属性
  showdNovel?: boolean | false; // 添加是否在小说中显示
}

export interface Translation {
  chinese: string;
  type: string;
}

export interface Phrase {
  phrase: string;
  chinese: string;
}

export interface WordCache {
  date: string;
  words: Word[];
}

export interface Pagination {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  currentPage: number;
}
