"use client"

export function CodePreviewSkeleton() {
  return (
    <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-300 rounded" />
        <div className="h-4 bg-gray-300 rounded w-32" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 rounded w-full" />
        <div className="h-3 bg-gray-300 rounded w-5/6" />
        <div className="h-3 bg-gray-300 rounded w-4/6" />
        <div className="h-3 bg-gray-300 rounded w-full" />
        <div className="h-3 bg-gray-300 rounded w-3/6" />
      </div>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer" />
      </div>
    </div>
  )
}
