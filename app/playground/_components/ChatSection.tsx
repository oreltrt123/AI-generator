"use client"
import { useState } from "react"
import type { Messages } from "../[projectId]/page"
import { Button } from "@/components/ui/button"
import { ArrowUp, Sparkles } from "lucide-react"

type Props = {
  messages: Messages[]
  onSend: (input: string) => void
  isLoading: boolean
}

function ChatSection({ messages, onSend, isLoading }: Props) {
  const [input, setInput] = useState<string>("")
  const [isImproving, setIsImproving] = useState(false)

  const handleSend = () => {
    if (!input?.trim()) return
    onSend(input)
    setInput("")
  }

  const handleImprovePrompt = async () => {
    if (!input?.trim()) {
      return
    }

    setIsImproving(true)

    try {
      const response = await fetch("/api/improve-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      })

      if (!response.ok) throw new Error("Failed to improve prompt")

      const data = await response.json()
      setInput(data.improvedPrompt)

    } catch (error) {
      console.error("Error improving prompt:", error)
    } finally {
      setIsImproving(false)
    }
  }

  return (
    <div className="w-96 h-[98vh] p-4 flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col mt-5">
        {messages?.length === 0 ? (
          <p className="text-muted-foreground text-center">No Messages Yet</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`p-3 rounded-lg max-w-[80%] text-[13px]
                ${msg.role === "user" ? "bg-gray-300 text-black" : "bg-none text-black"}`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg max-w-[80%] bg-muted text-foreground animate-pulse">Generating...</div>
          </div>
        )}
      </div>

      <div className="w-full p-4 border rounded-2xl relative bg-background">
        <textarea
          value={input}
          placeholder="Describe your page design..."
          className="w-full h-20 focus:outline-none focus:ring-0 resize-none pr-10 bg-transparent text-foreground"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <div className="absolute bottom-2 right-2 flex gap-2">
          <Button
            onClick={handleImprovePrompt}
            disabled={isLoading || isImproving || !input.trim()}
            variant="outline"
            size="icon"
            title="Improve prompt with AI"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChatSection
