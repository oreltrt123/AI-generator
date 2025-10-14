"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Zap, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { models } from "@/types/models"
import { Textarea } from "@/components/ui/textarea"

type UserSettings = {
  activeModels: (keyof typeof models)[]
  customInstructions: string
}

type Props = {
  settings: UserSettings
  onSave: (newSettings: Partial<UserSettings>) => Promise<void>
  onClose: () => void
}

export default function SettingsModal({ settings, onSave, onClose }: Props) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [activeTab, setActiveTab] = useState<"instructions" | "models">("instructions")

  const toggleModel = (model: keyof typeof models) => {
    const isActive = localSettings.activeModels.includes(model)
    const updated = isActive
      ? localSettings.activeModels.filter((m) => m !== model)
      : [...localSettings.activeModels, model]
    setLocalSettings({ ...localSettings, activeModels: updated })
  }

  const handleSave = async () => {
    await onSave(localSettings)
    onClose()
  }

  const aiControlExamples = [
    "From today, all the time you create files for me, you will create them professionally 100%.",
    "Always use Tailwind CSS for styling in generated code.",
    "Prioritize accessibility in all UI components.",
  ]

  const injectInstruction = (example: string) => {
    setLocalSettings({
      ...localSettings,
      customInstructions: `${localSettings.customInstructions ? localSettings.customInstructions + "\n" : ""}${example}`,
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto">
        <div className="flex h-96 bg-[#f0eeee] rounded-lg">
          {/* Sidebar Inside Modal */}
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              Settings
            </DialogTitle>
          </DialogHeader>

          <div className="w-36 border-r p-2 flex flex-col space-y-2">
            <Button
              variant={activeTab === "instructions" ? "default" : "ghost"}
              className={`justify-start text-sm text-accent-foreground ${
                activeTab === "instructions" ? "bg-white hover:bg-white shadow" : ""
              }`}
              onClick={() => setActiveTab("instructions")}
            >
              AI Controls
            </Button>
            <Button
              variant={activeTab === "models" ? "default" : "ghost"}
              className={`justify-start text-sm text-accent-foreground ${
                activeTab === "models" ? "bg-white hover:bg-white shadow" : "hover:bg-none"
              }`}
              onClick={() => setActiveTab("models")}
            >
              Models ({localSettings.activeModels.length}/3)
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 space-y-4">
            {activeTab === "instructions" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom AI Instructions</label>
                <div className="mt-2">
                  <Textarea
                    value={localSettings.customInstructions}
                    onChange={(e) => setLocalSettings({ ...localSettings, customInstructions: e.target.value })}
                    placeholder="E.g., 'Always create files professionally 100%...'"
                    className="h-24 resize-none bg-white"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    These will be prepended to every prompt.
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Quick Add:</p>
                    {aiControlExamples.map((example, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="text-xs h-auto py-1 w-full justify-start"
                        onClick={() => injectInstruction(example)}
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        {example.substring(0, 30)}...
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "models" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Toggle models on/off. Inactive ones won’t appear in the selector.
                </p>
                {Object.entries(models).map(([key, modelData]) => (
                  <div key={key} className="flex items-center justify-between p-2 shadow bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{modelData.name}</Badge>
                      <span className="text-xs">by {modelData.author}</span>
                    </div>
                    <Button
                      size="icon"
                      variant={localSettings.activeModels.includes(key as any) ? "default" : "outline"}
                      onClick={() => toggleModel(key as any)}
                      className="w-6 h-6"
                    >
                      {localSettings.activeModels.includes(key as any) ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              className="w-full bg-white hover:bg-white shadow text-accent-foreground"
              onClick={handleSave}
            >
              Save & Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}