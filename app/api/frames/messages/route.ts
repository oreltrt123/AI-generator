// File: app/api/frames/messages/route.ts (new)
import { db } from "@/config/db";
import { chatTable, frameTable, projectTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    console.log('Current user in messages POST:', user?.id, user?.primaryEmailAddress?.emailAddress); // Debug
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const creatorEmail = user.primaryEmailAddress.emailAddress;

    const { projectId, frameId, message } = await req.json();
    if (!projectId || !frameId || !message || typeof message !== 'object') {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Verify ownership (project exists and belongs to user)
    try {
      const projectResult = await db
        .select({ projectId: projectTable.projectId })
        .from(projectTable)
        .where(and(eq(projectTable.projectId, projectId), eq(projectTable.createdBy, creatorEmail)));

      if (!projectResult.length) {
        return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
      }
      console.log('Project ownership verified for message');
    } catch (ownErr: any) {
      console.error("Ownership check failed:", ownErr);
      return NextResponse.json({ error: "Ownership verification failed", details: ownErr.message }, { status: 500 });
    }

    // Verify frame exists (under the project)
    try {
      const frameResult = await db
        .select()
        .from(frameTable)
        .where(and(eq(frameTable.frameId, frameId), eq(frameTable.projectId, projectId)));

      if (!frameResult.length) {
        return NextResponse.json({ error: "Frame not found" }, { status: 404 });
      }
      console.log('Frame verified for message');
    } catch (frameErr: any) {
      console.error("Frame verification failed:", frameErr);
      return NextResponse.json({ error: "Frame verification failed", details: frameErr.message }, { status: 500 });
    }

    // Insert new chat row (each message gets its own row; GET will flatten)
    try {
      await db.insert(chatTable).values({
        frameId,
        chatMessage: [message], // Store as array (even single); schema jsonb handles it
        createdBy: creatorEmail
      });
      console.log('Message inserted');
    } catch (insertErr: any) {
      console.error("Message insert failed:", insertErr);
      return NextResponse.json({ error: "Message creation failed (check schema)", details: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Global POST error in messages:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}