"use client"
import { Save } from "lucide-react"

type Props = {
  onSave: () => void
}

export default function PlaygroundHeader({ onSave }: Props) {
  return (
    <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">Pentrix</h1>
        <span className="text-sm text-gray-500">AI Website Builder</span>
      </div>

      <button
        onClick={onSave}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Save className="w-4 h-4" />
        Save
      </button>
    </header>
  )
}
