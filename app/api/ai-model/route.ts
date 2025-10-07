// app/api/ai-model/route.ts
import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat", // Fixed model ID to a valid free model
        messages,
        stream: true, // enable streaming
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000", // optional
          "X-Title": "My Next.js App", // optional
        },
        responseType: "stream", // important for streaming
      },
    )

    const stream = response.data

    // Return as a web stream so frontend can consume
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

        stream.on("end", () => {
          controller.close()
        })

        stream.on("error", (err: any) => {
          console.error("Stream error", err)
          controller.error(err)
        })
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
