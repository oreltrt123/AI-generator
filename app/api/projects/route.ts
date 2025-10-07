import { db } from "@/config/db";
import { chatTable, frameTable, projectTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) { 
  try {
    const user = await currentUser();
    console.log('Current user:', user?.id, user?.primaryEmailAddress?.emailAddress); // Debug
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const creatorEmail = user.primaryEmailAddress.emailAddress;

    const { projectId, frameId, messages, designCode } = await req.json(); // CHANGE: Optional designCode
    
    if (!projectId || !frameId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing or invalid projectId, frameId, or messages" }, { status: 400 });
    }

    // Create Project
    try {
      await db.insert(projectTable).values({
        projectId: projectId,
        createdBy: creatorEmail
      });
      console.log('Project inserted');
    } catch (projectErr: any) {
      console.error("Project insert failed:", projectErr);
      return NextResponse.json({ error: "Project creation failed", details: projectErr.message }, { status: 500 });
    }

    // Create Frame
    try {
      await db.insert(frameTable).values({
        frameId: frameId,
        projectId: projectId,
        designCode: designCode || null, // CHANGE: Support initial code
      });
      console.log('Frame inserted');
    } catch (frameErr: any) {
      console.error("Frame insert failed:", frameErr);
      return NextResponse.json({ error: "Frame creation failed", details: frameErr.message }, { status: 500 });
    }

    // Create Chat
    try {
      await db.insert(chatTable).values({
        frameId: frameId,
        chatMessage: messages, // JSON array
        createdBy: creatorEmail
      });
      console.log('Chat inserted');
    } catch (chatErr: any) {
      console.error("Chat insert failed:", chatErr);
      return NextResponse.json({ error: "Chat creation failed (check frameId column)", details: chatErr.message }, { status: 500 });
    }

    return NextResponse.json({
      projectId, 
      frameId, 
      messages,
      success: true
    });
  } catch (error: any) {
    console.error("Global POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}