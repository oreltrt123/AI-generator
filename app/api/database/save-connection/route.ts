import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/config/db"
import { databaseConnectionsTable } from "@/config/schema"
import { eq, and } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const { userId, provider, connectionName, config, projectId } = await req.json()

    if (!userId || !provider || !connectionName || !config) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Deactivate any existing connections for this user and project
    if (projectId) {
      await db
        .update(databaseConnectionsTable)
        .set({ isActive: 0 })
        .where(and(eq(databaseConnectionsTable.userId, userId), eq(databaseConnectionsTable.projectId, projectId)))
    }

    // Insert new connection
    const [connection] = await db
      .insert(databaseConnectionsTable)
      .values({
        userId,
        provider,
        connectionName,
        config,
        projectId: projectId || null,
        isActive: 1,
      })
      .returning()

    return NextResponse.json({ connection }, { status: 200 })
  } catch (error: any) {
    console.error("Error saving database connection:", error)
    return NextResponse.json({ error: "Failed to save database connection" }, { status: 500 })
  }
}
