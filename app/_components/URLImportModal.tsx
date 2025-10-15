"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

interface URLImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (url: string) => Promise<void>
}

export default function URLImportModal({ open, onClose, onImport }: URLImportModalProps) {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error("Please enter a valid URL")
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      toast.error("Please enter a valid URL (e.g., https://example.com)")
      return
    }

    setLoading(true)
    try {
      await onImport(url)
      setUrl("")
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to import website")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setUrl("")
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from URL</DialogTitle>
          <DialogDescription>
            Enter the URL of a website you want to import. We'll analyze the page and create a project based on its
            design and structure.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleImport()
                }
              }}
              disabled={loading}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={loading || !url.trim()}>
            {loading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
