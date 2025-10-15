import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"
import { db } from "@/config/db"
import { projectTable, frameTable, variantsTable } from "@/config/schema"

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, projectId, frameId, userId } = await req.json()

    if (!repoUrl || !projectId || !frameId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Extract owner and repo from GitHub URL
    const urlMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)\/?$/)
    if (!urlMatch) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 })
    }

    const [, owner, repo] = urlMatch
    const repoName = repo.replace(/\.git$/, "")

    // Fetch repository contents from GitHub API
    const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/git/trees/main?recursive=1`

    let response
    try {
      response = await axios.get(apiUrl, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          // Add GitHub token if available for higher rate limits
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
      })
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Try 'master' branch if 'main' doesn't exist
        const masterUrl = `https://api.github.com/repos/${owner}/${repoName}/git/trees/master?recursive=1`
        response = await axios.get(masterUrl, {
          headers: {
            Accept: "application/vnd.github.v3+json",
            ...(process.env.GITHUB_TOKEN && {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            }),
          },
        })
      } else {
        throw error
      }
    }

    const tree = response.data.tree

    // Filter for files only (not directories) and exclude certain files
    const files = tree.filter(
      (item: any) =>
        item.type === "blob" &&
        !item.path.includes("node_modules") &&
        !item.path.includes(".git/") &&
        !item.path.startsWith("."),
    )

    // Fetch content for each file
    const projectFiles = await Promise.all(
      files.slice(0, 100).map(async (file: any) => {
        // Limit to 100 files
        try {
          const contentResponse = await axios.get(
            `https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}`,
            {
              headers: {
                Accept: "application/vnd.github.v3.raw",
                ...(process.env.GITHUB_TOKEN && {
                  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                }),
              },
            },
          )

          return {
            path: file.path,
            content:
              typeof contentResponse.data === "string"
                ? contentResponse.data
                : JSON.stringify(contentResponse.data, null, 2),
          }
        } catch (error) {
          console.error(`Failed to fetch ${file.path}:`, error)
          return null
        }
      }),
    )

    const validFiles = projectFiles.filter((f) => f !== null)

    // Create project in database
    await db.insert(projectTable).values({
      projectId,
      createdBy: userId,
    })

    // Create frame
    await db.insert(frameTable).values({
      frameId: frameId.toString(),
      projectId,
      designCode: JSON.stringify(validFiles),
    })

    // Create single variant with imported files
    await db.insert(variantsTable).values({
      frameId: frameId.toString(),
      variantNumber: 1,
      projectFiles: validFiles,
      prdData: {
        features: [`Imported from ${repoUrl}`],
        reasoning: `Repository imported from GitHub: ${owner}/${repoName}`,
        techStack: ["GitHub Import"],
        architecture: `Files imported from ${repoUrl}`,
        userFlow: ["Repository cloned", "Files loaded into editor"],
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      projectId,
      frameId,
      filesImported: validFiles.length,
    })
  } catch (error: any) {
    console.error("GitHub import error:", error)
    return NextResponse.json({ error: error.message || "Failed to import repository" }, { status: 500 })
  }
}
