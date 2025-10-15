import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { auth } from "@clerk/nextjs/server"

const sql = neon(process.env.DATABASE_URL!)

async function ensureTablesExist() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS adaptive_deployments (
        id SERIAL PRIMARY KEY,
        project_id VARCHAR NOT NULL,
        deployment_id VARCHAR NOT NULL UNIQUE,
        project_files JSONB NOT NULL,
        current_version INTEGER DEFAULT 1,
        language VARCHAR(50) NOT NULL,
        deployed_by VARCHAR NOT NULL,
        is_active BOOLEAN DEFAULT true,
        deployed_on TIMESTAMP DEFAULT NOW(),
        last_updated TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS site_versions (
        id SERIAL PRIMARY KEY,
        deployment_id VARCHAR NOT NULL,
        version_number INTEGER NOT NULL,
        project_files JSONB NOT NULL,
        site_config JSONB NOT NULL,
        changes_summary TEXT,
        performance_metrics JSONB,
        created_by VARCHAR DEFAULT 'adaptive-ai',
        created_on TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS engagement_metrics (
        id SERIAL PRIMARY KEY,
        deployment_id VARCHAR NOT NULL,
        version_number INTEGER NOT NULL,
        total_visitors INTEGER DEFAULT 0,
        avg_time_spent REAL DEFAULT 0,
        avg_scroll_depth REAL DEFAULT 0,
        cta_click_rate REAL DEFAULT 0,
        bounce_rate REAL DEFAULT 0,
        top_clicked_elements JSONB,
        low_engagement_sections JSONB,
        calculated_on TIMESTAMP DEFAULT NOW()
      )
    `

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

    await sql`
      CREATE TABLE IF NOT EXISTS adaptive_configs (
        id SERIAL PRIMARY KEY,
        deployment_id VARCHAR NOT NULL,
        config_type VARCHAR(50) NOT NULL,
        target_element VARCHAR(500),
        original_value TEXT,
        new_value TEXT,
        reasoning TEXT,
        applied_on TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        performance_impact REAL
      )
    `

    console.log("[Adaptive Deploy] Tables ensured to exist")
  } catch (error: any) {
    console.error("[Adaptive Deploy] Error ensuring tables exist:", error)
    throw error
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, projectFiles, language } = await req.json()

    if (!projectId || !projectFiles || !Array.isArray(projectFiles)) {
      return NextResponse.json({ error: "Missing required fields: projectId, projectFiles" }, { status: 400 })
    }

    await ensureTablesExist()

    // Generate unique deployment ID
    const deploymentId = `${projectId}-${Date.now()}`

    // Insert deployment record
    await sql`
      INSERT INTO adaptive_deployments (
        project_id, deployment_id, project_files, language, deployed_by, current_version
      ) VALUES (
        ${projectId}, ${deploymentId}, ${JSON.stringify(projectFiles)}, ${language || "nextjs"}, ${userId}, 1
      )
    `

    // Create initial version record
    await sql`
      INSERT INTO site_versions (
        deployment_id, version_number, project_files, site_config, changes_summary, created_by
      ) VALUES (
        ${deploymentId}, 
        1, 
        ${JSON.stringify(projectFiles)}, 
        ${JSON.stringify({ layout: "default", theme: "original" })},
        'Initial deployment',
        'user'
      )
    `

    // Initialize engagement metrics
    await sql`
      INSERT INTO engagement_metrics (
        deployment_id, version_number, total_visitors, avg_time_spent, avg_scroll_depth, cta_click_rate, bounce_rate
      ) VALUES (
        ${deploymentId}, 1, 0, 0, 0, 0, 0
      )
    `

    const deploymentUrl = `https://www.pentrix.site/preview/publish/${deploymentId}`

    console.log("[Adaptive Deploy] Successfully deployed:", deploymentUrl)

    return NextResponse.json({
      success: true,
      deploymentId,
      deploymentUrl,
      message: "Site deployed successfully with adaptive tracking enabled",
    })
  } catch (error: any) {
    console.error("[Adaptive Deploy] Error:", error)
    return NextResponse.json({ error: "Failed to deploy site", details: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
    }

    await ensureTablesExist()

    const deployments = await sql`
      SELECT * FROM adaptive_deployments 
      WHERE project_id = ${projectId} 
      ORDER BY deployed_on DESC 
      LIMIT 1
    `

    if (deployments.length === 0) {
      return NextResponse.json({ deployed: false })
    }

    const deployment = deployments[0]
    return NextResponse.json({
      deployed: true,
      deploymentId: deployment.deployment_id,
      deploymentUrl: `https://www.pentrix.site/preview/publish/${deployment.deployment_id}`,
      currentVersion: deployment.current_version,
      lastUpdated: deployment.last_updated,
    })
  } catch (error: any) {
    console.error("[Adaptive Deploy] GET Error:", error)
    return NextResponse.json({ error: "Failed to fetch deployment", details: error.message }, { status: 500 })
  }
}
