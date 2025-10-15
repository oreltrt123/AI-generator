"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
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
  Clock,
  FileText,
  Database,
  Loader2,
  MessageCircle,
  Layers,
} from "lucide-react"
import {
  SiOpenai,
  SiGooglegemini,
  SiAnthropic,
  SiHtml5,
  SiPython,
  SiNextdotjs,
  SiVite,
  SiVuedotjs,
  SiReact,
} from "react-icons/si"
import { Gem } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tip } from "@/components/tooltip"
import SettingsModal from "./SettingsModal"
import DatabaseConnectionModal from "./DatabaseConnectionModal"
import { models } from "@/types/models"
import "./button.css"
import "./animations.css"
import "./chat.css"

type Props = {
  messages: Messages[]
  onSend: (
    input: string,
    model: string,
    language: string,
    dbConnection?: any,
    discussMode?: boolean,
    multiVariant?: boolean,
  ) => void
  isLoading: boolean
  generatingFiles?: { path: string; status: "pending" | "complete" }[]
  isRunningCommands?: boolean
  currentStep?: string
  aiThinking?: boolean
  thinkingTime?: number
  projectId?: string
  streamingMessage?: string
  generatingVariants?: number[]
}

type UserSettings = {
  activeModels: string[]
  customInstructions: string
}

type FileContent = {
  path: string
  content: string
}

type DatabaseConnection = {
  provider: string
  connectionName: string
}

type LanguageOption = {
  id: string
  name: string
  icon: React.ComponentType<any>
  description: string
}

