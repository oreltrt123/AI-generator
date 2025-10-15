"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

type Props = {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: string
}

export function CollapsibleSection({ title, icon, children, defaultOpen = false, badge }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 p-3 hover:bg-accent/50 transition-colors text-left"
      >
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {icon}
        <span className="font-medium text-sm">{title}</span>
        {badge && <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{badge}</span>}
      </button>
      {isOpen && (
        <div className="p-3 pt-0 text-sm text-muted-foreground border-t border-border animate-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </div>
  )
}
