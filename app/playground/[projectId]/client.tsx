"use client"

import { useUser } from "@clerk/nextjs"
import { useParams, useSearchParams } from "next/navigation"
import PlaygroundHeader from "../_components/PlaygroundHeader"
import ChatSection from "../_components/ChatSection"
import WebsiteDesign from "../_components/WebsiteDesign"
import axios from "axios"
import { useEffect, useRef, useState } from "react"

export type Frame = {
  projectId23: string
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
  filePath?: string // Added for live file updates
  folderName?: string // Added for folder name display
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

export interface PlaygroundProps {
  projectName?: string
}

const Prompt = `
You are an elite full-stack developer with expertise in modern web development, similar to v0.dev and bolt.new. Your goal is to generate COMPLETE, PRODUCTION-READY, and FULLY FUNCTIONAL projects with PROFESSIONAL styling.

streaming live Messages

User Request: {userInput}
Selected Language/Framework: {selectedLanguage}
Variant Number: {variantNumber} of 4

{databaseContext}

CRITICAL INSTRUCTIONS:

VARIANT DIFFERENTIATION - VARIANT #{variantNumber}:
Each of the 4 variants MUST have a COMPLETELY DIFFERENT design approach and visual identity:

Variant 1: Minimalist & Clean - Lots of whitespace, subtle shadows, neutral colors (whites, grays, blacks), simple typography
Variant 2: Bold & Vibrant - Bright colors, gradients, animations, modern UI patterns, eye-catching elements
Variant 3: Professional Corporate - Structured layouts, business-appropriate colors (blues, grays), formal typography, data-focused
Variant 4: Creative & Artistic - Unique layouts, creative typography, unconventional color schemes, artistic elements
PROFESSIONAL CODE GENERATION (Like v0.dev and bolt.new):

Multi-File Architecture - NEVER put everything in one file:

Break down complex applications into logical components
Create separate files for different features/pages
Use proper folder structure (components/, pages/, utils/, etc.)
For Next.js: Use app router with proper page.tsx, layout.tsx structure
For React/Vite: Create component files in src/components/
For HTML: Create separate HTML files for different pages
Use TypeScript for type safety (when applicable)
Follow framework-specific best practices
Add meaningful comments for complex logic
Use modern ES6+ syntax
Implement proper state management
Add input validation and error boundaries
Iterative Development Approach:

Generate complete, working code from the start
Include all necessary imports and dependencies
Add proper error handling and loading states
Implement responsive design for all screen sizes
Include accessibility features (ARIA labels, semantic HTML)
Code Quality Standards:

Use TypeScript for type safety (when applicable)
Follow framework-specific best practices
Add meaningful comments for complex logic
Use modern ES6+ syntax
Implement proper state management
Add input validation and error boundaries
Functionality Requirements:

ALL interactive elements MUST work (buttons, forms, navigation)
Implement actual functionality, not just UI mockups
Add proper event handlers for user interactions
Include form validation where appropriate
Implement routing for multi-page applications
Add loading states and error handling
Language-Specific Best Practices:

For Next.js + TypeScript (nextjs):

Use App Router (app/ directory)
Create server and client components appropriately
Use 'use client' directive when needed
Implement proper data fetching (async/await in server components)
Use Next.js Image component for images
Implement proper metadata and SEO
File structure:
app/page.tsx (main page)
app/layout.tsx (root layout with CSS links)
app/globals.css (Tailwind directives)
public/style.css (custom styles)
components/ (reusable components)
lib/ (utility functions)
Link CSS in layout.tsx: <link rel="stylesheet" href="/style.css" />
For HTML, CSS, JavaScript (html):

Create semantic HTML5 structure
Use modern CSS (Flexbox, Grid, CSS Variables, animations)
Implement responsive design with media queries
Add interactive JavaScript functionality
File structure:
index.html (main page)
about.html, contact.html (additional pages if needed)
style.css (all styling with proper organization)
script.js (all JavaScript functionality)
Include proper meta tags and SEO
For Python (python):

Use Flask or Django for web applications
Create proper project structure
Include requirements.txt with all dependencies
Implement proper routing and templates
Add database models if needed
File structure:
app.py or main.py (main application)
requirements.txt (dependencies)
templates/ (HTML templates)
static/ (CSS, JS, images)
models.py (database models if needed)
For Vite + React (vite):

Use functional components with hooks
Implement proper state management
Create reusable components
Use React Router for navigation
File structure:
src/main.tsx (entry point)
src/App.tsx (main component)
src/components/ (reusable components)
src/pages/ (page components)
src/index.css (global styles)
vite.config.ts (Vite configuration)
For Vue.js (vue):

Use Composition API
Create Single File Components (.vue)
Implement Vue Router for navigation
Use Pinia for state management if needed
File structure:
src/App.vue (main component)
src/main.ts (entry point)
src/components/ (reusable components)
src/views/ (page components)
src/router/ (routing configuration)
For React (react):

Use functional components with hooks
Implement proper state management
Create component hierarchy
Add React Router for multi-page apps
File structure:
src/App.js (main component)
src/index.js (entry point)
src/components/ (reusable components)
src/pages/ (page components)
src/index.css (global styles)
Styling Requirements - CRITICAL FOR PROFESSIONAL APPEARANCE:

Color Palette (DIFFERENT for each variant):

Use 3-5 colors maximum
Ensure proper contrast ratios (WCAG AA compliance)
Create cohesive color schemes appropriate for the variant style
Use CSS variables for easy theme management
Typography:

Use maximum 2 font families
Implement proper font hierarchy (h1-h6, body, captions)
Use appropriate line-height (1.4-1.6 for body text)
Ensure readable font sizes (minimum 16px for body)
Layout & Spacing:

Use consistent spacing scale (4px, 8px, 16px, 24px, 32px, etc.)
Implement proper whitespace and breathing room
Create responsive layouts (mobile-first approach)
Use Flexbox/Grid for modern layouts
Interactive Elements:

Add hover effects on buttons and links
Implement smooth transitions (0.2s-0.3s)
Add focus states for accessibility
Include loading states for async operations
Add subtle animations for better UX
Modern UI Patterns:

Rounded corners (border-radius: 8px-16px)
Subtle shadows for depth
Gradient backgrounds (when appropriate)
Card-based layouts
Sticky headers/navigation
Smooth scrolling
Database Integration - {databaseInstructions}
{databaseBestPractices}

Response Format - MUST be valid JSON:

{
  "files": [
    {
      "path": "appropriate/file/path",
      "content": "... COMPLETE file content with ALL code ..."
    }
  ],
  "imageUrls": ["url1", "url2", ...],
  "prd": {
    "features": [
      "Feature 1: Detailed description of what it does",
      "Feature 2: Detailed description of what it does",
      ...
    ],
    "reasoning": "Comprehensive explanation of your architectural decisions, technology choices, design patterns, and why this approach is optimal for THIS SPECIFIC VARIANT. Explain how this variant differs from the others.",
    "techStack": ["Technology 1", "Technology 2", "Technology 3", ...],
    "architecture": "Detailed description of the project structure, component hierarchy, data flow, and how different parts interact",
    "userFlow": [
      "Step 1: User lands on homepage and sees...",
      "Step 2: User clicks on... and the system...",
      "Step 3: User submits form and...",
      ...
    ]
  }
}

Testing & Validation:

Ensure all code is syntactically correct
Verify all imports are properly declared
Check that all functions are implemented
Validate that interactive elements have proper handlers
Ensure responsive design works on mobile, tablet, and desktop
For Simple Greetings: If user just says "Hi" or "Hello", respond with:
{
  "message": "Hello! I'm your AI development assistant, ready to build professional, production-ready applications. I can create projects in Next.js, React, Vue, HTML/CSS/JS, Python, and more. What would you like to build today?"
}

REMEMBER:

Generate COMPLETE, WORKING code - not placeholders or TODOs
Break complex projects into MULTIPLE files with proper organization
Implement ACTUAL functionality - all buttons, forms, and interactions must work
Create BEAUTIFUL, PROFESSIONAL designs with proper styling
Make each variant VISUALLY DISTINCT from the others
Follow industry best practices like v0.dev and bolt.new
Now, create an amazing, fully functional {selectedLanguage} project (VARIANT #{variantNumber}) for: {userInput}
`

function Playground({ projectName = "Untitled Project" }: PlaygroundProps) {
  const { user, isLoaded } = useUser()
  const { projectId } = useParams()
  const params = useSearchParams()
  const frameId = params.get("frameId")
  const [frameDetail, setFrameDetail] = useState<Frame | null>(null)
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [generatingVariants, setGeneratingVariants] = useState<number[]>([])
  const [liveCodeUpdates, setLiveCodeUpdates] = useState<{ path: string; content: string }[]>([]) // Added for live code updates

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

        /* Error Message */
        .error-message {
          background: #fee2e2;
          color: #dc2626;
          padding: 16px;
          border-radius: 8px;
          margin: 16px;
          text-align: center;
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
            next: "15.0.1",
            react: "^18.3.1",
            "react-dom": "^18.3.1",
            axios: "^1.7.7",
            "@clerk/nextjs": "^5.7.2"
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
      setErrorMessage("Please sign in to access your project.")
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
        variants: variants,
      })
      console.log("[v0] Frame data with variants saved successfully")
    } catch (error: any) {
      console.error("[v0] Error saving frame data:", error.message)
      setErrorMessage("Failed to save frame data. Please try again.")
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
      setErrorMessage("Failed to check deployment status. Please try again later.")
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
    if (!user || !frameId || !projectId) {
      setErrorMessage("Missing user authentication or project details.")
      setVariants([
        { variantNumber: 1, projectFiles: defaultProjectFiles },
        { variantNumber: 2, projectFiles: defaultProjectFiles },
        { variantNumber: 3, projectFiles: defaultProjectFiles },
        { variantNumber: 4, projectFiles: defaultProjectFiles },
      ])
      return
    }
    try {
      const result = await axios.get(`/api/frames?frameId=${frameId}&projectId=${projectId}`)
      console.log("[v0] Fetched frame details:", result.data)
      setFrameDetail(result.data)
      const fetchedMessages = result.data.chatMessages || []
      setMessages(fetchedMessages)

      if (result.data.variants && Array.isArray(result.data.variants) && result.data.variants.length > 0) {
        setVariants(result.data.variants)
      } else if (result.data.designCode) {
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
      if (error.response?.status === 404) {
        setErrorMessage("Project or frame not found. Please verify the project ID and frame ID.")
      } else if (error.response?.status === 403) {
        setErrorMessage("You do not have permission to access this project.")
      } else {
        setErrorMessage("Failed to load project details. Please try again later.")
      }
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
      setErrorMessage("Please sign in and ensure a valid project is selected.")
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
      setCurrentStep("🤔 Analyzing your request and planning the site structure...")
      setErrorMessage(null)
      setLiveCodeUpdates([]) // Reset live code updates

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
        { role: "assistant", content: "Starting site generation process...", streaming: true },
      ])

      const newVariants: Variant[] = []
      const buildSteps = [
        "🤔 Analyzing your request and planning the site structure...",
        "📝 Generating project files and folder structure...",
        "🎨 Applying variant-specific styling and design...",
        "🔧 Implementing interactive components and functionality...",
        "✅ Finalizing and validating the generated code...",
      ]

      for (let variantNum = 1; variantNum <= 4; variantNum++) {
        setGeneratingVariants((prev) => [...prev, variantNum])
        setCurrentStep(buildSteps[0])

        const enhancedPrompt = Prompt.replace(/{userInput}/g, userInput)
          .replace(/{selectedLanguage}/g, languageDisplayName)
          .replace(/{variantNumber}/g, variantNum.toString())
          .replace(/{databaseContext}/g, databaseContext)
          .replace(/{databaseInstructions}/g, databaseInstructions)
          .replace(/{databaseBestPractices}/g, databaseBestPractices)

        const fullPrompt = `${enhancedPrompt}\n${fileContents.join("\n")}`

        // Simulate step-by-step progress
        for (let step = 0; step < buildSteps.length; step++) {
          setCurrentStep(buildSteps[step])
          await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate processing time
        }

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
        let tempFiles: { path: string; status: "pending" | "complete" }[] = []

        while (true) {
          const { done, value } = await reader!.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          aiResponse += chunk

          // Process live file updates
          if (chunk.includes('"path":')) {
            const match = chunk.match(/"path":"([^"]+)"/)
            if (match && match[1]) {
              const folderName = match[1].split("/").slice(0, -1).join("/") || "/"
              tempFiles.push({ path: match[1], status: "pending" })
              setGeneratingFiles([...tempFiles])
              setMessages((prev) => [
                ...prev.slice(0, streamingMsgIndex),
                {
                  role: "assistant",
                  content: `Generating file: ${match[1]}`,
                  streaming: true,
                  filePath: match[1],
                  folderName,
                },
                ...prev.slice(streamingMsgIndex + 1),
              ])
              setLiveCodeUpdates((prev) => [...prev, { path: match[1], content: "" }])
              await new Promise(resolve => setTimeout(resolve, 500)) // Simulate file processing
              tempFiles = tempFiles.map(file =>
                file.path === match[1] ? { ...file, status: "complete" } : file
              )
              setGeneratingFiles([...tempFiles])
            }
          }

          // Update live code content
          if (chunk.includes('"content":')) {
            const contentMatch = chunk.match(/"content":"((?:[^"\\]|\\.)*)"/)
            if (contentMatch && contentMatch[1]) {
              const filePath = tempFiles[tempFiles.length - 1]?.path
              if (filePath) {
                setLiveCodeUpdates((prev) =>
                  prev.map((update) =>
                    update.path === filePath ? { ...update, content: contentMatch[1] } : update
                  )
                )
              }
            }
          }
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
      setGeneratingFiles([])
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
      setErrorMessage(`Failed to generate variants: ${error.message}`)
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
    <div className="h-screen flex flex-col bg-[#171818]">
      <PlaygroundHeader
        onSave={handleManualSave}
        projectId={projectId as string}
        projectName={projectName}
        messages={messages}
        projectFiles={currentProjectFiles}
      />
      {errorMessage && (
        <div className="error-message" role="alert">
          {errorMessage}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden ml-3">
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
          width={designWidth}
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
          liveCodeUpdates={liveCodeUpdates} // Pass live code updates
        />
      </div>
    </div>
  )
}

