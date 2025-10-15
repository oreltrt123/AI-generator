"use client"
import { ArrowUp, Loader2Icon, Github, Link, HomeIcon, LayoutDashboard, User, Store, Briefcase  } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SignInButton, useUser } from "@clerk/nextjs"
import axios from "axios"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import GitHubImportModal from "./GitHubImportModal"
import URLImportModal from "./URLImportModal"
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
  const [showGitHubModal, setShowGitHubModal] = useState(false)
  const [showURLModal, setShowURLModal] = useState(false)

  const CreateNewProject = async () => {
    if (!isLoaded || !user) {
      toast.error("Please sign in first!")
      return
    }

    setLoading(true)
    const projectId = uuidv4()
    const frameId = generateRandomFrameNumber()
    const messages = [
      {
        role: "user",
        content: userInput,
      },
    ]

    try {
      await axios.post("/api/projects", {
        projectId,
        frameId,
        messages,
        userId: user.id,
      })
      toast.success("Project created!")
      router.push(`/playground/${projectId}?frameId=${frameId}`)
      setLoading(false)
    } catch (e) {
      toast.error("Internal server error!")
      console.log(e)
      setLoading(false)
    }
  }

  const handleGitHubImport = async (repoUrl: string) => {
    if (!isLoaded || !user) {
      toast.error("Please sign in first!")
      return
    }

    setLoading(true)
    const projectId = uuidv4()
    const frameId = generateRandomFrameNumber()

    try {
      const response = await axios.post("/api/github-import", {
        repoUrl,
        projectId,
        frameId,
        userId: user.id,
      })

      toast.success("Repository imported successfully!")
      router.push(`/playground/${projectId}?frameId=${frameId}`)
    } catch (error: any) {
      console.error("GitHub import error:", error)
      throw new Error(error.response?.data?.error || "Failed to import repository")
    } finally {
      setLoading(false)
    }
  }

  const handleURLImport = async (url: string) => {
    if (!isLoaded || !user) {
      toast.error("Please sign in first!")
      return
    }

    setLoading(true)
    const projectId = uuidv4()
    const frameId = generateRandomFrameNumber()

    try {
      await axios.post("/api/url-import", {
        url,
        projectId,
        frameId,
        userId: user.id,
      })

      toast.success("Website imported successfully!")
      router.push(`/playground/${projectId}?frameId=${frameId}`)
    } catch (error: any) {
      console.error("URL import error:", error)
      throw new Error(error.response?.data?.error || "Failed to import website")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center h-[100vh] justify-center">
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

      <div className="w-full max-w-2xl p-1 bg-gray-300 mt-5 rounded-2xl relative">
        <textarea
          placeholder="Turn imagination into websites that work your way."
          value={userInput}
          onChange={(event) => setUserInput(event.target.value)}
          className="w-full p-3 pr-14 bg-[#ffffff] top-0.5 relative rounded-lg resize-none focus:outline-none"
          style={{ height: "144px" }}
        />
        <div className="absolute top-2 right-2">
          {!isLoaded ? (
            <div>Loading...</div>
          ) : user ? (
            <Button
              disabled={!userInput || loading}
              onClick={CreateNewProject}
              className="text-white mt-1 mr-1 bg-gray-400 hover:bg-gray-400"
            >
              {loading ? <Loader2Icon className="animate-spin" /> : <ArrowUp />}
            </Button>
          ) : (
            <SignInButton forceRedirectUrl={"/workspace"}>
              <Button disabled={loading}>Sign In to Create</Button>
            </SignInButton>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        {!isLoaded ? (
          <div>Loading...</div>
        ) : user ? (
          <>
            <Button
              variant="outline"
              onClick={() => setShowGitHubModal(true)}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              Import from GitHub
            </Button>
            <span className="text-sm text-gray-600">or</span>
          </>
        ) : (
          <>
            <SignInButton forceRedirectUrl={"/workspace"}>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Github className="w-4 h-4" />
                Import from GitHub
              </Button>
            </SignInButton>
            <SignInButton forceRedirectUrl={"/workspace"}>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Link className="w-4 h-4" />
                Import from URL
              </Button>
            </SignInButton>
          </>
        )}
      </div>

      <div className="mt-4 gap-3 flex flex-wrap justify-center">
        {suggestions.map((suggestion, index) => (
          <div className="sp" key={index}>
            <button className="sparkle-button bg-white border" onClick={() => setUserInput(suggestion.prompt)}>
              <span className="spark"></span>
              <span className="backdrop"></span>
              <span className="text text-accent-foreground">{suggestion.label}</span>
            </button>
          </div>
        ))}
      </div>

      <GitHubImportModal
        open={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
        onImport={handleGitHubImport}
      />
      <URLImportModal open={showURLModal} onClose={() => setShowURLModal(false)} onImport={handleURLImport} />
    </div>
  )
}

export default Hero

const generateRandomFrameNumber = () => {
  const num = Math.floor(Math.random() * 10000)
  return num
}
