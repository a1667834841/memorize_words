export interface Message {
    role: string; // 角色 user 或 assistant
    parts: Part[];
    requestTime?: number;
    responseTime?: number;
    audioRequestTime?: number;
    audioResponseTime?: number;
    show?: boolean; // 是否展示
  }
 export interface Part {
    text: string;
    words?: string[];
  }