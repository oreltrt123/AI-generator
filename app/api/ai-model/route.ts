import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"
import OpenAI from "openai"  // For GPT-5 SDK
import Anthropic from "@anthropic-ai/sdk"

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    if (!model || !["gemini", "gpt-oss", "claude-code", "gpt-5-chat"].includes(model)) {
      return NextResponse.json({ error: "Invalid or missing model" }, { status: 400 })
    }

    // Extract user query from the last message
    const userQuery = messages[messages.length - 1].content.replace(/.*Now, create an amazing Next.js project for: (.*)/, "$1").trim()

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
        { headers: { "Content-Type": "application/json" } }
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

    // === GPT-OSS HANDLER ===
    if (model === "gpt-oss") {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 })

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        { model: "openai/gpt-oss-20b:free", messages },
        { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
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

    // === CLAUDE-CODE HANDLER ===
    if (model === "claude-code") {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 })

      // Initialize SDK client
      const anthropic = new Anthropic({ apiKey });

      // Convert messages to Anthropic format (role: "user" or "assistant")
      const anthropicMessages = messages.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      try {
        const response = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",  // Underlying model for coding tasks
          max_tokens: 1024,
          messages: anthropicMessages,
          temperature: 0.7,  // Adjustable for creativity
        });

        let output = response.content[0]?.text ?? "";

        // Append image URLs to the response if it's a JSON object with files
        try {
          const parsedOutput = JSON.parse(output);
          if (parsedOutput.files && Array.isArray(parsedOutput.files)) {
            parsedOutput.imageUrls = imageUrls;
            output = JSON.stringify(parsedOutput);
          }
        } catch (error) {
          console.error("Error appending image URLs to Claude response:", error);
        }

        return new NextResponse(output, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      } catch (error: any) {
        console.error("Claude API error:", error.message);
        return NextResponse.json({ error: "Claude API request failed" }, { status: 500 });
      }
    }

    // === GPT-5-CHAT HANDLER ===
    if (model === "gpt-5-chat") {
      const apiKey = process.env.GPT5_API_KEY
      if (!apiKey) return NextResponse.json({ error: "GPT-5 API key not configured" }, { status: 500 })

      // Initialize SDK
      const openai = new OpenAI({ apiKey })

      // Concatenate messages into a single input string for this API (supports multi-turn as context)
      const input = messages.map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')

      try {
        const response = await openai.responses.create({
          model: "gpt-5-nano",  // As per your code; swap to "gpt-5" if needed
          input: input,
          store: true,  // As per your code
        })

        let output = (await response).output_text ?? ""

        // Append image URLs to the response if it's a JSON object with files
        try {
          const parsedOutput = JSON.parse(output)
          if (parsedOutput.files && Array.isArray(parsedOutput.files)) {
            parsedOutput.imageUrls = imageUrls
            output = JSON.stringify(parsedOutput)
          }
        } catch (error) {
          console.error("Error appending image URLs to GPT-5 response:", error)
        }

        return new NextResponse(output, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
      } catch (error: any) {
        console.error("GPT-5 API error:", error.message)
        return NextResponse.json({ error: "GPT-5 API request failed" }, { status: 500 })
      }
    }

    return NextResponse.json({ error: "Unknown model" }, { status: 400 })
  } catch (error: any) {
    console.error("AI API error:", error?.response?.data ?? error.message)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}