export default Playground









// "use client"

// import { useUser } from "@clerk/nextjs"
// import { useParams, useSearchParams } from "next/navigation"
// import PlaygroundHeader from "../_components/PlaygroundHeader"
// import ChatSection from "../_components/ChatSection"
// import WebsiteDesign from "../_components/WebsiteDesign"
// import axios from "axios"
// import { useEffect, useRef, useState } from "react"
// import { detectBuildIntent, prepareBuildingPrompt, prepareConversationalPrompt } from "@/lib/prompts"

// export type Frame = {
//   projectId23: string
//   frameId: string
//   designCode: string
//   chatMessages: Messages[]
//   projectFiles?: ProjectFile[]
//   prdData?: PRDData
//   variants?: Variant[]
// }

// export type Variant = {
//   id?: number
//   variantNumber: number
//   projectFiles: ProjectFile[]
//   prdData?: PRDData
//   imageUrls?: string[]
// }

// export type Messages = {
//   role: string
//   content: string
//   streaming?: boolean
//   filePath?: string
//   folderName?: string
// }

// export type ProjectFile = {
//   path: string
//   content: string
// }

// export type PRDData = {
//   features: string[]
//   reasoning: string
//   techStack: string[]
//   architecture: string
//   userFlow: string[]
//   timestamp: string
// }

