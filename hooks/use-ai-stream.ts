"use client"

import { useState, useCallback } from "react"
import { parseStreamResponse, type StreamEvent } from "@/lib/stream-parser"
import type { ProjectFile } from "@/app/playground/[projectId]/client"

type StreamState = {
  stage: "idle" | "thinking" | "reasoning" | "generating" | "complete" | "error"
  reasoning?: string
  currentFile?: string
  filesGenerated: string[]
  thinkingTime: number
  error?: string
}

export function useAIStream() {
  const [streamState, setStreamState] = useState<StreamState>({
    stage: "idle",
    filesGenerated: [],
    thinkingTime: 0,
  })

  const startStream = useCallback(
    async (
      messages: any[],
      model: string,
      onComplete: (files: ProjectFile[], imageUrls: string[], metadata: any) => void,
    ) => {
      const startTime = Date.now()
      setStreamState({
        stage: "thinking",
        filesGenerated: [],
        thinkingTime: 0,
      })

      try {
        const response = await fetch("/api/ai-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, model }),
        })

        if (!response.ok) {
          throw new Error(`Stream API error: ${response.status}`)
        }

        await parseStreamResponse(response, (event: StreamEvent) => {
          switch (event.type) {
            case "thinking":
              setStreamState((prev) => ({
                ...prev,
                stage: "thinking",
                thinkingTime: Date.now() - startTime,
              }))
              break

            case "reasoning":
              setStreamState((prev) => ({
                ...prev,
                stage: "reasoning",
                reasoning: event.data.reasoning,
                thinkingTime: Date.now() - startTime,
              }))
              break

            case "file":
              setStreamState((prev) => ({
                ...prev,
                stage: "generating",
                currentFile: event.data.file,
                filesGenerated: [...prev.filesGenerated, event.data.file],
                thinkingTime: Date.now() - startTime,
              }))
              break

            case "complete":
              const thinkingTime = Date.now() - startTime
              setStreamState((prev) => ({
                ...prev,
                stage: "complete",
                thinkingTime,
              }))

              if (event.data.files) {
                onComplete(event.data.files, event.data.imageUrls || [], {
                  reasoning: streamState.reasoning,
                  filesGenerated: event.data.filesGenerated,
                  thinkingTime,
                })
              } else if (event.data.message) {
                onComplete([], [], { message: event.data.message, thinkingTime })
              }
              break

            case "error":
              setStreamState((prev) => ({
                ...prev,
                stage: "error",
                error: event.data.error,
              }))
              break
          }
        })
      } catch (error: any) {
        console.error("Stream error:", error)
        setStreamState((prev) => ({
          ...prev,
          stage: "error",
          error: error.message,
        }))
      }
    },
    [streamState.reasoning],
  )

  const resetStream = useCallback(() => {
    setStreamState({
      stage: "idle",
      filesGenerated: [],
      thinkingTime: 0,
    })
  }, [])

  return { streamState, startStream, resetStream }
}
