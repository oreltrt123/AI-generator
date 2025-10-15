"use client"

import { CheckCircle2, FileCode, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

type FileGenerationProgressProps = {
  files: { path: string; status: "pending" | "generating" | "complete" }[]
}

export function FileGenerationProgress({ files }: FileGenerationProgressProps) {
  const [visibleFiles, setVisibleFiles] = useState<typeof files>([])

  useEffect(() => {
    files.forEach((file, index) => {
      setTimeout(() => {
        setVisibleFiles((prev) => {
          const exists = prev.find((f) => f.path === file.path)
          if (exists) {
            return prev.map((f) => (f.path === file.path ? file : f))
          }
          return [...prev, file]
        })
      }, index * 150)
    })
  }, [files])

  return (
    <div className="space-y-2 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <FileCode className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-semibold text-purple-700">Generating Files</span>
        <span className="text-xs text-gray-600">
          ({files.filter((f) => f.status === "complete").length}/{files.length})
        </span>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {visibleFiles.map((file, idx) => (
          <div
            key={file.path}
            className="flex items-center gap-2 p-2 bg-white rounded-md animate-slide-in-left"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {file.status === "complete" ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
            )}
            <code className="text-xs font-mono text-gray-700 flex-1 truncate">{file.path}</code>
            {file.status === "generating" && (
              <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="file-progress-bar" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
