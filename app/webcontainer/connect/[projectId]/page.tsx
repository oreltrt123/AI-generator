"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import WebsiteDesign from "@/app/playground/_components/WebsiteDesign"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectFile } from "@/app/playground/[projectId]/page"

export default function ConnectProject() {
  const { projectId } = useParams()
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return
      try {
        setLoading(true)
        // Assuming frameId is not required for connect route; adjust if needed
        const response = await axios.get(`/api/frames?projectId=${projectId}`)
        const frameData = response.data
        let files: ProjectFile[] = []
        if (frameData.designCode) {
          try {
            files = JSON.parse(frameData.designCode)
            if (!Array.isArray(files)) {
              files = [{ path: "index.html", content: frameData.designCode }]
            }
          } catch {
            files = [{ path: "index.html", content: frameData.designCode }]
          }
        }
        setProjectFiles(files)
        setLoading(false)
      } catch (err: any) {
        console.error("Error fetching project details:", err)
        setError("Failed to load project. Please try again.")
        setLoading(false)
      }
    }

    fetchProjectDetails()
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading Project...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Please wait while we load your project.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Card className="m-4">
        <CardHeader>
          <CardTitle>Project Preview - ID: {projectId}</CardTitle>
        </CardHeader>
        <CardContent>
          <WebsiteDesign
            projectFiles={projectFiles}
            onFilesChange={setProjectFiles}
            width={800}
            onWidthChange={() => {}} // Width change not needed for connect page
            onAutoRunStart={() => console.log("[Connect] Auto-run started")}
            onAutoRunComplete={() => console.log("[Connect] Auto-run completed")}
          />
        </CardContent>
      </Card>
    </div>
  )
}