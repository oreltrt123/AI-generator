import { db } from "@/config/db"
import { projectTable } from "@/config/schema"
import { currentUser } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"

export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userEmail = user.primaryEmailAddress.emailAddress

    const { projectId, newName } = await req.json()

    if (!projectId || !newName || typeof newName !== "string") {
      return NextResponse.json({ error: "Missing or invalid projectId or newName" }, { status: 400 })
    }

    // Verify user owns the project
    const project = await db
      .select()
      .from(projectTable)
      .where(and(eq(projectTable.projectId, projectId), eq(projectTable.createdBy, userEmail)))

    if (!project.length) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 })
    }

    // Update project name
    await db
      .update(projectTable)
      .set({
        projectName: newName,
        updatedOn: new Date(),
      })
      .where(eq(projectTable.projectId, projectId))

    return NextResponse.json({ success: true, projectId, newName })
  } catch (error: any) {
    console.error("[v0] Rename project error:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}
