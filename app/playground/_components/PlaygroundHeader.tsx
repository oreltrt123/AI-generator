"use client"

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React, { useState } from 'react'
import { Save, Download, Github } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useUser, useSignIn } from '@clerk/nextjs'
import type { OAuthStrategy } from '@clerk/types'

type Props = {
  onSave?: () => void
  projectId: string
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

function PlaygroundHeader({ onSave, projectId, messages, projectFiles }: Props) {
  const [isProjectIdPopoverOpen, setIsProjectIdPopoverOpen] = useState(false)
  const [isExportPopoverOpen, setIsExportPopoverOpen] = useState(false)
  const [uploadingToGitHub, setUploadingToGitHub] = useState(false)
  const { isSignedIn, user } = useUser()
  const { signIn, isLoaded } = useSignIn()

  // Candidate strategies for GitHub OAuth
  const GITHUB_CANDIDATES = ["oauth_github", "oauth_github_oauth_app"]

  // Helper to try OAuth strategies
  async function tryStrategies(
    candidates: string[],
    redirectUrl = "/sign-in",
    redirectUrlComplete = `/playground/${projectId}`
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
        return // Browser redirects, so no further execution
      } catch (err: any) {
        // Handle "already signed in" error specifically
        if (err.message?.includes("You're already signed in")) {
          console.warn(`Strategy ${s} skipped: User is already signed in`)
          return // Skip OAuth flow if already signed in
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

  const handleDownloadChatHistory = () => {
    try {
      const jsonContent = JSON.stringify(messages, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `chat_history_${projectId}.json`
      link.click()
      URL.revokeObjectURL(url)
      setIsExportPopoverOpen(false)
      setIsProjectIdPopoverOpen(false)
    } catch (error) {
      console.error('Error downloading chat history:', error)
    }
  }

  const handleDownloadProjectFiles = async () => {
    try {
      let JSZip;
      try {
        JSZip = (await import('jszip')).default
      } catch (error) {
        console.error('JSZip module not found. Please install jszip using "npm install jszip".', error)
        alert('Cannot download project files: JSZip module is not installed. Please install it using "npm install jszip".')
        return
      }

      const zip = new JSZip()
      
      projectFiles.forEach(file => {
        zip.file(file.path, file.content)
      })

      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = `project_${projectId}.zip`
      link.click()
      URL.revokeObjectURL(url)
      setIsExportPopoverOpen(false)
      setIsProjectIdPopoverOpen(false)
    } catch (error) {
      console.error('Error downloading project files:', error)
    }
  }

  const handleConnectToGitHub = async () => {
    if (!isSignedIn || !user?.id) {
      alert('Please sign in to connect with GitHub.')
      window.location.href = '/sign-in'
      return
    }

    // Check if already connected to GitHub
    const hasGitHub = user?.externalAccounts?.some((acc: any) => acc.provider === 'oauth_github')
    if (hasGitHub) {
      setUploadingToGitHub(true)
      try {
        const response = await fetch('/api/github-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            projectId,
            projectFiles: projectFiles.map(f => ({ path: f.path, content: f.content }))
          })
        })

        if (!response.ok) {
          throw new Error(`GitHub upload failed: ${response.statusText}`)
        }

        const { repoUrl } = await response.json()
        alert(`Successfully uploaded files to GitHub: ${repoUrl}`)
      } catch (error) {
        console.error('Error uploading to GitHub:', error)
        alert('Failed to upload to GitHub. Please try again.')
      } finally {
        setUploadingToGitHub(false)
        setIsExportPopoverOpen(false)
        setIsProjectIdPopoverOpen(false)
      }
      return
    }

    // Start GitHub OAuth flow
    setUploadingToGitHub(true)
    try {
      await tryStrategies(GITHUB_CANDIDATES, '/sign-in', `/playground/${projectId}`)
    } catch (error) {
      console.error('GitHub OAuth failed:', error)
      alert('Failed to connect to GitHub. Ensure GitHub is enabled in your Clerk dashboard.')
    } finally {
      setUploadingToGitHub(false)
    }
  }

  return (
    <div className='flex justify-between items-center p-1'>
      <div className='flex items-center gap-2'>
        <Image className='top-[-3px] ml-2 absolute' src={'/logoIcon12.png'} alt='logo' width={50} height={140} />
        <Popover open={isProjectIdPopoverOpen} onOpenChange={setIsProjectIdPopoverOpen}>
          <PopoverTrigger asChild>
            <button 
              className="top-[4px] ml-14 absolute text-white text-sm font-mono hover:bg-[#3e3f42] px-2 py-1 rounded"
            >
              {projectId}
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-48 p-2 bg-[#333437] border-[#464447] rounded-lg"
            side="bottom"
            align="start"
            style={{ boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)' }}
          >
            <Popover open={isExportPopoverOpen} onOpenChange={setIsExportPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-[#3e3f42] hover:text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-64 p-2 bg-[#333437] border-[#464447] rounded-lg"
                side="right"
                align="start"
                style={{ boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)' }}
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
                  {uploadingToGitHub ? 'Connecting...' : user?.externalAccounts?.some((acc: any) => acc.provider === 'oauth_github') ? 'Upload to GitHub' : 'Connect to GitHub'}
                </Button>
              </PopoverContent>
            </Popover>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

export default PlaygroundHeader