// export interface PlaygroundProps {
//   projectName?: string
// }

// function Playground({ projectName = "Untitled Project" }: PlaygroundProps) {
//   const { user, isLoaded } = useUser()
//   const { projectId } = useParams()
//   const params = useSearchParams()
//   const frameId = params.get("frameId")
//   const [frameDetail, setFrameDetail] = useState<Frame | null>(null)
//   const [loading, setLoading] = useState(false)
//   const [messages, setMessages] = useState<Messages[]>([])
//   const [variants, setVariants] = useState<Variant[]>([])
//   const [activeVariantIndex, setActiveVariantIndex] = useState(0)
//   const [saveTrigger, setSaveTrigger] = useState(0)
//   const [designWidth, setDesignWidth] = useState(800)
//   const [generatingFiles, setGeneratingFiles] = useState<{ path: string; status: "pending" | "complete" }[]>([])
//   const [isRunningCommands, setIsRunningCommands] = useState(false)
//   const [currentStep, setCurrentStep] = useState("")
//   const [aiThinking, setAiThinking] = useState(false)
//   const [thinkingTime, setThinkingTime] = useState(0)
//   const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null)
//   const [streamingMessage, setStreamingMessage] = useState("")
//   const [errorMessage, setErrorMessage] = useState<string | null>(null)
//   const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null)
//   const [generatingVariants, setGeneratingVariants] = useState<number[]>([])
//   const [liveCodeUpdates, setLiveCodeUpdates] = useState<{ path: string; content: string }[]>([])

