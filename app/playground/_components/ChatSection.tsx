"use client"

import type React from "react"

import { useState, useMemo, useEffect, useRef } from "react"
import type { Messages } from "../[projectId]/client"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import {
  ArrowUp,
  Sparkles,
  Check,
  ImageIcon,
  BrainCircuit,
  Loader2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileCode,
  Package,
  FileText,
  Database,
} from "lucide-react"
import { SiOpenai, SiGooglegemini, SiAnthropic, SiX } from "react-icons/si"
import { Gem } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tip } from "@/components/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import SettingsModal from "./SettingsModal"
import DatabaseConnectionModal from "./DatabaseConnectionModal"
import { models } from "@/types/models"
import "./button.css"
import axios from "axios"

type Props = {
  messages: Messages[]
  onSend: (input: string, model: string, dbConnection?: any) => void
  isLoading: boolean
  generatingFiles?: { path: string; status: "pending" | "complete" }[]
  isRunningCommands?: boolean
  currentStep?: string
  aiThinking?: boolean
  thinkingTime?: number
  projectId?: string
}

type UserSettings = {
  activeModels: (keyof typeof models)[]
  customInstructions: string
}

type FileContent = {
  name: string
  content: string
  type: "text" | "code" | "image"
}

type DatabaseConnection = {
  id: number
  provider: "supabase" | "firebase"
  connectionName: string
  config: any
  isActive: number
}

