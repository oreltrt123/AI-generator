import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/config/db"
import { deploymentsTable } from "@/config/schema"
import { eq } from "drizzle-orm"

export async function GET(req: NextRequest, { params }: { params: { subdomain: string } }) {
  try {
    const { subdomain } = params

    // Fetch deployment from database
    const deployment = await db
      .select()
      .from(deploymentsTable)
      .where(eq(deploymentsTable.subdomain, subdomain))
      .limit(1)

    if (deployment.length === 0) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Site Not Found</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
              }
              h1 {
                font-size: 3rem;
                margin: 0 0 1rem 0;
              }
              p {
                font-size: 1.25rem;
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>404</h1>
              <p>This site hasn't been deployed yet.</p>
              <p>Create your site at <a href="https://pentrix.site" style="color: white; text-decoration: underline;">pentrix.site</a></p>
            </div>
          </body>
        </html>
        `,
        {
          status: 404,
          headers: {
            "Content-Type": "text/html",
          },
        },
      )
    }

    // Return the deployed HTML
    return new NextResponse(deployment[0].htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Error serving site:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
