export interface NovelFragment {
  title: string;
  content: string;
  englishWord: string;
  done: boolean; // 是否完成
  summary: string; // 章节总结
}

export interface Novel {
  title: string;
  description: string;
  coverImage: string;
  hero: string;
  summary: string;
  // 小说类型
  type: string;
  characters: Character[];
  chapters: NovelChapter[];
  tags: string[];
}

// 小说章节
export interface NovelChapter {
  summary: string;
  conflict: string;
  // 悬念
  suspense: string;
}

export interface Character {
  name: string;
  // 性格细节
  details: string;
  // 故事背景
  background: string;
}