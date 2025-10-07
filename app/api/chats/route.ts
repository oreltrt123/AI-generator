// app/api/chats/route.ts
import { db } from "@/config/db";
import { chatTable, frameTable, projectTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser();
    console.log('Current user in PUT /api/chats:', user?.id); // Debug
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const creatorId = user.id;

    const { messages, frameId, projectId, userId } = await req.json();

    if (!frameId || !projectId || !messages || userId !== creatorId) {
      return NextResponse.json(
        { error: "Missing required fields or unauthorized user" },
        { status: 400 }
      );
    }

    // Verify project ownership (to ensure frame belongs to user)
    try {
      const projectResult = await db
        .select({ projectId: projectTable.projectId })
        .from(projectTable)
        .where(and(eq(projectTable.projectId, projectId), eq(projectTable.createdBy, creatorId)));

      if (!projectResult.length) {
        return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
      }
      console.log('Project ownership verified for chats');
    } catch (ownErr: any) {
      console.error("Ownership check failed:", ownErr);
      return NextResponse.json({ error: "Ownership verification failed", details: ownErr.message }, { status: 500 });
    }

    // Verify frame exists and belongs to project
    try {
      const frameResult = await db
        .select({ frameId: frameTable.frameId })
        .from(frameTable)
        .where(and(eq(frameTable.frameId, frameId), eq(frameTable.projectId, projectId)));

      if (!frameResult.length) {
        return NextResponse.json({ error: "Frame not found" }, { status: 404 });
      }
      console.log('Frame verified');
    } catch (frameErr: any) {
      console.error("Frame verification failed:", frameErr);
      return NextResponse.json({ error: "Frame verification failed", details: frameErr.message }, { status: 500 });
    }

    // Check if chat exists for this frameId and user
    const existingChats = await db
      .select()
      .from(chatTable)
      .where(and(eq(chatTable.frameId, frameId), eq(chatTable.createdBy, creatorId)))
      .limit(1);

    if (existingChats.length > 0) {
      // Update existing chat
      await db
        .update(chatTable)
        .set({
          chatMessage: messages,
        })
        .where(and(eq(chatTable.frameId, frameId), eq(chatTable.createdBy, creatorId)));
      console.log('Chat updated');
    } else {
      // Insert new chat
      await db.insert(chatTable).values({
        chatMessage: messages,
        frameId: frameId,
        createdBy: creatorId,
      });
      console.log('New chat inserted');
    }

    return NextResponse.json({ result: 'updated' });
  } catch (error: any) {
    console.error("Global PUT /api/chats error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}