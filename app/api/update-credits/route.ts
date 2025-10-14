import { NextResponse } from "next/server"
import { db } from "@/config/db"
import { usersTable } from "@/config/schema"
import { currentUser } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  console.log("Received POST to /api/update-credits")
  try {
    const { userId, creditsToDeduct } = await req.json()
    console.log("Request body:", { userId, creditsToDeduct })

    if (!userId || typeof creditsToDeduct !== "number") {
      console.log("Invalid request parameters")
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 })
    }

    const clerkUser = await currentUser()
    if (!clerkUser || clerkUser.id !== userId) {
      console.log("Unauthorized: Clerk user mismatch")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = clerkUser.primaryEmailAddress?.emailAddress
    if (!email) {
      console.log("User email not found")
      return NextResponse.json({ error: "User email not found" }, { status: 400 })
    }

    const user = await db
      .select({ credits: usersTable.credits })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1)

    if (!user.length) {
      console.log("User not found in usersTable for email:", email)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const currentCredits = user[0].credits ?? 0
    console.log("Current credits:", currentCredits)
    if (currentCredits < creditsToDeduct) {
      console.log("Insufficient credits")
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 })
    }

    const updatedUser = await db
      .update(usersTable)
      .set({ credits: currentCredits - creditsToDeduct })
      .where(eq(usersTable.email, email))
      .returning({ credits: usersTable.credits })

    console.log("Updated credits:", updatedUser[0].credits)
    return NextResponse.json({ credits: updatedUser[0].credits })
  } catch (error: any) {
    console.error("Error updating credits:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}