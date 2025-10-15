"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Folder, FileCode, Brain, CheckCircle2 } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { EnhancedMessage } from "@/types/message"

type MessageBubbleProps = {
  message: EnhancedMessage
  userImage?: string
  userName?: string
  onVersionClick?: (messageId: string) => void
}

export function MessageBubble({ message, userImage, userName, onVersionClick }: MessageBubbleProps) {
  const [showReasoning, setShowReasoning] = useState(false)
  const [showFiles, setShowFiles] = useState(false)
  const isUser = message.role === "user"
  const hasCodeSnapshot = message.metadata?.codeSnapshot

  return (
    <div>
      {/* Main Message Content */}
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-2`}>
        <div
          className={`p-3 rounded-lg max-w-[80%] text-[13px] ${
            isUser ? "bg-gray-300 text-accent-foreground" : "text-gray-900"
          }`}
        >
          {message.content}
        </div>
        {isUser && userImage && (
          <img
            src={userImage || "/placeholder.svg"}
            alt={userName || "User"}
            className="w-7 h-7 rounded-full"
          />
        )}
      </div>

      {/* AI Metadata Sections */}
      {!isUser && message.metadata && (
        <div className="ml-3">
          {/* Reasoning Section */}
          {message.metadata.reasoning && (
            <Collapsible open={showReasoning} onOpenChange={setShowReasoning}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs flex items-center gap-1 hover:bg-white hover:cursor-pointer w-full justify-start pl-3 group"
                >
                  {showReasoning ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <>
                      <Brain className="w-3 h-3 group-hover:hidden transition-opacity duration-200" />
                      <ChevronRight className="w-3 h-3 hidden group-hover:block transition-opacity duration-200" />
                    </>
                  )}
                  <span>Thought for {(message.metadata.thinkingTime / 1000).toFixed(1)}s</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 relative">
                <div
                  className="overflow-y-auto rounded-lg text-xs text-gray-700 whitespace-pre-wrap relative"
                  style={{
                    height: "200px",
                    background: "transparent",
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-4 pointer-events-none"
                    style={{
                      background: "linear-gradient(to bottom, rgba(255,255,255,0.7), rgba(255,255,255,0))",
                    }}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none"
                    style={{
                      background: "linear-gradient(to top, rgba(255,255,255,0.7), rgba(255,255,255,0))",
                    }}
                  />
                  <div className="relative">{message.metadata.reasoning}</div>
                </div>
                <style jsx>{`
                  div::-webkit-scrollbar {
                    width: 4px;
                  }
                  div::-webkit-scrollbar-thumb {
                    background-color: rgba(0, 0, 0, 0.2);
                    border-radius: 2px;
                  }
                  div::-webkit-scrollbar-track {
                    background: transparent;
                  }
                `}</style>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Files Generated Section */}
          {message.metadata.filesGenerated && message.metadata.filesGenerated.length > 0 && (
            <Collapsible open={showFiles} onOpenChange={setShowFiles}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs flex items-center gap-1 hover:bg-white hover:cursor-pointer w-full justify-start pl-3 group"
                >
                  {showFiles ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <>
                      <Folder className="w-3 h-3 group-hover:hidden transition-opacity duration-200" />
                      <ChevronRight className="w-3 h-3 hidden group-hover:block transition-opacity duration-200" />
                    </>
                  )}
                  <span>Files Generated ({message.metadata.filesGenerated.length})</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="">
                <div className="bg-white border-blue-200 rounded-lg p-3 space-y-1">
                  {message.metadata.filesGenerated.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      <code className="font-mono">{file}</code>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Version Button */}
          {hasCodeSnapshot && onVersionClick && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs flex items-center gap-2 border-2 border-blue-500 hover:bg-blue-50 bg-transparent"
              onClick={() => onVersionClick(message.metadata!.messageId)}
            >
              <FileCode className="w-3 h-3" />
              <span>View This Version</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                v{message.metadata.messageId.slice(0, 6)}
              </Badge>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}