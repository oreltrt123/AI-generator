"use client"

import { Loader2, Sparkles, FileCode, Brain, CheckCircle2 } from "lucide-react"

type StreamingIndicatorProps = {
  stage: "thinking" | "reasoning" | "generating" | "complete"
  currentFile?: string
  filesCount?: number
}

export function StreamingIndicator({ stage, currentFile, filesCount }: StreamingIndicatorProps) {
  return (
    <div className="animate-slide-in-bottom">
      {stage === "thinking" && (
        <div className="flex items-center gap-3 p-3 bg-white text-black rounded-lg animate-glow">
          <Brain className="w-4 h-4 text-black animate-pulse" />
          <span className="text-sm text-black font-medium">AI is thinking</span>
          {/* <div className="thinking-dots ml-auto">
            <span className="bg-black" />
            <span className="bg-black" />
            <span className="bg-black" />
          </div> */}
        </div>
      )}

      {stage === "reasoning" && (
        <div className="flex items-center gap-3 p-3 bg-white text-black rounded-lg animate-glow">
          <Sparkles className="w-4 h-4 text-black animate-bounce" />
          <span className="text-sm text-black font-medium">Planning the project</span>
          {/* <Loader2 className="w-4 h-4 text-blue-600 animate-spin ml-auto" /> */}
        </div>
      )}

      {stage === "generating" && (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <FileCode className="w-4 h-4 text-green-600" />
          <div className="flex-1">
            <div className="text-sm text-green-700 font-medium">
              Generating files {filesCount ? `(${filesCount})` : ""}
            </div>
            {currentFile && (
              <div className="text-xs text-gray-600 font-mono mt-0.5 truncate max-w-xs">{currentFile}</div>
            )}
          </div>
          <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
        </div>
      )}

      {stage === "complete" && (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 rounded-lg animate-scale-in">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700 font-semibold">Generation complete!</span>
        </div>
      )}
    </div>
  )
}
