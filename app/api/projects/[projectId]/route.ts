import { db } from "@/config/db"
import { projectTable, projectCollaboratorsTable } from "@/config/schema"
import { currentUser } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const user = await currentUser()
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userEmail = user.primaryEmailAddress.emailAddress
    const { projectId } = params

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
    }

    // Check if user owns the project OR is a collaborator
    const isOwner = await db
      .select()
      .from(projectTable)
      .where(and(eq(projectTable.projectId, projectId), eq(projectTable.createdBy, userEmail)))

    const isCollaborator = await db
      .select()
      .from(projectCollaboratorsTable)
      .where(
        and(
          eq(projectCollaboratorsTable.projectId, projectId),
          eq(projectCollaboratorsTable.userEmail, userEmail),
          eq(projectCollaboratorsTable.status, "accepted"),
        ),
      )

    if (!isOwner.length && !isCollaborator.length) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 })
    }

    const project =
      isOwner.length > 0
        ? isOwner[0]
        : await db
            .select()
            .from(projectTable)
            .where(eq(projectTable.projectId, projectId))
            .then((res) => res[0])

    return NextResponse.json(project)
  } catch (error: any) {
    console.error("[v0] GET project error:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}
