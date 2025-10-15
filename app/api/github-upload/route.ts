import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/core'

export async function POST(request: NextRequest) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId, projectFiles } = await request.json()

  try {
    // Get GitHub token from Clerk's external accounts
    const response = await fetch(`${process.env.CLERK_API_URL}/users/${userId}/oauth_access_tokens/oauth_github`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch GitHub token from Clerk')
    }
    const { token } = await response.json()

    const octokit = new Octokit({ auth: token })
    const username = (await octokit.request('GET /user')).data.login
    const repoName = `ai-project-${projectId}`

    // Create repo if it doesn't exist
    let repo;
    try {
      repo = await octokit.request('GET /repos/{owner}/{repo}', {
        owner: username,
        repo: repoName,
      })
    } catch {
      repo = await octokit.request('POST /user/repos', {
        name: repoName,
        description: 'AI-generated project',
        private: false,
      })
    }

    // Get default branch and latest commit SHA
    const { data: { default_branch } } = await octokit.request('GET /repos/{owner}/{repo}', {
      owner: username,
      repo: repoName,
    })
    let latestCommitSha;
    try {
      const { data: refData } = await octokit.request('GET /repos/{owner}/{repo}/git/ref/heads/{branch}', {
        owner: username,
        repo: repoName,
        branch: default_branch,
      })
      latestCommitSha = refData.object.sha
    } catch {
      const { data: commitData } = await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
        owner: username,
        repo: repoName,
        message: 'Initial commit',
        tree: (await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
          owner: username,
          repo: repoName,
          tree: [],
        })).data.sha,
      })
      latestCommitSha = commitData.sha
      await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}', {
        owner: username,
        repo: repoName,
        branch: default_branch,
        sha: latestCommitSha,
      })
    }

    // Upload files
    for (const file of projectFiles) {
      await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner: username,
        repo: repoName,
        path: file.path,
        message: `Add ${file.path}`,
        content: Buffer.from(file.content).toString('base64'),
        branch: default_branch,
      })
    }

    return NextResponse.json({ repoUrl: repo.data.html_url })
  } catch (error) {
    console.error('GitHub upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}