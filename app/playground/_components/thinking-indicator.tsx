"use client"

import { Brain } from "lucide-react"

type ThinkingIndicatorProps = {
  thinkingTime?: number
}

export function ThinkingIndicator({ thinkingTime }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 rounded-lg animate-scale-in">
      <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
      <div className="flex-1">
        <div className="text-sm font-semibold text-purple-800">AI is thinking</div>
        <div className="thinking-dots mt-1">
          <span className="bg-purple-600" />
          <span className="bg-purple-600" />
          <span className="bg-purple-600" />
        </div>
      </div>
      {thinkingTime !== undefined && (
        <div className="text-xs text-purple-600 font-mono">{(thinkingTime / 1000).toFixed(1)}s</div>
      )}
    </div>
  )
}