const languageOptions: LanguageOption[] = [
  {
    id: "html",
    name: "HTML",
    icon: SiHtml5,
    description: "Hypertext Markup Language is the standard markup language for creating web pages.",
  },
  {
    id: "python",
    name: "Python",
    icon: SiPython,
    description: "A high-level, interpreted programming language known for its readability and versatility.",
  },
  {
    id: "nextjs",
    name: "Next.js",
    icon: SiNextdotjs,
    description: "A React framework for building server-side rendered and statically generated web applications.",
  },
  {
    id: "vite",
    name: "Vite",
    icon: SiVite,
    description:
      "A build tool that aims to provide a faster and leaner development experience for modern web projects.",
  },
  {
    id: "vue",
    name: "Vue.js",
    icon: SiVuedotjs,
    description: "A progressive JavaScript framework for building user interfaces.",
  },
  { id: "react", name: "React", icon: SiReact, description: "A JavaScript library for building user interfaces." },
]

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
  streamingMessage = "",
  generatingVariants = [],
}: Props) {
  const { user } = useUser()
  const [input, setInput] = useState("")
  const [isImproving, setIsImproving] = useState(false)
  const [selectedModel, setSelectedModel] = useState<"gemini" | "gpt-oss" | "claude-code" | "gpt-5-chat">("gemini")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("nextjs")
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDatabaseModal, setShowDatabaseModal] = useState(false)
  const [expandedSections, setExpandedSections] = useState<{ [key: number]: boolean }>({})
  const [settings, setSettings] = useState<UserSettings>({
    activeModels: ["gemini", "gpt-oss", "claude-code", "gpt-5-chat"],
    customInstructions: "",
  })
  const [uploadedFiles, setUploadedFiles] = useState<FileContent[]>([])
  const [previewFile, setPreviewFile] = useState<FileContent | null>(null)
  const [connectedDatabase, setConnectedDatabase] = useState<DatabaseConnection | null>(null)
  const [discussMode, setDiscussMode] = useState(false)
  const [multiVariant, setMultiVariant] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const currentLanguage = languageOptions.find((lang) => lang.id === selectedLanguage) || languageOptions[2]
  const visibleModels = settings.activeModels

  const handleSend = () => {
    onSend(input, selectedModel, selectedLanguage, connectedDatabase, discussMode, multiVariant)
    setInput("")
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles: FileContent[] = Array.from(files).map((file) => ({
        path: file.name,
        content: "",
      }))
      setUploadedFiles([...uploadedFiles, ...newFiles])
    }
  }

  const handleImprovePrompt = () => {
    setIsImproving(true)
    // Logic to improve prompt goes here
    setIsImproving(false)
  }

  const saveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings)
  }

  const handleDatabaseConnectionSaved = (connection: DatabaseConnection) => {
    setConnectedDatabase(connection)
  }

  const isLargeContent = (content: string) => {
    return content.length > 1000
  }

  const renderLargeContent = (content: string) => {
    return <pre>{content}</pre>
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="w-96 h-[100vh] p-4 flex flex-col bg-[#1E1E21]">
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
                    msg.role === "user" ? "bg-[#FFFFFF12] text-white" : "bg-none text-white"
                  }`}
                >
                  {msg.streaming ? (
                    <div className="flex items-center gap-2">
                      <span>{msg.content}</span>
                    </div>
                  ) : isLargeContent(msg.content) ? (
                    <div className="w-[140%] overflow-y-auto p-4 rounded-lg">{renderLargeContent(msg.content)}</div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
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
                      <div className="font-sans font-light text-lg mb-1">
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
          <div className="flex items-center gap-3 p-3 bg-[#FFFFFF12] text-white rounded-lg animate-glow">
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span className="text-xs font-medium text-white">AI is thinking... ({thinkingTime.toFixed(1)}s)</span>
          </div>
        )}

        {generatingVariants.length > 0 && (
          <div className="p-3 bg-[#FFFFFF12] rounded-lg space-y-2 animate-glow">
            <div className="text-xs font-semibold text-white mb-2">
              🎨 Generating {multiVariant ? "4" : "1"} Unique Design Variant{multiVariant ? "s" : ""}:
            </div>
            {multiVariant ? (
              [1, 2, 3, 4].map((variantNum) => {
                const isComplete = !generatingVariants.includes(variantNum)
                const isGenerating = generatingVariants.includes(variantNum)

                return (
                  <div key={variantNum} className="flex items-center gap-2 text-xs">
                    {isComplete ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : isGenerating ? (
                      <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border-2 border-gray-500" />
                    )}
                    <span
                      className={
                        isComplete ? "text-green-400 font-medium" : isGenerating ? "text-blue-400" : "text-gray-500"
                      }
                    >
                      Variant {variantNum}{" "}
                      {isGenerating ? "(generating...)" : isComplete ? "(✓ complete)" : "(pending)"}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="flex items-center gap-2 text-xs">
                {generatingVariants.length === 0 ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                )}
                <span className={generatingVariants.length === 0 ? "text-green-400 font-medium" : "text-blue-400"}>
                  Single Variant {generatingVariants.length === 0 ? "(✓ complete)" : "(generating...)"}
                </span>
              </div>
            )}
          </div>
        )}

        {generatingFiles.length > 0 && (
          <div className="p-3 bg-[#FFFFFF12] rounded-lg space-y-2 animate-glow">
            <div className="text-xs font-semibold text-white">Generating Files:</div>
            {generatingFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {file.status === "complete" ? (
                  <Check className="w-3 h-3 text-white" />
                ) : (
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                )}
                <span className={file.status === "complete" ? "text-white" : "text-gray-600"}>{file.path}</span>
              </div>
            ))}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="blueChatAI w-full p-4 border border-[#464447] rounded-2xl h-[140px] relative bg-[#333437] flex flex-col gap-2">
        <div className="absolute top-2 left-2 flex gap-2 items-center">
          <Popover open={showLanguageSelector} onOpenChange={setShowLanguageSelector}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="r2552esf25_252trewt3erblueFontDocs h-7 px-2 hover:bg-[#3e3f42] hover:text-white text-muted-foreground rounded-md border-0 font-medium text-[11px] flex items-center gap-1"
                aria-label="Select language"
                title={`Current language: ${currentLanguage.name}`}
              >
                <currentLanguage.icon className="h-3.5 w-3.5 mr-1 text-gray-500" />
                {currentLanguage.name}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-50 border-[#464447] bg-[#333437]" style={{ boxShadow: "0 0 8px rgba(0, 0, 0, 0.2)" }}>
              <Command>
                <CommandList>
                  <CommandEmpty>No languages found.</CommandEmpty>
                  <CommandGroup>
                    {languageOptions.map((lang) => (
                      <CommandItem
                        key={lang.id}
                        value={lang.id}
                        onSelect={(value) => {
                          setSelectedLanguage(value)
                          setShowLanguageSelector(false)
                        }}
                      >
                        <Tip
                          content={
                            <div
                              className="p-5 rounded-2xl max-w-xs bg-[#333437]"
                              style={{ boxShadow: "0 0 8px rgba(0, 0, 0, 0.2)" }}
                            >
                              <div className="font-semibold text-sm mb-1 text-white">{lang.name}</div>
                              <div className="text-xs text-muted-foreground mb-2">{lang.description}</div>
                            </div>
                          }
                          className="bg-muted max-w-xs min-w-xs w-xs"
                          side="left"
                        >
                          <div className="flex items-center w-full">
                            <lang.icon className="mr-2 h-4 w-4 text-gray-300" />
                            <span className="text-sm font-sans font-light text-gray-300">{lang.name}</span>
                            {selectedLanguage === lang.id && <Check className="ml-auto h-3.5 w-3.5 text-gray-300" />}
                          </div>
                        </Tip>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Popover open={showModelSelector} onOpenChange={setShowModelSelector}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="r2552esf25_252trewt3erblueFontDocs h-7 px-2 hover:bg-[#3e3f42] hover:text-white text-muted-foreground rounded-md border-0 font-medium text-[11px] flex items-center gap-1"
                aria-label="Select model"
                title={`Current model: ${models[selectedModel as keyof typeof models]?.name || "Unknown"} (Active: ${visibleModels.length})`}
              >
                {(() => {
                  const author = models[selectedModel as keyof typeof models]?.author
                  switch (author) {
                    case "OpenAI":
                      return <SiOpenai className="h-3.5 w-3.5 mr-1 text-gray-500" />
                    case "Anthropic":
                      return <SiAnthropic className="h-3.5 w-3.5 mr-1 text-gray-500" />
                    case "Google":
                      return <SiGooglegemini className="h-3.5 w-3.5 mr-1 text-gray-500" />
                    default:
                      return <Gem className="h-3.5 w-3.5 mr-1 text-gray-500" />
                  }
                })()}
                {models[selectedModel as keyof typeof models]?.name}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-58 border-[#464447] bg-[#333437]" style={{ boxShadow: "0 0 8px rgba(0, 0, 0, 0.2)" }}>
              <Command>
                <CommandList>
                  <CommandEmpty>No active models found.</CommandEmpty>
                  <CommandGroup>
                    {visibleModels.map((model) => (
                      <CommandItem
                        key={model}
                        value={model}
                        onSelect={(value) => {
                          setSelectedModel(value as "gemini" | "gpt-oss" | "claude-code" | "gpt-5-chat")
                          setShowModelSelector(false)
                        }}
                      >
                        <Tip
                          content={
                            <div
                              className="p-5 rounded-2xl max-w-xs bg-white"
                              style={{ boxShadow: "0 0 8px rgba(0, 0, 0, 0.2)" }}
                            >
                              <div className="font-semibold text-foreground text-sm mb-1">
                                {models[model as keyof typeof models]?.name}
                              </div>
                              <div className="text-xs text-muted-foreground mb-1">
                                by {models[model as keyof typeof models]?.author}
                              </div>
                              <div className="text-xs text-muted-foreground mb-2">
                                {models[model as keyof typeof models]?.description}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {(models[model as keyof typeof models]?.features || []).map((feature) => (
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
                              const author = models[model as keyof typeof models]?.author
                              switch (author) {
                                case "OpenAI":
                                  return <SiOpenai className="mr-2 h-4 w-4 text-gray-300" />
                                case "Anthropic":
                                  return <SiAnthropic className="mr-2 h-4 w-4 text-gray-300" />
                                case "Google":
                                  return <SiGooglegemini className="mr-2 h-4 w-4 text-gray-300" />
                                default:
                                  return <Gem className="mr-2 h-4 w-4 text-gray-300" />
                              }
                            })()}
                            <span className="text-sm font-sans font-light text-gray-300">
                              {models[model as keyof typeof models]?.name}
                            </span>
                            <div className="flex items-center gap-1 ml-auto">
                              {(models[model as keyof typeof models]?.features || []).map((feature) => {
                                switch (feature) {
                                  case "reasoning":
                                    return <BrainCircuit key={feature} className="h-4 w-4 text-gray-300" />
                                  case "language":
                                    return <FileText key={feature} className="h-4 w-4 text-gray-300" />
                                  case "experimental":
                                    return <ImageIcon key={feature} className="h-4 w-4 text-gray-300" />
                                  default:
                                    return null
                                }
                              })}
                            </div>
                            {selectedModel === model && <Check className="ml-2 h-3.5 w-3.5 text-gray-300" />}
                          </div>
                        </Tip>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Tip
            content={
              <div className="p-3 rounded-lg max-w-xs bg-[#333437]">
                <div className="font-semibold text-sm mb-1 text-white">Discuss Mode</div>
                <div className="text-xs text-muted-foreground">
                  {discussMode
                    ? "AI will answer questions without generating code"
                    : "AI will generate code and websites"}
                </div>
              </div>
            }
            side="bottom"
          >
            {/* <Button
              variant="ghost"
              onClick={() => setDiscussMode(!discussMode)}
              className={`r2552esf25_252trewt3erblueFontDocs h-7 px-2 rounded-md border-0 font-medium text-[11px] flex items-center gap-1 ${
                discussMode
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "hover:bg-[#3e3f42] hover:text-white text-muted-foreground"
              }`}
              title={discussMode ? "Discuss mode active" : "Code generation mode"}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {discussMode && <span className="text-[10px]">Discuss</span>}
            </Button> */}
          </Tip>

          {!discussMode && (
            <Tip
              content={
                <div className="p-3 rounded-lg max-w-xs bg-[#333437]">
                  <div className="font-semibold text-sm mb-1 text-white">Variant Mode</div>
                  <div className="text-xs text-muted-foreground">
                    {multiVariant ? "Generate 4 unique design variants" : "Generate single website"}
                  </div>
                </div>
              }
              side="bottom"
            >
              <Button
                variant="ghost"
                onClick={() => setMultiVariant(!multiVariant)}
                className={`r2552esf25_252trewt3erblueFontDocs h-7 px-2 rounded-md border-0 font-medium text-[11px] flex items-center gap-1 ${
                  multiVariant
                    ? "bg-[#464747] text-white hover:text-white hover:bg-[#464747]"
                    : "hover:bg-[#3e3f42] hover:text-white text-muted-foreground"
                }`}
                title={multiVariant ? "4 variants mode" : "Single variant mode"}
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="text-[10px]">{multiVariant ? "4x" : "1x"}</span>
              </Button>
            </Tip>
          )}
        </div>
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
            onClick={handleImprovePrompt}
            disabled={isLoading || isImproving || !input.trim()}
            variant="outline"
            className="r2552esf25_252trewt3erblueFontDocs bg-transparent hover:bg-[#3e3f42] hover:text-white text-muted-foreground"
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
        <textarea
          value={input}
          placeholder={
            discussMode
              ? "Ask me anything about programming, code, or development..."
              : `Describe your page design... (Will generate ${multiVariant ? "4 unique variants" : "1 website"})`
          }
          className="flex-1 h-20 focus:outline-none resize-none mt-6 bg-transparent text-white placeholder:text-muted-foreground"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
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
    </div>
  )
}

export default ChatSection