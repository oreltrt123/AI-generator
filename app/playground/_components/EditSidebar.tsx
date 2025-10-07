// app/playground/_components/EditSidebar.tsx
"use client"
import React, { useState } from "react"
import { X } from "lucide-react"

type SelectedElement = {
  tagName: string
  id: string
  className: string
  style: Record<string, string>
  cssText?: string
  alt?: string
}

type Props = {
  selectedElement: SelectedElement | null
  iframeWindow: Window | null
  onClose: () => void
  onUpdateStyle: (prop: string, value: string) => void
  onUpdateAlt?: (alt: string) => void
}

const googleFonts = new Set([
  "Roboto", "Open Sans", "Lato", "Montserrat", "Raleway", "Source Sans Pro",
  "Poppins", "Inter", "Nunito", "PT Sans", "Ubuntu", "Oswald", "Merriweather",
  "Playfair Display", "Dancing Script", "Lobster", "Indie Flower", "Pacifico"
])

const systemFonts = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia"]

const allFonts = Array.from(googleFonts).concat(systemFonts)

function EditSidebar({ selectedElement, iframeWindow, onClose, onUpdateStyle, onUpdateAlt }: Props) {
  const [marginTop, setMarginTop] = useState(selectedElement?.style.marginTop || "")
  const [marginRight, setMarginRight] = useState(selectedElement?.style.marginRight || "")
  const [marginBottom, setMarginBottom] = useState(selectedElement?.style.marginBottom || "")
  const [marginLeft, setMarginLeft] = useState(selectedElement?.style.marginLeft || "")
  const [paddingTop, setPaddingTop] = useState(selectedElement?.style.paddingTop || "")
  const [paddingRight, setPaddingRight] = useState(selectedElement?.style.paddingRight || "")
  const [paddingBottom, setPaddingBottom] = useState(selectedElement?.style.paddingBottom || "")
  const [paddingLeft, setPaddingLeft] = useState(selectedElement?.style.paddingLeft || "")
  const [borderWidth, setBorderWidth] = useState(selectedElement?.style.borderWidth || "")
  const [borderStyle, setBorderStyle] = useState(selectedElement?.style.borderStyle || "solid")
  const [borderRadius, setBorderRadius] = useState(selectedElement?.style.borderRadius || "")
  const [boxShadow, setBoxShadow] = useState(selectedElement?.style.boxShadow || "")
  const [transform, setTransform] = useState(selectedElement?.style.transform || "")
  const [customCSS, setCustomCSS] = useState(selectedElement?.style.cssText || "")
  const [altText, setAltText] = useState(selectedElement?.alt || "")

  const handleSpacingChange = (side: 'top' | 'right' | 'bottom' | 'left', type: 'margin' | 'padding', value: string) => {
    if (type === 'margin') {
      if (side === 'top') setMarginTop(value)
      else if (side === 'right') setMarginRight(value)
      else if (side === 'bottom') setMarginBottom(value)
      else setMarginLeft(value)
      onUpdateStyle('margin', `${marginTop || 0} ${marginRight || 0} ${marginBottom || 0} ${marginLeft || 0}`)
    } else {
      if (side === 'top') setPaddingTop(value)
      else if (side === 'right') setPaddingRight(value)
      else if (side === 'bottom') setPaddingBottom(value)
      else setPaddingLeft(value)
      onUpdateStyle('padding', `${paddingTop || 0} ${paddingRight || 0} ${paddingBottom || 0} ${paddingLeft || 0}`)
    }
  }

  const handleBorderChange = () => {
    onUpdateStyle('border', `${borderWidth} ${borderStyle} currentColor`)
  }

  const isTextElement = (tag: string) => ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'DIV', 'LI', 'TD'].includes(tag)
  const isImageElement = (tag: string) => tag === 'IMG'
  const isButtonElement = (tag: string) => tag === 'BUTTON'

  if (!selectedElement) return null

  return (
    <div className="w-[350px] bg-gray-100 border-l border-gray-300 flex flex-col h-full">
      <div className="p-3 border-b bg-white flex justify-between items-center">
        <h3 className="font-bold text-sm">Edit {selectedElement.tagName}</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4 text-xs">
        {/* Typography */}
        {isTextElement(selectedElement.tagName) && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">Typography</h4>
            <div>
              <label className="block mb-1">Font Family</label>
              <select 
                value={selectedElement.style.fontFamily || 'Arial'} 
                onChange={(e) => {
                  onUpdateStyle('fontFamily', e.target.value)
                  if (googleFonts.has(e.target.value)) {
                    iframeWindow?.postMessage({ type: 'loadFont', font: e.target.value }, '*')
                  }
                }}
                className="w-full p-2 border rounded text-sm"
              >
                {allFonts.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1">Font Size (px)</label>
              <input 
                type="number" 
                value={Number(selectedElement.style.fontSize?.replace('px', '')) || 16} 
                onChange={(e) => onUpdateStyle('fontSize', e.target.value + 'px')}
                className="w-full p-2 border rounded text-sm" 
              />
            </div>
            <div>
              <label className="block mb-1">Font Weight</label>
              <select 
                value={selectedElement.style.fontWeight || '400'} 
                onChange={(e) => onUpdateStyle('fontWeight', e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="100">100 (Thin)</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400 (Normal)</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700 (Bold)</option>
                <option value="800">800</option>
                <option value="900">900 (Black)</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Text Align</label>
              <select 
                value={selectedElement.style.textAlign || 'left'} 
                onChange={(e) => onUpdateStyle('textAlign', e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Line Height</label>
              <input 
                type="number" 
                step="0.1" 
                value={Number(selectedElement.style.lineHeight) || 1.5} 
                onChange={(e) => onUpdateStyle('lineHeight', e.target.value)}
                className="w-full p-2 border rounded text-sm" 
              />
            </div>
            <div>
              <label className="block mb-1">Text Transform</label>
              <select 
                value={selectedElement.style.textTransform || 'none'} 
                onChange={(e) => onUpdateStyle('textTransform', e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="none">None</option>
                <option value="uppercase">Uppercase</option>
                <option value="lowercase">Lowercase</option>
                <option value="capitalize">Capitalize</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Letter Spacing (px)</label>
              <input 
                type="number" 
                step="0.1" 
                value={Number(selectedElement.style.letterSpacing?.replace('px', '')) || 0} 
                onChange={(e) => onUpdateStyle('letterSpacing', e.target.value + 'px')}
                className="w-full p-2 border rounded text-sm" 
              />
            </div>
          </div>
        )}

        {/* Colors */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Colors</h4>
          <div>
            <label className="block mb-1">Text Color</label>
            <input 
              type="color" 
              value={selectedElement.style.color?.replace(/^#?/, '#') || '#000000'} 
              onChange={(e) => onUpdateStyle('color', e.target.value)}
              className="w-full h-8 border rounded" 
            />
          </div>
          <div>
            <label className="block mb-1">Background Color</label>
            <input 
              type="color" 
              value={selectedElement.style.backgroundColor?.replace(/^#?/, '#') || '#ffffff'} 
              onChange={(e) => onUpdateStyle('backgroundColor', e.target.value)}
              className="w-full h-8 border rounded" 
            />
          </div>
        </div>

        {/* Spacing */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Spacing</h4>
          <div>
            <label className="block mb-1">Width</label>
            <input 
              type="text" 
              value={selectedElement.style.width || ''} 
              onChange={(e) => onUpdateStyle('width', e.target.value)}
              placeholder="e.g. 100px" 
              className="w-full p-2 border rounded text-sm" 
            />
          </div>
          <div>
            <label className="block mb-1">Height</label>
            <input 
              type="text" 
              value={selectedElement.style.height || ''} 
              onChange={(e) => onUpdateStyle('height', e.target.value)}
              placeholder="e.g. 50px" 
              className="w-full p-2 border rounded text-sm" 
            />
          </div>
          <div>
            <label className="block mb-1">Margin (all)</label>
            <input 
              type="text" 
              value={`${marginTop} ${marginRight} ${marginBottom} ${marginLeft}`.trim() || ''} 
              onChange={(e) => {
                const parts = e.target.value.split(/\s+/).slice(0,4)
                while(parts.length < 4) parts.push('0px')
                setMarginTop(parts[0]), setMarginRight(parts[1]), setMarginBottom(parts[2]), setMarginLeft(parts[3])
                onUpdateStyle('margin', e.target.value)
              }}
              className="w-full p-2 border rounded text-sm" 
            />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <input type="text" placeholder="Top" value={marginTop} onChange={(e) => handleSpacingChange('top', 'margin', e.target.value + 'px')} className="p-1 border rounded text-xs" />
            <input type="text" placeholder="Right" value={marginRight} onChange={(e) => handleSpacingChange('right', 'margin', e.target.value + 'px')} className="p-1 border rounded text-xs" />
            <input type="text" placeholder="Bottom" value={marginBottom} onChange={(e) => handleSpacingChange('bottom', 'margin', e.target.value + 'px')} className="p-1 border rounded text-xs" />
            <input type="text" placeholder="Left" value={marginLeft} onChange={(e) => handleSpacingChange('left', 'margin', e.target.value + 'px')} className="p-1 border rounded text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <input type="text" placeholder="Padding Top" value={paddingTop} onChange={(e) => handleSpacingChange('top', 'padding', e.target.value + 'px')} className="p-1 border rounded text-xs" />
            <input type="text" placeholder="Padding Right" value={paddingRight} onChange={(e) => handleSpacingChange('right', 'padding', e.target.value + 'px')} className="p-1 border rounded text-xs" />
            <input type="text" placeholder="Padding Bottom" value={paddingBottom} onChange={(e) => handleSpacingChange('bottom', 'padding', e.target.value + 'px')} className="p-1 border rounded text-xs" />
            <input type="text" placeholder="Padding Left" value={paddingLeft} onChange={(e) => handleSpacingChange('left', 'padding', e.target.value + 'px')} className="p-1 border rounded text-xs" />
          </div>
        </div>

        {/* Border */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Border</h4>
          <div>
            <label className="block mb-1">Border Width (px)</label>
            <input 
              type="number" 
              value={Number(borderWidth?.replace('px', '')) || 0} 
              onChange={(e) => { setBorderWidth(e.target.value + 'px'); handleBorderChange(); }}
              className="w-full p-2 border rounded text-sm" 
            />
          </div>
          <div>
            <label className="block mb-1">Border Style</label>
            <select 
              value={borderStyle} 
              onChange={(e) => { setBorderStyle(e.target.value); handleBorderChange(); }}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="double">Double</option>
              <option value="none">None</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Border Radius (px)</label>
            <input 
              type="number" 
              value={Number(borderRadius?.replace('px', '')) || 0} 
              onChange={(e) => { setBorderRadius(e.target.value + 'px'); onUpdateStyle('borderRadius', e.target.value + 'px'); }}
              className="w-full p-2 border rounded text-sm" 
            />
          </div>
        </div>

        {/* Image Upload */}
        {isImageElement(selectedElement.tagName) && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">Image</h4>
            <div>
              <label className="block mb-1">Upload New Image</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (ev) => {
                      iframeWindow?.postMessage({ type: 'updateImageSrc', src: ev.target?.result as string }, '*')
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="w-full p-2 border rounded text-sm" 
              />
            </div>
            <div>
              <label className="block mb-1">Alt Text</label>
              <input 
                type="text" 
                value={altText} 
                onChange={(e) => { setAltText(e.target.value); onUpdateAlt?.(e.target.value); }}
                className="w-full p-2 border rounded text-sm" 
              />
            </div>
          </div>
        )}

        {/* Button Styles */}
        {isButtonElement(selectedElement.tagName) && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">Button</h4>
            <div>
              <label className="block mb-1">Border Radius Preset</label>
              <select 
                value={borderRadius || '4px'} 
                onChange={(e) => onUpdateStyle('borderRadius', e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="0px">Square</option>
                <option value="4px">Small</option>
                <option value="8px">Medium</option>
                <option value="12px">Large</option>
                <option value="50%">Pill</option>
              </select>
            </div>
          </div>
        )}

        {/* Advanced */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Advanced</h4>
          <div>
            <label className="block mb-1">Opacity</label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={Number(selectedElement.style.opacity) || 1} 
              onChange={(e) => onUpdateStyle('opacity', e.target.value)}
              className="w-full" 
            />
            <span className="text-xs">{Number(selectedElement.style.opacity) || 1}</span>
          </div>
          <div>
            <label className="block mb-1">Position</label>
            <select 
              value={selectedElement.style.position || 'static'} 
              onChange={(e) => onUpdateStyle('position', e.target.value)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="static">Static</option>
              <option value="relative">Relative</option>
              <option value="absolute">Absolute</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Z-Index</label>
            <input 
              type="number" 
              value={Number(selectedElement.style.zIndex) || 0} 
              onChange={(e) => onUpdateStyle('zIndex', e.target.value)}
              className="w-full p-2 border rounded text-sm" 
            />
          </div>
          <div>
            <label className="block mb-1">Box Shadow</label>
            <input 
              type="text" 
              value={boxShadow} 
              onChange={(e) => { setBoxShadow(e.target.value); onUpdateStyle('boxShadow', e.target.value); }}
              placeholder="e.g. 0 4px 6px rgba(0,0,0,0.1)" 
              className="w-full p-2 border rounded text-sm" 
            />
          </div>
          <div>
            <label className="block mb-1">Transform</label>
            <input 
              type="text" 
              value={transform} 
              onChange={(e) => { setTransform(e.target.value); onUpdateStyle('transform', e.target.value); }}
              placeholder="e.g. rotate(5deg) scale(1.05)" 
              className="w-full p-2 border rounded text-sm" 
            />
          </div>
          <div>
            <label className="block mb-1">Transition</label>
            <input 
              type="text" 
              value={selectedElement.style.transition || ''} 
              onChange={(e) => onUpdateStyle('transition', e.target.value)}
              placeholder="e.g. all 0.3s ease" 
              className="w-full p-2 border rounded text-sm" 
            />
          </div>
          <div>
            <label className="block mb-1">Custom CSS</label>
            <textarea 
              value={customCSS} 
              onChange={(e) => { setCustomCSS(e.target.value); onUpdateStyle('cssText', e.target.value); }}
              rows={3} 
              className="w-full p-2 border rounded text-sm" 
              placeholder="Enter custom styles..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditSidebar