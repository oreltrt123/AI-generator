import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function ensureAnalyticsTableExists() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS site_analytics (
        id SERIAL PRIMARY KEY,
        deployment_id VARCHAR NOT NULL,
        session_id VARCHAR NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        element_selector VARCHAR(500),
        element_text TEXT,
        scroll_depth INTEGER,
        time_spent INTEGER,
        section_id VARCHAR(255),
        timestamp TIMESTAMP DEFAULT NOW(),
        metadata JSONB
      )
    `

    await sql`CREATE INDEX IF NOT EXISTS idx_site_analytics_deployment_id ON site_analytics(deployment_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_site_analytics_session_id ON site_analytics(session_id)`
  } catch (error) {
    console.error("[Analytics] Error ensuring table exists:", error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { deploymentId, sessionId, eventType, data } = await req.json()

    if (!deploymentId || !sessionId || !eventType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await ensureAnalyticsTableExists()

    // Insert analytics event
    await sql`
      INSERT INTO site_analytics (
        deployment_id, session_id, event_type, element_selector, element_text, 
        scroll_depth, time_spent, section_id, metadata
      ) VALUES (
        ${deploymentId},
        ${sessionId},
        ${eventType},
        ${data.elementSelector || null},
        ${data.elementText || null},
        ${data.scrollDepth || null},
        ${data.timeSpent || null},
        ${data.sectionId || null},
        ${JSON.stringify(data.metadata || {})}
      )
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Analytics] Error:", error)
    return NextResponse.json({ error: "Failed to track analytics", details: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const deploymentId = searchParams.get("deploymentId")

    if (!deploymentId) {
      return NextResponse.json({ error: "Missing deploymentId" }, { status: 400 })
    }

    await ensureAnalyticsTableExists()

    // Get aggregated analytics
    const analytics = await sql`
      SELECT 
        event_type,
        COUNT(*) as count,
        element_selector,
        element_text,
        AVG(scroll_depth) as avg_scroll_depth,
        AVG(time_spent) as avg_time_spent
      FROM site_analytics
      WHERE deployment_id = ${deploymentId}
      GROUP BY event_type, element_selector, element_text
      ORDER BY count DESC
    `

    return NextResponse.json({ analytics })
  } catch (error: any) {
    console.error("[Analytics] GET Error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics", details: error.message }, { status: 500 })
  }
}
