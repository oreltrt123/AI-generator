"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Check, Loader2, AlertCircle } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import axios from "axios"

type DatabaseConnection = {
  id: number
  provider: "supabase" | "firebase"
  connectionName: string
  config: any
  isActive: number
}

type SupabaseProject = {
  id: string
  name: string
  region: string
}

type Props = {
  open: boolean
  onClose: () => void
  onConnectionSaved: (connection: DatabaseConnection) => void
}

export default function DatabaseConnectionModal({ open, onClose, onConnectionSaved }: Props) {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<"supabase" | "firebase">("supabase")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Supabase state
  const [supabaseToken, setSupabaseToken] = useState("")
  const [supabaseProjects, setSupabaseProjects] = useState<SupabaseProject[]>([])
  const [selectedSupabaseProject, setSelectedSupabaseProject] = useState<string | null>(null)
  const [loadingProjects, setLoadingProjects] = useState(false)

  // Firebase state
  const [firebaseConfig, setFirebaseConfig] = useState({
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  })
  const [connectionName, setConnectionName] = useState("")

  const fetchSupabaseProjects = async () => {
    if (!supabaseToken.trim()) {
      setError("Please enter your Supabase access token")
      return
    }

    setLoadingProjects(true)
    setError("")
    try {
      const response = await axios.post("/api/database/supabase-projects", {
        token: supabaseToken,
      })
      setSupabaseProjects(response.data.projects || [])
      if (response.data.projects.length === 0) {
        setError("No projects found for this token")
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch Supabase projects")
      setSupabaseProjects([])
    } finally {
      setLoadingProjects(false)
    }
  }

  const saveSupabaseConnection = async () => {
    if (!selectedSupabaseProject) {
      setError("Please select a Supabase project")
      return
    }

    const project = supabaseProjects.find((p) => p.id === selectedSupabaseProject)
    if (!project) return

    setLoading(true)
    setError("")
    try {
      const response = await axios.post("/api/database/save-connection", {
        userId: user?.id,
        provider: "supabase",
        connectionName: project.name,
        config: {
          token: supabaseToken,
          projectId: project.id,
          projectName: project.name,
          region: project.region,
        },
      })
      setSuccess("Supabase connection saved successfully!")
      onConnectionSaved(response.data.connection)
      setTimeout(() => {
        onClose()
        resetForm()
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save Supabase connection")
    } finally {
      setLoading(false)
    }
  }

  const saveFirebaseConnection = async () => {
    if (!connectionName.trim()) {
      setError("Please enter a connection name")
      return
    }

    const missingFields = Object.entries(firebaseConfig).filter(([_, value]) => !value.trim())
    if (missingFields.length > 0) {
      setError(`Please fill in all Firebase config fields: ${missingFields.map(([key]) => key).join(", ")}`)
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await axios.post("/api/database/save-connection", {
        userId: user?.id,
        provider: "firebase",
        connectionName,
        config: firebaseConfig,
      })
      setSuccess("Firebase connection saved successfully!")
      onConnectionSaved(response.data.connection)
      setTimeout(() => {
        onClose()
        resetForm()
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save Firebase connection")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSupabaseToken("")
    setSupabaseProjects([])
    setSelectedSupabaseProject(null)
    setFirebaseConfig({
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
    })
    setConnectionName("")
    setError("")
    setSuccess("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Connect Database
          </DialogTitle>
          <DialogDescription>
            Connect your Supabase or Firebase database to automatically integrate it into your AI-generated projects.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "supabase" | "firebase")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supabase">Supabase</TabsTrigger>
            <TabsTrigger value="firebase">Firebase</TabsTrigger>
          </TabsList>

          <TabsContent value="supabase" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supabase Connection</CardTitle>
                <CardDescription>Enter your Supabase access token to view and select your projects.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supabase-token">Access Token</Label>
                  <Input
                    id="supabase-token"
                    type="password"
                    placeholder="sbp_xxxxxxxxxxxxx"
                    value={supabaseToken}
                    onChange={(e) => setSupabaseToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your access token from Supabase Dashboard → Account → Access Tokens
                  </p>
                </div>

                <Button onClick={fetchSupabaseProjects} disabled={loadingProjects || !supabaseToken.trim()}>
                  {loadingProjects ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading Projects...
                    </>
                  ) : (
                    "Fetch Projects"
                  )}
                </Button>

                {supabaseProjects.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Project</Label>
                    <div className="grid gap-2">
                      {supabaseProjects.map((project) => (
                        <Card
                          key={project.id}
                          className={`cursor-pointer transition-all ${
                            selectedSupabaseProject === project.id
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedSupabaseProject(project.id)}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{project.name}</p>
                              <p className="text-xs text-muted-foreground">Region: {project.region}</p>
                            </div>
                            {selectedSupabaseProject === project.id && <Check className="w-5 h-5 text-primary" />}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSupabaseProject && (
                  <Button onClick={saveSupabaseConnection} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Connection"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="firebase" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Firebase Connection</CardTitle>
                <CardDescription>Enter your Firebase project configuration from the Firebase Console.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="connection-name">Connection Name</Label>
                  <Input
                    id="connection-name"
                    placeholder="My Firebase Project"
                    value={connectionName}
                    onChange={(e) => setConnectionName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firebase-apiKey">API Key</Label>
                  <Input
                    id="firebase-apiKey"
                    placeholder="AIzaSy..."
                    value={firebaseConfig.apiKey}
                    onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firebase-authDomain">Auth Domain</Label>
                  <Input
                    id="firebase-authDomain"
                    placeholder="myapp.firebaseapp.com"
                    value={firebaseConfig.authDomain}
                    onChange={(e) => setFirebaseConfig({ ...firebaseConfig, authDomain: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firebase-projectId">Project ID</Label>
                  <Input
                    id="firebase-projectId"
                    placeholder="myapp-12345"
                    value={firebaseConfig.projectId}
                    onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firebase-storageBucket">Storage Bucket</Label>
                  <Input
                    id="firebase-storageBucket"
                    placeholder="myapp.appspot.com"
                    value={firebaseConfig.storageBucket}
                    onChange={(e) => setFirebaseConfig({ ...firebaseConfig, storageBucket: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firebase-messagingSenderId">Messaging Sender ID</Label>
                  <Input
                    id="firebase-messagingSenderId"
                    placeholder="123456789"
                    value={firebaseConfig.messagingSenderId}
                    onChange={(e) => setFirebaseConfig({ ...firebaseConfig, messagingSenderId: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firebase-appId">App ID</Label>
                  <Input
                    id="firebase-appId"
                    placeholder="1:123456789:web:abc123"
                    value={firebaseConfig.appId}
                    onChange={(e) => setFirebaseConfig({ ...firebaseConfig, appId: e.target.value })}
                  />
                </div>

                <Button onClick={saveFirebaseConnection} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Connection"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
            <Check className="w-4 h-4" />
            <p className="text-sm">{success}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
