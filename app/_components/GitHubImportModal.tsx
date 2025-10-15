"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Github, AlertCircle } from "lucide-react"
import { toast } from "sonner"

type Props = {
  open: boolean
  onClose: () => void
  onImport: (repoUrl: string) => Promise<void>
}

export default function GitHubImportModal({ open, onClose, onImport }: Props) {
  const [repoUrl, setRepoUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const validateGitHubUrl = (url: string): boolean => {
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/
    return githubPattern.test(url)
  }

  const handleImport = async () => {
    setError("")

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL")
      return
    }

    if (!validateGitHubUrl(repoUrl)) {
      setError("Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)")
      return
    }

    setLoading(true)
    try {
      await onImport(repoUrl)
      toast.success("Repository imported successfully!")
      onClose()
      setRepoUrl("")
    } catch (err: any) {
      setError(err.message || "Failed to import repository")
      toast.error("Failed to import repository")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Import from GitHub
          </DialogTitle>
          <DialogDescription>Enter a GitHub repository URL to import all files into your project</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="repo-url" className="text-sm font-medium">
              Repository URL
            </label>
            <Input
              id="repo-url"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value)
                setError("")
              }}
              disabled={loading}
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
            <p className="font-medium">Examples:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>https://github.com/vercel/next.js</li>
              <li>https://github.com/facebook/react</li>
              <li>https://github.com/StackBlitz/bolt.new</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={loading || !repoUrl.trim()}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Github className="w-4 h-4 mr-2" />
                Import Repository
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
