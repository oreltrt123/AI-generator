// app/api/improve-text/route.ts
import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

export async function POST(req: NextRequest) {
  try {
    const { text, instruction } = await req.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Invalid text provided" }, { status: 400 })
    }

    const improvePrompt = `You are an expert copywriter specializing in website content. Improve this text to make it more engaging, professional, and suitable for a modern website:

Original text: "${text}"

User instructions: ${instruction || "Make it concise, persuasive, and visually appealing."}

Output ONLY the improved text. No explanations, no markdown, just the plain improved text.`

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: improvePrompt }],
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    )

    const improvedText = response.data.choices[0].message.content.trim()

    return NextResponse.json({ improvedText })
  } catch (error: any) {
    console.error("Text improvement error:", error)
    return NextResponse.json({ error: "Failed to improve text" }, { status: 500 })
  }
}