function ChatSection({
  messages,
  onSend,
  isLoading,
  generatingFiles = [],
  isRunningCommands = false,
  currentStep = "",
  aiThinking = false,
  thinkingTime = 0,
  projectId,
}: Props) {
  const { user } = useUser()
  const [input, setInput] = useState("")
  const [isImproving, setIsImproving] = useState(false)
  const [selectedModel, setSelectedModel] = useState<"gemini" | "deepseek" | "gpt-oss">("gemini")
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDatabaseModal, setShowDatabaseModal] = useState(false)
  const [expandedSections, setExpandedSections] = useState<{ [key: number]: boolean }>({})
  const [settings, setSettings] = useState<UserSettings>({
    activeModels: ["gemini", "deepseek", "gpt-oss"],
    customInstructions: "",
  })
  const [uploadedFiles, setUploadedFiles] = useState<FileContent[]>([])
  const [previewFile, setPreviewFile] = useState<FileContent | null>(null)
  const [connectedDatabase, setConnectedDatabase] = useState<DatabaseConnection | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      const stored = localStorage.getItem(`settings_${user.primaryEmailAddress.emailAddress}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings(parsed)
        if (!parsed.activeModels.includes(selectedModel)) {
          setSelectedModel(parsed.activeModels[0] || "gemini")
        }
      }
      // Load connected database for this project
      loadConnectedDatabase()
    }
  }, [user?.primaryEmailAddress?.emailAddress, selectedModel, projectId])

  const loadConnectedDatabase = async () => {
    if (!user?.id || !projectId) return
    try {
      const response = await axios.get(`/api/database/get-connection?userId=${user.id}&projectId=${projectId}`)
      if (response.data.connection) {
        setConnectedDatabase(response.data.connection)
      }
    } catch (err) {
      console.error("Failed to load database connection:", err)
    }
  }

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    if (user?.primaryEmailAddress?.emailAddress) {
      localStorage.setItem(`settings_${user.primaryEmailAddress.emailAddress}`, JSON.stringify(updated))
    }
  }

  const handleSend = () => {
    if (!input?.trim() && uploadedFiles.length === 0) return
    let fullPrompt = settings.customInstructions ? `${settings.customInstructions}\n\n${input}` : input
    if (uploadedFiles.length > 0) {
      const fileContents = uploadedFiles.map((file) => `File: ${file.name}\nContent:\n${file.content}`).join("\n\n")
      fullPrompt = `${fullPrompt}\n\n${fileContents}`
    }
    onSend(fullPrompt, selectedModel, connectedDatabase)
    setInput("")
    setUploadedFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleImprovePrompt = async () => {
    if (!input?.trim()) return
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newFiles: FileContent[] = []
    for (const file of Array.from(files)) {
      const isLargeFile = file.size > 10 * 1024 * 1024 // 10MB
      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.name.endsWith(".ts") ||
            file.name.endsWith(".tsx") ||
            file.name.endsWith(".js") ||
            file.name.endsWith(".jsx")
          ? "code"
          : "text"

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (isLargeFile) {
          newFiles.push({ name: file.name, content, type: fileType })
        } else {
          setInput((prev) => `${prev}\n\nFile: ${file.name}\nContent:\n${content}`)
        }
        if (newFiles.length === files.length) {
          setUploadedFiles((prev) => [...prev, ...newFiles])
        }
      }
      if (fileType === "image") {
        reader.readAsDataURL(file)
      } else {
        reader.readAsText(file)
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const handleDatabaseConnectionSaved = (connection: DatabaseConnection) => {
    setConnectedDatabase(connection)
  }

  const visibleModels = useMemo(
    () => Object.keys(models).filter((key) => settings.activeModels.includes(key as any)),
    [settings.activeModels],
  )

  const isLargeContent = (content: string) => {
    return content.length > 1000
  }

  return (
    <div className="w-96 h-[100vh] p-4 flex flex-col bg-background">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col mt-5">
        {connectedDatabase && (
          <div className="flex items-center justify-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <Database className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">
              Connected to {connectedDatabase.provider}: {connectedDatabase.connectionName}
            </span>
          </div>
        )}

        {messages.length === 0 ? (
          <p className="text-muted-foreground text-center">No Messages Yet</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="space-y-2">
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}>
                <div
                  className={`p-3 rounded-lg max-w-[80%] text-[13px] ${
                    msg.role === "user" ? "bg-gray-300 text-black" : "bg-none text-black"
                  }`}
                >
                  {isLargeContent(msg.content) ? (
                    <Button
                      variant="outline"
                      className="text-xs flex items-center gap-1 bg-transparent"
                      onClick={() => setPreviewFile({ name: "User Message", content: msg.content, type: "text" })}
                    >
                      <FileText className="w-3 h-3" />
                      View Large Content
                    </Button>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role !== "user" && user?.imageUrl && <div className="w-6 h-6" />}
                {msg.role === "user" && user?.imageUrl && (
                  <img
                    src={user.imageUrl || "/placeholder.svg"}
                    alt={user.firstName || user.username || "User"}
                    className="w-6 h-6 rounded-full"
                  />
                )}
              </div>

              {expandedSections[i] && msg.role === "user" && (
                <div className="flex justify-end items-end gap-2">
                  <div className="max-w-[80%] rounded-lg p-3 bg-gray-300 space-y-2">
                    <div className="text-xs text-black">
                      <div className="font-sans font-light text-l mb-1">
                        {user?.firstName || user?.username || "User"}
                      </div>
                      <div className="text-black">{msg.content}</div>
                    </div>
                    <div className="text-xs text-black flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Sent at {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {aiThinking && (
          <div className="space-y-2">
            <div className="flex justify-start">
              <div className="p-3 rounded-lg max-w-[80%] bg-gray-300 r2552esf25_252trewt3erblueFontDocs text-black flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-medium">AI is thinking...</span>
                {thinkingTime > 0 && <span className="text-xs text-black ml-auto">{thinkingTime.toFixed(1)}s</span>}
              </div>
            </div>
            <div className="flex justify-start">
              <button
                onClick={() => toggleSection(-1)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {expandedSections[-1] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span>What is the AI thinking?</span>
              </button>
            </div>
            {expandedSections[-1] && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-gray-300 space-y-2">
                  <div className="text-xs text-black">
                    <div className="font-semibold mb-2">AI Process</div>
                    <div className="space-y-1 text-black">
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-black" />
                        <span>Analyzing your request</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3 h-3 text-black" />
                        <span>Planning project structure</span>
                      </div>
                      {connectedDatabase && (
                        <div className="flex items-center gap-2">
                          <Check className="w-3 h-3 text-black" />
                          <span>Integrating {connectedDatabase.provider} database</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generating code files</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep && !aiThinking && (
          <div className="flex justify-start">
            <div className="p-3 rounded-lg max-w-[80%] bg-gray-300 r2552esf25_252trewt3erblueFontDocs text-black flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs font-medium">{currentStep}</span>
            </div>
          </div>
        )}

        {generatingFiles.length > 0 && (
          <div className="rounded-lg p-4 bg-gray-300 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-black flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                Creating Project Files
              </div>
              <Badge variant="secondary" className="text-xs">
                {generatingFiles.filter((f) => f.status === "complete").length}/{generatingFiles.length}
              </Badge>
            </div>

            <div className="h-[100%] overflow-y-auto">
              {generatingFiles.map((file, idx) => (
                <div
                  key={idx}
                  className={`gap-1 flex items-center text-xs p-2 transition-colors border-b ${
                    file.status === "complete" ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  {file.status === "complete" ? (
                    <Check className="w-3.5 h-3.5 text-black flex-shrink-0" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 text-black/70 flex-shrink-0 animate-spin" />
                  )}
                  <span
                    className={`font-mono ${file.status === "complete" ? "text-black font-medium" : "text-black/70"}`}
                  >
                    {file.path}
                  </span>
                </div>
              ))}
              <div>
                {isRunningCommands && (
                  <div className="flex items-center gap-2 text-xs pt-3 border-t border-indigo-200">
                    <Package className="w-4 h-4 text-black flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-black mb-1">Installing Dependencies</div>
                      <div className="text-black font-mono text-[11px]">npm install</div>
                    </div>
                    <Loader2 className="w-4 h-4 text-black" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Files Preview */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="text-xs flex items-center gap-1 p-2 h-auto bg-transparent"
                onClick={() => setPreviewFile(file)}
              >
                {file.type === "image" ? (
                  <ImageIcon className="w-3 h-3" />
                ) : file.type === "code" ? (
                  <FileCode className="w-3 h-3" />
                ) : (
                  <FileText className="w-3 h-3" />
                )}
                <span className="truncate max-w-[150px]">{file.name}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Input Box with File Upload and Model Selector */}
      <div className="w-full p-4 border rounded-2xl h-[140px] relative bg-background flex flex-col gap-2">
        <textarea
          value={input}
          placeholder={`Describe your page design... (Settings apply automatically)`}
          className="flex-1 h-20 focus:outline-none resize-none pr-10 bg-transparent text-foreground"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <div className="absolute bottom-2 right-2 flex gap-2 items-center">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="text/*,image/*,.ts,.tsx,.js,.jsx"
          />

          <Button
            onClick={() => setShowDatabaseModal(true)}
            variant="outline"
            className="r2552esf25_252trewt3erblueFontDocs bg-transparent"
            size="icon"
            title="Connect Database"
          >
            <Database className="w-4 h-4" />
          </Button>

          <Popover open={showModelSelector} onOpenChange={setShowModelSelector}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="r2552esf25_252trewt3erblueFontDocs h-7 px-2 hover:bg-[#F6F6F6] text-muted-foreground hover:text-muted-foreground rounded-md border-0 font-medium text-[11px] flex items-center gap-1"
                aria-label="Select model"
                title={`Current model: ${models[selectedModel].name} (Active: ${visibleModels.length})`}
              >
                {(() => {
                  const author = models[selectedModel].author
                  switch (author) {
                    case "OpenAI":
                      return <SiOpenai className="h-3.5 w-3.5 mr-1" />
                    case "Anthropic":
                      return <SiAnthropic className="h-3.5 w-3.5 mr-1" />
                    case "Google":
                      return <SiGooglegemini className="h-3.5 w-3.5 mr-1" />
                    case "DeepSeek":
                      return <Gem className="h-3.5 w-3.5 mr-1 text-[#9466ff]" />
                    case "xAI":
                      return <SiX className="h-3.5 w-3.5 mr-1" />
                    default:
                      return <Gem className="h-3.5 w-3.5 mr-1 text-gray-500" />
                  }
                })()}
                {models[selectedModel].name}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0 w-48" style={{ boxShadow: "0 0 8px rgba(0, 0, 0, 0.2)" }}>
              <Command>
                <CommandList>
                  <CommandEmpty>No active models found.</CommandEmpty>
                  <CommandGroup>
                    {visibleModels.map((model) => (
                      <CommandItem
                        key={model}
                        value={model}
                        onSelect={(value) => {
                          setSelectedModel(value as "gemini" | "deepseek" | "gpt-oss")
                          setShowModelSelector(false)
                        }}
                      >
                        <Tip
                          content={
                            <div className="p-2 max-w-xs">
                              <div className="font-semibold text-foreground text-sm mb-1">{models[model].name}</div>
                              <div className="text-xs text-muted-foreground mb-1">by {models[model].author}</div>
                              <div className="text-xs text-muted-foreground mb-2">{models[model].description}</div>
                              <div className="flex flex-wrap gap-1">
                                {models[model].features.map((feature) => (
                                  <Badge key={feature} variant="secondary" className="text-[10px]">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          }
                          className="bg-muted max-w-xs min-w-xs w-xs"
                          side="left"
                        >
                          <div className="flex items-center w-full">
                            {(() => {
                              const author = models[model].author
                              switch (author) {
                                case "OpenAI":
                                  return <SiOpenai className="mr-2 h-4 w-4" />
                                case "Anthropic":
                                  return <SiAnthropic className="mr-2 h-4 w-4" />
                                case "Google":
                                  return <SiGooglegemini className="mr-2 h-4 w-4" />
                                case "DeepSeek":
                                  return <Gem className="mr-2 h-4 w-4 text-[#9466ff]" />
                                case "xAI":
                                  return <SiX className="mr-2 h-4 w-4" />
                                default:
                                  return <Gem className="mr-2 h-4 w-4 text-gray-500" />
                              }
                            })()}
                            <span className="text-sm font-medium text-foreground">{models[model].name}</span>
                            <div className="flex items-center gap-1 ml-auto">
                              {models[model].features.map((feature) => {
                                switch (feature) {
                                  case "reasoning":
                                    return <BrainCircuit key={feature} className="h-4 w-4 text-pink-500" />
                                  case "experimental":
                                    return <ImageIcon key={feature} className="h-4 w-4 text-green-500" />
                                  default:
                                    return null
                                }
                              })}
                            </div>
                            {selectedModel === model && <Check className="ml-2 h-3.5 w-3.5 text-primary" />}
                          </div>
                        </Tip>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button
            onClick={handleImprovePrompt}
            disabled={isLoading || isImproving || !input.trim()}
            variant="outline"
            className="r2552esf25_252trewt3erblueFontDocs bg-transparent"
            size="icon"
          >
            <Sparkles className="w-4 h-4" />
          </Button>

          <Button
            className="r2552esf25_252trewt3erblueFontDocs"
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
            size="icon"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showSettings && (
        <SettingsModal settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} />
      )}

      {showDatabaseModal && (
        <DatabaseConnectionModal
          open={showDatabaseModal}
          onClose={() => setShowDatabaseModal(false)}
          onConnectionSaved={handleDatabaseConnectionSaved}
        />
      )}

      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewFile.name}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-4 bg-gray-50 rounded-lg">
              {previewFile.type === "image" ? (
                <img src={previewFile.content || "/placeholder.svg"} alt={previewFile.name} className="w-full h-auto" />
              ) : (
                <pre className="text-sm whitespace-pre-wrap font-mono">{previewFile.content}</pre>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default ChatSection