//   // Default project files to ensure iframe has content
//   const defaultProjectFiles: ProjectFile[] = [
//     {
//       path: "app/page.tsx",
//       content: `
//         import React from 'react';
//         export default function Home() {
//           return (
//             <div className="container">
//               <h1>Welcome to Your Project</h1>
//               <p>This is a default page to get you started. Click elements to edit them!</p>
//               <button className="btn">Click Me</button>
//             </div>
//           );
//         }
//       `,
//     },
//     {
//       path: "app/layout.tsx",
//       content: `
//         import type { Metadata } from "next"
//         import "./globals.css"
//         export const metadata: Metadata = {
//           title: "Generated App",
//           description: "Generated by AI",
//         }
//         export default function RootLayout({
//           children,
//         }: {
//           children: React.ReactNode
//         }) {
//           return (
//             <html lang="en">
//               <head>
//                 <link rel="stylesheet" href="/style.css" />
//               </head>
//               <body>{children}</body>
//             </html>
//           )
//         }
//       `,
//     },
//     {
//       path: "app/globals.css",
//       content: `
//         @tailwind base;
//         @tailwind components;
//         @tailwind utilities;
//       `,
//     },
//     {
//       path: "public/style.css",
//       content: `
//         /* Reset and Base Styles */
//         * {
//           margin: 0;
//           padding: 0;
//           box-sizing: border-box;
//         }
//         body {
//           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
//           line-height: 1.6;
//           color: #333;
//           background: #f8fafc;
//         }
//         .container {
//           max-width: 1200px;
//           margin: 0 auto;
//           padding: 20px;
//         }
//         button, .btn {
//           height: 55px;
//           background: linear-gradient(180deg, #363636 0%, #1B1B1B 50%, #000000 100%);
//           border-radius: 11px;
//           border: 0;
//           outline: none;
//           color: #ffffff;
//           font-size: 13px;
//           font-weight: 700;
//           padding: 0 20px;
//           cursor: pointer;
//           transition: all 0.3s cubic-bezier(0.15, 0.83, 0.66, 1);
//         }
//         button:hover, .btn:hover {
//           box-shadow: 0px 0px 0px 2px #FFFFFF, 0px 0px 0px 4px #0000003a;
//         }
//         .error-message {
//           background: #fee2e2;
//           color: #dc2626;
//           padding: 16px;
//           border-radius: 8px;
//           margin: 16px;
//           text-align: center;
//         }
//       `,
//     },
//     {
//       path: "package.json",
//       content: JSON.stringify(
//         {
//           name: "nextjs-project",
//           version: "0.1.0",
//           private: true,
//           scripts: {
//             dev: "next dev --port 3000",
//             build: "next build",
//             start: "next start",
//           },
//           dependencies: {
//             next: "15.0.1",
//             react: "^18.3.1",
//             "react-dom": "^18.3.1",
//             axios: "^1.7.7",
//             "@clerk/nextjs": "^5.7.2",
//           },
//           devDependencies: {
//             "@types/node": "^20",
//             "@types/react": "^18",
//             "@types/react-dom": "^18",
//             typescript: "^5",
//             tailwindcss: "^3.4.1",
//             postcss: "^8",
//             autoprefixer: "^10.4.19",
//           },
//         },
//         null,
//         2,
//       ),
//     },
//   ]

