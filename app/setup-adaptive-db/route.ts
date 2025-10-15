import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { auth } from "@clerk/nextjs/server"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Setup] Creating adaptive deployment tables...")

    // Create all tables
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

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_adaptive_deployments_project_id ON adaptive_deployments(project_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_adaptive_deployments_deployment_id ON adaptive_deployments(deployment_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_site_analytics_deployment_id ON site_analytics(deployment_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_site_analytics_session_id ON site_analytics(session_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_site_versions_deployment_id ON site_versions(deployment_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_adaptive_configs_deployment_id ON adaptive_configs(deployment_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_engagement_metrics_deployment_id ON engagement_metrics(deployment_id)`

    console.log("[Setup] All tables created successfully")

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully",
    })
  } catch (error: any) {
    console.error("[Setup] Error creating tables:", error)
    return NextResponse.json({ error: "Failed to setup database", details: error.message }, { status: 500 })
  }
}
