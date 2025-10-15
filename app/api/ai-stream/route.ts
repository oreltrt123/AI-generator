import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"
import Anthropic from "@anthropic-ai/sdk"

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    if (!model || !["gemini", "deepseek", "gpt-oss", "claude", "llama", "mistral"].includes(model)) {
      return NextResponse.json({ error: "Invalid or missing model" }, { status: 400 })
    }

    const encoder = new TextEncoder()

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send thinking stage
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "thinking", data: { stage: "thinking" } })}\n\n`),
          )

          // Extract user query for Unsplash
          const userQuery = messages[messages.length - 1].content
            .replace(/.*Now, create an amazing Next.js project for: (.*)/, "$1")
            .trim()

          // Fetch images from Unsplash
          let imageUrls: string[] = []
          try {
            const unsplashApiKey = process.env.UNSPLASH_API_KEY
            if (unsplashApiKey) {
              const unsplashResponse = await axios.get("https://api.unsplash.com/search/photos", {
                params: {
                  query: userQuery || "generic",
                  per_page: 5,
                  client_id: unsplashApiKey,
                },
              })
              imageUrls = unsplashResponse.data.results.map((photo: any) => photo.urls.regular)
            }
          } catch (error: any) {
            console.error("Unsplash API error:", error?.response?.data ?? error.message)
          }

          // Send reasoning stage
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "reasoning",
                data: {
                  stage: "reasoning",
                  reasoning: `Analyzing request: "${userQuery}"\n\nPlanning to create a Next.js project with:\n- Modern React components\n- TypeScript for type safety\n- Beautiful CSS styling\n- Responsive design\n- Professional UI/UX`,
                },
              })}\n\n`,
            ),
          )

          // Call AI model based on selection
          let aiResponse = ""

          if (model === "gemini") {
            const apiKey = process.env.GOOGLE_API_KEY
            if (!apiKey) throw new Error("Gemini API key not configured")

            const geminiModel = "gemini-2.5-flash-lite-preview-06-17"
            const contents = messages.map((msg: any) => ({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content }],
            }))

            const resp = await axios.post(
              `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
              { contents },
              { headers: { "Content-Type": "application/json" } },
            )

            aiResponse = resp?.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
          } else if (model === "claude") {
            const apiKey = process.env.ANTHROPIC_API_KEY
            if (!apiKey) throw new Error("Anthropic API key not configured")

            const anthropic = new Anthropic({ apiKey })
            const anthropicMessages = messages.map((msg: any) => ({
              role: msg.role === "assistant" ? "assistant" : "user",
              content: msg.content,
            }))

            const response = await anthropic.messages.create({
              model: "claude-3-5-haiku-20241022",
              max_tokens: 4096,
              messages: anthropicMessages,
            })

            aiResponse = response.content[0].type === "text" ? response.content[0].text : ""
          } else if (model === "deepseek" || model === "gpt-oss" || model === "llama" || model === "mistral") {
            const apiKey = process.env.OPENROUTER_API_KEY
            if (!apiKey) throw new Error("OpenRouter API key not configured")

            const modelMap: Record<string, string> = {
              deepseek: "deepseek/deepseek-chat",
              "gpt-oss": "openai/gpt-oss-20b:free",
              llama: "meta-llama/llama-3.1-70b-instruct",
              mistral: "mistralai/mistral-7b-instruct",
            }

            const response = await axios.post(
              "https://openrouter.ai/api/v1/chat/completions",
              { model: modelMap[model], messages },
              { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } },
            )

            aiResponse = response.data?.choices?.[0]?.message?.content ?? ""
          }

          // Parse the AI response
          let jsonStr = aiResponse.trim()
          jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "")

          const jsonObjects: string[] = []
          let currentDepth = 0
          let startIndex = -1

          for (let i = 0; i < jsonStr.length; i++) {
            if (jsonStr[i] === "{") {
              if (currentDepth === 0) startIndex = i
              currentDepth++
            } else if (jsonStr[i] === "}") {
              currentDepth--
              if (currentDepth === 0 && startIndex !== -1) {
                jsonObjects.push(jsonStr.substring(startIndex, i + 1))
                startIndex = -1
              }
            }
          }

          let parsed: any = null
          for (const objStr of jsonObjects) {
            try {
              parsed = JSON.parse(objStr)
              if (parsed.files || parsed.message) break
            } catch (err) {
              console.warn("Failed to parse JSON object:", err)
            }
          }

          if (!parsed) {
            const fixedJson = jsonStr
              .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
              .replace(/\n/g, "\\n")
              .replace(/\r/g, "\\r")
              .replace(/\t/g, "\\t")
              .replace(/,\s*}/g, "}")
              .replace(/,\s*]/g, "]")

            try {
              parsed = JSON.parse(fixedJson)
            } catch (secondError) {
              throw new Error("Failed to parse AI response")
            }
          }

          // Stream file generation
          if (parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0) {
            parsed.imageUrls = imageUrls

            // Send files one by one
            for (let i = 0; i < parsed.files.length; i++) {
              const file = parsed.files[i]
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "file",
                    data: {
                      stage: "generating",
                      file: file.path,
                      index: i,
                      total: parsed.files.length,
                    },
                  })}\n\n`,
                ),
              )
              await new Promise((resolve) => setTimeout(resolve, 100))
            }

            // Send complete response
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "complete",
                  data: {
                    files: parsed.files,
                    imageUrls: parsed.imageUrls,
                    filesGenerated: parsed.files.map((f: any) => f.path),
                  },
                })}\n\n`,
              ),
            )
          } else if (parsed.message) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "complete",
                  data: { message: parsed.message },
                })}\n\n`,
              ),
            )
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error: any) {
          console.error("Streaming error:", error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                data: { error: error.message },
              })}\n\n`,
            ),
          )
          controller.close()
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error: any) {
    console.error("AI Stream API error:", error?.response?.data ?? error.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