//   // Handle websiteGenerated event for compatibility with ChatSection
//   useEffect(() => {
//     const handleWebsiteGenerated = (event: Event) => {
//       const websiteData = (event as CustomEvent).detail
//       console.log("[v0] Received websiteGenerated event:", websiteData)

//       const projectFiles: ProjectFile[] = websiteData.components.map((comp: { type: string; content: string }, index: number) => ({
//         path: `app/components/${comp.type}-${index}.tsx`,
//         content: `
//           import React from 'react';
//           export default function ${comp.type.charAt(0).toUpperCase() + comp.type.slice(1)}() {
//             return (
//               ${comp.content}
//             );
//           }
//         `,
//       }))
//       const newVariant: Variant = {
//         variantNumber: variants.length + 1,
//         projectFiles: [
//           ...projectFiles,
//           {
//             path: "app/page.tsx",
//             content: `
//               import React from 'react';
//               ${projectFiles.map((_, idx) => `import Component${idx} from './components/${websiteData.components[idx].type}-${idx}';`).join('\n')}
//               export default function Home() {
//                 return (
//                   <div className="container">
//                     <h1>${websiteData.title}</h1>
//                     <p>${websiteData.description}</p>
//                     ${projectFiles.map((_, idx) => `<Component${idx} />`).join('\n')}
//                   </div>
//                 );
//               }
//             `,
//           },
//           ...defaultProjectFiles.filter((file) => file.path !== "app/page.tsx"),
//         ],
//         imageUrls: websiteData.imageUrls,
//         prdData: {
//           features: [`${websiteData.title} page`, "Responsive design"],
//           reasoning: `Generated based on user request: ${websiteData.description}`,
//           techStack: ["Next.js", "React", "Tailwind CSS"],
//           architecture: "Component-based architecture with reusable components",
//           userFlow: ["User lands on homepage", "Views generated components"],
//           timestamp: new Date().toISOString(),
//         },
//       }

//       setVariants((prev) => {
//         const totalVariants = websiteData.multiVariant ? 4 : 1
//         const newVariants = websiteData.multiVariant
//           ? Array.from({ length: 4 }, (_, i) => ({
//               ...newVariant,
//               variantNumber: i + 1,
//               prdData: {
//                 ...newVariant.prdData!,
//                 features: [`${websiteData.title} (Variant ${i + 1})`, ...newVariant.prdData!.features.slice(1)],
//               },
//             }))
//           : [newVariant]
//         return newVariants
//       })
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: `✅ Successfully generated ${websiteData.multiVariant ? "4 variants" : "1 website"}!`,
//         },
//       ])
//       setSaveTrigger((prev) => prev + 1)
//     }

//     window.addEventListener("websiteGenerated", handleWebsiteGenerated)
//     return () => window.removeEventListener("websiteGenerated", handleWebsiteGenerated)
//   }, [variants])

