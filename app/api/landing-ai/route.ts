// app/api/ai-model/route.ts
import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    // 🔹 Extract the last user message text
    const userPrompt = messages[messages.length - 1]?.content || ""

    // 🔹 Get related images from Unsplash
    const unsplashImages = await fetchUnsplashImages(userPrompt)

    // 🔹 Add the image URLs to the model’s context
    const promptWithImages = `
You are an AI that builds modern websites.
Use the following relevant Unsplash image URLs in your design:
${unsplashImages.join("\n")}

User request:
${userPrompt}
    `

    const finalMessages = [
      ...messages.slice(0, -1),
      { role: "user", content: promptWithImages },
    ]

    // 🔹 Send the request to OpenRouter (DeepSeek)
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        messages: finalMessages,
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "My Next.js App",
        },
        responseType: "stream",
      }
    )

    const stream = response.data
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        stream.on("data", (chunk: any) => {
          const payLoads = chunk.toString().split("\n\n")
          for (const payLoad of payLoads) {
            if (payLoad.includes("[DONE]")) {
              controller.close()
              return
            }
            if (payLoad.startsWith("data:")) {
              try {
                const data = JSON.parse(payLoad.replace("data:", ""))
                const text = data.choices[0].delta?.content
                if (text) {
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
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error: any) {
    console.error("API error:", error)
    if (error.response) {
      console.error("OpenRouter response error:", error.response.data)
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

/* 🔹 Helper function: Fetch images from Unsplash */
async function fetchUnsplashImages(query: string): Promise<string[]> {
  try {
    const keyword = extractKeyword(query)
    const response = await axios.get("https://api.unsplash.com/search/photos", {
      params: {
        query: keyword,
        per_page: 5,
      },
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    })

    const results = response.data.results
    return results.map((img: any) => img.urls?.regular).filter(Boolean)
  } catch (error) {
    console.error("Unsplash API error:", error)
    return []
  }
}

/* 🔹 Simple keyword extractor */
function extractKeyword(text: string): string {
  // Simple heuristic — can improve later
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
  const skip = ["make", "create", "design", "website", "build", "for", "the"]
  const keyword = words.find((w) => !skip.includes(w))
  return keyword || "web design"
}
