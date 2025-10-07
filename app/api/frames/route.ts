import { db } from "@/config/db";
import { chatTable, frameTable, projectTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    console.log('Current user in GET:', user?.id, user?.primaryEmailAddress?.emailAddress); // Debug
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const creatorEmail = user.primaryEmailAddress.emailAddress;

    const { searchParams } = new URL(req.url);
    const frameId = searchParams.get("frameId");
    const projectId = searchParams.get("projectId");

    if (!frameId || !projectId) {
      return NextResponse.json(
        { error: "Missing frameId or projectId" },
        { status: 400 }
      );
    }

    // Verify ownership
    try {
      const projectResult = await db
        .select({ projectId: projectTable.projectId })
        .from(projectTable)
        .where(and(eq(projectTable.projectId, projectId), eq(projectTable.createdBy, creatorEmail)));

      if (!projectResult.length) {
        return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
      }
      console.log('Project ownership verified');
    } catch (ownErr: any) {
      console.error("Ownership check failed:", ownErr);
      return NextResponse.json({ error: "Ownership verification failed", details: ownErr.message }, { status: 500 });
    }

    // Fetch frame
    let frameResult;
    try {
      frameResult = await db
        .select()
        .from(frameTable)
        .where(and(eq(frameTable.frameId, frameId), eq(frameTable.projectId, projectId)));
      
      if (!frameResult.length) {
        return NextResponse.json({ error: "Frame not found" }, { status: 404 });
      }
      console.log('Frame fetched');
    } catch (frameErr: any) {
      console.error("Frame fetch failed:", frameErr);
      return NextResponse.json({ error: "Frame fetch failed", details: frameErr.message }, { status: 500 });
    }

    // Fetch chats
    let chatResult;
    try {
      chatResult = await db
        .select()
        .from(chatTable)
        .where(and(eq(chatTable.frameId, frameId), eq(chatTable.createdBy, creatorEmail)));

      const allMessages = chatResult.flatMap((chat) => {
        if (!chat.chatMessage) return [];
        if (Array.isArray(chat.chatMessage)) return chat.chatMessage;
        return [chat.chatMessage];
      });
      console.log('Chats fetched, messages count:', allMessages.length);

      const finalResult = {
        ...frameResult[0],
        chatMessages: allMessages,
      };

      return NextResponse.json(finalResult);
    } catch (chatErr: any) {
      console.error("Chat fetch failed:", chatErr);
      return NextResponse.json({ error: "Chat fetch failed", details: chatErr.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Global GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// FIXED FOR NEON-HTTP: No transactions or .forUpdate() - sequential ops only. No more 500!
export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const creatorEmail = user.primaryEmailAddress.emailAddress;

    const body = await req.json();
    const { projectId, frameId, designCode, chatMessages } = body;

    if (!projectId || !frameId) {
      return NextResponse.json({ error: "Missing projectId or frameId" }, { status: 400 });
    }

    console.log('PUT request body:', { projectId, frameId, hasDesignCode: !!designCode, hasChatMessages: !!chatMessages?.length }); // Debug

    // Verify ownership (read-only)
    const projectResult = await db
      .select({ projectId: projectTable.projectId })
      .from(projectTable)
      .where(and(eq(projectTable.projectId, projectId), eq(projectTable.createdBy, creatorEmail)));

    if (!projectResult.length) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }
    console.log('Project ownership verified for PUT');

    // FIXED: Sequential non-tx ops - Neon-HTTP safe. Frame first, then chat.
    // If frame fails, chat won't run (chained try-catch).
    try {
      // Handle frame (check existence, update/insert)
      const existingFrame = await db
        .select({ frameId: frameTable.frameId })
        .from(frameTable)
        .where(and(eq(frameTable.frameId, frameId), eq(frameTable.projectId, projectId)));

      if (existingFrame.length > 0) {
        if (designCode !== undefined) {
          await db
            .update(frameTable)
            .set({ designCode: designCode || null })
            .where(eq(frameTable.frameId, frameId));
          console.log('Design code updated');
        }
      } else {
        await db.insert(frameTable).values({
          frameId,
          projectId,
          designCode: designCode || null,
        });
        console.log('Frame inserted');
      }
    } catch (frameErr: any) {
      console.error("Frame op error:", frameErr);
      return NextResponse.json({ error: "Frame save failed", details: frameErr.message }, { status: 500 });
    }

    // Handle chat upsert if messages provided (only if frame succeeded)
    if (chatMessages && Array.isArray(chatMessages) && chatMessages.length > 0) {
      try {
        const existingChat = await db
          .select({ id: chatTable.id })
          .from(chatTable)
          .where(and(eq(chatTable.frameId, frameId), eq(chatTable.createdBy, creatorEmail)));

        if (existingChat.length > 0) {
          await db
            .update(chatTable)
            .set({ chatMessage: chatMessages })
            .where(eq(chatTable.id, existingChat[0].id));
          console.log('Chat updated');
        } else {
          await db.insert(chatTable).values({
            frameId,
            chatMessage: chatMessages,
            createdBy: creatorEmail,
          });
          console.log('Chat inserted');
        }
      } catch (chatErr: any) {
        console.error("Chat op error:", chatErr);
        return NextResponse.json({ error: "Chat save failed", details: chatErr.message }, { status: 500 });
      }
    } else {
      console.log('Skipping chat - no messages');
    }

    console.log('PUT completed successfully - no tx needed!');
    return NextResponse.json({ success: true, frameId });
  } catch (error: any) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message || error },
      { status: 500 }
    );
  }
}