//   useEffect(() => {
//     if (isLoaded && frameId && projectId && user) {
//       GetFrameDetails()
//       checkDeployment()
//     } else if (isLoaded && !user) {
//       console.log("[v0] User not authenticated, using default files")
//       setVariants([
//         { variantNumber: 1, projectFiles: defaultProjectFiles },
//         { variantNumber: 2, projectFiles: defaultProjectFiles },
//         { variantNumber: 3, projectFiles: defaultProjectFiles },
//         { variantNumber: 4, projectFiles: defaultProjectFiles },
//       ])
//       setErrorMessage("Please sign in to access your project.")
//     }
//   }, [frameId, projectId, isLoaded, user])

//   useEffect(() => {
//     if (saveTrigger > 0) {
//       saveFrameData()
//     }
//   }, [saveTrigger])

//   const saveFrameData = async () => {
//     if (!user || !frameId || !projectId || !messages.length) return
//     try {
//       await axios.put("/api/frames", {
//         designCode: JSON.stringify(variants[activeVariantIndex]?.projectFiles || []),
//         chatMessages: messages,
//         frameId,
//         projectId,
//         prdData: variants[activeVariantIndex]?.prdData
//           ? JSON.stringify(variants[activeVariantIndex].prdData)
//           : undefined,
//         variants: variants,
//       })
//       console.log("[v0] Frame data saved successfully")
//     } catch (error: any) {
//       console.error("[v0] Error saving frame data:", error.message)
//       setErrorMessage("Failed to save frame data. Please try again.")
//     }
//   }

//   const checkDeployment = async () => {
//     try {
//       const response = await axios.get(`/api/deploy?projectId=${projectId}`)
//       if (response.status === 200 && response.data.deployed && response.data.url) {
//         setDeploymentUrl(response.data.url)
//         localStorage.setItem(`deploymentUrl_${projectId}`, response.data.url)
//       }
//     } catch (error: any) {
//       console.error("[v0] Failed to check deployment status:", error.message)
//     }
//   }

//   const GetFrameDetails = async () => {
//     if (!user || !frameId || !projectId) {
//       setVariants([
//         { variantNumber: 1, projectFiles: defaultProjectFiles },
//         { variantNumber: 2, projectFiles: defaultProjectFiles },
//         { variantNumber: 3, projectFiles: defaultProjectFiles },
//         { variantNumber: 4, projectFiles: defaultProjectFiles },
//       ])
//       return
//     }
//     try {
//       const result = await axios.get(`/api/frames?frameId=${frameId}&projectId=${projectId}`)
//       setFrameDetail(result.data)
//       setMessages(result.data.chatMessages || [])
//       if (result.data.variants && Array.isArray(result.data.variants)) {
//         setVariants(result.data.variants)
//       } else if (result.data.designCode) {
//         const parsed = JSON.parse(result.data.designCode)
//         setVariants([
//           { variantNumber: 1, projectFiles: parsed },
//           { variantNumber: 2, projectFiles: defaultProjectFiles },
//           { variantNumber: 3, projectFiles: defaultProjectFiles },
//           { variantNumber: 4, projectFiles: defaultProjectFiles },
//         ])
//       } else {
//         setVariants([
//           { variantNumber: 1, projectFiles: defaultProjectFiles },
//           { variantNumber: 2, projectFiles: defaultProjectFiles },
//           { variantNumber: 3, projectFiles: defaultProjectFiles },
//           { variantNumber: 4, projectFiles: defaultProjectFiles },
//         ])
//       }
//     } catch (error: any) {
//       console.error("[v0] Error fetching frame details:", error.message)
//       setVariants([
//         { variantNumber: 1, projectFiles: defaultProjectFiles },
//         { variantNumber: 2, projectFiles: defaultProjectFiles },
//         { variantNumber: 3, projectFiles: defaultProjectFiles },
//         { variantNumber: 4, projectFiles: defaultProjectFiles },
//       ])
//       setErrorMessage("Failed to load project details.")
//     }
//   }

//   const SendMessage = async (
//     userInput: string,
//     selectedModel: string,
//     selectedLanguage: string,
//     dbConnection?: any,
//     files?: File[],
//     discussMode?: boolean,
//     multiVariant?: boolean,
//   ) => {
//     if (!user || !frameId || !projectId) {
//       setMessages((prev) => [
//         ...prev,
//         { role: "assistant", content: "Please sign in and select a valid project." },
//       ])
//       setErrorMessage("Please sign in and select a valid project.")
//       return
//     }

//     setMessages((prev) => [...prev, { role: "user", content: userInput }])

//     // Handle greetings
//     if (["hi", "hello", "hey"].includes(userInput.toLowerCase().trim())) {
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content:
//             "Hello! I'm your AI development assistant, ready to build professional, production-ready applications. I can create projects in Next.js, React, Vue, HTML/CSS/JS, Python, and more. What would you like to build today?",
//         },
//       ])
//       return
//     }

