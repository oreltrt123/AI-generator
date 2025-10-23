"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Rocket, Loader2, Check, X, ExternalLink } from "lucide-react"
import type { ProjectFile } from "../[projectId]/client"

type Props = {
  projectFiles: ProjectFile[]
  projectId: string
}

export default function DeployButton({ projectFiles, projectId }: Props) {
  const [isDeploying, setIsDeploying] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [deploymentSteps, setDeploymentSteps] = useState<
    { step: string; status: "pending" | "in-progress" | "complete" | "error" }[]
  >([])
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAlreadyDeployed, setIsAlreadyDeployed] = useState(false)
  const [isCheckingDeployment, setIsCheckingDeployment] = useState(true)

  useEffect(() => {
    const checkDeployment = async () => {
      try {
        const response = await fetch(`/api/deploy?projectId=${projectId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.deployed) {
            const cleanUrl = cleanDomain(data.url)
            setDeploymentUrl(cleanUrl)
            setIsAlreadyDeployed(true)
          }
        }
      } catch (err) {
        console.error("Failed to check deployment status:", err)
      } finally {
        setIsCheckingDeployment(false)
      }
    }

    checkDeployment()
  }, [projectId])

  // ✨ Helper to remove the random suffix and return the clean domain
  const cleanDomain = (url: string): string => {
    try {
      const domain = new URL(url).hostname
      const cleaned = domain.replace(/-[a-z0-9]+\.vercel\.app$/, ".vercel.app")
      return `https://${cleaned}`
    } catch {
      return url
    }
  }

  const handleDeploy = async () => {
    if (projectFiles.length === 0) {
      alert("No files to deploy. Please generate a project first.")
      return
    }

    setIsDeploying(true)
    setShowProgress(true)
    setError(null)

    const steps = [
      { step: "Preparing files for deployment", status: "pending" as const },
      { step: "Creating Vercel deployment", status: "pending" as const },
      { step: "Uploading files to Vercel", status: "pending" as const },
      { step: "Running npm install", status: "pending" as const },
      { step: "Building Next.js project", status: "pending" as const },
      { step: "Deploying to production", status: "pending" as const },
    ]

    setDeploymentSteps(steps)

    try {
      // Step 1
      setDeploymentSteps((prev) => prev.map((s, i) => (i === 0 ? { ...s, status: "in-progress" } : s)))
      await new Promise((resolve) => setTimeout(resolve, 800))
      setDeploymentSteps((prev) => prev.map((s, i) => (i === 0 ? { ...s, status: "complete" } : s)))

      // Step 2 - Vercel deployment
      setDeploymentSteps((prev) => prev.map((s, i) => (i === 1 ? { ...s, status: "in-progress" } : s)))

      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          files: projectFiles,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.details || data.error || "Deployment failed")

      console.log("[v0] Deployment response:", data)

      // Simulate step progress
      for (let i = 1; i < steps.length; i++) {
        setDeploymentSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: "complete" } : s)))
        if (i < steps.length - 1) {
          setDeploymentSteps((prev) => prev.map((s, idx) => (idx === i + 1 ? { ...s, status: "in-progress" } : s)))
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      // ✅ Clean up URL and show correct domain
      const cleanUrl = cleanDomain(data.url)
      setDeploymentUrl(cleanUrl)
      setIsAlreadyDeployed(true)
      setIsDeploying(false)
    } catch (err: any) {
      console.error("[v0] Deployment error:", err)
      setError(err.message || "Deployment failed")
      setDeploymentSteps((prev) => prev.map((s) => (s.status === "in-progress" ? { ...s, status: "error" } : s)))
      setIsDeploying(false)
    }
  }

  if (isCheckingDeployment) {
    return (
      <Button disabled className="bg-gray-200 text-gray-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Checking...
      </Button>
    )
  }

  if (isAlreadyDeployed && deploymentUrl && !showProgress) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={deploymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="r2552esf25_252trewt3erblueFontDocs cursor-default flex items-center gap-2 px-4 py-2 bg-[#3a3838a2] hover:bg-[#3a3838e1] rounded-lg text-sm text-[#e5e6e6da] transition-colors"
        >
          {deploymentUrl}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    )
  }

  return (
    <div className="relative">
      <Button
        onClick={handleDeploy}
        disabled={isDeploying || projectFiles.length === 0}
        className=" bg-[#333437] border border-[#444547] text-white hover:bg-[#3e3f42]"
      >
        {isDeploying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Deploying...
          </>
        ) : (
          <>
            <Rocket className="w-4 h-4 mr-2" />
            Publish
          </>
        )}
      </Button>

      {showProgress && (
        <div className="absolute top-full mt-2 right-0 w-96 bg-white border rounded-lg p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Deployment Progress</h3>
            <button onClick={() => setShowProgress(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {deploymentSteps.map((step, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                {step.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                {step.status === "in-progress" && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                {step.status === "complete" && <Check className="w-4 h-4 text-green-600" />}
                {step.status === "error" && <X className="w-4 h-4 text-red-600" />}
                <span
                  className={
                    step.status === "complete"
                      ? "text-green-700"
                      : step.status === "error"
                        ? "text-red-700"
                        : step.status === "in-progress"
                          ? "text-blue-700 font-medium"
                          : "text-gray-500"
                  }
                >
                  {step.step}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
          )}

          {deploymentUrl && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-700 font-medium mb-2">Deployment successful!</p>
              <a
                href={deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline break-all"
              >
                {deploymentUrl}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
