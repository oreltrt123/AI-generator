import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/config/db"
import { deploymentsTable } from "@/config/schema"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 })
    }

    // Check if project is deployed
    const deployment = await db
      .select({
        subdomain: deploymentsTable.subdomain,
        deployedOn: deploymentsTable.deployedOn,
      })
      .from(deploymentsTable)
      .where(eq(deploymentsTable.projectId, projectId))
      .limit(1)

    if (deployment.length === 0) {
      return NextResponse.json({ deployed: false })
    }

    return NextResponse.json({
      deployed: true,
      subdomain: deployment[0].subdomain,
      deployedOn: deployment[0].deployedOn,
    })
  } catch (error) {
    console.error("Error checking deployment status:", error)
    return NextResponse.json({ error: "Failed to check deployment status" }, { status: 500 })
  }
}