//     const isBuildRequest = detectBuildIntent(userInput)
//     if (!isBuildRequest || discussMode) {
//       setLoading(true)
//       setStreamingMessage("")
//       const prompt = prepareConversationalPrompt(userInput)
//       try {
//         const result = await fetch("/api/ai-model", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             model: selectedModel,
//             messages: [
//               ...messages.map((m) => ({ role: m.role, content: m.content })),
//               { role: "user", content: prompt },
//             ],
//             discussMode: true,
//           }),
//         })
//         const reader = result.body?.getReader()
//         const decoder = new TextDecoder()
//         let response = ""
//         while (true) {
//           const { done, value } = await reader!.read()
//           if (done) break
//           response += decoder.decode(value, { stream: true })
//           setStreamingMessage(response)
//           setMessages((prev) => [
//             ...prev.slice(0, -1),
//             { role: "assistant", content: response, streaming: true },
//             ...prev.slice(-1),
//           ])
//         }
//         setMessages((prev) => [
//           ...prev.slice(0, -1),
//           { role: "assistant", content: response, streaming: false },
//         ])
//         setLoading(false)
//       } catch (error: any) {
//         setMessages((prev) => [
//           ...prev,
//           { role: "assistant", content: `Error: ${error.message}` },
//         ])
//         setErrorMessage("Failed to process conversational request.")
//         setLoading(false)
//       }
//       return
//     }

//     // Build Mode
//     setLoading(true)
//     setAiThinking(true)
//     setCurrentStep("Analyzing request and planning site structure...")
//     setGeneratingFiles([])
//     setGeneratingVariants([1, 2, 3, 4])
//     const totalVariants = multiVariant ? 4 : 1
//     const newVariants: Variant[] = []

//     try {
//       for (let variantNum = 1; variantNum <= totalVariants; variantNum++) {
//         setCurrentStep(`Generating Variant ${variantNum}...`)
//         const prompt = prepareBuildingPrompt(userInput, selectedLanguage, variantNum, totalVariants, dbConnection)
//         const result = await fetch("/api/ai-model", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             model: selectedModel,
//             messages: [{ role: "user", content: prompt }],
//             discussMode: false,
//             language: selectedLanguage,
//             multiVariant,
//           }),
//         })

//         if (!result.ok) throw new Error(`API error: ${result.statusText}`)

//         const reader = result.body?.getReader()
//         const decoder = new TextDecoder()
//         let response = ""
//         let tempFiles: { path: string; status: "pending" | "complete" }[] = []

//         while (true) {
//           const { done, value } = await reader!.read()
//           if (done) break
//           const chunk = decoder.decode(value, { stream: true })
//           response += chunk

//           if (chunk.includes('"path":')) {
//             const match = chunk.match(/"path":"([^"]+)"/)
//             if (match && match[1]) {
//               tempFiles.push({ path: match[1], status: "pending" })
//               setGeneratingFiles([...tempFiles])
//               setMessages((prev) => [
//                 ...prev,
//                 { role: "assistant", content: `Generating file: ${match[1]}`, filePath: match[1], folderName: match[1].split("/").slice(0, -1).join("/") },
//               ])
//               setLiveCodeUpdates((prev) => [...prev, { path: match[1], content: "" }])
//               tempFiles = tempFiles.map((file) => (file.path === match[1] ? { ...file, status: "complete" } : file))
//               setGeneratingFiles([...tempFiles])
//             }
//           }
//         }

