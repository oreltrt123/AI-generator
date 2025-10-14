"use client"
import { ArrowUp, HomeIcon, Key, LayoutDashboard, Loader2Icon, User, Store, Briefcase } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SignInButton, useUser } from '@clerk/nextjs'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Tooltip, 
  TooltipContent, 
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import "./hero.css"
const suggestions = [
  {
    label: 'SaaS Landing',
    prompt: `Create a high-conversion landing page for a modern SaaS startup offering AI-driven tools that improve productivity and workflow automation.

Structure:
- Hero Section: Large headline ("Supercharge Your Work with AI"), subheadline summarizing core value, CTA buttons ("Start Free", "Watch Demo"), with a clean gradient or 3D background.
- Key Features: Four cards with icons and short texts — Smart Automation, Real-Time Insights, Cloud Integration, 24/7 AI Support.
- Product Preview: Interactive mockup carousel showcasing the app.
- Social Proof: Customer logos and testimonials.
- Pricing Plans: 3-tier layout (Starter, Pro, Enterprise).
- FAQ Section: Expandable accordions with 5 questions.
- Footer: About, Careers, Privacy, and newsletter signup.

Visual style: Futuristic yet minimal — blue/purple gradient, soft glassmorphism, clean sans-serif fonts.
Goal: Drive conversions and build user trust.`,
    icon: LayoutDashboard
  },
  {
    label: 'Founder Site',
    prompt: `Build a personal portfolio website for a startup founder or developer that highlights their story, projects, and experience.

Structure:
- Hero: Profile photo or avatar, name, and tagline ("Building scalable ideas with AI and design").
- About: Bio section, skills grid, and timeline of experience.
- Projects: Cards with screenshots, descriptions, tech stack, and "View Live" buttons.
- Testimonials: Collaborator or client feedback with photos.
- Blog: 3–5 post previews about AI, tech, or entrepreneurship.
- Contact: Email form and social links.

Style: Minimal white layout, soft shadows, rounded cards.
Goal: Help the founder attract clients and show professionalism.`,
    icon: User
  },
  {
    label: 'AI Agency',
    prompt: `Design a full website for an AI agency offering automation and data intelligence services.

Structure:
- Landing Page: Hero headline ("We Build Smarter Businesses with AI") and CTA ("Book a Consultation").
- Services: AI Chatbots, Predictive Analytics, Workflow Automation, Machine Learning Models.
- Case Studies: Real business results with measurable impact.
- Team: Grid of team members with photos and LinkedIn links.
- Testimonials: Client quotes with logos.
- Blog: 3–4 short posts about AI trends.
- Contact: Clean form, integrated calendar, and map.

Style: Dark background with neon blue and violet highlights, futuristic typography.
Goal: Build credibility and convert leads.`,
    icon: Briefcase
  },
  {
    label: 'Fashion Store',
    prompt: `Create an elegant e-commerce landing page for an eco-friendly clothing brand.

Structure:
- Hero: Full-width lifestyle image, tagline ("Look Good. Do Good."), CTAs ("Shop Now", "Our Story").
- Collections: Carousel of featured items with names and prices.
- Sustainability: Icons and text about eco-friendly materials.
- Reviews: Customer testimonials and star ratings.
- Newsletter: Signup form ("Join Our Eco Community").
- Footer: Store links, contact info, and payment badges.

Style: Soft neutral tones, modern serif fonts, minimalist layout.
Goal: Promote ethical fashion and drive sales.`,
    icon: Store
  },
  {
    label: 'Analytics App',
    prompt: `Build a complete multi-page analytics dashboard for an AI SaaS platform.

Pages:
- Dashboard: KPIs (users, revenue, conversion), line/pie/bar charts.
- Reports: Data filters, export buttons, paginated tables.
- User Management: Editable user list with avatars.
- Settings: Theme toggle, notification settings, API key management.
- Support: FAQ list and integrated live chat.

Style: Responsive UI, sidebar navigation, clean white layout with subtle gradients.
Goal: Deliver a professional, data-driven dashboard experience.`,
    icon: HomeIcon
  }
]

