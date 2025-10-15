import { neon } from "@neondatabase/serverless"
import { notFound } from "next/navigation"
import AdaptiveRenderer from "./adaptive-renderer"

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
  } catch (error) {
    console.error("[Published Site] Error ensuring tables exist:", error)
  }
}

export default async function PublishedSitePage({ params }: { params: { id: string } }) {
  const deploymentId = params.id

  try {
    await ensureTablesExist()

    // Fetch deployment data
    const deployments = await sql`
      SELECT * FROM adaptive_deployments WHERE deployment_id = ${deploymentId} AND is_active = true
    `

    if (deployments.length === 0) {
      notFound()
    }

    const deployment = deployments[0]
    const projectFiles = deployment.project_files as any[]
    const language = deployment.language as string

    // Get adaptive configs
    const configs = await sql`
      SELECT * FROM adaptive_configs 
      WHERE deployment_id = ${deploymentId} AND is_active = true
      ORDER BY applied_on DESC
    `

    return (
      <AdaptiveRenderer
        deploymentId={deploymentId}
        projectFiles={projectFiles}
        language={language}
        adaptiveConfigs={configs}
      />
    )
  } catch (error) {
    console.error("[Published Site] Error:", error)
    notFound()
  }
}
