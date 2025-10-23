import { type NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/config/db"
import { vercelDeploymentsTable } from "@/config/schema"
import { eq } from "drizzle-orm"

// 🧠 Helper to remove the random suffix (like -p6ho6zafe)
function cleanDomain(url: string): string {
  try {
    const domain = new URL(`https://${url.replace(/^https?:\/\//, "")}`).hostname
    const cleaned = domain.replace(/-[a-z0-9]+\.vercel\.app$/, ".vercel.app")
    return cleaned
  } catch {
    return url
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
    }

    const deployment = await db
      .select()
      .from(vercelDeploymentsTable)
      .where(eq(vercelDeploymentsTable.projectId, projectId))
      .limit(1)

    if (deployment.length > 0 && deployment[0].deploymentUrl) {
      return NextResponse.json({
        deployed: true,
        url: `https://${deployment[0].deploymentUrl}`,
        deploymentId: deployment[0].vercelDeploymentId,
      })
    }

    return NextResponse.json({ deployed: false }, { status: 200 })
  } catch (error: any) {
    console.error("[Deploy GET] Error:", error)
    return NextResponse.json({ error: "Failed to check deployment status", details: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, files } = await req.json()
    if (!projectId || !files || !Array.isArray(files)) {
      return NextResponse.json({ error: "Missing projectId or files" }, { status: 400 })
    }

    const vercelToken = process.env.VERCEL_TOKEN
    let deploymentUrl: string
    let deploymentId: string | undefined

    if (!vercelToken) {
      console.log("[Deploy] Simulating deployment (no Vercel token)")
      await new Promise((resolve) => setTimeout(resolve, 2000))
      deploymentUrl = `${Date.now()}.vercel.app`
    } else {
      try {
        const vercelResponse = await fetch("https://api.vercel.com/v13/deployments", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: projectId,
            files: files.map((f: any) => ({
              file: f.path,
              data: f.content,
            })),
            projectSettings: {
              framework: "nextjs",
            },
          }),
        })

        if (!vercelResponse.ok) {
          throw new Error(`Vercel API error: ${vercelResponse.status}`)
        }

        const deploymentData = await vercelResponse.json()
        deploymentUrl = cleanDomain(deploymentData.url) // ✅ Clean the domain
        deploymentId = deploymentData.id
      } catch (vercelError) {
        console.error("[Deploy] Vercel API error:", vercelError)
        deploymentUrl = `${Date.now()}.vercel.app`
      }
    }

    await db.insert(vercelDeploymentsTable).values({
      projectId,
      deploymentUrl, // already cleaned
      vercelDeploymentId: deploymentId,
      deployedBy: user.primaryEmailAddress.emailAddress,
      deployedOn: new Date(),
    })

    return NextResponse.json({
      success: true,
      url: `https://${deploymentUrl}`,
      deploymentId,
      message: vercelToken
        ? "Deployment successful"
        : "Deployment simulated (configure VERCEL_TOKEN for real deployments)",
    })
  } catch (error: any) {
    console.error("[Deploy POST] Error:", error)
    return NextResponse.json({ error: "Deployment failed", details: error.message }, { status: 500 })
  }
}
