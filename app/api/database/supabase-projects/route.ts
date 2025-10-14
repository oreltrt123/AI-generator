import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: "Missing Supabase token" }, { status: 400 })
    }

    // Fetch projects from Supabase API
    const response = await axios.get("https://api.supabase.com/v1/projects", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const projects = response.data.map((project: any) => ({
      id: project.id,
      name: project.name,
      region: project.region,
    }))

    return NextResponse.json({ projects }, { status: 200 })
  } catch (error: any) {
    console.error("Error fetching Supabase projects:", error.response?.data || error.message)
    return NextResponse.json(
      { error: error.response?.data?.message || "Failed to fetch Supabase projects" },
      { status: 500 },
    )
  }
}
