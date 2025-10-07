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
    <div className='flex items-center justify-between p-4 shadow'>
        <div className='flex gap-2 items-center'>
           <Image src={'/logo.svg'} alt='logo' width={140} height={140}/>
        </div>
        <div className='flex gap-3'>
            {MenuOpetion.map((menu, index) => (
                <Link href={menu.path} key={index}>
                    <Button variant={'ghost'}>{menu.name}</Button>
                </Link>
            ))}
        </div>
        <div>
            {isSignedIn ? (
                <Link href={'/workspace'}>
                    <Button>Get Started <ArrowRight /></Button>
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