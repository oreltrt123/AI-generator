"use client"
import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { SignInButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'

const MenuOpetion = [
    {
        name: 'Pricing',
        path: '/pricing'
    },
    {
        name: 'Contact us',
        path: '/contact-us'
    }
]

const Header = () => {
  const { isSignedIn } = useUser();

  return (
    <div 
      className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
        <div className='flex gap-2 items-center absolute left-5'>
           <Image src={'/logoIcon.png'} alt='logo' width={55} height={140}/>
        </div>
        <div className='flex gap-3'>
            {/* {MenuOpetion.map((menu, index) => (
                <Link href={menu.path} key={index}>
                    <Button variant={'ghost'}>{menu.name}</Button>
                </Link>
            ))} */}
        </div>
        <div className='absolute right-4 top-3'>
            {isSignedIn ? (
                <Link href={'/workspace'}>
                    <Button
      style={{
        padding: "0.25rem 0.75rem", // smaller height and width
        fontSize: "0.875rem", // label-2 size
        fontWeight: 500,
        color: "#FFFFFF", // text-ceramic-white
        backgroundColor: "#7C3AED", // ceramic-purple-700 example
        borderRadius: "0.375rem", // rounded corners
        boxShadow:
          "inset 0 1px 1px 0 rgba(255,255,255,0.12), 0 2px 2px -1px rgba(0,0,0,0.16), 0 4px 4px -2px rgba(0,0,0,0.24), 0 0 0 1px #7C3AED",
        cursor: "pointer",
        whiteSpace: "nowrap",
        height: "30px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        transform: "none",
      }}>Get Started <ArrowRight /></Button>
                </Link>
            ) : (
                <SignInButton mode='modal' forceRedirectUrl={'/workspace'}>
                    <Button>Get Started <ArrowRight /></Button>
                </SignInButton>
            )}
        </div>
    </div>
  )
}

export default Header