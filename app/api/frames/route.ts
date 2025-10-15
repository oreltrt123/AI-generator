import { db } from "@/config/db"
import { chatTable, frameTable, projectTable, variantsTable } from "@/config/schema"
import { currentUser } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const creatorEmail = user.primaryEmailAddress.emailAddress

    const { searchParams } = new URL(req.url)
    const frameId = searchParams.get("frameId")
    const projectId = searchParams.get("projectId")
    const messageId = searchParams.get("messageId")

    if (!frameId || !projectId) {
      return NextResponse.json({ error: "Missing frameId or projectId" }, { status: 400 })
    }

    const projectResult = await db
      .select({ projectId: projectTable.projectId })
      .from(projectTable)
      .where(and(eq(projectTable.projectId, projectId), eq(projectTable.createdBy, creatorEmail)))

    if (!projectResult.length) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 })
    }

    const frameResult = await db
      .select()
      .from(frameTable)
      .where(and(eq(frameTable.frameId, frameId), eq(frameTable.projectId, projectId)))

    if (!frameResult.length) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 })
    }

    const variantsResult = await db
      .select()
      .from(variantsTable)
      .where(eq(variantsTable.frameId, frameId))
      .orderBy(variantsTable.variantNumber)

    if (messageId) {
      const messageResult = await db
        .select()
        .from(chatTable)
        .where(and(eq(chatTable.frameId, frameId), eq(chatTable.messageId, messageId)))

      if (messageResult.length > 0 && messageResult[0].codeSnapshot) {
        return NextResponse.json({
          ...frameResult[0],
          designCode: messageResult[0].codeSnapshot,
          chatMessages: [],
          messageVersion: messageId,
          variants: variantsResult.length > 0 ? variantsResult : undefined,
        })
      }
    }

    const chatResult = await db
      .select()
      .from(chatTable)
      .where(and(eq(chatTable.frameId, frameId), eq(chatTable.createdBy, creatorEmail)))

    const allMessages = chatResult.flatMap((chat) => {
      if (!chat.chatMessage) return []
      if (Array.isArray(chat.chatMessage)) return chat.chatMessage
      return [chat.chatMessage]
    })

    const finalResult = {
      ...frameResult[0],
      chatMessages: allMessages,
      variants: variantsResult.length > 0 ? variantsResult : undefined,
    }

    return NextResponse.json(finalResult)
  } catch (error: any) {
    console.error("GET error:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const creatorEmail = user.primaryEmailAddress.emailAddress

    const body = await req.json()
    const {
      projectId,
      frameId,
      designCode,
      chatMessages,
      messageId,
      reasoning,
      filesGenerated,
      thinkingTime,
      variants, // Accept array of 4 variants
    } = body

    if (!projectId || !frameId) {
      return NextResponse.json({ error: "Missing projectId or frameId" }, { status: 400 })
    }

    const projectResult = await db
      .select({ projectId: projectTable.projectId })
      .from(projectTable)
      .where(and(eq(projectTable.projectId, projectId), eq(projectTable.createdBy, creatorEmail)))

    if (!projectResult.length) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 })
    }

    const existingFrame = await db
      .select({ frameId: frameTable.frameId })
      .from(frameTable)
      .where(and(eq(frameTable.frameId, frameId), eq(frameTable.projectId, projectId)))

    if (existingFrame.length > 0) {
      if (designCode !== undefined) {
        await db
          .update(frameTable)
          .set({ designCode: designCode || null })
          .where(eq(frameTable.frameId, frameId))
      }
    } else {
      await db.insert(frameTable).values({
        frameId,
        projectId,
        designCode: designCode || null,
      })
    }

    if (variants && Array.isArray(variants) && variants.length > 0) {
      for (const variant of variants) {
        const existingVariant = await db
          .select({ id: variantsTable.id })
          .from(variantsTable)
          .where(and(eq(variantsTable.frameId, frameId), eq(variantsTable.variantNumber, variant.variantNumber)))

        const variantData = {
          frameId,
          variantNumber: variant.variantNumber,
          projectFiles: variant.projectFiles ? JSON.stringify(variant.projectFiles) : null,
          prdData: variant.prdData ? JSON.stringify(variant.prdData) : null,
          imageUrls: variant.imageUrls ? JSON.stringify(variant.imageUrls) : null,
        }

        if (existingVariant.length > 0) {
          await db.update(variantsTable).set(variantData).where(eq(variantsTable.id, existingVariant[0].id))
        } else {
          await db.insert(variantsTable).values(variantData)
        }
      }
    }

    if (chatMessages && Array.isArray(chatMessages) && chatMessages.length > 0) {
      const existingChat = await db
        .select({ id: chatTable.id })
        .from(chatTable)
        .where(and(eq(chatTable.frameId, frameId), eq(chatTable.createdBy, creatorEmail)))

      const chatData: any = {
        chatMessage: chatMessages,
        frameId,
        messageId: messageId || `msg_${Date.now()}`,
        codeSnapshot: designCode || null,
        reasoning: reasoning || null,
        filesGenerated: filesGenerated || null,
        thinkingTime: thinkingTime || null,
      }

      if (existingChat.length > 0) {
        await db.update(chatTable).set(chatData).where(eq(chatTable.id, existingChat[0].id))
      } else {
        await db.insert(chatTable).values({
          createdBy: creatorEmail,
          ...chatData,
        })
      }
    }

    return NextResponse.json({ success: true, frameId })
  } catch (error: any) {
    console.error("PUT error:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message || error }, { status: 500 })
  }
}
