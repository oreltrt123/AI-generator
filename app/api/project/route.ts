import { db } from "@/config/db"
import { chatTable, frameTable, projectTable } from "@/config/schema"
import { currentUser } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    console.log("[v0] Current user:", user?.id, user?.primaryEmailAddress?.emailAddress)
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const creatorEmail = user.primaryEmailAddress.emailAddress

    const { projectId, frameId, messages, designCode, projectName } = await req.json()

    if (!projectId || !frameId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing or invalid projectId, frameId, or messages" }, { status: 400 })
    }

    const finalProjectName =
      projectName || messages.find((m: any) => m.role === "user")?.content?.substring(0, 100) || "Untitled Project"

    // Create Project
    try {
      await db.insert(projectTable).values({
        projectId: projectId,
        projectName: finalProjectName,
        createdBy: creatorEmail,
      })
      console.log("[v0] Project inserted:", projectId, "with name:", finalProjectName)
    } catch (projectErr: any) {
      if (projectErr.code === "23505") {
        console.log("[v0] Project already exists:", projectId)
      } else {
        console.error("[v0] Project insert failed:", projectErr)
        return NextResponse.json({ error: "Project creation failed", details: projectErr.message }, { status: 500 })
      }
    }

    // Create Frame
    try {
      await db.insert(frameTable).values({
        frameId: frameId,
        projectId: projectId,
        designCode: designCode || null,
      })
      console.log("[v0] Frame inserted:", frameId)
    } catch (frameErr: any) {
      if (frameErr.code === "23505") {
        console.log("[v0] Frame already exists:", frameId)
      } else {
        console.error("[v0] Frame insert failed:", frameErr)
        return NextResponse.json({ error: "Frame creation failed", details: frameErr.message }, { status: 500 })
      }
    }

    // Create Chat
    try {
      await db.insert(chatTable).values({
        frameId: frameId,
        chatMessage: messages,
        createdBy: creatorEmail,
        messageId: `msg_${Date.now()}`,
      })
      console.log("[v0] Chat inserted for frame:", frameId)
    } catch (chatErr: any) {
      console.error("[v0] Chat insert failed:", chatErr)
      return NextResponse.json({ error: "Chat creation failed", details: chatErr.message }, { status: 500 })
    }

    return NextResponse.json({
      projectId,
      frameId,
      messages,
      projectName: finalProjectName,
      success: true,
    })
  } catch (error: any) {
    console.error("[v0] Global POST error:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}
