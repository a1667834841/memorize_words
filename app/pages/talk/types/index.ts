export interface Message {
  role: string
  parts: { text: string }[]
  requestTime?: number
  responseTime?: number
  audioRequestTime?: number
  audioResponseTime?: number
}

export interface Word {
  english: string
  chinese: string
  hitCount?: number
} 