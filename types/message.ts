export type MessageMetadata = {
  messageId: string
  codeSnapshot?: string // JSON string of ProjectFile[]
  reasoning?: string
  filesGenerated?: string[]
  thinkingTime?: number
  timestamp: number
}

export type EnhancedMessage = {
  role: "user" | "assistant"
  content: string
  metadata?: MessageMetadata
}

export type StreamChunk = {
  type: "thinking" | "reasoning" | "file" | "content" | "complete"
  data: any
}
