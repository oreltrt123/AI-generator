"use client"

import { useUser } from "@clerk/nextjs"
import { useParams, useSearchParams } from "next/navigation"
import PlaygroundHeader from "../_components/PlaygroundHeader"
import ChatSection from "../_components/ChatSection"
import WebsiteDesign from "../_components/WebsiteDesign"
import axios from "axios"
import { useEffect, useRef, useState } from "react"

export type Frame = {
  projectId: string
  frameId: string
  designCode: string
  chatMessages: Messages[]
  projectFiles?: ProjectFile[]
  prdData?: PRDData
  variants?: Variant[]
}

export type Variant = {
  id?: number
  variantNumber: number
  projectFiles: ProjectFile[]
  prdData?: PRDData
  imageUrls?: string[]
}

export type Messages = {
  role: string
  content: string
  streaming?: boolean
}

export type ProjectFile = {
  path: string
  content: string
}

export type PRDData = {
  features: string[]
  reasoning: string
  techStack: string[]
  architecture: string
  userFlow: string[]
  timestamp: string
}

const Prompt = `
You are an expert full-stack developer. Generate complete, production-ready projects with BEAUTIFUL, PROFESSIONAL styling based on the selected programming language/framework.

User Request: {userInput}
Selected Language/Framework: {selectedLanguage}
Variant Number: {variantNumber} of 4

{databaseContext}

CRITICAL INSTRUCTIONS:

**IMPORTANT: You are generating VARIANT #{variantNumber} of 4 different design approaches.**
Each variant should have a DISTINCTLY DIFFERENT design approach:
- Variant 1: Modern minimalist with clean lines and lots of whitespace
- Variant 2: Bold and colorful with vibrant gradients and animations
- Variant 3: Professional corporate style with structured layouts
- Variant 4: Creative and artistic with unique layouts and typography

Make sure this variant has a UNIQUE visual identity compared to the others!

1. **Language-Specific Project Generation**:
   
   **For HTML, CSS, JavaScript** (html):
   - Create standalone HTML files with embedded or linked CSS and JavaScript
   - Use modern CSS (Flexbox, Grid, CSS Variables)
   - Include responsive design with media queries
   - Generate clean, semantic HTML5
   - Required files: index.html, style.css, script.js (and additional pages as needed)
   - Example structure:
     * index.html (main page)
     * about.html (if requested)
     * style.css (all styling)
     * script.js (interactivity)
   
   **For Python** (python):
   - Create Python scripts or Flask/Django applications as appropriate
   - Include requirements.txt for dependencies
   - Use proper Python conventions (PEP 8)
   - For web apps: create templates, static files, and routes
   - Required files: main.py or app.py, requirements.txt, README.md
   - Example structure:
     * app.py (Flask application)
     * requirements.txt (dependencies)
     * templates/index.html
     * static/style.css
   
   **For Next.js + TypeScript** (nextjs) - DEFAULT:
   - Create complete Next.js 14+ App Router projects
   - Use TypeScript for all files
   - Include app/page.tsx, app/layout.tsx, app/globals.css, public/style.css
   - Link CSS in layout.tsx: <link rel="stylesheet" href="/style.css" />
   - Required files: app/page.tsx, app/layout.tsx, app/globals.css, public/style.css, package.json, tsconfig.json, next.config.ts
   
   **For Vite + React** (vite):
   - Create Vite-based React project structure
   - Use modern React hooks and functional components
   - Include vite.config.ts, index.html, src/main.tsx, src/App.tsx
   - Required files: vite.config.ts, index.html, src/main.tsx, src/App.tsx, src/index.css, package.json
   
   **For Vue.js** (vue):
   - Create Vue 3 Composition API project
   - Use Single File Components (.vue files)
   - Include proper Vue Router setup if multiple pages
   - Required files: src/App.vue, src/main.ts, index.html, package.json, vite.config.ts
   
   **For React** (react):
   - Create standard React application
   - Use Create React App or similar structure
   - Include src/App.js, src/index.js, public/index.html
   - Required files: src/App.js, src/index.js, public/index.html, src/index.css, package.json

2. **Database Integration** - {databaseInstructions}

3. **MUST Include Beautiful Styling**:
   - For web projects: Create comprehensive CSS with modern design
   - Use cohesive color palettes (3-5 colors) - DIFFERENT for each variant!
   - Add hover effects, transitions, and animations
   - Make responsive with proper breakpoints
   - Include shadows, rounded corners, and modern UI elements
   - For HTML projects: Use style.css
   - For React/Vue/Svelte: Use component-scoped styles or CSS modules
   - For Next.js: Use both globals.css and public/style.css

4. **Response Format**:
   You MUST respond with a JSON object containing an array of files AND a prd object.
   
   {
     "files": [
       {
         "path": "appropriate/file/path",
         "content": "... full file content ..."
       }
     ],
     "imageUrls": ["url1", "url2", ...],
     "prd": {
       "features": ["Feature 1: Description", "Feature 2: Description", ...],
       "reasoning": "Detailed explanation of why you chose this approach, technologies, and design patterns FOR THIS SPECIFIC VARIANT",
       "techStack": ["Technology 1", "Technology 2", ...],
       "architecture": "Description of the project architecture and structure",
       "userFlow": ["Step 1: User action", "Step 2: System response", ...]
     }
   }

5. **Code Quality**:
   - Use modern patterns for the selected language/framework
   - Implement proper type safety where applicable
   - Add responsive design for web projects
   - Use semantic HTML elements
   - Follow framework-specific best practices
   {databaseBestPractices}

6. **For Greetings**: If user just says "Hi" or "Hello", respond with:
   {
     "message": "Hello! I'm ready to help you build projects in multiple languages and frameworks. What would you like to create?"
   }

Now, create an amazing {selectedLanguage} project (VARIANT #{variantNumber}) for: {userInput}
`

