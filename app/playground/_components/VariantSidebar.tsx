"use client"
import { Check, Loader2 } from "lucide-react"
import type { ProjectFile } from "../[projectId]/client"

type Variant = {
  id: number
  name: string
  projectFiles: ProjectFile[]
  thumbnail?: string
  isGenerating?: boolean
}

type Props = {
  variants: Variant[]
  selectedVariantId: number
  onSelectVariant: (id: number) => void
  isGenerating?: boolean
}

export default function VariantSidebar({ variants, selectedVariantId, onSelectVariant, isGenerating }: Props) {
  return (
    <div className="w-64 bg-white border-l flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Design Variants</h3>
        <p className="text-xs text-gray-500 mt-1">Choose your favorite design</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => !variant.isGenerating && onSelectVariant(variant.id)}
            disabled={variant.isGenerating}
            className={`w-full border rounded-lg overflow-hidden transition-all ${
              selectedVariantId === variant.id ? "border-purple-700" : "border-gray-200"
            } ${variant.isGenerating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="aspect-video bg-gray-100 relative flex items-center justify-center">
              {variant.isGenerating ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-700" />
                  <span className="text-xs text-gray-500">Generating...</span>
                </div>
              ) : variant.thumbnail ? (
                <img
                  src={variant.thumbnail || "/placeholder.svg"}
                  alt={variant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <div className="text-xs text-gray-400 font-mono">{variant.projectFiles.length} files</div>
                </div>
              )}
              {selectedVariantId === variant.id && !variant.isGenerating && (
                <div className="absolute top-2 right-2 bg-purple-700 rounded-full p-1">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="p-2 bg-white">
              <p className="text-xs font-medium text-gray-700">{variant.name}</p>
            </div>
          </button>
        ))}
      </div>

      {isGenerating && (
        <div className="p-4 border-t bg-blue-50">
          <div className="flex items-center gap-2 text-xs text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating 4 variants...</span>
          </div>
        </div>
      )}
    </div>
  )
}
