import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/config/db"
import { AIOutput, Projects } from "@/config/schema"

export async function POST(req: NextRequest) {
  try {
    const { url, projectId, frameId, userId } = await req.json()

    if (!url || !projectId || !frameId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Create initial message for the AI to analyze the URL
    const initialMessage = {
      role: "user",
      content: `Please analyze and recreate this website: ${url}. Take a screenshot first to understand the design, then recreate it with similar styling, layout, and functionality.`,
    }

    // Create project in database
    await db.insert(Projects).values({
      projectId,
      userId,
      frameId,
      messages: JSON.stringify([initialMessage]),
    })

    // Create initial AI output entry
    await db.insert(AIOutput).values({
      projectId,
      frameId,
      output: JSON.stringify({
        type: "url_import",
        url,
        status: "pending",
      }),
    })

    return NextResponse.json({
      success: true,
      projectId,
      frameId,
    })
  } catch (error) {
    console.error("URL import error:", error)
    return NextResponse.json({ error: "Failed to import website from URL" }, { status: 500 })
  }
}