function Playground() {
  const { user, isLoaded } = useUser()
  const { projectId } = useParams()
  const params = useSearchParams()
  const frameId = params.get("frameId")
  const [frameDetail, setFrameDetail] = useState<Frame>()
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Messages[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [activeVariantIndex, setActiveVariantIndex] = useState(0)
  const [saveTrigger, setSaveTrigger] = useState(0)
  const [designWidth, setDesignWidth] = useState(800)
  const [generatingFiles, setGeneratingFiles] = useState<{ path: string; status: "pending" | "complete" }[]>([])
  const [isRunningCommands, setIsRunningCommands] = useState(false)
  const [currentStep, setCurrentStep] = useState("")
  const [aiThinking, setAiThinking] = useState(false)
  const [thinkingTime, setThinkingTime] = useState(0)
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null)
  const [streamingMessage, setStreamingMessage] = useState("")
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [generatingVariants, setGeneratingVariants] = useState<number[]>([])

  // Default project files to ensure iframe has content
  const defaultProjectFiles: ProjectFile[] = [
    {
      path: "app/page.tsx",
      content: `
import React from 'react';

export default function Home() {
  return (
    <div className="container">
      <h1>Welcome to Your Project</h1>
      <p>This is a default page to get you started. Click elements to edit them!</p>
      <button className="btn">Click Me</button>
    </div>
  );
}
      `,
    },
    {
      path: "app/layout.tsx",
      content: `
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Generated App",
  description: "Generated by AI",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
      `,
    },
    {
      path: "app/globals.css",
      content: `
@tailwind base;
@tailwind components;
@tailwind utilities;
      `,
    },
    {
      path: "public/style.css",
      content: `
/* Reset and Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f8fafc;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Buttons */
button, .btn {
  height: 55px;
  background: #F2F2F2;
  border-radius: 11px;
  border: 0;
  outline: none;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  background: linear-gradient(180deg, #363636 0%, #1B1B1B 50%, #000000 100%);
  box-shadow: 0px 0px 0px 0px #FFFFFF, 0px 0px 0px 0px #000000;
  transition: all 0.3s cubic-bezier(0.15, 0.83, 0.66, 1);
}

button:hover, .btn:hover {
  box-shadow: 0px 0px 0px 2px #FFFFFF, 0px 0px 0px 4px #0000003a;
}

/* Inputs */
input, textarea, select {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: white;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Cards */
.card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

/* Typography */
h1 {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: #1e293b;
}

h2 {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #334155;
}

p {
  font-size: 1.125rem;
  line-height: 1.7;
  color: #64748b;
  margin-bottom: 1rem;
}
      `,
    },
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: "nextjs-project",
          version: "0.1.0",
          private: true,
          scripts: {
            dev: "next dev --port 3000",
            build: "next build",
            start: "next start",
          },
          dependencies: {
            next: "14.2.5",
            react: "^18.3.1",
            "react-dom": "^18.3.1",
          },
          devDependencies: {
            "@types/node": "^20",
            "@types/react": "^18",
            "@types/react-dom": "^18",
            typescript: "^5",
            tailwindcss: "^3.4.1",
            postcss: "^8",
            autoprefixer: "^10.4.19",
          },
        },
        null,
        2,
      ),
    },
  ]

  useEffect(() => {
    if (isLoaded && frameId && projectId && user) {
      GetFrameDetails()
      checkDeployment()
    } else if (!user) {
      console.log("[v0] User not authenticated, using default files")
      setVariants([
        { variantNumber: 1, projectFiles: defaultProjectFiles },
        { variantNumber: 2, projectFiles: defaultProjectFiles },
        { variantNumber: 3, projectFiles: defaultProjectFiles },
        { variantNumber: 4, projectFiles: defaultProjectFiles },
      ])
    }
  }, [frameId, projectId, isLoaded, user])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSaveTrigger((prev) => prev + 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [variants])

  const saveFrameData = async () => {
    if (!user || !frameId || !projectId || !messages.length) return
    try {
      await axios.put("/api/frames", {
        designCode: JSON.stringify(variants[activeVariantIndex]?.projectFiles || []),
        chatMessages: messages,
        frameId,
        projectId,
        prdData: variants[activeVariantIndex]?.prdData
          ? JSON.stringify(variants[activeVariantIndex].prdData)
          : undefined,
        variants: variants, // Save all variants
      })
      console.log("[v0] Frame data with variants saved successfully")
    } catch (error: any) {
      console.error("[v0] Error saving frame data:", error.message)
    }
  }

  const checkDeployment = async () => {
    try {
      const cachedUrl = localStorage.getItem(`deploymentUrl_${projectId}`)
      if (cachedUrl) {
        setDeploymentUrl(cachedUrl)
        return
      }

      const response = await axios.get(`/api/deploy?projectId=${projectId}`, {
        validateStatus: (status) => status < 500,
      })
      if (response.status === 200 && response.data.deployed && response.data.url) {
        setDeploymentUrl(response.data.url)
        localStorage.setItem(`deploymentUrl_${projectId}`, response.data.url)
      }
    } catch (error: any) {
      console.error("[v0] Failed to check deployment status:", error.message)
    }
  }

  useEffect(() => {
    if (saveTrigger > 0) {
      saveFrameData()
    }
  }, [saveTrigger])

  const handleManualSave = () => {
    saveFrameData()
  }

  const GetFrameDetails = async () => {
    if (!user || !frameId || !projectId) return
    try {
      const result = await axios.get(`/api/frames?frameId=${frameId}&projectId=${projectId}`)
      console.log("[v0] Fetched frame details:", result.data)
      setFrameDetail(result.data)
      const fetchedMessages = result.data.chatMessages || []
      setMessages(fetchedMessages)

      if (result.data.variants && Array.isArray(result.data.variants) && result.data.variants.length > 0) {
        setVariants(result.data.variants)
      } else if (result.data.designCode) {
        // Fallback: if no variants but has designCode, create one variant
        try {
          const parsed = JSON.parse(result.data.designCode)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVariants([
              { variantNumber: 1, projectFiles: parsed },
              { variantNumber: 2, projectFiles: defaultProjectFiles },
              { variantNumber: 3, projectFiles: defaultProjectFiles },
              { variantNumber: 4, projectFiles: defaultProjectFiles },
            ])
          } else {
            setVariants([
              { variantNumber: 1, projectFiles: defaultProjectFiles },
              { variantNumber: 2, projectFiles: defaultProjectFiles },
              { variantNumber: 3, projectFiles: defaultProjectFiles },
              { variantNumber: 4, projectFiles: defaultProjectFiles },
            ])
          }
        } catch (error: any) {
          console.error("[v0] Error parsing designCode:", error.message)
          setVariants([
            { variantNumber: 1, projectFiles: defaultProjectFiles },
            { variantNumber: 2, projectFiles: defaultProjectFiles },
            { variantNumber: 3, projectFiles: defaultProjectFiles },
            { variantNumber: 4, projectFiles: defaultProjectFiles },
          ])
        }
      } else {
        setVariants([
          { variantNumber: 1, projectFiles: defaultProjectFiles },
          { variantNumber: 2, projectFiles: defaultProjectFiles },
          { variantNumber: 3, projectFiles: defaultProjectFiles },
          { variantNumber: 4, projectFiles: defaultProjectFiles },
        ])
      }
    } catch (error: any) {
      console.error("[v0] Error fetching frame details:", error.message)
      setVariants([
        { variantNumber: 1, projectFiles: defaultProjectFiles },
        { variantNumber: 2, projectFiles: defaultProjectFiles },
        { variantNumber: 3, projectFiles: defaultProjectFiles },
        { variantNumber: 4, projectFiles: defaultProjectFiles },
      ])
    }
  }

  const SendMessage = async (
    userInput: string,
    selectedModel: string,
    selectedLanguage: string,
    dbConnection?: any,
    files?: File[],
  ) => {
    if (!user || !frameId || !projectId) {
      console.error("[v0] Missing required params for SendMessage")
      const errorMsg: Messages = {
        role: "assistant",
        content: "Please sign in and ensure a valid project is selected.",
      }
      setMessages((prev) => [...prev, errorMsg])
      return
    }

    try {
      const newUserMsg: Messages = { role: "user", content: userInput }
      setMessages((prev) => [...prev, newUserMsg])

      setLoading(true)
      setGeneratingFiles([])
      setAiThinking(true)
      setStreamingMessage("")
      setGeneratingVariants([1, 2, 3, 4])
      setCurrentStep("🤔 Thinking about your request and preparing 4 unique variants...")

      let fileContents: string[] = []
      if (files && files.length > 0) {
        fileContents = await Promise.all(
          files.map(async (file) => {
            if (file.size > 10 * 1024 * 1024) {
              return `File: ${file.name} (large file, please process)`
            }
            const text = await file.text()
            return `File: ${file.name}\nContent:\n\`\`\`\n${text}\n\`\`\``
          }),
        )
      }

      let languageDisplayName = ""
      switch (selectedLanguage) {
        case "html":
          languageDisplayName = "HTML, CSS, and JavaScript"
          break
        case "python":
          languageDisplayName = "Python"
          break
        case "nextjs":
          languageDisplayName = "Next.js + TypeScript"
          break
        case "vite":
          languageDisplayName = "Vite + React"
          break
        case "vue":
          languageDisplayName = "Vue.js"
          break
        case "react":
          languageDisplayName = "React"
          break
        default:
          languageDisplayName = "Next.js + TypeScript"
      }

      let databaseContext = ""
      let databaseInstructions = "No database is connected. Generate a standalone application."
      let databaseBestPractices = ""

      if (dbConnection) {
        if (dbConnection.provider === "supabase") {
          databaseContext = `
DATABASE CONNECTED: Supabase
Project: ${dbConnection.config.projectName}
Project ID: ${dbConnection.config.projectId}
Region: ${dbConnection.config.region}
`
          databaseInstructions = `
The user has connected a Supabase database. You MUST integrate Supabase into the generated ${languageDisplayName} project:
- Create appropriate database client configuration for ${languageDisplayName}
- Use environment variables for Supabase URL and anon key
- Include database operations (queries, mutations)
- Add proper error handling for database operations
- Use Supabase's real-time features if appropriate for the use case
`
          databaseBestPractices = `
   - Use Supabase client-side for real-time subscriptions
   - Implement Row Level Security (RLS) policies
   - Handle loading and error states for database operations
   - Use appropriate database patterns for ${languageDisplayName}
`
        } else if (dbConnection.provider === "firebase") {
          databaseContext = `
DATABASE CONNECTED: Firebase
Project: ${dbConnection.connectionName}
Project ID: ${dbConnection.config.projectId}
`
          databaseInstructions = `
The user has connected a Firebase database. You MUST integrate Firebase into the generated ${languageDisplayName} project:
- Create appropriate Firebase configuration for ${languageDisplayName}
- Use the provided Firebase config (apiKey, authDomain, projectId, etc.)
- Include Firestore database operations
- Add proper error handling for database operations
- Use Firebase's real-time listeners if appropriate for the use case
`
          databaseBestPractices = `
   - Use Firebase client SDK for real-time updates
   - Implement proper security rules
   - Handle loading and error states for database operations
   - Use Firebase collections and documents appropriately for ${languageDisplayName}
`
        }
      }

      const streamingMsgIndex = messages.length + 1
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Generating 4 unique design variants for you...", streaming: true },
      ])

      const newVariants: Variant[] = []

      for (let variantNum = 1; variantNum <= 4; variantNum++) {
        setCurrentStep(`✨ Generating Variant ${variantNum} of 4...`)

        const enhancedPrompt = Prompt.replace(/{userInput}/g, userInput)
          .replace(/{selectedLanguage}/g, languageDisplayName)
          .replace(/{variantNumber}/g, variantNum.toString())
          .replace(/{databaseContext}/g, databaseContext)
          .replace(/{databaseInstructions}/g, databaseInstructions)
          .replace(/{databaseBestPractices}/g, databaseBestPractices)

        const fullPrompt = `${enhancedPrompt}\n${fileContents.join("\n")}`

        const result = await fetch("/api/ai-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: "user", content: fullPrompt }],
          }),
        })

        if (!result.ok) {
          throw new Error(`AI model API error: ${result.status} - ${result.statusText}`)
        }

        const reader = result.body?.getReader()
        const decoder = new TextDecoder()
        let aiResponse = ""

        while (true) {
          const { done, value } = await reader!.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          aiResponse += chunk
        }

        console.log(`[v0] Variant ${variantNum} response length:`, aiResponse.length)

        try {
          let jsonStr = aiResponse.trim()
          jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "")

          const jsonObjects: string[] = []
          let currentDepth = 0
          let startIndex = -1

          for (let i = 0; i < jsonStr.length; i++) {
            if (jsonStr[i] === "{") {
              if (currentDepth === 0) startIndex = i
              currentDepth++
            } else if (jsonStr[i] === "}") {
              currentDepth--
              if (currentDepth === 0 && startIndex !== -1) {
                jsonObjects.push(jsonStr.substring(startIndex, i + 1))
                startIndex = -1
              }
            }
          }

          let parsed: any = null
          for (const objStr of jsonObjects) {
            try {
              parsed = JSON.parse(objStr)
              if (parsed.files) break
            } catch (err) {
              console.warn(`[v0] Failed to parse JSON for variant ${variantNum}`)
            }
          }

          if (parsed && parsed.files && Array.isArray(parsed.files)) {
            newVariants.push({
              variantNumber: variantNum,
              projectFiles: parsed.files,
              prdData: parsed.prd ? { ...parsed.prd, timestamp: new Date().toISOString() } : undefined,
              imageUrls: parsed.imageUrls || [],
            })
            setGeneratingVariants((prev) => prev.filter((v) => v !== variantNum))
          } else {
            // Fallback to default files for this variant
            newVariants.push({
              variantNumber: variantNum,
              projectFiles: defaultProjectFiles,
            })
          }
        } catch (error: any) {
          console.error(`[v0] Error parsing variant ${variantNum}:`, error)
          newVariants.push({
            variantNumber: variantNum,
            projectFiles: defaultProjectFiles,
          })
        }
      }

      setAiThinking(false)
      setGeneratingVariants([])
      setCurrentStep("")
      setVariants(newVariants)

      const successMsg: Messages = {
        role: "assistant",
        content: `✅ Successfully generated 4 unique ${languageDisplayName} variants! Click on the variant cards on the right to switch between different designs. Each variant has a unique visual style and approach.`,
      }

      setMessages((prev) => {
        const filtered = prev.filter((_, idx) => idx !== streamingMsgIndex)
        return [...filtered, successMsg]
      })

      setTimeout(() => {
        setSaveTrigger((prev) => prev + 1)
      }, 500)

      setLoading(false)
    } catch (error: any) {
      setLoading(false)
      setAiThinking(false)
      setCurrentStep("")
      setGeneratingFiles([])
      setGeneratingVariants([])
      setStreamingMessage("")
      console.error("[v0] Error sending message:", error)
      const errorMsg: Messages = {
        role: "assistant",
        content: `❌ Sorry, I encountered an error: ${error.message}. Initializing with default variants.`,
      }
      setMessages((prev) => [...prev, errorMsg])
      setVariants([
        { variantNumber: 1, projectFiles: defaultProjectFiles },
        { variantNumber: 2, projectFiles: defaultProjectFiles },
        { variantNumber: 3, projectFiles: defaultProjectFiles },
        { variantNumber: 4, projectFiles: defaultProjectFiles },
      ])
    }
  }

  useEffect(() => {
    if (aiThinking) {
      setThinkingTime(0)
      thinkingTimerRef.current = setInterval(() => {
        setThinkingTime((prev) => prev + 0.1)
      }, 100)
    } else {
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current)
        thinkingTimerRef.current = null
      }
    }

    return () => {
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current)
      }
    }
  }, [aiThinking])

  const currentProjectFiles = variants[activeVariantIndex]?.projectFiles || defaultProjectFiles
  const currentPRDData = variants[activeVariantIndex]?.prdData || null

  const handleFilesChange = (newFiles: ProjectFile[]) => {
    setVariants((prev) => {
      const updated = [...prev]
      if (updated[activeVariantIndex]) {
        updated[activeVariantIndex] = {
          ...updated[activeVariantIndex],
          projectFiles: newFiles,
        }
      }
      return updated
    })
  }

  return (
    <div className="h-screen flex flex-col bg-[#1E1E21]">
      <PlaygroundHeader
        onSave={handleManualSave}
        projectId={projectId as string}
        messages={messages}
        projectFiles={currentProjectFiles}
      />
      <div className="flex flex-1 overflow-hidden">
        <ChatSection
          messages={messages}
          onSend={SendMessage}
          isLoading={loading}
          generatingFiles={generatingFiles}
          isRunningCommands={isRunningCommands}
          currentStep={currentStep}
          aiThinking={aiThinking}
          thinkingTime={thinkingTime}
          projectId={projectId as string}
          streamingMessage={streamingMessage}
          generatingVariants={generatingVariants}
        />
        <WebsiteDesign
          projectFiles={currentProjectFiles}
          onFilesChange={handleFilesChange}
          width={designWidth}
          onWidthChange={setDesignWidth}
          onAutoRunStart={() => setIsRunningCommands(true)}
          onAutoRunComplete={() => {
            setIsRunningCommands(false)
            setGeneratingFiles([])
          }}
          projectId={projectId as string}
          prdData={currentPRDData}
          variants={variants}
          activeVariantIndex={activeVariantIndex}
          onVariantChange={setActiveVariantIndex}
        />
      </div>
    </div>
  )
}

export default Playground
