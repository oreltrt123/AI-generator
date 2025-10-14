"use client"

import React from 'react'
import Hero from './_components/Hero'
import AppHeader from "./workspace/_components/AppHeader"
import {
  SidebarProvider,
} from "@/components/ui/sidebar"

function Workspace() {
  return (
    <SidebarProvider>
      <main className="flex-1">
        <AppHeader />
        <Hero />
      </main>
    </SidebarProvider>
  )
}

export default Workspace