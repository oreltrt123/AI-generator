import { db } from "@/config/db"
import { projectTable, frameTable, chatTable, variantsTable } from "@/config/schema"
import { currentUser } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userEmail = user.primaryEmailAddress.emailAddress

    const { projectId } = await req.json()

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
    }

    // Verify user owns the project
    const originalProject = await db
      .select()
      .from(projectTable)
      .where(and(eq(projectTable.projectId, projectId), eq(projectTable.createdBy, userEmail)))

    if (!originalProject.length) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 })
    }

    // Create new project with duplicated data
    const newProjectId = uuidv4()
    await db.insert(projectTable).values({
      projectId: newProjectId,
      projectName: `${originalProject[0].projectName} (Copy)`,
      createdBy: userEmail,
    })

    // Get all frames from original project
    const originalFrames = await db.select().from(frameTable).where(eq(frameTable.projectId, projectId))

    // Duplicate frames
    for (const frame of originalFrames) {
      const newFrameId = uuidv4()

      // Insert new frame
      await db.insert(frameTable).values({
        frameId: newFrameId,
        projectId: newProjectId,
        designCode: frame.designCode,
      })

      // Get and duplicate variants
      const variants = await db.select().from(variantsTable).where(eq(variantsTable.frameId, frame.frameId))

      for (const variant of variants) {
        await db.insert(variantsTable).values({
          frameId: newFrameId,
          variantNumber: variant.variantNumber,
          projectFiles: variant.projectFiles,
          prdData: variant.prdData,
          imageUrls: variant.imageUrls,
        })
      }

      // Get and duplicate chats
      const chats = await db.select().from(chatTable).where(eq(chatTable.frameId, frame.frameId))

      for (const chat of chats) {
        await db.insert(chatTable).values({
          frameId: newFrameId,
          chatMessage: chat.chatMessage,
          createdBy: userEmail,
          messageId: `msg_${Date.now()}_${Math.random()}`,
          codeSnapshot: chat.codeSnapshot,
          reasoning: chat.reasoning,
          filesGenerated: chat.filesGenerated,
          thinkingTime: chat.thinkingTime,
        })
      }
    }

    return NextResponse.json({
      success: true,
      newProjectId,
      message: "Project duplicated successfully",
    })
  } catch (error: any) {
    console.error("[v0] Duplicate project error:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}
