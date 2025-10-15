"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Rocket, Loader2, ExternalLink, TrendingUp } from "lucide-react"
import type { ProjectFile } from "../[projectId]/client"

type Props = {
  projectFiles: ProjectFile[]
  projectId: string
  onDeploymentComplete?: (url: string) => void
}

export default function AdaptiveDeployButton({ projectFiles, projectId, onDeploymentComplete }: Props) {
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkExistingDeployment = async () => {
      try {
        const cachedUrl = localStorage.getItem(`adaptiveDeploymentUrl_${projectId}`)
        if (cachedUrl) {
          setDeploymentUrl(cachedUrl)
          onDeploymentComplete?.(cachedUrl)
          return
        }

        const response = await fetch(`/api/adaptive-deploy?projectId=${projectId}`)
        const data = await response.json()

        if (data.deployed && data.deploymentUrl) {
          setDeploymentUrl(data.deploymentUrl)
          localStorage.setItem(`adaptiveDeploymentUrl_${projectId}`, data.deploymentUrl)
          onDeploymentComplete?.(data.deploymentUrl)
        }
      } catch (err: any) {
        console.error("[Adaptive Deploy] Check error:", err)
      }
    }

    if (projectId) {
      checkExistingDeployment()
    }
  }, [projectId])

  const handleDeploy = async () => {
    setIsDeploying(true)
    setError(null)

    try {
      let language = "nextjs"
      if (projectFiles.some((f) => f.path === "index.html")) {
        language = "html"
      } else if (projectFiles.some((f) => f.path === "src/App.tsx")) {
        language = "react"
      } else if (projectFiles.some((f) => f.path === "src/App.vue")) {
        language = "vue"
      }

      console.log("[Adaptive Deploy] Deploying with language:", language)

      const response = await fetch("/api/adaptive-deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          projectFiles,
          language,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Deployment failed")
      }

      setDeploymentUrl(data.deploymentUrl)
      localStorage.setItem(`adaptiveDeploymentUrl_${projectId}`, data.deploymentUrl)
      onDeploymentComplete?.(data.deploymentUrl)

      console.log("[Adaptive Deploy] Successfully deployed:", data.deploymentUrl)
    } catch (err: any) {
      console.error("[Adaptive Deploy] Error:", err)
      setError(err.message || "Failed to deploy site")
    } finally {
      setIsDeploying(false)
    }
  }

  const openDeployment = () => {
    if (deploymentUrl) {
      window.open(deploymentUrl, "_blank")
    }
  }

  return (
    <div className="flex items-center gap-2">
      {deploymentUrl ? (
        <>
          <Button
            onClick={openDeployment}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-transparent"
          >
            <ExternalLink className="w-4 h-4" />
            View Live Site
          </Button>
          <Button
            onClick={handleDeploy}
            variant="default"
            size="sm"
            disabled={isDeploying}
            className="flex items-center gap-2"
          >
            {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            {isDeploying ? "Updating..." : "Redeploy"}
          </Button>
        </>
      ) : (
        <Button
          onClick={handleDeploy}
          variant="default"
          size="sm"
          disabled={isDeploying || projectFiles.length === 0}
          className="flex items-center gap-2"
        >
          {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {isDeploying ? "Deploying..." : "Deploy with AI Tracking"}
        </Button>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