function Hero() {
  const [userInput, setUserInput] = useState<string>()
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const CreateNewProject = async () => {
    if (!isLoaded || !user) {
      toast.error('Please sign in first!')
      return
    }

    setLoading(true)
    const projectId = uuidv4()
    const frameId = generateRandomFrameNumber()
    const messages = [
      {
        role: 'user',
        content: userInput
      }
    ]

    try {
      await axios.post('/api/projects', {
        projectId,
        frameId,
        messages,
        userId: user.id
      })
      toast.success('Project created!')
      router.push(`/playground/${projectId}?frameId=${frameId}`)
      setLoading(false)
    } catch (e) {
      toast.error('Internal server error!')
      console.log(e)
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col items-center h-[100vh] justify-center'>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="100%"
        width="100%"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: -9999,
        }}
      >
        <defs>
          <pattern
            id="dottedGrid"
            patternUnits="userSpaceOnUse"
            width={30}
            height={30}
          >
            <circle fill="rgba(0,0,0,0.15)" r={1} cx={2} cy={2} />
          </pattern>
        </defs>
        <rect fill="url(#dottedGrid)" width="100%" height="100%" />
      </svg>

      <h2 style={{ fontSize: "50px" }} className="text-black font-sans font-light leading-relaxed max-w-3xl mx-auto text-center">
        You speak, we think and build.
      </h2>
    <TooltipProvider delayDuration={100}>
      <p
        style={{ fontSize: "16px" }}
        className="text-black font-sans font-light leading-relaxed max-w-3xl mx-auto text-center mt-[-15px] flex justify-center flex-wrap gap-1"
      >
        {/* IDEA */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help hover:underline">idea</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-sm text-white bg-black">
            An <strong>idea</strong> is the initial concept — your vision for a product or project before building begins.
          </TooltipContent>
        </Tooltip>

        <span>{" -> "}</span>

        {/* BUILD */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help hover:underline">build</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-sm text-white bg-black">
            <strong>Build</strong> means creating and developing the website, app, or product using design and code.
          </TooltipContent>
        </Tooltip>

        <span>{" -> "}</span>

        {/* ADVERTISING */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help hover:underline">advertising</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-sm text-white bg-black">
            <strong>Advertising</strong> refers to promoting your creation through online campaigns and social media.
          </TooltipContent>
        </Tooltip>

        <span>{" -> "}</span>

        {/* MARKETING */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-blue-500 font-medium cursor-help hover:underline">Marketing</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-sm text-white bg-black">
            <strong>Marketing</strong> is the long-term process of building awareness, trust, and engagement for your brand or product.
          </TooltipContent>
        </Tooltip>

        <span>{"."}</span>
      </p>
    </TooltipProvider>

      <div className='w-full max-w-2xl p-1 bg-gray-300 mt-5 rounded-2xl relative'>
        <textarea
          placeholder='Turn imagination into websites that work your way.'
          value={userInput}
          onChange={(event) => setUserInput(event.target.value)}
          className="w-full p-3 pr-14 bg-[#ffffff] top-0.5 relative rounded-lg resize-none focus:outline-none"
          style={{ height: '144px' }}
        />
        <div className='absolute top-2 right-2'>
          {!isLoaded ? (
            <div>Loading...</div>
          ) : user ? (
            <Button
              disabled={!userInput || loading}
              onClick={CreateNewProject}
              className='text-white mt-1 mr-1 bg-gray-400 hover:bg-gray-400'
            >
              {loading ? <Loader2Icon className='animate-spin' /> : <ArrowUp />}
            </Button>
          ) : (
            <SignInButton forceRedirectUrl={'/workspace'}>
              <Button disabled={loading}>Sign In to Create</Button>
            </SignInButton>
          )}
        </div>
      </div>

      <div className='mt-4 gap-3 flex flex-wrap justify-center'>
        {suggestions.map((suggestion, index) => (
          <div className="sp" key={index}>
            <button
              className="sparkle-button bg-white border"
              onClick={() => setUserInput(suggestion.prompt)}
            >
              <span className="spark"></span>
              <span className="backdrop"></span>
              <span className="text text-accent-foreground">
                {suggestion.label}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Hero

const generateRandomFrameNumber = () => {
  const num = Math.floor(Math.random() * 10000)
  return num
}



// "use client"

// import { ArrowUp, HomeIcon, Key, LayoutDashboard, Loader2Icon, User, Store, Briefcase, Sparkles, Settings, FileText, Check, Gem, BrainCircuit, ImageIcon } from 'lucide-react'
// import React, { useState, useEffect, useRef } from 'react'
// import { Button } from '@/components/ui/button'
// import { SignInButton, useUser } from '@clerk/nextjs'
// import axios from 'axios'
// import { v4 as uuidv4 } from 'uuid'
// import { toast } from 'sonner'
// import { useRouter } from 'next/navigation'
// import {
//   Tooltip, 
//   TooltipProvider,
//   TooltipTrigger,
//   TooltipContent,
// } from "@/components/ui/tooltip"
// import {
//   Popover,
//   PopoverTrigger,
//   PopoverContent,
// } from "@/components/ui/popover"
// import {
//   Command,
//   CommandList,
//   CommandEmpty,
//   CommandGroup,
//   CommandItem,
// } from "@/components/ui/command"
// import { SiOpenai, SiGooglegemini, SiAnthropic, SiX } from "react-icons/si"
// import { Tip } from "@/components/tooltip"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Badge } from "@/components/ui/badge" // Added missing import
// import SettingsModal from "../playground/_components/SettingsModal"
// import { models } from "@/types/models"
// import "./hero.css"


// const suggestions = [
//   {
//     label: 'SaaS Landing',
//     prompt: `Create a high-conversion landing page for a modern SaaS startup offering AI-driven tools that improve productivity and workflow automation.

// Structure:
// - Hero Section: Large headline ("Supercharge Your Work with AI"), subheadline summarizing core value, CTA buttons ("Start Free", "Watch Demo"), with a clean gradient or 3D background.
// - Key Features: Four cards with icons and short texts — Smart Automation, Real-Time Insights, Cloud Integration, 24/7 AI Support.
// - Product Preview: Interactive mockup carousel showcasing the app.
// - Social Proof: Customer logos and testimonials.
// - Pricing Plans: 3-tier layout (Starter, Pro, Enterprise).
// - FAQ Section: Expandable accordions with 5 questions.
// - Footer: About, Careers, Privacy, and newsletter signup.

// Visual style: Futuristic yet minimal — blue/purple gradient, soft glassmorphism, clean sans-serif fonts.
// Goal: Drive conversions and build user trust.`,
//     icon: LayoutDashboard
//   },
//   {
//     label: 'Founder Site',
//     prompt: `Build a personal portfolio website for a startup founder or developer that highlights their story, projects, and experience.

// Structure:
// - Hero: Profile photo or avatar, name, and tagline ("Building scalable ideas with AI and design").
// - About: Bio section, skills grid, and timeline of experience.
// - Projects: Cards with screenshots, descriptions, tech stack, and "View Live" buttons.
// - Testimonials: Collaborator or client feedback with photos.
// - Blog: 3–5 post previews about AI, tech, or entrepreneurship.
// - Contact: Email form and social links.

// Style: Minimal white layout, soft shadows, rounded cards.
// Goal: Help the founder attract clients and show professionalism.`,
//     icon: User
//   },
//   {
//     label: 'AI Agency',
//     prompt: `Design a full website for an AI agency offering automation and data intelligence services.

// Structure:
// - Landing Page: Hero headline ("We Build Smarter Businesses with AI") and CTA ("Book a Consultation").
// - Services: AI Chatbots, Predictive Analytics, Workflow Automation, Machine Learning Models.
// - Case Studies: Real business results with measurable impact.
// - Team: Grid of team members with photos and LinkedIn links.
// - Testimonials: Client quotes with logos.
// - Blog: 3–4 short posts about AI trends.
// - Contact: Clean form, integrated calendar, and map.

// Style: Dark background with neon blue and violet highlights, futuristic typography.
// Goal: Build credibility and convert leads.`,
//     icon: Briefcase
//   },
//   {
//     label: 'Fashion Store',
//     prompt: `Create an elegant e-commerce landing page for an eco-friendly clothing brand.

// Structure:
// - Hero: Full-width lifestyle image, tagline ("Look Good. Do Good."), CTAs ("Shop Now", "Our Story").
// - Collections: Carousel of featured items with names and prices.
// - Sustainability: Icons and text about eco-friendly materials.
// - Reviews: Customer testimonials and star ratings.
// - Newsletter: Signup form ("Join Our Eco Community").
// - Footer: Store links, contact info, and payment badges.

// Style: Soft neutral tones, modern serif fonts, minimalist layout.
// Goal: Promote ethical fashion and drive sales.`,
//     icon: Store
//   },
//   {
//     label: 'Analytics App',
//     prompt: `Build a complete multi-page analytics dashboard for an AI SaaS platform.

// Pages:
// - Dashboard: KPIs (users, revenue, conversion), line/pie/bar charts.
// - Reports: Data filters, export buttons, paginated tables.
// - User Management: Editable user list with avatars.
// - Settings: Theme toggle, notification settings, API key management.
// - Support: FAQ list and integrated live chat.

// Style: Responsive UI, sidebar navigation, clean white layout with subtle gradients.
// Goal: Deliver a professional, data-driven dashboard experience.`,
//     icon: HomeIcon
//   }
// ]

// type UserSettings = {
//   activeModels: (keyof typeof models)[]
//   customInstructions: string
// }

// type FileContent = {
//   name: string
//   content: string
//   type: "text" | "code" | "image"
// }

// function Hero() {
//   const [userInput, setUserInput] = useState<string>("")
//   const { user, isLoaded } = useUser()
//   const router = useRouter()
//   const [loading, setLoading] = useState(false)
//   const [selectedModel, setSelectedModel] = useState<"gemini" | "deepseek" | "gpt-oss">("gemini")
//   const [showModelSelector, setShowModelSelector] = useState(false)
//   const [showSettings, setShowSettings] = useState(false)
//   const [isImproving, setIsImproving] = useState(false)
//   const [uploadedFiles, setUploadedFiles] = useState<FileContent[]>([])
//   const [previewFile, setPreviewFile] = useState<FileContent | null>(null)
//   const fileInputRef = useRef<HTMLInputElement>(null)
//   const [settings, setSettings] = useState<UserSettings>({
//     activeModels: ["gemini", "deepseek", "gpt-oss"],
//     customInstructions: "",
//   })

//   useEffect(() => {
//     if (user?.primaryEmailAddress?.emailAddress) {
//       const stored = localStorage.getItem(`settings_${user.primaryEmailAddress.emailAddress}`)
//       if (stored) {
//         const parsed = JSON.parse(stored)
//         setSettings(parsed)
//         if (!parsed.activeModels.includes(selectedModel)) {
//           setSelectedModel(parsed.activeModels[0] || "gemini")
//         }
//       }
//     }
//   }, [user?.primaryEmailAddress?.emailAddress, selectedModel])

//   const saveSettings = async (newSettings: Partial<UserSettings>) => {
//     const updated = { ...settings, ...newSettings }
//     setSettings(updated)
//     if (user?.primaryEmailAddress?.emailAddress) {
//       localStorage.setItem(`settings_${user.primaryEmailAddress.emailAddress}`, JSON.stringify(updated))
//     }
//   }

//   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const files = event.target.files
//     if (!files) return

//     const newFiles: FileContent[] = []
//     for (const file of Array.from(files)) {
//       const isLargeFile = file.size > 10 * 1024 * 1024 // 10MB
//       const fileType = file.type.startsWith("image/")
//         ? "image"
//         : file.name.endsWith(".ts") || file.name.endsWith(".tsx") || file.name.endsWith(".js") || file.name.endsWith(".jsx")
//         ? "code"
//         : "text"

//       const reader = new FileReader()
//       reader.onload = (e) => {
//         const content = e.target?.result as string
//         if (isLargeFile) {
//           newFiles.push({ name: file.name, content, type: fileType })
//         } else {
//           setUserInput((prev) => `${prev}\n\nFile: ${file.name}\nContent:\n${content}`)
//         }
//         if (newFiles.length === files.length) {
//           setUploadedFiles((prev) => [...prev, ...newFiles])
//         }
//       }
//       if (fileType === "image") {
//         reader.readAsDataURL(file)
//       } else {
//         reader.readAsText(file)
//       }
//     }
//   }

//   const triggerFileInput = () => {
//     fileInputRef.current?.click()
//   }

//   const handleImprovePrompt = async () => {
//     if (!userInput?.trim()) return
//     setIsImproving(true)
//     try {
//       const response = await fetch("/api/improve-prompt", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt: userInput }),
//       })
//       if (!response.ok) throw new Error("Failed to improve prompt")
//       const data = await response.json()
//       setUserInput(data.improvedPrompt)
//     } catch (error) {
//       console.error("Error improving prompt:", error)
//       toast.error("Failed to improve prompt")
//     } finally {
//       setIsImproving(false)
//     }
//   }

//   const CreateNewProject = async () => {
//     if (!isLoaded || !user) {
//       toast.error('Please sign in first!')
//       return
//     }

//     setLoading(true)
//     const projectId = uuidv4()
//     const frameId = generateRandomFrameNumber()
//     let fullPrompt = settings.customInstructions ? `${settings.customInstructions}\n\n${userInput}` : userInput
//     if (uploadedFiles.length > 0) {
//       const fileContents = uploadedFiles.map((file) => `File: ${file.name}\nContent:\n${file.content}`).join("\n\n")
//       fullPrompt = `${fullPrompt}\n\n${fileContents}`
//     }

//     try {
//       await axios.post('/api/projects', {
//         projectId,
//         frameId,
//         messages: [{ role: 'user', content: fullPrompt }],
//         userId: user.id,
//         selectedModel // Include selected model in the request
//       })
//       toast.success('Project created!')
//       router.push(`/playground/${projectId}?frameId=${frameId}&model=${selectedModel}`)
//       setLoading(false)
//     } catch (e) {
//       toast.error('Internal server error!')
//       console.log(e)
//       setLoading(false)
//     }
//   }

//   const visibleModels = Object.keys(models).filter((key) => settings.activeModels.includes(key as any))

//   return (
//     <div className='flex flex-col items-center h-[100vh] justify-center'>
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         height="100%"
//         width="100%"
//         style={{
//           position: "absolute",
//           width: "100%",
//           height: "100%",
//           zIndex: -9999,
//         }}
//       >
//         <defs>
//           <pattern
//             id="dottedGrid"
//             patternUnits="userSpaceOnUse"
//             width={30}
//             height={30}
//           >
//             <circle fill="rgba(0,0,0,0.15)" r={1} cx={2} cy={2} />
//           </pattern>
//         </defs>
//         <rect fill="url(#dottedGrid)" width="100%" height="100%" />
//       </svg>

//       <h2 style={{ fontSize: "50px" }} className="text-black font-sans font-light leading-relaxed max-w-3xl mx-auto text-center">
//         You speak, we think and build.
//       </h2>
//       <TooltipProvider delayDuration={100}>
//         <p
//           style={{ fontSize: "16px" }}
//           className="text-black font-sans font-light leading-relaxed max-w-3xl mx-auto text-center mt-[-15px] flex justify-center flex-wrap gap-1"
//         >
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <span className="cursor-help hover:underline">idea</span>
//             </TooltipTrigger>
//             <TooltipContent side="top" className="max-w-xs text-sm text-white bg-black">
//               An <strong>idea</strong> is the initial concept — your vision for a product or project before building begins.
//             </TooltipContent>
//           </Tooltip>
//           <span>{" -> "}</span>
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <span className="cursor-help hover:underline">build</span>
//             </TooltipTrigger>
//             <TooltipContent side="top" className="max-w-xs text-sm text-white bg-black">
//               <strong>Build</strong> means creating and developing the website, app, or product using design and code.
//             </TooltipContent>
//           </Tooltip>
//           <span>{" -> "}</span>
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <span className="cursor-help hover:underline">advertising</span>
//             </TooltipTrigger>
//             <TooltipContent side="top" className="max-w-xs text-sm text-white bg-black">
//               <strong>Advertising</strong> refers to promoting your creation through online campaigns and social media.
//             </TooltipContent>
//           </Tooltip>
//           <span>{" -> "}</span>
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <span className="text-blue-500 font-medium cursor-help hover:underline">Marketing</span>
//             </TooltipTrigger>
//             <TooltipContent side="top" className="max-w-xs text-sm text-white bg-black">
//               <strong>Marketing</strong> is the long-term process of building awareness, trust, and engagement for your brand or product.
//             </TooltipContent>
//           </Tooltip>
//           <span>{"."}</span>
//         </p>
//       </TooltipProvider>

//       <div className='w-full max-w-2xl p-4 border rounded-2xl h-[140px] relative bg-white flex flex-col gap-2 mt-5'>
//         <textarea
//           placeholder='Describe your page design... (Settings apply automatically)'
//           value={userInput}
//           onChange={(event) => setUserInput(event.target.value)}
//           className="flex-1 h-20 focus:outline-none resize-none pr-10 bg-transparent text-black"
//           onKeyDown={(e) => {
//             if (e.key === "Enter" && !e.shiftKey) {
//               e.preventDefault()
//               CreateNewProject()
//             }
//           }}
//         />
//         <div className="absolute bottom-2 right-2 flex gap-2 items-center">
//           <input
//             type="file"
//             ref={fileInputRef}
//             multiple
//             onChange={handleFileUpload}
//             className="hidden"
//             accept="text/*,image/*,.ts,.tsx,.js,.jsx"
//           />
//           <Button
//             onClick={triggerFileInput}
//             variant="outline"
//             className="bg-transparent"
//             size="icon"
//             title="Upload file"
//           >
//             <FileText className="w-4 h-4" />
//           </Button>
//           <Popover open={showModelSelector} onOpenChange={setShowModelSelector}>
//             <PopoverTrigger asChild>
//               <Button
//                 variant="ghost"
//                 className="h-7 px-2 hover:bg-[#F6F6F6] text-muted-foreground hover:text-muted-foreground rounded-md border-0 font-medium text-[11px] flex items-center gap-1"
//                 aria-label="Select model"
//                 title={`Current model: ${models[selectedModel].name} (Active: ${visibleModels.length})`}
//               >
//                 {(() => {
//                   const author = models[selectedModel].author
//                   switch (author) {
//                     case "OpenAI":
//                       return <SiOpenai className="h-3.5 w-3.5 mr-1" />
//                     case "Anthropic":
//                       return <SiAnthropic className="h-3.5 w-3.5 mr-1" />
//                     case "Google":
//                       return <SiGooglegemini className="h-3.5 w-3.5 mr-1" />
//                     case "DeepSeek":
//                       return <Gem className="h-3.5 w-3.5 mr-1 text-[#9466ff]" />
//                     case "xAI":
//                       return <SiX className="h-3.5 w-3.5 mr-1" />
//                     default:
//                       return <Gem className="h-3.5 w-3.5 mr-1 text-gray-500" />
//                   }
//                 })()}
//                 {models[selectedModel].name}
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="p-0 w-48" style={{ boxShadow: "0 0 8px rgba(0, 0, 0, 0.2)" }}>
//               <Command>
//                 <CommandList>
//                   <CommandEmpty>No active models found.</CommandEmpty>
//                   <CommandGroup>
//                     {visibleModels.map((model) => (
//                       <CommandItem
//                         key={model}
//                         value={model}
//                         onSelect={(value) => {
//                           setSelectedModel(value as "gemini" | "deepseek" | "gpt-oss")
//                           setShowModelSelector(false)
//                         }}
//                       >
//                         <Tip
//                           content={
//                             <div className="p-2 max-w-xs">
//                               <div className="font-semibold text-foreground text-sm mb-1">{models[model].name}</div>
//                               <div className="text-xs text-muted-foreground mb-1">by {models[model].author}</div>
//                               <div className="text-xs text-muted-foreground mb-2">{models[model].description}</div>
//                               <div className="flex flex-wrap gap-1">
//                                 {models[model].features.map((feature) => (
//                                   <Badge key={feature} variant="secondary" className="text-[10px]">
//                                     {feature}
//                                   </Badge>
//                                 ))}
//                               </div>
//                             </div>
//                           }
//                           className="bg-muted max-w-xs min-w-xs w-xs"
//                           side="left"
//                         >
//                           <div className="flex items-center w-full">
//                             {(() => {
//                               const author = models[model].author
//                               switch (author) {
//                                 case "OpenAI":
//                                   return <SiOpenai className="mr-2 h-4 w-4" />
//                                 case "Anthropic":
//                                   return <SiAnthropic className="mr-2 h-4 w-4" />
//                                 case "Google":
//                                   return <SiGooglegemini className="mr-2 h-4 w-4" />
//                                 case "DeepSeek":
//                                   return <Gem className="mr-2 h-4 w-4 text-[#9466ff]" />
//                                 case "xAI":
//                                   return <SiX className="mr-2 h-4 w-4" />
//                                 default:
//                                   return <Gem className="mr-2 h-4 w-4 text-gray-500" />
//                               }
//                             })()}
//                             <span className="text-sm font-medium text-foreground">{models[model].name}</span>
//                             <div className="flex items-center gap-1 ml-auto">
//                               {models[model].features.map((feature) => {
//                                 switch (feature) {
//                                   case "reasoning":
//                                     return <BrainCircuit key={feature} className="h-4 w-4 text-pink-500" />
//                                   case "experimental":
//                                     return <ImageIcon key={feature} className="h-4 w-4 text-green-500" />
//                                   default:
//                                     return null
//                                 }
//                               })}
//                             </div>
//                             {selectedModel === model && <Check className="ml-2 h-3.5 w-3.5 text-primary" />}
//                           </div>
//                         </Tip>
//                       </CommandItem>
//                     ))}
//                   </CommandGroup>
//                 </CommandList>
//               </Command>
//             </PopoverContent>
//           </Popover>
//           <Button
//             onClick={handleImprovePrompt}
//             disabled={loading || isImproving || !userInput.trim()}
//             variant="outline"
//             className="bg-transparent"
//             size="icon"
//           >
//             <Sparkles className="w-4 h-4" />
//           </Button>
//           <Button
//             onClick={() => setShowSettings(true)}
//             variant="outline"
//             className="bg-transparent"
//             size="icon"
//           >
//             <Settings className="w-4 h-4" />
//           </Button>
//           {!isLoaded ? (
//             <Button disabled>Loading...</Button>
//           ) : user ? (
//             <Button
//               disabled={!userInput.trim() && uploadedFiles.length === 0 || loading}
//               onClick={CreateNewProject}
//               className="text-white bg-gray-400 hover:bg-gray-400"
//               size="icon"
//             >
//               {loading ? <Loader2Icon className='animate-spin' /> : <ArrowUp className="w-4 h-4" />}
//             </Button>
//           ) : (
//             <SignInButton mode='modal' forceRedirectUrl={'/workspace'}>
//               <Button disabled={loading}>Sign In to Create</Button>
//             </SignInButton>
//           )}
//         </div>
//         {uploadedFiles.length > 0 && (
//           <div className="flex flex-wrap gap-2 mt-2">
//             {uploadedFiles.map((file, idx) => (
//               <Button
//                 key={idx}
//                 variant="outline"
//                 className="text-xs flex items-center gap-1 p-2 h-auto"
//                 onClick={() => setPreviewFile(file)}
//               >
//                 {file.type === "image" ? (
//                   <ImageIcon className="w-3 h-3" />
//                 ) : file.type === "code" ? (
//                   <FileCode className="w-3 h-3" />
//                 ) : (
//                   <FileText className="w-3 h-3" />
//                 )}
//                 <span className="truncate max-w-[150px]">{file.name}</span>
//               </Button>
//             ))}
//           </div>
//         )}
//       </div>

//       <div className='mt-4 gap-3 flex flex-wrap justify-center'>
//         {suggestions.map((suggestion, index) => (
//           <div className="sp" key={index}>
//             <button
//               className="sparkle-button bg-white border"
//               onClick={() => setUserInput(suggestion.prompt)}
//             >
//               <span className="spark"></span>
//               <span className="backdrop"></span>
//               <span className="text text-accent-foreground">
//                 {suggestion.label}
//               </span>
//             </button>
//           </div>
//         ))}
//       </div>

//       {showSettings && (
//         <SettingsModal settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} />
//       )}

//       {previewFile && (
//         <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
//           <DialogContent className="max-w-3xl">
//             <DialogHeader>
//               <DialogTitle>{previewFile.name}</DialogTitle>
//             </DialogHeader>
//             <div className="max-h-[60vh] overflow-y-auto p-4 bg-gray-50 rounded-lg">
//               {previewFile.type === "image" ? (
//                 <img src={previewFile.content} alt={previewFile.name} className="w-full h-auto" />
//               ) : (
//                 <pre className="text-sm whitespace-pre-wrap font-mono">{previewFile.content}</pre>
//               )}
//             </div>
//           </DialogContent>
//         </Dialog>
//       )}
//     </div>
//   )
// }

// export default Hero

// const generateRandomFrameNumber = () => {
//   const num = Math.floor(Math.random() * 10000)
//   return num
// } 