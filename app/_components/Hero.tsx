"use client"
import { ArrowUp, HomeIcon, ImagePlus, Key, LayoutDashboard, Loader2Icon, User } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SignInButton, useUser } from '@clerk/nextjs'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const suggestions = [
  {
    label: 'Dashboard',
    prompt: 'Create an analytics dashboard to track customers and revenue data for a SaaS',
    icon: LayoutDashboard
  },
  {
    label: 'SignUp Form',
    prompt: 'Create a modern sign up form with email/password fields, Google and Github login options, and terms checkbox',
    icon: Key
  },
  {
    label: 'Hero',
    prompt: 'Create a modern header and centered hero section for a productivity SaaS. Include a badge for feature announcement, a title with a subtle gradient effect',
    icon: HomeIcon
  },
  {
    label: 'User Profile Card',
    prompt: 'Create a modern user profile card component for a social media website',
    icon: User
  }
]

function Hero() {
    const [userInput, setUserInput] = useState<string>();
    const { user, isLoaded } = useUser(); // Added isLoaded for auth readiness
    const router = useRouter();
    const [Loading, setLoading] = useState(false);
    
    const CreateNewProject = async () => {
      if (!isLoaded || !user) {
        toast.error('Please sign in first!');
        return; // Block creation if not signed in
      }
      
      setLoading(true);
      const projectId = uuidv4();
      const frameId = generateRandomFrameNumber();
      const messages = [
        {
          role: 'user',
          content: userInput
        }
      ]
      try {
        const result = await axios.post('/api/projects', {
          projectId: projectId,
          frameId: frameId,
          messages: messages,
          userId: user.id // Add userId to associate with backend
        })
        console.log(result.data);
        toast.success('Project created!')
        //Navigate to playground
        router.push(`/playground/${projectId}?frameId=${frameId}`)
        setLoading(false);
      } catch (e) {
        toast.error('Internal server error!')
        console.log(e);
        setLoading(false);
      }
    }

  return (
    <div className='flex flex-col items-center h-[80vh] justify-center'>
        <h2 className='font-bold text-6xl'>What should we Design?</h2>
        <p className='mt-2 text-xl text-gray-500'>Generate, Edit and Explore desin with AI, Export code as well</p>

        <div className='w-full max-w-2xl p-5 border mt-5 rounded-2xl'>
            <textarea placeholder='Describe your page design'
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
            className='w-full h-24 focus:outline-none focus:ring-0 resize-none'
            />
            <div className='flex justify-between items-center'>
                <Button variant={'ghost'}><ImagePlus/></Button>
                {!isLoaded ? (
                  <div>Loading...</div> // Show loading while Clerk initializes
                ) : user ? (
                  <Button disabled={!userInput || Loading} onClick={CreateNewProject}>
                    {Loading ? <Loader2Icon className='animate-spin'/> : <ArrowUp/>}
                  </Button>
                ) : (
                  <SignInButton mode='modal' forceRedirectUrl={'/workspace'}>
                    <Button disabled={Loading}>Sign In to Create</Button>
                  </SignInButton>
                )}
            </div>
        </div>

        <div className='mt-4 gap-3'>
            {suggestions.map((suggestion, index) => (
                <Button variant={'outline'} key={index} onClick={() => setUserInput(suggestion.prompt)}>
                <suggestion.icon />
                {suggestion.label}
                </Button>
            ))}
        </div>
    </div>
  )
}

export default Hero

const generateRandomFrameNumber = () => {
  const num = Math.floor(Math.random() * 10000);
  return num
}