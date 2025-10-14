"use client"
import { useState } from "react"
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

type Props = {
  isOpen: boolean
  onClose: () => void
  generatedCode: string
  projectId?: string
  onDeploySuccess?: (subdomain: string) => void
}

export default function DeployModal({ isOpen, onClose, generatedCode, projectId, onDeploySuccess }: Props) {
  const [subdomain, setSubdomain] = useState("")
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState<"idle" | "validating" | "deploying" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [deployedUrl, setDeployedUrl] = useState("")

  if (!isOpen) return null

  const validateSubdomain = (name: string): boolean => {
    // Only lowercase letters, numbers, and hyphens, 3-30 chars
    const regex = /^[a-z0-9-]{3,30}$/
    return regex.test(name)
  }

  const validateHTML = (html: string): { valid: boolean; error?: string } => {
    if (!html || html.trim().length === 0) {
      return { valid: false, error: "No HTML code to deploy" }
    }

    // Check for basic HTML structure
    if (!html.includes("<body") || !html.includes("</body>")) {
      return { valid: false, error: "Invalid HTML structure - missing body tags" }
    }

    // Check for script tags that might be malicious
    const scriptCount = (html.match(/<script/gi) || []).length
    if (scriptCount > 20) {
      return { valid: false, error: "Too many script tags detected" }
    }

    return { valid: true }
  }

  const handleDeploy = async () => {
    if (!subdomain) {
      setErrorMessage("Please enter a subdomain name")
      return
    }

    if (!validateSubdomain(subdomain)) {
      setErrorMessage("Subdomain must be 3-30 characters, lowercase letters, numbers, and hyphens only")
      return
    }

    setIsDeploying(true)
    setDeployStatus("validating")
    setErrorMessage("")

    // Validate HTML
    const validation = validateHTML(generatedCode)
    if (!validation.valid) {
      setDeployStatus("error")
      setErrorMessage(validation.error || "Invalid HTML")
      setIsDeploying(false)
      return
    }

    // Deploy
    setDeployStatus("deploying")
    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain,
          html: generatedCode,
          projectId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Deployment failed")
      }

      setDeployStatus("success")
      setDeployedUrl(`https://${subdomain}.pentrix.site`)
      if (onDeploySuccess) {
        onDeploySuccess(subdomain)
      }
    } catch (error: any) {
      setDeployStatus("error")
      setErrorMessage(error.message || "Deployment failed")
    } finally {
      setIsDeploying(false)
    }
  }

  const handleClose = () => {
    setSubdomain("")
    setDeployStatus("idle")
    setErrorMessage("")
    setDeployedUrl("")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Deploy Your Website</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDeploying}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {deployStatus === "idle" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose your subdomain</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                    placeholder="mysite"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isDeploying}
                  />
                  <span className="text-gray-500 text-sm">.pentrix.site</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  3-30 characters, lowercase letters, numbers, and hyphens only
                </p>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Your website will be published at:
                  <br />
                  <span className="font-mono font-semibold">https://{subdomain || "yoursite"}.pentrix.site</span>
                </p>
              </div>
            </>
          )}

          {deployStatus === "validating" && (
            <div className="flex items-center gap-3 p-4">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <div>
                <p className="font-medium">Validating HTML...</p>
                <p className="text-sm text-gray-500">Checking code structure</p>
              </div>
            </div>
          )}

          {deployStatus === "deploying" && (
            <div className="flex items-center gap-3 p-4">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <div>
                <p className="font-medium">Deploying...</p>
                <p className="text-sm text-gray-500">Publishing your website</p>
              </div>
            </div>
          )}

          {deployStatus === "success" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900">Deployment Successful!</p>
                  <p className="text-sm text-green-700 mt-1">Your website is now live</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Your website URL:</p>
                <a
                  href={deployedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-mono text-sm break-all underline"
                >
                  {deployedUrl}
                </a>
              </div>
            </div>
          )}

          {deployStatus === "error" && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">Deployment Failed</p>
                <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          {deployStatus === "idle" && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isDeploying}
              >
                Cancel
              </button>
              <button
                onClick={handleDeploy}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeploying || !subdomain}
              >
                Deploy
              </button>
            </>
          )}

          {(deployStatus === "success" || deployStatus === "error") && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
