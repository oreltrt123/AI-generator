"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"
import { FileCode, FolderOpen, TerminalIcon, X, ChevronRight, ChevronDown, File, Eye, Code2, MousePointer2 } from "lucide-react"
import type { ProjectFile } from "../[projectId]/client"
import { getWebContainerInstance } from "@/lib/webcontainer-singleton"
import { detectPackagesFromFiles, getPackageInstallCommand } from "@/lib/package-detector"
import DeployButton from "./DeployButton"
import EditSidebar from "./EditSidebar"

type Props = {
  projectFiles: ProjectFile[]
  onFilesChange: (files: ProjectFile[]) => void
  width: number
  onWidthChange: (width: number) => void
  onAutoRunStart?: () => void
  onAutoRunComplete?: () => void
  projectId?: string
}

type SelectedElement = {
  tagName: string
  id: string
  className: string
  style: Record<string, string>
  cssText?: string
  alt?: string
}

const textElements = ["P", "H1", "H2", "H3", "H4", "H5", "H6", "SPAN", "DIV", "LI", "TD"]

function WebsiteDesign({
  projectFiles,
  projectId = "",
  onFilesChange,
  width,
  onWidthChange,
  onAutoRunStart,
  onAutoRunComplete,
}: Props) {
  const [webcontainer, setWebcontainer] = useState<any>(null)
  const [terminal, setTerminal] = useState<any>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [isRunning, setIsRunning] = useState(false)
  const [showTerminal, setShowTerminal] = useState(true)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/", "app", "components"]))
  const [containerReady, setContainerReady] = useState(false)
  const [terminalReady, setTerminalReady] = useState(false)
  const [hasAutoRun, setHasAutoRun] = useState(false)
  const [viewMode, setViewMode] = useState<"code" | "preview">("preview")
  const [editMode, setEditMode] = useState(false)
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [currentText, setCurrentText] = useState("")
  const [instruction, setInstruction] = useState("")

  const terminalRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fitAddonRef = useRef<any>(null)
  const shellProcessRef = useRef<any>(null)
  const previousFilesCountRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const googleFonts = new Set([
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Oswald",
    "Source Sans 3",
    "Raleway",
    "PT Sans",
    "Merriweather",
    "Inter",
    "DM Sans",
  ])

  useEffect(() => {
    let mounted = true

    const initWebContainer = async () => {
      try {
        console.log("[v0] Starting WebContainer initialization...")
        const instance = await getWebContainerInstance()

        if (mounted) {
          setWebcontainer(instance)
          setContainerReady(true)
          console.log("[v0] WebContainer initialized successfully")
        }
      } catch (error) {
        console.error("[v0] Failed to initialize WebContainer:", error)
        console.error("[v0] Make sure your browser supports WebContainers and SharedArrayBuffer")
      }
    }

    initWebContainer()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!terminalRef.current || terminal || !containerReady) return

    let mounted = true

    const initTerminal = async () => {
      try {
        console.log("[v0] Initializing terminal...")
        const { Terminal } = await import("@xterm/xterm")
        const { FitAddon } = await import("@xterm/addon-fit")

        if (!mounted) return

        const term = new Terminal({
          cursorBlink: true,
          fontSize: 13,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          theme: {
            background: "#1e1e1e",
            foreground: "#d4d4d4",
          },
          convertEol: true,
        })

        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.open(terminalRef.current!)

        setTimeout(() => {
          fitAddon.fit()
        }, 100)

        fitAddonRef.current = fitAddon

        if (mounted) {
          setTerminal(term)
          setTerminalReady(true)
          console.log("[v0] Terminal initialized successfully")
        }

        const handleResize = () => {
          if (fitAddon) {
            setTimeout(() => fitAddon.fit(), 100)
          }
        }
        window.addEventListener("resize", handleResize)

        return () => {
          window.removeEventListener("resize", handleResize)
          term.dispose()
        }
      } catch (error) {
        console.error("[v0] Failed to initialize terminal:", error)
      }
    }

    initTerminal()

    return () => {
      mounted = false
    }
  }, [containerReady])

  useEffect(() => {
    if (!webcontainer || !terminal || !terminalReady || shellProcessRef.current) return

    const startShell = async () => {
      try {
        console.log("[v0] Starting shell process...")
        const shellProcess = await webcontainer.spawn("jsh", {
          terminal: {
            cols: terminal.cols,
            rows: terminal.rows,
          },
        })

        shellProcessRef.current = shellProcess

        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal.write(data)
            },
          }),
        )

        const input = shellProcess.input.getWriter()
        terminal.onData((data: string) => {
          input.write(data)
        })

        terminal.writeln("Welcome to WebContainer Terminal!")
        terminal.writeln("Your Next.js project will auto-run when ready.")
        terminal.writeln("")

        console.log("[v0] Shell connected successfully")
      } catch (error) {
        console.error("[v0] Failed to start shell:", error)
      }
    }

    startShell()
  }, [webcontainer, terminal, terminalReady])

  useEffect(() => {
    if (!webcontainer || !containerReady || projectFiles.length === 0) return

    const loadFiles = async () => {
      try {
        console.log("[v0] Loading files into WebContainer...", projectFiles.length, "files")

        const allFiles = [...projectFiles]
        const hasPackageJson = allFiles.some((f) => f.path === "package.json")

        if (!hasPackageJson) {
          const defaultPackageJson = {
            name: "nextjs-project",
            version: "0.1.0",
            private: true,
            scripts: {
              dev: "next dev --port 3000",
              build: "next build",
              start: "next start",
            },
            dependencies: {
              next: "14.2.5",
              react: "^18.3.1",
              "react-dom": "^18.3.1",
            },
            devDependencies: {
              "@types/node": "^20",
              "@types/react": "^18",
              "@types/react-dom": "^18",
              typescript: "^5",
              tailwindcss: "^3.4.1",
              postcss: "^8",
              autoprefixer: "^10.4.19",
            },
          }
          allFiles.push({
            path: "package.json",
            content: JSON.stringify(defaultPackageJson, null, 2),
          })
        }

        const fileTree: any = {}

        for (const file of allFiles) {
          const parts = file.path.split("/").filter((p) => p)
          let current = fileTree

          for (let i = 0; i < parts.length - 1; i++) {
            const dirName = parts[i]
            if (!current[dirName]) {
              current[dirName] = { directory: {} }
            }
            current = current[dirName].directory
          }

          const fileName = parts[parts.length - 1]
          current[fileName] = {
            file: {
              contents: file.content,
            },
          }
        }

        console.log("[v0] File tree structure:", fileTree)
        await webcontainer.mount(fileTree)
        console.log("[v0] Files loaded successfully")

        if (!selectedFile && allFiles.length > 0) {
          setSelectedFile(allFiles[0].path)
          setFileContent(allFiles[0].content)
        }

        if (projectFiles.length > previousFilesCountRef.current && !hasAutoRun && projectFiles.length > 0) {
          previousFilesCountRef.current = projectFiles.length
          setHasAutoRun(true)
          setTimeout(() => {
            autoRunDevServer()
          }, 500)
        }
      } catch (error) {
        console.error("[v0] Error loading files:", error)
      }
    }

    loadFiles()
  }, [webcontainer, containerReady, projectFiles])

  const autoRunDevServer = async () => {
    if (!webcontainer || !containerReady || isRunning) {
      console.log("[v0] Cannot auto-run - container not ready or already running")
      return
    }

    setIsRunning(true)
    onAutoRunStart?.()

    const detectedPackages = detectPackagesFromFiles(projectFiles)
    console.log("[v0] Detected packages:", detectedPackages)

    terminal?.writeln("\n[Auto-run] $ npm install")

    try {
      const installProcess = await webcontainer.spawn("npm", ["install"])

      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal?.write(data)
          },
        }),
      )

      const installCode = await installProcess.exit

      if (installCode !== 0) {
        terminal?.writeln("\n[Auto-run] Failed to install dependencies")
        setIsRunning(false)
        onAutoRunComplete?.()
        return
      }

      if (detectedPackages.length > 0) {
        const installCmd = getPackageInstallCommand(detectedPackages)
        terminal?.writeln(`\n[Auto-run] $ ${installCmd}`)

        const additionalInstall = await webcontainer.spawn("npm", ["install", ...detectedPackages])

        additionalInstall.output.pipeTo(
          new WritableStream({
            write(data) {
              terminal?.write(data)
            },
          }),
        )

        const additionalCode = await additionalInstall.exit

        if (additionalCode !== 0) {
          terminal?.writeln("\n[Auto-run] Warning: Some additional packages failed to install")
        } else {
          terminal?.writeln(`\n[Auto-run] Successfully installed ${detectedPackages.length} additional packages`)
        }
      }

      terminal?.writeln("\n[Auto-run] $ npm run dev")

      const devProcess = await webcontainer.spawn("npm", ["run", "dev"])

      devProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            terminal?.write(data)
          },
        }),
      )

      webcontainer.on("server-ready", (port: number, url: string) => {
        console.log("[v0] Server ready at:", url)
        setPreviewUrl(url)
        terminal?.writeln(`\n✓ Server running at ${url}`)
        terminal?.writeln("✓ Preview is now live!")
        onAutoRunComplete?.()
      })
    } catch (error) {
      console.error("[v0] Error auto-running dev server:", error)
      terminal?.writeln(`\n[Auto-run] Error: ${error}`)
      setIsRunning(false)
      onAutoRunComplete?.()
    }
  }

  useEffect(() => {
    if (!editMode) {
      setSidebarOpen(false)
      setSelectedElement(null)
    }
  }, [editMode])

  useEffect(() => {
    setIframeLoaded(false)
  }, [previewUrl])

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return

      if (e.data.type === "elementSelected") {
        setSelectedElement(e.data.element)
        setSidebarOpen(true)
      } else if (e.data.type === "improveText") {
        setCurrentText(e.data.text)
        setInstruction("")
      } else if (e.data.type === "textChanged") {
        updateCode()
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  useEffect(() => {
    if (viewMode !== "preview" || !iframeRef.current || !previewUrl || !iframeLoaded) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument
    if (!doc) return

    const oldStyle = doc.getElementById("edit-style")
    if (oldStyle) oldStyle.remove()

    const oldScript = doc.getElementById("edit-script")
    if (oldScript) oldScript.remove()

    if (editMode) {
      const style = doc.createElement("style")
      style.id = "edit-style"
      style.innerHTML = `
        .selected {
          outline: 2px solid #3B82F6 !important;
          outline-offset: 2px !important;
        }
        * {
          outline: 1px solid transparent !important;
          transition: outline 0.2s ease !important;
        }
        *:hover {
          outline: 1px dashed #3B82F6 !important;
          outline-offset: -1px !important;
        }
        * {
          cursor: crosshair !important;
        }
      `
      if (doc.head) {
        doc.head.appendChild(style)
      } else {
        const head = doc.createElement("head")
        doc.documentElement?.insertBefore(head, doc.body)
        head.appendChild(style)
      }

      const script = doc.createElement("script")
      script.id = "edit-script"
      script.innerHTML = `
        let currentSelected = null
        const textElements = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'DIV', 'LI', 'TD']

        function rgbToHex(rgb) {
          if (rgb.startsWith('#')) return rgb
          const [r, g, b] = rgb.match(/\\d+/g)?.map(Number) || [0, 0, 0]
          return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
        }

        function removeAIBbutton(el) {
          const btn = el.querySelector('button[id^="ai-improve-"]')
          if (btn) btn.remove()
        }

        function addAIBbutton(el) {
          if (!textElements.includes(el.tagName)) return
          removeAIBbutton(el)
          const buttonId = 'ai-improve-' + Math.random().toString(36).slice(2)
          const aiButton = document.createElement('button')
          aiButton.id = buttonId
          aiButton.innerHTML = '🤖 AI'
          aiButton.style.position = 'absolute'
          aiButton.style.top = '0'
          aiButton.style.right = '-40px'
          aiButton.style.zIndex = '1000'
          aiButton.style.padding = '2px 8px'
          aiButton.style.background = '#3B82F6'
          aiButton.style.color = 'white'
          aiButton.style.borderRadius = '4px'
          aiButton.style.fontSize = '12px'
          aiButton.style.border = 'none'
          aiButton.style.cursor = 'pointer'
          aiButton.onclick = function(e) {
            e.stopPropagation()
            const text = el.textContent || el.innerText || ''
            window.parent.postMessage({ type: 'improveText', text }, '*')
          }
          el.style.position = 'relative'
          el.appendChild(aiButton)
        }

        function selectElement(el) {
          if (currentSelected && currentSelected !== el) {
            currentSelected.classList.remove('selected')
            if (textElements.includes(currentSelected.tagName)) {
              currentSelected.contentEditable = false
              removeAIBbutton(currentSelected)
            }
          }
          currentSelected = el
          el.classList.add('selected')
          const computedStyle = window.getComputedStyle(el)
          const isText = textElements.includes(el.tagName)
          if (isText) {
            el.contentEditable = true
            el.focus()
            addAIBbutton(el)
            el.addEventListener('input', function() {
              window.parent.postMessage({ type: 'textChanged' }, '*')
            })
          }
          window.parent.postMessage({
            type: 'elementSelected',
            element: {
              tagName: el.tagName.toLowerCase(),
              id: el.id || '',
              className: el.className || '',
              style: {
                fontSize: computedStyle.fontSize,
                color: rgbToHex(computedStyle.color),
                backgroundColor: rgbToHex(computedStyle.backgroundColor),
                width: el.style.width,
                height: el.style.height,
                padding: el.style.padding,
                margin: el.style.margin,
                fontFamily: computedStyle.fontFamily,
                fontWeight: computedStyle.fontWeight,
                textAlign: computedStyle.textAlign,
                lineHeight: computedStyle.lineHeight,
                textTransform: computedStyle.textTransform,
                letterSpacing: computedStyle.letterSpacing,
                borderWidth: computedStyle.borderWidth,
                borderStyle: computedStyle.borderStyle,
                borderRadius: computedStyle.borderRadius,
                boxShadow: computedStyle.boxShadow,
                transform: computedStyle.transform,
                opacity: computedStyle.opacity,
                position: computedStyle.position,
                zIndex: computedStyle.zIndex,
                transition: computedStyle.transition,
                cssText: el.style.cssText
              },
              ...(el.tagName === 'IMG' && { alt: el.alt })
            }
          }, '*')
        }

        window.addEventListener('message', function(e) {
          if (e.data.type === 'loadFont') {
            const font = e.data.font
            if (!document.querySelector(\`link[href*="family=\${font}"]\`)) {
              const link = document.createElement('link')
              link.href = \`https://fonts.googleapis.com/css2?family=\${font}:wght@100..900&display=swap\`
              link.rel = 'stylesheet'
              document.head.appendChild(link)
            }
          } else if (e.data.type === 'updateText') {
            if (currentSelected) {
              currentSelected.textContent = e.data.text
              currentSelected.contentEditable = false
              window.parent.postMessage({ type: 'textChanged' }, '*')
            }
          } else if (e.data.type === 'updateImageSrc') {
            if (currentSelected && currentSelected.tagName === 'IMG') {
              currentSelected.src = e.data.src
              window.parent.postMessage({ type: 'textChanged' }, '*')
            }
          } else if (e.data.type === 'updateAlt') {
            if (currentSelected && currentSelected.tagName === 'IMG') {
              currentSelected.alt = e.data.alt
              window.parent.postMessage({ type: 'textChanged' }, '*')
            }
          } else if (e.data.type === 'deselectElement') {
            if (currentSelected) {
              currentSelected.classList.remove('selected')
              if (textElements.includes(currentSelected.tagName)) {
                currentSelected.contentEditable = false
                removeAIBbutton(currentSelected)
              }
              currentSelected = null
            }
          }
        })

        document.addEventListener('click', function(e) {
          e.preventDefault()
          e.stopPropagation()
          selectElement(e.target)
        }, true)
      `
      if (doc.head) {
        doc.head.appendChild(script)
      } else {
        const head = doc.createElement("head")
        doc.documentElement?.insertBefore(head, doc.body)
        head.appendChild(script)
      }
    }
  }, [viewMode, editMode, previewUrl, iframeLoaded])

  const updateCode = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      const iframe = iframeRef.current
      if (!iframe || !iframe.contentDocument) return

      const doc = iframe.contentDocument
      doc.querySelectorAll(".selected").forEach((el: Element) => el.classList.remove("selected"))

      const selectedFileContent = projectFiles.find(f => f.path === selectedFile)?.content || ''
      const bodyStartMatch = selectedFileContent.match(/<body[^>]*>/i)
      if (!bodyStartMatch) return

      const bodyStart = bodyStartMatch.index! + bodyStartMatch[0].length
      const bodyEnd = selectedFileContent.indexOf("</body>", bodyStart)
      if (bodyEnd === -1) return

      const prefix = selectedFileContent.substring(0, bodyStart)
      const suffix = selectedFileContent.substring(bodyEnd)
      const newBodyContent = doc.body.innerHTML
      const newCode = prefix + newBodyContent + suffix

      if (selectedFile) {
        const updatedFiles = projectFiles.map((f) => 
          f.path === selectedFile ? { ...f, content: newCode } : f
        )
        onFilesChange(updatedFiles)

        if (webcontainer && containerReady) {
          webcontainer.fs.writeFile(selectedFile, newCode).catch((err: any) => {
            console.error("[v0] Error writing file to WebContainer:", err)
          })
        }
      }
    }, 300)
  }

  const updateStyle = (prop: string, val: string) => {
    const iframe = iframeRef.current
    if (iframe?.contentDocument) {
      const el = iframe.contentDocument.querySelector(".selected")
      if (el) {
        ;(el as any).style[prop] = val
        setSelectedElement((prev) => (prev ? { ...prev, style: { ...prev.style, [prop]: val } } : null))
        if (prop === "fontFamily") {
          if (googleFonts.has(val)) {
            iframe.contentWindow?.postMessage({ type: "loadFont", font: val }, "*")
          }
        }
        updateCode()
      }
    }
  }

  const updateAlt = (alt: string) => {
    iframeRef.current?.contentWindow?.postMessage({ type: "updateAlt", alt }, "*")
    setSelectedElement((prev) => (prev ? { ...prev, alt } : null))
    updateCode()
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
    setSelectedElement(null)
    if (iframeRef.current?.contentDocument) {
      const doc = iframeRef.current.contentDocument
      const el = doc.querySelector(".selected")
      if (el) {
        el.classList.remove("selected")
        if (textElements.includes(el.tagName)) {
          iframeRef.current?.contentWindow?.postMessage({ type: "deselectElement" }, "*")
        }
      }
    }
  }

  const renderFileTree = () => {
    if (projectFiles.length === 0) {
      return <div className="p-4 text-center text-sm text-gray-500">No files yet. Start by chatting with the AI!</div>
    }

    const folders: { [key: string]: ProjectFile[] } = { "/": [] }

    projectFiles.forEach((file) => {
      const parts = file.path.split("/").filter((p) => p)

      if (parts.length === 1) {
        folders["/"].push(file)
      } else {
        const folderPath = parts.slice(0, -1).join("/")
        if (!folders[folderPath]) {
          folders[folderPath] = []
        }
        folders[folderPath].push(file)
      }
    })

    const toggleFolder = (path: string) => {
      const newExpanded = new Set(expandedFolders)
      if (newExpanded.has(path)) {
        newExpanded.delete(path)
      } else {
        newExpanded.add(path)
      }
      setExpandedFolders(newExpanded)
    }

    const renderFolder = (folderPath: string, level = 0): React.JSX.Element[] => {
      const elements: React.JSX.Element[] = []
      const isExpanded = expandedFolders.has(folderPath)
      const files = folders[folderPath] || []

      if (folderPath !== "/") {
        const folderName = folderPath.split("/").pop() || folderPath
        elements.push(
          <div
            key={`folder-${folderPath}`}
            className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => toggleFolder(folderPath)}
          >
            {isExpanded ? <img width={17} src="/icon/open-folder.png" alt="" /> : <img width={17} src="/icon/folder.png" alt="" /> }
            <span className="ml-1">{folderName}</span>
          </div>,
        )
      }

      if (isExpanded || folderPath === "/") {
        files.forEach((file) => {
          const fileName = file.path.split("/").pop() || file.path
          elements.push(
            <div
              key={`file-${file.path}`}
              className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm ${
                selectedFile === file.path ? "bg-blue-50 border-l-2 border-blue-500" : ""
              }`}
              style={{ paddingLeft: `${(folderPath === "/" ? level : level + 1) * 12 + 8}px` }}
              onClick={() => {
                setSelectedFile(file.path)
                setFileContent(file.content)
              }}
            >
              <img width={17} src="/icon/file_.png" alt="" />
              <span className="truncate ml-1">{fileName}</span>
            </div>,
          )
        })

        Object.keys(folders)
          .filter((f) => {
            if (folderPath === "/") {
              return f !== "/" && !f.includes("/")
            }
            return f.startsWith(folderPath + "/") && f.split("/").length === folderPath.split("/").length + 1
          })
          .sort()
          .forEach((subFolder) => {
            elements.push(...renderFolder(subFolder, folderPath === "/" ? level : level + 1))
          })
      }

      return elements
    }

    return <div className="overflow-auto">{renderFolder("/")}</div>
  }

  const handleFileContentChange = (newContent: string) => {
    setFileContent(newContent)
    if (selectedFile) {
      const updatedFiles = projectFiles.map((f) => (f.path === selectedFile ? { ...f, content: newContent } : f))
      onFilesChange(updatedFiles)

      if (webcontainer && containerReady) {
        webcontainer.fs.writeFile(selectedFile, newContent).catch((err: any) => {
          console.error("[v0] Error writing file to WebContainer:", err)
        })
      }
    }
  }

  const sidebarWidth = 350

  const toggleTerminal = () => {
    setShowTerminal(!showTerminal)
    if (!showTerminal) {
      setTimeout(() => fitAddonRef.current?.fit(), 150)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white mr-2 relative" style={{ width: `${width}px`, minWidth: "400px" }}>
      <div className="flex items-center justify-between p-3 border-b bg-white border rounded-l-lg rounded-r-lg rounded-b-none">
        <div className="flex items-center gap-2">
          <span className="font-sans font-light text-sm absolute">{projectId as string}</span>
        </div>
        <div className="text-sm font-mono flex">
          <button
            onClick={() => setViewMode("preview")}
            className={`flex items-center justify-center gap-2 px-3 py-1 text-sm font-medium
              ${viewMode === "preview" ? "bg-gray-300 text-black" : "bg-white text-black border border-gray-300"} 
              rounded-tl-lg rounded-tr-none rounded-bl-lg rounded-br-none 
              transition-colors`}
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => setViewMode("code")}
            className={`flex items-center justify-center gap-2 px-3 py-1 text-sm font-medium
              ${viewMode === "code" ? "bg-gray-300 text-black" : "bg-white text-black border border-gray-300"}
              rounded-none
              transition-colors`}
          >
            <Code2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setEditMode((prev) => !prev)}
            className={`flex items-center justify-center gap-2 px-3 py-1 text-sm font-medium
              ${editMode ? "bg-gray-300 text-black" : "bg-white text-black border border-gray-300"}
              rounded-none
              transition-colors`}
            disabled={viewMode !== "preview"}
          >
            <MousePointer2 className="w-4 h-4" />
          </button>

          <button
            onClick={toggleTerminal}
            className={`flex items-center justify-center gap-2 px-3 py-1 text-sm font-medium
              ${showTerminal ? "bg-gray-300 text-black" : "bg-white text-black border border-gray-300"}
              rounded-tr-lg rounded-br-lg
              transition-colors`}
          >
            <TerminalIcon className="w-4 h-4" />
          </button>
        </div>
        <DeployButton projectFiles={projectFiles} projectId={projectId} />
      </div>

      <div className={`flex flex-1 overflow-hidden border-l-1 transition-all duration-300 ${sidebarOpen ? `w-[${width - sidebarWidth}px]` : "w-full"}`}>
        {viewMode === "code" && (
          <div className="w-64 border-r bg-white overflow-auto">
            <div className="p-2 border-b flex items-center justify-between bg-white">
              <span className="text-xs font-semibold text-gray-700">FILES</span>
              <span className="text-xs text-gray-500">{projectFiles.length} files</span>
            </div>
            {renderFileTree()}
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col border-b-0 border-r-1">
            {viewMode === "code" && selectedFile ? (
              <>
                <div className="w-full border-r bg-white overflow-auto">
                  <div className="p-2 border-b flex items-center justify-between bg-white">
                    <span className="text-xs font-semibold text-gray-700">{selectedFile}</span>
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setFileContent("")
                      }}
                      className="text-xs font-semibold text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={fileContent}
                  onChange={(e) => handleFileContentChange(e.target.value)}
                  className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none bg-white"
                  spellCheck={false}
                  placeholder="Edit your code here..."
                  style={{ height: "100%" }}
                />
              </>
            ) : viewMode === "code" && !selectedFile ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 bg-white">
                <div className="text-center">
                  <img width={57} src="/icon/file_.png" alt="" className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Select a file to edit</p>
                  <p className="text-xs mt-1">Choose from the file explorer on the left</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {previewUrl ? (
                  <iframe
                    ref={iframeRef}
                    src={previewUrl}
                    className="w-full h-full bg-white border-0 border-b-0"
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin"
                    onLoad={() => setIframeLoaded(true)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 bg-white border border-b-0">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-3 border-4 border-blue-600 border-t-transparent rounded-full animate-spin opacity-30" />
                      <p className="text-sm font-medium">Starting preview...</p>
                      <p className="text-xs mt-1">Running npm install and dev server</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {showTerminal && (
            <div className="h-56">
              <div className="px-3 py-2 bg-[#1e1e1e] text-white text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4" />
                  <span>Terminal</span>
                  {!terminalReady && <span className="text-xs text-gray-400">(Loading...)</span>}
                </div>
                <button
                  onClick={() => setShowTerminal(false)}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div ref={terminalRef} className="h-[calc(100%-40px)] bg-[#1e1e1e]" />
            </div>
          )}
        </div>

        {sidebarOpen && selectedElement && (
          <EditSidebar
            selectedElement={selectedElement}
            iframeWindow={iframeRef.current?.contentWindow || null}
            onClose={handleCloseSidebar}
            onUpdateStyle={updateStyle}
            onUpdateAlt={updateAlt}
          />
        )}
      </div>
    </div>
  )
}

export default WebsiteDesign






// "use client"
// import { useState, useRef, useEffect } from "react"
// import type React from "react"
// import { FileCode, FolderOpen, TerminalIcon, X, ChevronRight, ChevronDown, File, Eye, Code2 } from "lucide-react"
// import type { ProjectFile } from "../[projectId]/client"
// import { getWebContainerInstance } from "@/lib/webcontainer-singleton"
// import { detectPackagesFromFiles, getPackageInstallCommand } from "@/lib/package-detector"
// import DeployButton from "./DeployButton"

// type Props = {
//   projectFiles: ProjectFile[]
//   onFilesChange: (files: ProjectFile[]) => void
//   width: number
//   onWidthChange: (width: number) => void
//   onAutoRunStart?: () => void
//   onAutoRunComplete?: () => void
//   projectId?: string
// }

// function WebsiteDesign({
//   projectFiles,
//   projectId = "",
//   onFilesChange,
//   width,
//   onWidthChange,
//   onAutoRunStart,
//   onAutoRunComplete,
// }: Props) {
//   const [webcontainer, setWebcontainer] = useState<any>(null)
//   const [terminal, setTerminal] = useState<any>(null)
//   const [previewUrl, setPreviewUrl] = useState<string>("")
//   const [selectedFile, setSelectedFile] = useState<string | null>(null)
//   const [fileContent, setFileContent] = useState<string>("")
//   const [isRunning, setIsRunning] = useState(false)
//   const [showTerminal, setShowTerminal] = useState(true)
//   const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/", "app", "components"]))
//   const [containerReady, setContainerReady] = useState(false)
//   const [terminalReady, setTerminalReady] = useState(false)
//   const [hasAutoRun, setHasAutoRun] = useState(false)
//   const [viewMode, setViewMode] = useState<"code" | "preview">("preview")

//   const terminalRef = useRef<HTMLDivElement>(null)
//   const iframeRef = useRef<HTMLIFrameElement>(null)
//   const fitAddonRef = useRef<any>(null)
//   const shellProcessRef = useRef<any>(null)
//   const previousFilesCountRef = useRef(0)

//   useEffect(() => {
//     let mounted = true

//     const initWebContainer = async () => {
//       try {
//         console.log("[v0] Starting WebContainer initialization...")
//         const instance = await getWebContainerInstance()

//         if (mounted) {
//           setWebcontainer(instance)
//           setContainerReady(true)
//           console.log("[v0] WebContainer initialized successfully")
//         }
//       } catch (error) {
//         console.error("[v0] Failed to initialize WebContainer:", error)
//         console.error("[v0] Make sure your browser supports WebContainers and SharedArrayBuffer")
//       }
//     }

//     initWebContainer()

//     return () => {
//       mounted = false
//     }
//   }, [])

//   useEffect(() => {
//     if (!terminalRef.current || terminal || !containerReady) return

//     let mounted = true

//     const initTerminal = async () => {
//       try {
//         console.log("[v0] Initializing terminal...")
//         const { Terminal } = await import("@xterm/xterm")
//         const { FitAddon } = await import("@xterm/addon-fit")

//         if (!mounted) return

//         const term = new Terminal({
//           cursorBlink: true,
//           fontSize: 13,
//           fontFamily: 'Menlo, Monaco, "Courier New", monospace',
//           theme: {
//             background: "#1e1e1e",
//             foreground: "#d4d4d4",
//           },
//           convertEol: true,
//         })

//         const fitAddon = new FitAddon()
//         term.loadAddon(fitAddon)
//         term.open(terminalRef.current!)

//         setTimeout(() => {
//           fitAddon.fit()
//         }, 100)

//         fitAddonRef.current = fitAddon

//         if (mounted) {
//           setTerminal(term)
//           setTerminalReady(true)
//           console.log("[v0] Terminal initialized successfully")
//         }

//         const handleResize = () => {
//           if (fitAddon) {
//             setTimeout(() => fitAddon.fit(), 100)
//           }
//         }
//         window.addEventListener("resize", handleResize)

//         return () => {
//           window.removeEventListener("resize", handleResize)
//           term.dispose()
//         }
//       } catch (error) {
//         console.error("[v0] Failed to initialize terminal:", error)
//       }
//     }

//     initTerminal()

//     return () => {
//       mounted = false
//     }
//   }, [containerReady])

//   useEffect(() => {
//     if (!webcontainer || !terminal || !terminalReady || shellProcessRef.current) return

//     const startShell = async () => {
//       try {
//         console.log("[v0] Starting shell process...")
//         const shellProcess = await webcontainer.spawn("jsh", {
//           terminal: {
//             cols: terminal.cols,
//             rows: terminal.rows,
//           },
//         })

//         shellProcessRef.current = shellProcess

//         shellProcess.output.pipeTo(
//           new WritableStream({
//             write(data) {
//               terminal.write(data)
//             },
//           }),
//         )

//         const input = shellProcess.input.getWriter()
//         terminal.onData((data: string) => {
//           input.write(data)
//         })

//         terminal.writeln("Welcome to WebContainer Terminal!")
//         terminal.writeln("Your Next.js project will auto-run when ready.")
//         terminal.writeln("")

//         console.log("[v0] Shell connected successfully")
//       } catch (error) {
//         console.error("[v0] Failed to start shell:", error)
//       }
//     }

//     startShell()
//   }, [webcontainer, terminal, terminalReady])

//   useEffect(() => {
//     if (!webcontainer || !containerReady || projectFiles.length === 0) return

//     const loadFiles = async () => {
//       try {
//         console.log("[v0] Loading files into WebContainer...", projectFiles.length, "files")

//         const allFiles = [...projectFiles]
//         const hasPackageJson = allFiles.some((f) => f.path === "package.json")

//         if (!hasPackageJson) {
//           const defaultPackageJson = {
//             name: "nextjs-project",
//             version: "0.1.0",
//             private: true,
//             scripts: {
//               dev: "next dev --port 3000",
//               build: "next build",
//               start: "next start",
//             },
//             dependencies: {
//               next: "14.2.5",
//               react: "^18.3.1",
//               "react-dom": "^18.3.1",
//             },
//             devDependencies: {
//               "@types/node": "^20",
//               "@types/react": "^18",
//               "@types/react-dom": "^18",
//               typescript: "^5",
//               tailwindcss: "^3.4.1",
//               postcss: "^8",
//               autoprefixer: "^10.4.19",
//             },
//           }
//           allFiles.push({
//             path: "package.json",
//             content: JSON.stringify(defaultPackageJson, null, 2),
//           })
//         }

//         const fileTree: any = {}

//         for (const file of allFiles) {
//           const parts = file.path.split("/").filter((p) => p)
//           let current = fileTree

//           for (let i = 0; i < parts.length - 1; i++) {
//             const dirName = parts[i]
//             if (!current[dirName]) {
//               current[dirName] = { directory: {} }
//             }
//             current = current[dirName].directory
//           }

//           const fileName = parts[parts.length - 1]
//           current[fileName] = {
//             file: {
//               contents: file.content,
//             },
//           }
//         }

//         console.log("[v0] File tree structure:", fileTree)
//         await webcontainer.mount(fileTree)
//         console.log("[v0] Files loaded successfully")

//         if (!selectedFile && allFiles.length > 0) {
//           setSelectedFile(allFiles[0].path)
//           setFileContent(allFiles[0].content)
//         }

//         if (projectFiles.length > previousFilesCountRef.current && !hasAutoRun && projectFiles.length > 0) {
//           previousFilesCountRef.current = projectFiles.length
//           setHasAutoRun(true)
//           setTimeout(() => {
//             autoRunDevServer()
//           }, 500)
//         }
//       } catch (error) {
//         console.error("[v0] Error loading files:", error)
//       }
//     }

//     loadFiles()
//   }, [webcontainer, containerReady, projectFiles])

//   const autoRunDevServer = async () => {
//     if (!webcontainer || !containerReady || isRunning) {
//       console.log("[v0] Cannot auto-run - container not ready or already running")
//       return
//     }

//     setIsRunning(true)
//     onAutoRunStart?.()

//     const detectedPackages = detectPackagesFromFiles(projectFiles)
//     console.log("[v0] Detected packages:", detectedPackages)

//     terminal?.writeln("\n[Auto-run] $ npm install")

//     try {
//       const installProcess = await webcontainer.spawn("npm", ["install"])

//       installProcess.output.pipeTo(
//         new WritableStream({
//           write(data) {
//             terminal?.write(data)
//           },
//         }),
//       )

//       const installCode = await installProcess.exit

//       if (installCode !== 0) {
//         terminal?.writeln("\n[Auto-run] Failed to install dependencies")
//         setIsRunning(false)
//         onAutoRunComplete?.()
//         return
//       }

//       if (detectedPackages.length > 0) {
//         const installCmd = getPackageInstallCommand(detectedPackages)
//         terminal?.writeln(`\n[Auto-run] $ ${installCmd}`)

//         const additionalInstall = await webcontainer.spawn("npm", ["install", ...detectedPackages])

//         additionalInstall.output.pipeTo(
//           new WritableStream({
//             write(data) {
//               terminal?.write(data)
//             },
//           }),
//         )

//         const additionalCode = await additionalInstall.exit

//         if (additionalCode !== 0) {
//           terminal?.writeln("\n[Auto-run] Warning: Some additional packages failed to install")
//         } else {
//           terminal?.writeln(`\n[Auto-run] Successfully installed ${detectedPackages.length} additional packages`)
//         }
//       }

//       terminal?.writeln("\n[Auto-run] $ npm run dev")

//       const devProcess = await webcontainer.spawn("npm", ["run", "dev"])

//       devProcess.output.pipeTo(
//         new WritableStream({
//           write(data) {
//             terminal?.write(data)
//           },
//         }),
//       )

//       webcontainer.on("server-ready", (port: number, url: string) => {
//         console.log("[v0] Server ready at:", url)
//         setPreviewUrl(url)
//         terminal?.writeln(`\n✓ Server running at ${url}`)
//         terminal?.writeln("✓ Preview is now live!")
//         onAutoRunComplete?.()
//       })
//     } catch (error) {
//       console.error("[v0] Error auto-running dev server:", error)
//       terminal?.writeln(`\n[Auto-run] Error: ${error}`)
//       setIsRunning(false)
//       onAutoRunComplete?.()
//     }
//   }

//   const renderFileTree = () => {
//     if (projectFiles.length === 0) {
//       return <div className="p-4 text-center text-sm text-gray-500">No files yet. Start by chatting with the AI!</div>
//     }

//     const folders: { [key: string]: ProjectFile[] } = { "/": [] }

//     projectFiles.forEach((file) => {
//       const parts = file.path.split("/").filter((p) => p)

//       if (parts.length === 1) {
//         folders["/"].push(file)
//       } else {
//         const folderPath = parts.slice(0, -1).join("/")
//         if (!folders[folderPath]) {
//           folders[folderPath] = []
//         }
//         folders[folderPath].push(file)
//       }
//     })

//     const toggleFolder = (path: string) => {
//       const newExpanded = new Set(expandedFolders)
//       if (newExpanded.has(path)) {
//         newExpanded.delete(path)
//       } else {
//         newExpanded.add(path)
//       }
//       setExpandedFolders(newExpanded)
//     }

//     const renderFolder = (folderPath: string, level = 0): React.JSX.Element[] => {
//       const elements: React.JSX.Element[] = []
//       const isExpanded = expandedFolders.has(folderPath)
//       const files = folders[folderPath] || []

//       if (folderPath !== "/") {
//         const folderName = folderPath.split("/").pop() || folderPath
//         elements.push(
//           <div
//             key={`folder-${folderPath}`}
//             className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
//             style={{ paddingLeft: `${level * 12 + 8}px` }}
//             onClick={() => toggleFolder(folderPath)}
//           >
//             {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
//             <FolderOpen className="w-4 h-4 text-blue-500" />
//             <span>{folderName}</span>
//           </div>,
//         )
//       }

//       if (isExpanded || folderPath === "/") {
//         files.forEach((file) => {
//           const fileName = file.path.split("/").pop() || file.path
//           elements.push(
//             <div
//               key={`file-${file.path}`}
//               className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm ${
//                 selectedFile === file.path ? "bg-blue-50 border-l-2 border-blue-500" : ""
//               }`}
//               style={{ paddingLeft: `${(folderPath === "/" ? level : level + 1) * 12 + 8}px` }}
//               onClick={() => {
//                 setSelectedFile(file.path)
//                 setFileContent(file.content)
//               }}
//             >
//               <File className="w-4 h-4 text-gray-500" />
//               <span className="truncate">{fileName}</span>
//             </div>,
//           )
//         })

//         Object.keys(folders)
//           .filter((f) => {
//             if (folderPath === "/") {
//               return f !== "/" && !f.includes("/")
//             }
//             return f.startsWith(folderPath + "/") && f.split("/").length === folderPath.split("/").length + 1
//           })
//           .sort()
//           .forEach((subFolder) => {
//             elements.push(...renderFolder(subFolder, folderPath === "/" ? level : level + 1))
//           })
//       }

//       return elements
//     }

//     return <div className="overflow-auto">{renderFolder("/")}</div>
//   }

//   const handleFileContentChange = (newContent: string) => {
//     setFileContent(newContent)
//     if (selectedFile) {
//       const updatedFiles = projectFiles.map((f) => (f.path === selectedFile ? { ...f, content: newContent } : f))
//       onFilesChange(updatedFiles)

//       if (webcontainer && containerReady) {
//         webcontainer.fs.writeFile(selectedFile, newContent).catch((err: any) => {
//           console.error("[v0] Error writing file to WebContainer:", err)
//         })
//       }
//     }
//   }

//   return (
//     <div className="flex-1 flex flex-col bg-white mr-2" style={{ width: `${width}px`, minWidth: "400px" }}>
//       <div className="flex items-center justify-between p-3 border-b bg-white border rounded-l-lg rounded-r-lg rounded-b-none">
//         <div className="flex items-center gap-2">
//           <span className="font-sans font-light text-sm absolute">Project {projectId as string}</span>
//           {/* {!containerReady && <span className="text-xs text-gray-500">(Loading...)</span>}
//           {isRunning && <span className="text-xs text-green-600">(Auto-running...)</span>} */}
//         </div>
//         <div className="text-sm font-mono flex">
//           <button
//             onClick={() => setViewMode("preview")}
//             className={`flex items-center justify-center gap-2 px-3 py-1 text-sm font-medium
// ${viewMode === "preview" ? "bg-gray-300 text-black" : "bg-white text-black border border-gray-300"} 
// rounded-tl-lg rounded-tr-none rounded-bl-lg rounded-br-none 
// transition-colors`}
//           >
//             <Eye className="w-4 h-4" />
//           </button>

//           {/* Code Button */}
//           <button
//             onClick={() => setViewMode("code")}
//             className={`flex items-center justify-center gap-2 px-3 py-1 text-sm font-medium rounded-r-lg
// ${viewMode === "code" ? "bg-gray-300 text-black" : "bg-white text-black border border-gray-300"}
// rounded-none
// transition-colors`}
//           >
//             <Code2 className="w-4 h-4" />
//           </button>
//         </div>
//         <DeployButton projectFiles={projectFiles} projectId={projectId} />
//       </div>

//       <div className="flex flex-1 overflow-hidden border-l-1">
//         {viewMode === "code" && (
//           <div className="w-64 border-r bg-white overflow-auto">
//             <div className="p-2 border-b flex items-center justify-between bg-white">
//               <span className="text-xs font-semibold text-gray-700">FILES</span>
//               <span className="text-xs text-gray-500">{projectFiles.length} files</span>
//             </div>
//             {renderFileTree()}
//           </div>
//         )}

//         <div className="flex-1 flex flex-col">
//           <div className="flex-1 flex flex-col border-b-0 border-r-1">
//             {viewMode === "code" && selectedFile ? (
//               <>
//                 <div className="w-full border-r bg-white overflow-auto">
//                   <div className="p-2 border-b flex items-center justify-between bg-white">
//                     <span className="text-xs font-semibold text-gray-700">{selectedFile}</span>
//                     <button
//                       onClick={() => {
//                         setSelectedFile(null)
//                         setFileContent("")
//                       }}
//                       className="text-xs font-semibold text-gray-700"
//                     >
//                       <X className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>
//                 <textarea
//                   value={fileContent}
//                   onChange={(e) => handleFileContentChange(e.target.value)}
//                   className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none bg-white"
//                   spellCheck={false}
//                   placeholder="Edit your code here..."
//                   style={{ height: "100%" }}
//                 />
//               </>
//             ) : viewMode === "code" && !selectedFile ? (
//               <div className="flex-1 flex items-center justify-center text-gray-400 bg-white">
//                 <div className="text-center">
//                   <FileCode className="w-16 h-16 mx-auto mb-3 opacity-30" />
//                   <p className="text-sm font-medium">Select a file to edit</p>
//                   <p className="text-xs mt-1">Choose from the file explorer on the left</p>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex-1 flex flex-col">
//                 <div className="px-3 py-2 bg-white border border-t-0 border-b-0 text-sm flex items-center justify-between">
//                   <span className="font-semibold text-gray-700">Preview</span>
//                   {previewUrl && (
//                     <a
//                       href={previewUrl}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-blue-600 hover:underline text-xs"
//                     >
//                       {previewUrl}
//                     </a>
//                   )}
//                 </div>
//                 {previewUrl ? (
//                   <iframe
//                     ref={iframeRef}
//                     src={previewUrl}
//                     className="w-full h-full bg-white border-0 border-b-0"
//                     title="Preview"
//                   />
//                 ) : (
//                   <div className="flex items-center justify-center h-full text-gray-400 bg-white border border-b-0">
//                     <div className="text-center">
//                       <div className="w-16 h-16 mx-auto mb-3 border-4 border-blue-600 border-t-transparent rounded-full animate-spin opacity-30" />
//                       <p className="text-sm font-medium">Starting preview...</p>
//                       <p className="text-xs mt-1">Running npm install and dev server</p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           {showTerminal && (
//             <div className="h-56">
//               <div className="px-3 py-2 bg-[#1e1e1e] text-white text-sm flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <TerminalIcon className="w-4 h-4" />
//                   <span>Terminal</span>
//                   {!terminalReady && <span className="text-xs text-gray-400">(Loading...)</span>}
//                 </div>
//                 <button
//                   onClick={() => setShowTerminal(false)}
//                   className="p-1 hover:bg-gray-800 rounded transition-colors"
//                 >
//                   <X className="w-4 h-4" />
//                 </button>
//               </div>
//               <div ref={terminalRef} className="h-[calc(100%-40px)] bg-[#1e1e1e]" />
//             </div>
//           )}

//           {!showTerminal && (
//             <button
//               onClick={() => {
//                 setShowTerminal(true)
//                 setTimeout(() => fitAddonRef.current?.fit(), 150)
//               }}
//               className="px-3 py-2 bg-[#1e1e1e] text-white text-sm hover:bg-[#1e1e1e] flex items-center gap-2 transition-colors"
//             >
//               <TerminalIcon className="w-4 h-4" />
//               Show Terminal
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }

// export default WebsiteDesign
