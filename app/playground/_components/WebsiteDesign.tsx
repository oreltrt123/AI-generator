// app/playground/_components/WebsiteDesign.tsx
"use client"
import React, { useState, useRef, useCallback, useEffect } from "react"
import { Eye, Code2, MousePointer2 } from "lucide-react"
import EditSidebar from "./EditSidebar"

type Props = {
  generatedCode: string
  width: number
  onWidthChange: (width: number) => void
  onCodeChange?: (code: string) => void
}

type SelectedElement = {
  tagName: string
  id: string
  className: string
  style: Record<string, string>
  cssText?: string
  alt?: string
}

const textElements = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'DIV', 'LI', 'TD']

function WebsiteDesign({ generatedCode, width, onWidthChange, onCodeChange }: Props) {
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview")
  const [isDragging, setIsDragging] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [showImproveModal, setShowImproveModal] = useState(false)
  const [currentText, setCurrentText] = useState("")
  const [instruction, setInstruction] = useState("")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const googleFonts = new Set([
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Oswald',
    'Source Sans 3',
    'Raleway',
    'PT Sans',
    'Merriweather',
    'Inter',
    'DM Sans'
  ])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newWidth = e.clientX - 384
      const minWidth = 400
      const maxWidth = window.innerWidth - 384 - 100
      const constrainedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth))
      onWidthChange(constrainedWidth)
    }

    const handleMouseUp = () => setIsDragging(false)

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, onWidthChange])

  useEffect(() => {
    if (!editMode) {
      setSidebarOpen(false)
      setSelectedElement(null)
    }
  }, [editMode])

  useEffect(() => {
    setIframeLoaded(false)
  }, [generatedCode])

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return

      if (e.data.type === 'elementSelected') {
        setSelectedElement(e.data.element)
        setSidebarOpen(true)
      } else if (e.data.type === 'improveText') {
        setCurrentText(e.data.text)
        setInstruction("")
        setShowImproveModal(true)
      } else if (e.data.type === 'textChanged') {
        updateCode()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleImprove = async () => {
    if (!currentText) return

    try {
      const response = await fetch("/api/improve-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentText, instruction }),
      })

      if (response.ok) {
        const { improvedText } = await response.json()
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'updateText', text: improvedText }, 
          '*'
        )
      }
    } catch (error) {
      console.error("Error improving text:", error)
    }

    setShowImproveModal(false)
    setInstruction("")
  }

  useEffect(() => {
    if (viewMode !== 'preview' || !iframeRef.current || !generatedCode || !iframeLoaded) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument
    if (!doc) return

    // Remove previous injections
    const oldStyle = doc.getElementById('edit-style')
    if (oldStyle) oldStyle.remove()

    const oldScript = doc.getElementById('edit-script')
    if (oldScript) oldScript.remove()

    if (editMode) {
      // Inject style for hover and selection
      const style = doc.createElement('style')
      style.id = 'edit-style'
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
        const head = doc.createElement('head')
        doc.documentElement?.insertBefore(head, doc.body)
        head.appendChild(style)
      }

      // Inject script for selection, editing, AI button
      const script = doc.createElement('script')
      script.id = 'edit-script'
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
        const head = doc.createElement('head')
        doc.documentElement?.insertBefore(head, doc.body)
        head.appendChild(script)
      }
    }
  }, [viewMode, editMode, generatedCode, iframeLoaded])

  const updateCode = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      const iframe = iframeRef.current
      if (!iframe || !iframe.contentDocument || !generatedCode || !onCodeChange) return

      const doc = iframe.contentDocument
      // Remove temporary selection classes before saving
      doc.querySelectorAll('.selected').forEach((el: Element) => el.classList.remove('selected'))

      const bodyStartMatch = generatedCode.match(/<body[^>]*>/i)
      if (!bodyStartMatch) return

      const bodyStart = bodyStartMatch.index! + bodyStartMatch[0].length
      const bodyEnd = generatedCode.indexOf('</body>', bodyStart)
      if (bodyEnd === -1) return

      const prefix = generatedCode.substring(0, bodyStart)
      const suffix = generatedCode.substring(bodyEnd)
      const newBodyContent = doc.body.innerHTML
      const newCode = prefix + newBodyContent + suffix

      onCodeChange(newCode)
    }, 300)
  }, [generatedCode, onCodeChange])

  const updateStyle = useCallback((prop: string, val: string) => {
    const iframe = iframeRef.current
    if (iframe?.contentDocument) {
      const el = iframe.contentDocument.querySelector('.selected')
      if (el) {
        ;(el as any).style[prop] = val
        setSelectedElement(prev => prev ? { ...prev, style: { ...prev.style, [prop]: val } } : null)
        if (prop === 'fontFamily') {
          if (googleFonts.has(val)) {
            iframe.contentWindow?.postMessage({ type: 'loadFont', font: val }, '*')
          }
        }
        updateCode()
      }
    }
  }, [updateCode])

  const updateAlt = useCallback((alt: string) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'updateAlt', alt }, '*')
    setSelectedElement(prev => prev ? { ...prev, alt } : null)
    updateCode()
  }, [updateCode])

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
    setSelectedElement(null)
    if (iframeRef.current?.contentDocument) {
      const doc = iframeRef.current.contentDocument
      const el = doc.querySelector('.selected')
      if (el) {
        el.classList.remove('selected')
        if (textElements.includes(el.tagName)) {
          iframeRef.current?.contentWindow?.postMessage({ type: 'deselectElement' }, '*')
        }
      }
    }
  }

  const sidebarWidth = 350

  return (
    <div
      className="flex-1 flex flex-col relative"
      style={{ width: `${width}px`, minWidth: "400px" }}
    >
      <div className={`flex-1 p-5 overflow-hidden flex transition-all duration-300 ${sidebarOpen ? `w-[${width - sidebarWidth}px]` : 'w-full'}`}>
        <div className="flex-1 overflow-auto transition-all duration-300">
          <div className="p-4 border border-b-0 rounded-t-lg overflow-auto text-sm font-mono flex">
            {/* Preview Button */}
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center justify-center gap-2 px-3 py-1 text-sm font-medium 
                ${viewMode === "preview" ? "bg-gray-300 text-black" : "bg-white text-black border border-gray-300"}
                rounded-tl-lg rounded-tr-none rounded-bl-lg rounded-br-none
                transition-colors`}
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Code Button */}
            <button
              onClick={() => setViewMode("code")}
              className={`flex items-center justify-center gap-2 px-3 py-1 text-sm font-medium
                ${viewMode === "code" ? "bg-gray-300 text-black" : "bg-white text-black border border-gray-300"}
                rounded-none
                transition-colors`}
            >
              <Code2 className="w-4 h-4" />
            </button>

            {/* Edit Button */}
            <button
              onClick={() => setEditMode(prev => !prev)}
              className={`flex items-center justify-center gap-2 px-3 py-1 text-sm font-medium
                ${editMode ? "bg-gray-300 text-black" : "bg-white text-black border border-gray-300"}
                rounded-tr-lg rounded-br-lg
                transition-colors`}
              disabled={viewMode !== "preview"}
            >
              <MousePointer2 className="w-4 h-4" />
            </button>
          </div>

          {viewMode === "preview" ? (
            <iframe
              ref={iframeRef}
              srcDoc={generatedCode}
              title="Website Preview"
              className="w-full h-[88vh] border bg-white rounded-b-lg rounded-t-0"
              sandbox="allow-scripts allow-same-origin"
              style={{ minHeight: "400px" }}
              onLoad={() => setIframeLoaded(true)}
            />
          ) : (
            <pre className="w-full h-[88vh] p-4 border overflow-auto text-sm font-mono rounded-b-lg rounded-t-0">
              <code>{generatedCode || "// No code generated yet..."}</code>
            </pre>
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

      {/* AI Improve Modal */}
      {showImproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="font-bold mb-4 text-lg">Improve Text with AI</h3>
            <p className="text-sm text-gray-600 mb-4">Current text:</p>
            <div className="bg-gray-100 p-3 rounded mb-4 text-sm max-h-32 overflow-auto">
              {currentText}
            </div>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Describe changes (e.g., 'make it more persuasive and shorter')"
              className="w-full p-3 border rounded mb-4 text-sm h-20"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowImproveModal(false); setInstruction(""); }}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleImprove}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Improve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WebsiteDesign