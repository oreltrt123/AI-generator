import { NextApiRequest, NextApiResponse } from "next"
import { Octokit } from "@octokit/rest"
import { auth } from "@clerk/nextjs/server"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { userId } = auth()
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { projectId, projectName, projectFiles } = req.body

  if (!projectId || !projectName || !projectFiles || !Array.isArray(projectFiles)) {
    return res.status(400).json({ error: "Invalid request body" })
  }

  // Use environment variable for GITHUB_TOKEN
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: "GitHub token not configured" })
  }

  const octokit = new Octokit({ auth: GITHUB_TOKEN })

  try {
    // Get authenticated user's GitHub username
    const { data: user } = await octokit.users.getAuthenticated()

    // Create a new repository
    const repoName = projectName.replace(/\s+/g, "-").toLowerCase()
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: `${repoName}-${projectId}`,
      description: `Project ${projectName} created from playground`,
      private: false, // Set to true for private repos
      auto_init: true, // Initialize with a README
    })

    // Upload each file to the repository
    for (const file of projectFiles) {
      await octokit.repos.createOrUpdateFileContents({
        owner: user.login,
        repo: repo.name,
        path: file.path,
        message: `Add ${file.path} from playground`,
        content: Buffer.from(file.content).toString("base64"),
        committer: {
          name: user.name || user.login,
          email: user.email || `${user.login}@users.noreply.github.com`,
        },
        author: {
          name: user.name || user.login,
          email: user.email || `${user.login}@users.noreply.github.com`,
        },
      })
    }

    return res.status(200).json({ repoUrl: repo.html_url })
  } catch (error: any) {
    console.error("GitHub API error:", error)
    return res.status(500).json({ error: error.message || "Failed to upload to GitHub" })
  }
}