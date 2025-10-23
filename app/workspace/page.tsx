"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FolderOpen, Clock, Users, Loader2, MoreVertical, Edit2, Copy, Mail, Check, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import axios from "axios"
import { v4 as uuidv4 } from "uuid"
import AppHeader from "@/app/workspace/_components/AppHeader"
import Hero from "../_components/Hero"

type Project = {
  id: number
  projectId: string
  projectName: string
  createdBy: string
  createdOn: string
  updatedOn: string
}

type Invitation = {
  id: number
  projectId: string
  userEmail: string
  invitedBy: string
  role: string
  status: string
  invitedOn: string
}

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([])
  const [sharedProjects, setSharedProjects] = useState<Project[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingProject, setCreatingProject] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [newProjectName, setNewProjectName] = useState("")
  const [renaming, setRenaming] = useState(false)

  useEffect(() => {
    if (isLoaded && user) {
      fetchProjects()
      fetchInvitations()
    } else if (isLoaded && !user) {
      router.push("/sign-in")
    }
  }, [isLoaded, user])

  const fetchProjects = async () => {
    try {
      const response = await axios.get("/api/projects")
      setOwnedProjects(response.data.ownedProjects || [])
      setSharedProjects(response.data.sharedProjects || [])
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitations = async () => {
    try {
      const response = await axios.get("/api/projects/invite")
      setInvitations(response.data.invitations || [])
    } catch (error) {
      console.error("Error fetching invitations:", error)
    }
  }

  const handleInvitationResponse = async (invitationId: number, action: "accept" | "reject") => {
    try {
      await axios.put("/api/projects/invite", {
        invitationId,
        action,
      })
      fetchInvitations()
      if (action === "accept") {
        fetchProjects()
      }
    } catch (error) {
      console.error("Error responding to invitation:", error)
      alert("Failed to respond to invitation")
    }
  }

  const createNewProject = async () => {
    setCreatingProject(true)
    try {
      const newProjectId = uuidv4()
      const newFrameId = uuidv4()

      await axios.post("/api/project", {
        projectId: newProjectId,
        frameId: newFrameId,
        messages: [{ role: "user", content: "New Project" }],
        projectName: "Untitled Project",
      })

      router.push(`/playground/${newProjectId}?frameId=${newFrameId}`)
    } catch (error) {
      console.error("Error creating project:", error)
      alert("Failed to create project")
      setCreatingProject(false)
    }
  }

  const openProject = async (projectId: string) => {
    try {
      const newFrameId = uuidv4()
      await axios.post("/api/frames", {
        projectId,
        frameId: newFrameId,
        designCode: JSON.stringify([]), // Initialize with empty design code
        chatMessages: [{ role: "user", content: "Opened existing project" }],
      })
      router.push(`/playground/${projectId}?frameId=${newFrameId}`)
    } catch (error) {
      console.error("Error creating new frame for project:", error)
      alert("Failed to open project")
    }
  }

  const handleRenameProject = async () => {
    if (!selectedProject || !newProjectName.trim()) return
    setRenaming(true)
    try {
      await axios.put("/api/projects/rename", {
        projectId: selectedProject.projectId,
        newName: newProjectName.trim(),
      })
      setShowRenameDialog(false)
      fetchProjects()
    } catch (error) {
      console.error("Error renaming project:", error)
      alert("Failed to rename project")
    } finally {
      setRenaming(false)
    }
  }

  const handleDuplicateProject = async (project: Project) => {
    try {
      const response = await axios.post("/api/projects/duplicate", {
        projectId: project.projectId,
      })
      fetchProjects()
      alert("Project duplicated successfully!")
    } catch (error) {
      console.error("Error duplicating project:", error)
      alert("Failed to duplicate project")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString()
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
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
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <Hero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 rounded-t-4xl"
        style={{
          background: 'linear-gradient(135deg, rgb(179, 208, 253) 0%, rgb(164, 202, 248) 100%)',
        }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-sans font-light text-white mb-2">Your Projects</h1>
            <p className="text-white font-sans font-light">Create and manage your AI-generated websites</p>
          </div>
          <Button
            onClick={createNewProject}
            disabled={creatingProject}
            className="bg-white text-black hover:bg-gray-200"
          >
            {creatingProject ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </>
            )}
          </Button>
        </div>

        {invitations.length > 0 && (
          <div className="mb-8 p-4 border border-[#464447] rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold">Pending Invitations</h3>
              <Badge variant="secondary" className="ml-2">
                {invitations.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 bg-[#1E1E21] rounded-lg border border-[#464447]"
                >
                  <div>
                    <p className="text-white font-medium">Project Invitation</p>
                    <p className="text-sm text-muted-foreground">
                      Invited by {invitation.invitedBy} as {invitation.role}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleInvitationResponse(invitation.id, "accept")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInvitationResponse(invitation.id, "reject")}
                      className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ownedProjects.length === 0 && sharedProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FolderOpen className="w-20 h-20 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6">Create your first AI-powered website project</p>
            <Button
              onClick={createNewProject}
              disabled={creatingProject}
              className="bg-white text-black hover:bg-gray-200"
            >
              {creatingProject ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {ownedProjects.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-sans font-light text-white mb-4 flex items-center gap-2">
                  <FolderOpen className="w-6 h-6" />
                  My Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ownedProjects.map((project) => (
                    <Card
                      key={project.id}
                      className="bg-white shadow-none border-white/20 transition-all group relative"
                    >
                      <div className="absolute top-4 right-4 z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-black hover:bg-[#e2e0e4a1]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-white shadow-none border">
                            <DropdownMenuItem
                              className="text-black hover:bg-[#e2e0e4a1] cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedProject(project)
                                setNewProjectName(project.projectName)
                                setShowRenameDialog(true)
                              }}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-black hover:bg-[#e2e0e4a1] cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDuplicateProject(project)
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div onClick={() => openProject(project.projectId)} className="cursor-pointer">
                        <CardHeader>
                          <CardTitle className="text-black group-hover:text-blue-400 transition-colors line-clamp-1 pr-8">
                            {project.projectName}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {formatDate(project.updatedOn || project.createdOn)}
                          </CardDescription>
                        </CardHeader>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {sharedProjects.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Shared With Me
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sharedProjects.map((project) => (
                    <Card
                      key={project.id}
                      className="bg-[#333437] border-[#464447] hover:border-white/20 transition-all cursor-pointer group"
                      onClick={() => openProject(project.projectId)}
                    >
                      <CardHeader>
                        <CardTitle className="text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                          {project.projectName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatDate(project.updatedOn || project.createdOn)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Shared by {project.createdBy}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
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
              onClick={handleRenameProject}
              disabled={renaming || !newProjectName.trim()}
              className="bg-white text-black hover:bg-gray-200"
            >
              {renaming ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}