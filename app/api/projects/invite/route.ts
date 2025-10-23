import { db } from "@/config/db"
import { projectTable, projectCollaboratorsTable } from "@/config/schema"
import { currentUser } from "@clerk/nextjs/server"
import { type NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userEmail = user.primaryEmailAddress.emailAddress

    const { projectId, inviteEmail, role = "viewer" } = await req.json()

    if (!projectId || !inviteEmail) {
      return NextResponse.json({ error: "Missing projectId or inviteEmail" }, { status: 400 })
    }

    // Verify user owns the project
    const project = await db
      .select()
      .from(projectTable)
      .where(and(eq(projectTable.projectId, projectId), eq(projectTable.createdBy, userEmail)))

    if (!project.length) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 })
    }

    // Check if user is already invited
    const existingInvite = await db
      .select()
      .from(projectCollaboratorsTable)
      .where(
        and(eq(projectCollaboratorsTable.projectId, projectId), eq(projectCollaboratorsTable.userEmail, inviteEmail)),
      )

    if (existingInvite.length > 0) {
      return NextResponse.json({ error: "User already invited to this project" }, { status: 400 })
    }

    // Create invitation
    await db.insert(projectCollaboratorsTable).values({
      projectId,
      userEmail: inviteEmail,
      invitedBy: userEmail,
      role,
      status: "pending",
    })

    // TODO: Send email notification via Clerk or email service
    // For now, the invitation is created in the database

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
    })
  } catch (error: any) {
    console.error("[v0] Invite user error:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}

// GET invitations for current user
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userEmail = user.primaryEmailAddress.emailAddress

    const invitations = await db
      .select()
      .from(projectCollaboratorsTable)
      .where(and(eq(projectCollaboratorsTable.userEmail, userEmail), eq(projectCollaboratorsTable.status, "pending")))

    return NextResponse.json({ invitations })
  } catch (error: any) {
    console.error("[v0] GET invitations error:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}

// PUT to accept/reject invitation
export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userEmail = user.primaryEmailAddress.emailAddress

    const { invitationId, action } = await req.json()

    if (!invitationId || !action || !["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Missing or invalid invitationId or action" }, { status: 400 })
    }

    // Verify invitation belongs to user
    const invitation = await db
      .select()
      .from(projectCollaboratorsTable)
      .where(and(eq(projectCollaboratorsTable.id, invitationId), eq(projectCollaboratorsTable.userEmail, userEmail)))

    if (!invitation.length) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Update invitation status
    await db
      .update(projectCollaboratorsTable)
      .set({
        status: action === "accept" ? "accepted" : "rejected",
        acceptedOn: action === "accept" ? new Date() : null,
      })
      .where(eq(projectCollaboratorsTable.id, invitationId))

    return NextResponse.json({
      success: true,
      message: `Invitation ${action}ed successfully`,
    })
  } catch (error: any) {
    console.error("[v0] Update invitation error:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}
