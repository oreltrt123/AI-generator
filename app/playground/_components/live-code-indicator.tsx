"use client"

import { FileCode, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  fileName: string
  status: "generating" | "complete"
  linesGenerated?: number
}

export function LiveCodeIndicator({ fileName, status, linesGenerated }: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-md border",
        status === "generating" ? "bg-blue-50 border-blue-200 animate-pulse" : "bg-green-50 border-green-200",
      )}
    >
      {status === "generating" ? (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      ) : (
        <FileCode className="w-3 h-3 text-green-600" />
      )}
      <span className="text-xs font-mono">{fileName}</span>
      {linesGenerated && <span className="ml-auto text-xs text-muted-foreground">{linesGenerated} lines</span>}
    </div>
  )
}
