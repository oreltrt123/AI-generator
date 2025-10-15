"use client"

import { Button } from "@/components/ui/button"
import { Code2 } from "lucide-react"

type Props = {
  messageId: string
  projectName: string
  onClick: () => void
  isActive?: boolean
}

export function VersionButton({ messageId, projectName, onClick, isActive }: Props) {
  return (
    <Button variant={isActive ? "default" : "outline"} size="sm" onClick={onClick} className="gap-2 text-xs">
      <Code2 className="w-3 h-3" />
      {projectName}
    </Button>
  )
}
