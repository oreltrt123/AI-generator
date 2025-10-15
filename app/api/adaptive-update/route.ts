import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  try {
    const { deploymentId } = await req.json()

    if (!deploymentId) {
      return NextResponse.json({ error: "Missing deploymentId" }, { status: 400 })
    }

    // Get current deployment
    const deployments = await sql`
      SELECT * FROM adaptive_deployments WHERE deployment_id = ${deploymentId}
    `

    if (deployments.length === 0) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 })
    }

    const deployment = deployments[0]

    // Get analytics data
    const analytics = await sql`
      SELECT 
        event_type,
        element_selector,
        element_text,
        COUNT(*) as interaction_count,
        AVG(scroll_depth) as avg_scroll,
        AVG(time_spent) as avg_time
      FROM site_analytics
      WHERE deployment_id = ${deploymentId}
      GROUP BY event_type, element_selector, element_text
      ORDER BY interaction_count DESC
    `

    // Calculate engagement metrics
    const totalVisitors = await sql`
      SELECT COUNT(DISTINCT session_id) as count 
      FROM site_analytics 
      WHERE deployment_id = ${deploymentId}
    `

    const visitorCount = totalVisitors[0]?.count || 0

    if (visitorCount === 0) {
      return NextResponse.json({
        message: "Not enough data yet to make adaptive changes",
        visitorCount: 0,
      })
    }

    // Identify low-engagement elements (clicked less than 10% of the time)
    const lowEngagementThreshold = visitorCount * 0.1
    const lowEngagementElements = analytics.filter(
      (a: any) => a.event_type === "click" && a.interaction_count < lowEngagementThreshold,
    )

    // AI-driven adaptive logic (simplified for MVP)
    const changes: any[] = []

    for (const element of lowEngagementElements) {
      if (element.element_selector && element.element_selector.includes("button")) {
        // Move low-engagement CTA buttons higher or change their copy
        const change = {
          configType: "layout",
          targetElement: element.element_selector,
          originalValue: "current position",
          newValue: "moved to above-the-fold",
          reasoning: `Button "${element.element_text}" has low engagement (${element.interaction_count} clicks out of ${visitorCount} visitors). Moving it higher for better visibility.`,
        }

        changes.push(change)

        // Insert adaptive config
        await sql`
          INSERT INTO adaptive_configs (
            deployment_id, config_type, target_element, original_value, new_value, reasoning
          ) VALUES (
            ${deploymentId},
            ${change.configType},
            ${change.targetElement},
            ${change.originalValue},
            ${change.newValue},
            ${change.reasoning}
          )
        `
      }
    }

    // Update engagement metrics
    const avgScrollDepth =
      analytics
        .filter((a: any) => a.avg_scroll !== null)
        .reduce((sum: number, a: any) => sum + Number.parseFloat(a.avg_scroll), 0) / analytics.length || 0

    const avgTimeSpent =
      analytics
        .filter((a: any) => a.avg_time !== null)
        .reduce((sum: number, a: any) => sum + Number.parseFloat(a.avg_time), 0) / analytics.length || 0

    await sql`
      UPDATE engagement_metrics
      SET 
        total_visitors = ${visitorCount},
        avg_scroll_depth = ${avgScrollDepth},
        avg_time_spent = ${avgTimeSpent},
        calculated_on = NOW()
      WHERE deployment_id = ${deploymentId} AND version_number = ${deployment.current_version}
    `

    return NextResponse.json({
      success: true,
      changesApplied: changes.length,
      changes,
      metrics: {
        totalVisitors: visitorCount,
        avgScrollDepth,
        avgTimeSpent,
      },
    })
  } catch (error: any) {
    console.error("[Adaptive Update] Error:", error)
    return NextResponse.json({ error: "Failed to apply adaptive updates", details: error.message }, { status: 500 })
  }
}