//         let parsed: any
//         if (response.startsWith("__WEBSITE_DATA__:")) {
//           const jsonStr = response.replace("__WEBSITE_DATA__:", "").trim()
//           const websiteData = JSON.parse(jsonStr)
//           const projectFiles: ProjectFile[] = websiteData.components.map((comp: { type: string; content: string }, index: number) => ({
//             path: `app/components/${comp.type}-${index}.tsx`,
//             content: `
//               import React from 'react';
//               export default function ${comp.type.charAt(0).toUpperCase() + comp.type.slice(1)}() {
//                 return (
//                   ${comp.content}
//                 );
//               }
//             `,
//           }))
//           newVariants.push({
//             variantNumber: variantNum,
//             projectFiles: [
//               ...projectFiles,
//               {
//                 path: "app/page.tsx",
//                 content: `
//                   import React from 'react';
//                   ${projectFiles.map((_, idx) => `import Component${idx} from './components/${websiteData.components[idx].type}-${idx}';`).join('\n')}
//                   export default function Home() {
//                     return (
//                       <div className="container">
//                         <h1>${websiteData.title}</h1>
//                         <p>${websiteData.description}</p>
//                         ${projectFiles.map((_, idx) => `<Component${idx} />`).join('\n')}
//                       </div>
//                     );
//                   }
//                 `,
//               },
//               ...defaultProjectFiles.filter((file) => file.path !== "app/page.tsx"),
//             ],
//             imageUrls: websiteData.imageUrls,
//             prdData: {
//               features: [`${websiteData.title} page`, "Responsive design"],
//               reasoning: `Generated for request: ${websiteData.description} (Variant ${variantNum})`,
//               techStack: ["Next.js", "React", "Tailwind CSS"],
//               architecture: "Component-based with dynamic imports",
//               userFlow: ["User lands on homepage", "Interacts with components"],
//               timestamp: new Date().toISOString(),
//             },
//           })
//         } else {
//           parsed = JSON.parse(response.replace(/```json\s*|\s*```/g, ""))
//           newVariants.push({
//             variantNumber: variantNum,
//             projectFiles: parsed.files || defaultProjectFiles,
//             prdData: parsed.prd ? { ...parsed.prd, timestamp: new Date().toISOString() } : undefined,
//             imageUrls: parsed.imageUrls || [],
//           })
//         }
//       }

//       setVariants(newVariants)
//       setMessages((prev) => [
//         ...prev,
//         { role: "assistant", content: `✅ Generated ${totalVariants} variant${totalVariants > 1 ? "s" : ""}! Switch between them using the variant cards.` },
//       ])
//       setSaveTrigger((prev) => prev + 1)
//     } catch (error: any) {
//       setMessages((prev) => [
//         ...prev,
//         { role: "assistant", content: `Error generating website: ${error.message}. Using default files.` },
//       ])
//       setErrorMessage("Failed to generate website. Using default files.")
//       setVariants([
//         { variantNumber: 1, projectFiles: defaultProjectFiles },
//         { variantNumber: 2, projectFiles: defaultProjectFiles },
//         { variantNumber: 3, projectFiles: defaultProjectFiles },
//         { variantNumber: 4, projectFiles: defaultProjectFiles },
//       ])
//     } finally {
//       setLoading(false)
//       setAiThinking(false)
//       setCurrentStep("")
//       setGeneratingFiles([])
//       setGeneratingVariants([])
//     }
//   }

//   useEffect(() => {
//     if (aiThinking) {
//       thinkingTimerRef.current = setInterval(() => setThinkingTime((prev) => prev + 0.1), 100)
//     } else {
//       if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current)
//     }
//     return () => {
//       if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current)
//     }
//   }, [aiThinking])

//   const currentProjectFiles = variants[activeVariantIndex]?.projectFiles || defaultProjectFiles
//   const currentPRDData = variants[activeVariantIndex]?.prdData || null

//   const handleFilesChange = (newFiles: ProjectFile[]) => {
//     setVariants((prev) => {
//       const updated = [...prev]
//       if (updated[activeVariantIndex]) {
//         updated[activeVariantIndex] = { ...updated[activeVariantIndex], projectFiles: newFiles }
//       }
//       return updated
//     })
//     setSaveTrigger((prev) => prev + 1)
//   }

//   return (
//     <div className="h-screen flex flex-col bg-[#171818]">
//       <PlaygroundHeader
//         onSave={saveFrameData}
//         projectId={projectId as string}
//         projectName={projectName}
//         messages={messages}
//         projectFiles={currentProjectFiles}
//       />
//       {errorMessage && (
//         <div className="error-message" role="alert">
//           {errorMessage}
//         </div>
//       )}
//       <div className="flex flex-1 overflow-hidden ml-3">
//         <ChatSection
//           messages={messages}
//           onSend={SendMessage}
//           isLoading={loading}
//           generatingFiles={generatingFiles}
//           isRunningCommands={isRunningCommands}
//           currentStep={currentStep}
//           aiThinking={aiThinking}
//           thinkingTime={thinkingTime}
//           projectId={projectId as string}
//           streamingMessage={streamingMessage}
//           generatingVariants={generatingVariants}
//           width={designWidth}
//         />
//         <WebsiteDesign
//           projectFiles={currentProjectFiles}
//           onFilesChange={handleFilesChange}
//           width={designWidth}
//           onWidthChange={setDesignWidth}
//           onAutoRunStart={() => setIsRunningCommands(true)}
//           onAutoRunComplete={() => setIsRunningCommands(false)}
//           projectId={projectId as string}
//           prdData={currentPRDData}
//           variants={variants}
//           activeVariantIndex={activeVariantIndex}
//           onVariantChange={setActiveVariantIndex}
//           liveCodeUpdates={liveCodeUpdates}
//         />
//       </div>
//     </div>
//   )
// }

// export default Playground