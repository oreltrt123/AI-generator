import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    if (!model || !["gemini", "deepseek", "gpt-oss"].includes(model)) {
      return NextResponse.json({ error: "Invalid or missing model" }, { status: 400 })
    }

    // Extract user query from the last message
    const userQuery = messages[messages.length - 1].content
      .replace(/.*Now, create an amazing Next.js project for: (.*)/, "$1")
      .trim()

    // Fetch images from Unsplash based on user query
    let imageUrls: string[] = []
    try {
      const unsplashApiKey = process.env.UNSPLASH_API_KEY
      if (!unsplashApiKey) {
        console.warn("Unsplash API key not configured")
      } else {
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

    // === GEMINI HANDLER ===
    if (model === "gemini") {
      const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY
      if (!apiKey) return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
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

      let output = resp?.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? resp?.data?.output ?? ""

      // Append image URLs to the response if it's a JSON object with files
      try {
        const parsedOutput = JSON.parse(output)
        if (parsedOutput.files && Array.isArray(parsedOutput.files)) {
          parsedOutput.imageUrls = imageUrls
          output = JSON.stringify(parsedOutput)
        }
      } catch (error) {
        console.error("Error appending image URLs to Gemini response:", error)
      }

      return new NextResponse(output, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
    }

    // === DEEPSEEK HANDLER ===
    if (model === "deepseek") {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) return NextResponse.json({ error: "DeepSeek API key not configured" }, { status: 500 })

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        { model: "deepseek/deepseek-chat", messages, stream: true },
        { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, responseType: "stream" },
      )

      const stream = response.data
      const encoder = new TextEncoder()

      const readable = new ReadableStream({
        async start(controller) {
          let accumulatedData = ""
          stream.on("data", (chunk: any) => {
            const payLoads = chunk.toString().split("\n\n")
            for (const payLoad of payLoads) {
              if (payLoad.includes("[DONE]")) {
                try {
                  const parsedOutput = JSON.parse(accumulatedData)
                  if (parsedOutput.files && Array.isArray(parsedOutput.files)) {
                    parsedOutput.imageUrls = imageUrls
                    controller.enqueue(encoder.encode(JSON.stringify(parsedOutput)))
                  } else {
                    controller.enqueue(encoder.encode(accumulatedData))
                  }
                } catch (error) {
                  controller.enqueue(encoder.encode(accumulatedData))
                }
                return controller.close()
              }
              if (payLoad.startsWith("data:")) {
                try {
                  const data = JSON.parse(payLoad.replace("data:", ""))
                  const text = data.choices[0].delta?.content
                  if (text) {
                    accumulatedData += text
                    controller.enqueue(encoder.encode(text))
                  }
                } catch (err) {
                  console.error("Error parsing stream", err)
                }
              }
            }
          })

          stream.on("end", () => controller.close())
          stream.on("error", (err: any) => controller.error(err))
        },
      })

      return new NextResponse(readable, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked" },
      })
    }

    // === GPT-OSS HANDLER ===
    if (model === "gpt-oss") {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 })

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        { model: "openai/gpt-oss-20b:free", messages },
        { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } },
      )

      let output = response.data?.choices?.[0]?.message?.content ?? ""

      // Append image URLs to the response if it's a JSON object with files
      try {
        const parsedOutput = JSON.parse(output)
        if (parsedOutput.files && Array.isArray(parsedOutput.files)) {
          parsedOutput.imageUrls = imageUrls
          output = JSON.stringify(parsedOutput)
        }
      } catch (error) {
        console.error("Error appending image URLs to GPT-OSS response:", error)
      }

      return new NextResponse(output, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
    }

    return NextResponse.json({ error: "Unknown model" }, { status: 400 })
  } catch (error: any) {
    console.error("AI API error:", error?.response?.data ?? error.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
