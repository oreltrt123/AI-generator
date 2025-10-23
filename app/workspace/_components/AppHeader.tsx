"use client"

import React, { useState } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { UserButton, useUser, SignInButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import { toast } from 'sonner'
import { useRouter, usePathname } from 'next/navigation' // Import usePathname
import Link from 'next/link'
import Image from "next/image"

function AppHeader() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const pathname = usePathname() // Get the current pathname
  const [loading, setLoading] = useState(false)

  // Helper: generate random frame number
  const generateRandomFrameNumber = () => Math.floor(Math.random() * 10000)

  // Create new project and redirect to /landing
  const handleCreateProject = async () => {
    if (!isLoaded || !user) {
      toast.error("Please sign in first!")
      return
    }

    setLoading(true)
    const projectId = uuidv4()
    const frameId = generateRandomFrameNumber()
    const messages = [
      { role: "user", content: "New landing project created from AppHeader" },
    ]

    try {
      await axios.post("/api/projects", {
        projectId,
        frameId,
        messages,
        userId: user.id,
      })

      toast.success("Project created!")
      router.push(`/landing/${projectId}?frameId=${frameId}`)
    } catch (error) {
      console.error(error)
      toast.error("Internal server error!")
    } finally {
      setLoading(false)
    }
  }

  // Define consistent button styles to avoid hydration mismatch
  const buttonClassName = "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm font-medium h-[30px] px-3"

  return (
    <div className="flex justify-between items-center p-4 fixed w-full">
      <div className="flex items-center gap-2">
        {isSignedIn ? (
          <div>
            {/* Conditionally render the Workspace button if not on /workspace */}
            {pathname !== '/workspace' && (
              <Link href={'/'}>
                <Image className="top-[-3px] ml-2 relative" src={"/logoIcon.png"} alt="logo" width={50} height={140} />
                {/* <Button
                  className={`${buttonClassName} bg-blue-300 hover:bg-blue-300 text-white ml-2`}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Workspace
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button> */}
              </Link>
            )}
          </div>
        ) : (
          <SignInButton mode="modal" forceRedirectUrl="/workspace">
            <Button
              disabled={loading}
              className={`${buttonClassName} text-white bg-blue-600 hover:bg-blue-600`}
            >
              Create Landing
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </SignInButton>
        )}
      </div>
      <UserButton />
    </div>
  )
}

export default AppHeader