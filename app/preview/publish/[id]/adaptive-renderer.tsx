"use client"

import { useEffect, useState, useRef } from "react"

type ProjectFile = {
  path: string
  content: string
}

type AdaptiveConfig = {
  config_type: string
  target_element: string
  new_value: string
  reasoning: string
}

type Props = {
  deploymentId: string
  projectFiles: ProjectFile[]
  language: string
  adaptiveConfigs: AdaptiveConfig[]
}

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

export default function AdaptiveRenderer({ deploymentId, projectFiles, language, adaptiveConfigs }: Props) {
  const [sessionId] = useState(() => generateSessionId())
  const [renderedContent, setRenderedContent] = useState<string>("")
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    let content = ""

    if (
      language === "html" ||
      language === "nextjs" ||
      language === "react" ||
      language === "vite" ||
      language === "vue"
    ) {
      // Find main HTML/component file
      const mainFile = projectFiles.find(
        (f) =>
          f.path === "index.html" ||
          f.path === "app/page.tsx" ||
          f.path === "src/App.tsx" ||
          f.path === "src/App.jsx" ||
          f.path === "src/App.vue",
      )

      const cssFile = projectFiles.find(
        (f) =>
          f.path === "style.css" ||
          f.path === "public/style.css" ||
          f.path === "src/index.css" ||
          f.path === "app/globals.css",
      )

      if (mainFile) {
        content = mainFile.content

        // For React/Next.js components, wrap in HTML
        if (language === "nextjs" || language === "react" || language === "vite") {
          content = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Published Site</title>
  ${cssFile ? `<style>${cssFile.content}</style>` : ""}
</head>
<body>
  <div id="root">
    ${content
      .replace(/export default function \w+$$$$ \{/, "")
      .replace(/\}$/, "")
      .replace(/return $$/, "")
      .replace(/$$;?$/, "")}
  </div>
</body>
</html>
          `
        } else if (cssFile) {
          // For HTML, inject CSS
          content = content.replace("</head>", `<style>${cssFile.content}</style></head>`)
        }

        const analyticsScript = `
          <script>
            (function() {
              const deploymentId = "${deploymentId}";
              const sessionId = "${sessionId}";
              let scrollDepth = 0;
              let startTime = Date.now();
              let clickedElements = new Set();

              console.log('[Adaptive Analytics] Tracking initialized for deployment:', deploymentId);

              // Track clicks with detailed information
              document.addEventListener('click', function(e) {
                const target = e.target;
                const selector = target.tagName.toLowerCase() + 
                  (target.id ? '#' + target.id : '') + 
                  (target.className ? '.' + target.className.split(' ').join('.') : '');
                
                clickedElements.add(selector);
                
                fetch('/api/analytics', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    deploymentId,
                    sessionId,
                    eventType: 'click',
                    data: {
                      elementSelector: selector,
                      elementText: target.textContent?.substring(0, 100),
                      metadata: {
                        timestamp: Date.now(),
                        viewport: { width: window.innerWidth, height: window.innerHeight },
                        isButton: target.tagName === 'BUTTON' || target.tagName === 'A',
                        isCTA: target.textContent?.toLowerCase().includes('buy') || 
                               target.textContent?.toLowerCase().includes('sign up') ||
                               target.textContent?.toLowerCase().includes('get started')
                      }
                    }
                  })
                }).catch(err => console.error('[Adaptive Analytics] Click tracking error:', err));
              }, true);

              // Track scroll depth with throttling
              let scrollTimeout;
              window.addEventListener('scroll', function() {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(function() {
                  const windowHeight = window.innerHeight;
                  const documentHeight = document.documentElement.scrollHeight;
                  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                  const currentDepth = Math.round((scrollTop + windowHeight) / documentHeight * 100);
                  
                  if (currentDepth > scrollDepth) {
                    scrollDepth = currentDepth;
                    
                    fetch('/api/analytics', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        deploymentId,
                        sessionId,
                        eventType: 'scroll',
                        data: {
                          scrollDepth: currentDepth,
                          metadata: { timestamp: Date.now() }
                        }
                      })
                    }).catch(err => console.error('[Adaptive Analytics] Scroll tracking error:', err));
                  }
                }, 200);
              });

              // Track time spent (send every 15 seconds)
              setInterval(function() {
                const timeSpent = Math.round((Date.now() - startTime) / 1000);
                
                fetch('/api/analytics', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    deploymentId,
                    sessionId,
                    eventType: 'timeSpent',
                    data: {
                      timeSpent,
                      metadata: { 
                        timestamp: Date.now(),
                        clickedElements: Array.from(clickedElements)
                      }
                    }
                  })
                }).catch(err => console.error('[Adaptive Analytics] Time tracking error:', err));
              }, 15000);

              // Track page view on load
              window.addEventListener('load', function() {
                fetch('/api/analytics', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    deploymentId,
                    sessionId,
                    eventType: 'pageView',
                    data: {
                      metadata: {
                        timestamp: Date.now(),
                        userAgent: navigator.userAgent,
                        viewport: { width: window.innerWidth, height: window.innerHeight },
                        referrer: document.referrer
                      }
                    }
                  })
                }).catch(err => console.error('[Adaptive Analytics] Page view tracking error:', err));
                
                console.log('[Adaptive Analytics] Page view tracked');
              });

              // Track before unload
              window.addEventListener('beforeunload', function() {
                const timeSpent = Math.round((Date.now() - startTime) / 1000);
                navigator.sendBeacon('/api/analytics', JSON.stringify({
                  deploymentId,
                  sessionId,
                  eventType: 'sessionEnd',
                  data: {
                    timeSpent,
                    scrollDepth,
                    metadata: { 
                      timestamp: Date.now(),
                      clickedElements: Array.from(clickedElements)
                    }
                  }
                }));
              });
            })();
          </script>
        `

        content = content.replace("</body>", `${analyticsScript}</body>`)

        adaptiveConfigs.forEach((config) => {
          if (config.config_type === "layout" && config.target_element) {
            // Move element to top by adding inline styles
            const elementRegex = new RegExp(`<([^>]+class="${config.target_element.replace(/\./g, "")}"[^>]*)>`, "g")
            content = content.replace(elementRegex, `<$1 style="order: -1; margin-top: 20px;">`)
          } else if (config.config_type === "copy" && config.target_element && config.new_value) {
            // Replace text content
            const textRegex = new RegExp(
              `(<[^>]+class="${config.target_element.replace(/\./g, "")}"[^>]*>)([^<]+)(</[^>]+>)`,
              "g",
            )
            content = content.replace(textRegex, `$1${config.new_value}$3`)
          }
        })
      }
    }

    setRenderedContent(content)
  }, [deploymentId, sessionId, projectFiles, language, adaptiveConfigs])

  return (
    <div className="w-full h-screen">
      {renderedContent ? (
        <iframe
          ref={iframeRef}
          srcDoc={renderedContent}
          className="w-full h-full border-0"
          title="Published Site"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-700">Loading your site...</p>
            <p className="text-xs text-gray-500 mt-1">Adaptive tracking enabled</p>
          </div>
        </div>
      )}
    </div>
  )
}
