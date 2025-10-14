import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/config/db"
import { databaseConnectionsTable } from "@/config/schema"
import { eq, and } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const projectId = searchParams.get("projectId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    let connection
    if (projectId) {
      // Get connection for specific project
      ;[connection] = await db
        .select()
        .from(databaseConnectionsTable)
        .where(
          and(
            eq(databaseConnectionsTable.userId, userId),
            eq(databaseConnectionsTable.projectId, projectId),
            eq(databaseConnectionsTable.isActive, 1),
          ),
        )
        .limit(1)
    } else {
      // Get most recent active connection
      ;[connection] = await db
        .select()
        .from(databaseConnectionsTable)
        .where(and(eq(databaseConnectionsTable.userId, userId), eq(databaseConnectionsTable.isActive, 1)))
        .orderBy(databaseConnectionsTable.createdOn)
        .limit(1)
    }

    return NextResponse.json({ connection: connection || null }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching database connection:", error)
    return NextResponse.json({ error: "Failed to fetch database connection" }, { status: 500 })
  }
}
