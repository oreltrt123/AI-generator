import { db } from "@/config/db";
import { projectTable, projectCollaboratorsTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { eq, or, and } from "drizzle-orm";

// GET all projects for the current user (owned + shared)
export async function GET(req: NextRequest) {
  try {
    // Verify Clerk authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: No user found" }, { status: 401 });
    }
    if (!user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized: User email not found" }, { status: 401 });
    }
    const userEmail = user.primaryEmailAddress.emailAddress;

    // Verify database connection
    try {
      await db.execute("SELECT 1"); // Simple query to test DB connection
    } catch (dbError) {
      console.error("[v0] Database connection error:", dbError);
      return NextResponse.json(
        { error: "Internal Server Error", details: "Failed to connect to database" },
        { status: 500 }
      );
    }

    // Get projects created by user
    let ownedProjects = [];
    try {
      ownedProjects = await db
        .select()
        .from(projectTable)
        .where(eq(projectTable.createdBy, userEmail))
        .orderBy(projectTable.updatedOn);
    } catch (ownedError) {
      console.error("[v0] Error fetching owned projects:", ownedError);
      return NextResponse.json(
        { error: "Internal Server Error", details: "Failed to fetch owned projects" },
        { status: 500 }
      );
    }

    // Get projects shared with user
    let sharedProjects = [];
    try {
      const sharedProjectIds = await db
        .select({ projectId: projectCollaboratorsTable.projectId })
        .from(projectCollaboratorsTable)
        .where(and(eq(projectCollaboratorsTable.userEmail, userEmail), eq(projectCollaboratorsTable.status, "accepted")));

      if (sharedProjectIds.length > 0) {
        sharedProjects = await db
          .select()
          .from(projectTable)
          .where(or(...sharedProjectIds.map((p) => eq(projectTable.projectId, p.projectId))));
      }
    } catch (sharedError) {
      console.error("[v0] Error fetching shared projects:", sharedError);
      return NextResponse.json(
        { error: "Internal Server Error", details: "Failed to fetch shared projects" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ownedProjects,
      sharedProjects,
    });
  } catch (error: any) {
    console.error("[v0] GET projects error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}