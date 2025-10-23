"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState } from "react"
import { Download, Github, Edit2, Copy, UserPlus } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser, useSignIn, UserButton } from "@clerk/nextjs"
import type { OAuthStrategy } from "@clerk/types"
import axios from "axios"
import { useRouter } from "next/navigation"

type Props = {
  onSave?: () => void
  projectId: string
  projectName?: string
  messages: Messages[]
  projectFiles: ProjectFile[]
}

export type ProjectFile = {
  path: string
  content: string
}

export type Messages = {
  role: string
  content: string
  streaming?: boolean
}

function PlaygroundHeader({ onSave, projectId, projectName = "Untitled Project", messages, projectFiles }: Props) {
  const [isProjectIdPopoverOpen, setIsProjectIdPopoverOpen] = useState(false)
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false)
  const [uploadingToGitHub, setUploadingToGitHub] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState(projectName)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("viewer")
  const [renaming, setRenaming] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [inviting, setInviting] = useState(false)
  const { isSignedIn, user } = useUser()
  const { signIn, isLoaded } = useSignIn()
  const router = useRouter()

  const GITHUB_CANDIDATES = ["oauth_github"]

  async function tryStrategies(
    candidates: string[],
    redirectUrl = "/sign-in",
    redirectUrlComplete = `/playground/${projectId}`,
  ): Promise<void> {
    if (!isLoaded || !signIn) throw new Error("SignIn not loaded")
    let lastError: any = null

    for (const s of candidates) {
      try {
        await signIn.authenticateWithRedirect({
          strategy: s as OAuthStrategy,
          redirectUrl,
          redirectUrlComplete,
        })
        return
      } catch (err: any) {
        if (err.message?.includes("You're already signed in")) {
          console.warn(`Strategy ${s} skipped: User is already signed in`)
          return
        }
        console.warn(`Strategy ${s} failed:`, err?.message ?? err)
        lastError = err
      }
    }
    throw lastError ?? new Error("No GitHub strategy succeeded")
  }

  const handleSave = () => {
    if (onSave) {
      onSave()
    }
  }

  const handleRename = async () => {
    if (!newProjectName.trim()) return
    setRenaming(true)
    try {
      await axios.put("/api/projects/rename", {
        projectId,
        newName: newProjectName.trim(),
      })
      setShowRenameDialog(false)
      setIsProjectIdPopoverOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error renaming project:", error)
      alert("Failed to rename project")
    } finally {
      setRenaming(false)
    }
  }

  const handleDuplicate = async () => {
    setDuplicating(true)
    try {
      const response = await axios.post("/api/projects/duplicate", {
        projectId,
      })
      setIsProjectIdPopoverOpen(false)
      router.push(`/playground/${response.data.newProjectId}?frameId=${Date.now()}`)
    } catch (error) {
      console.error("Error duplicating project:", error)
      alert("Failed to duplicate project")
    } finally {
      setDuplicating(false)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await axios.post("/api/projects/invite", {
        projectId,
        inviteEmail: inviteEmail.trim(),
        role: inviteRole,
      })
      setShowInviteDialog(false)
      setInviteEmail("")
      alert("Invitation sent successfully!")
    } catch (error: any) {
      console.error("Error inviting user:", error)
      alert(error.response?.data?.error || "Failed to invite user")
    } finally {
      setInviting(false)
    }
  }

  const handleDownloadChatHistory = () => {
    try {
      const jsonContent = JSON.stringify(messages, null, 2)
      const blob = new Blob([jsonContent], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `chat_history_${projectId}.json`
      link.click()
      URL.revokeObjectURL(url)
      setIsExportPopoverOpen(false)
      setIsProjectIdPopoverOpen(false)
    } catch (error) {
      console.error("Error downloading chat history:", error)
    }
  }

  const handleDownloadProjectFiles = async () => {
    try {
      let JSZip
      try {
        JSZip = (await import("jszip")).default
      } catch (error) {
        console.error('JSZip module not found. Please install jszip using "npm install jszip".', error)
        alert(
          'Cannot download project files: JSZip module is not installed. Please install it using "npm install jszip".',
        )
        return
      }

      const zip = new JSZip()
      projectFiles.forEach((file) => {
        zip.file(file.path, file.content)
      })

      const content = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(content)
      const link = document.createElement("a")
      link.href = url
      link.download = `project_${projectId}.zip`
      link.click()
      URL.revokeObjectURL(url)
      setIsExportPopoverOpen(false)
      setIsProjectIdPopoverOpen(false)
    } catch (error) {
      console.error("Error downloading project files:", error)
    }
  }

  const handleConnectToGitHub = async () => {
    if (!isSignedIn || !user?.id) {
      // Redirect to Clerk's sign-in page with GitHub OAuth
      try {
        await tryStrategies(GITHUB_CANDIDATES, "/sign-in", `/playground/${projectId}`)
      } catch (error) {
        console.error("GitHub OAuth failed:", error)
        alert("Failed to initiate GitHub authentication. Please try again.")
      }
      return
    }

    // Check if user has already connected GitHub
    const hasGitHub = user?.externalAccounts?.some((acc: any) => acc.provider === "oauth_github")
    
    if (hasGitHub) {
      setUploadingToGitHub(true)
      try {
        // Call backend to create repo and upload files
        const response = await fetch("/api/github-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            projectId,
            projectName: projectName.trim() || `project-${projectId}`,
            projectFiles: projectFiles.map((f) => ({ path: f.path, content: f.content })),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `GitHub upload failed: ${response.statusText}`)
        }

        const { repoUrl } = await response.json()
        alert(`Successfully uploaded files to GitHub: ${repoUrl}`)
        window.open(repoUrl, "_blank") // Open repo in new tab
      } catch (error: any) {
        console.error("Error uploading to GitHub:", error)
        alert(`Failed to upload to GitHub: ${error.message || "Unknown error"}`)
      } finally {
        setUploadingToGitHub(false)
        setIsExportPopoverOpen(false)
        setIsProjectIdPopoverOpen(false)
      }
    } else {
      // Initiate GitHub OAuth flow
      setUploadingToGitHub(true)
      try {
        await tryStrategies(GITHUB_CANDIDATES, "/sign-in", `/playground/${projectId}`)
      } catch (error) {
        console.error("GitHub OAuth failed:", error)
        alert("Failed to connect to GitHub. Ensure GitHub is enabled in your Clerk dashboard.")
      } finally {
        setUploadingToGitHub(false)
      }
    }
  }

  return (
    <div className="flex justify-between items-center p-1 bg-[#171818] border border-b-[#4445474f] border-t-0 border-l-0 border-r-0">
      <div className="flex items-center gap-2">
        <Image className="top-[-3px] ml-2 relative" src={"/logoIcon12.png"} alt="logo" width={50} height={140} />
        <Popover open={isProjectIdPopoverOpen} onOpenChange={setIsProjectIdPopoverOpen}>
          <PopoverTrigger asChild>
            <button className="top-[0px] ml-1 relative text-sm px-2 py-1 rounded hover:bg-[#3a38386b] text-[#e5e6e6da] font-sans font-light">
              {projectName}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-48 p-2 bg-[#333437] border-[#464447] rounded-lg"
            side="bottom"
            align="start"
            style={{ boxShadow: "0 0 8px rgba(0, 0, 0, 0.2)" }}
          >
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-[#3e3f42] hover:text-white mb-1"
              onClick={() => {
                setNewProjectName(projectName)
                setShowRenameDialog(true)
              }}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Rename
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-[#3e3f42] hover:text-white mb-1"
              onClick={handleDuplicate}
              disabled={duplicating}
            >
              <Copy className="mr-2 h-4 w-4" />
              {duplicating ? "Duplicating..." : "Duplicate"}
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-[#3e3f42] hover:text-white mb-1"
              onClick={() => setShowInviteDialog(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Users
            </Button>

            <Popover open={isExportPopoverOpen} onOpenChange={setIsExportPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-[#3e3f42] hover:text-white">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 p-2 bg-[#333437] border-[#464447] rounded-lg"
                side="right"
                align="start"
                style={{ boxShadow: "0 0 8px rgba(0, 0, 0, 0.2)" }}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-[#3e3f42] mb-1 hover:text-white"
                  onClick={handleDownloadChatHistory}
                >
                  Download Chat History
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-[#3e3f42] mb-1 hover:text-white"
                  onClick={handleDownloadProjectFiles}
                >
                  Download Project Files
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-[#3e3f42] hover:text-white"
                  onClick={handleConnectToGitHub}
                  disabled={uploadingToGitHub}
                >
                  <Github className="mr-2 h-4 w-4" />
                  {uploadingToGitHub
                    ? "Connecting..."
                    : user?.externalAccounts?.some((acc: any) => acc.provider === "oauth_github")
                      ? "Upload to GitHub"
                      : "Connect to GitHub"}
                </Button>
              </PopoverContent>
            </Popover>
          </PopoverContent>
        </Popover>
      </div>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="bg-[#333437] border-[#464447] text-white">
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription className="text-muted-foreground">Enter a new name for your project</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="project-name" className="text-white">
              Project Name
            </Label>
            <Input
              id="project-name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="mt-2 bg-[#1E1E21] border-[#464447] text-white"
              placeholder="Enter project name"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowRenameDialog(false)}
              className="text-white hover:bg-[#3e3f42]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={renaming || !newProjectName.trim()}
              className="bg-white text-black hover:bg-gray-200"
            >
              {renaming ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-[#333437] border-[#464447] text-white">
          <DialogHeader>
            <DialogTitle>Invite Users to Project</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Share this project with other users via email
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="invite-email" className="text-white">
                Email Address
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-2 bg-[#1E1E21] border-[#464447] text-white"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="invite-role" className="text-white">
                Role
              </Label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="mt-2 w-full p-2 bg-[#1E1E21] border border-[#464447] text-white rounded-md"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowInviteDialog(false)
                setInviteEmail("")
              }}
              className="text-white hover:bg-[#3e3f42]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteUser}
              disabled={inviting || !inviteEmail.trim()}
              className="bg-white text-black hover:bg-gray-200"
            >
              {inviting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="mr-3 mt-2">
        <UserButton />
      </div>
    </div>
  )
}

export default PlaygroundHeader