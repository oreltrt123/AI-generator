export type StreamEvent = {
  type: "thinking" | "reasoning" | "planning" | "file" | "complete" | "error"
  data?: any
}

export type MessageMetadata = {
  thinking?: string
  reasoning?: string
  planning?: string
  filesGenerated?: { path: string; content: string }[]
  thinkingTime?: number
  projectSnapshot?: any
}

export type EnhancedMessage = {
  role: "user" | "assistant"
  content: string
  metadata?: MessageMetadata
  timestamp?: number
  id?: string
}
