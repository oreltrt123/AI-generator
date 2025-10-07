import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt provided" }, { status: 400 })
    }

    const improvementPrompt = `You are an expert at writing detailed web development prompts. Take this basic prompt and expand it into a comprehensive brief that will generate a COMPLETE, MULTI-FILE web application.

Original prompt: "${prompt}"

Expand this into a detailed prompt (3-5 sentences) that specifies:
- ALL pages/files needed (e.g., for "tasks app": dashboard, create task page, task list, task details, settings)
- Specific functional features (forms, validation, data storage, search, filters)
- Modern design requirements (clean layout, professional colors, smooth interactions)
- Interactive elements needed (modals, dropdowns, charts, animations)

Be specific about functionality and design, but keep it concise and actionable.`

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: improvementPrompt }],
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    )

    const improvedPrompt = response.data.choices[0].message.content

    return NextResponse.json({ improvedPrompt })
  } catch (error: any) {
    console.error("Prompt improvement error:", error)
    return NextResponse.json({ error: "Failed to improve prompt" }, { status: 500 })
  }
}
