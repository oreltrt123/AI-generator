import type { NextRequest } from "next/server"
import axios from "axios"
import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!model || !["gemini", "gpt-oss", "claude-code", "gpt-5-chat"].includes(model)) {
      return new Response(JSON.stringify({ error: "Invalid or missing model" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Extract user query from the last message
    const userQuery = messages[messages.length - 1].content
      .replace(/.Now, create an amazing Next.js project for: (.)/, "$1")
      .trim()

    // Fetch images from Unsplash based on user query
    let imageUrls: string[] = []
    try {
      const unsplashApiKey = process.env.UNSPLASH_API_KEY
      if (unsplashApiKey) {
        const unsplashResponse = await axios.get("https://api.unsplash.com/search/photos", {
          params: {
            query: userQuery || "generic",
            per_page: 5,
            client_id: unsplashApiKey,
          },
        })
        imageUrls = unsplashResponse.data.results.map((photo: any) => photo.urls.regular)
      }
    } catch (error: any) {
      console.error("Unsplash API error:", error?.response?.data ?? error.message)
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // === GEMINI HANDLER WITH STREAMING ===
          if (model === "gemini") {
            const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY
            if (!apiKey) {
              controller.enqueue(encoder.encode(JSON.stringify({ error: "Gemini API key not configured" })))
              controller.close()
              return
            }

            const geminiModel = "gemini-2.5-flash-lite-preview-06-17"
            const contents = messages.map((msg: any) => ({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content }],
            }))

            const resp = await axios.post(
              `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${apiKey}`,
              { contents },
              {
                headers: { "Content-Type": "application/json" },
                responseType: "stream",
              },
            )

            for await (const chunk of resp.data) {
              const text = chunk.toString()
              controller.enqueue(encoder.encode(text))
            }

            if (imageUrls.length > 0) {
              controller.enqueue(encoder.encode(`\n__IMAGE_URLS__:${JSON.stringify(imageUrls)}`))
            }
          }

          // === GPT-OSS HANDLER WITH STREAMING ===
          else if (model === "gpt-oss") {
            const apiKey = process.env.OPENROUTER_API_KEY
            if (!apiKey) {
              controller.enqueue(encoder.encode(JSON.stringify({ error: "OpenRouter API key not configured" })))
              controller.close()
              return
            }

            const response = await axios.post(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                model: "openai/gpt-oss-20b:free",
                messages,
                stream: true,
              },
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                responseType: "stream",
              },
            )

            for await (const chunk of response.data) {
              const text = chunk.toString()
              const lines = text.split("\n").filter((line: string) => line.trim().startsWith("data: "))
              for (const line of lines) {
                const data = line.replace("data: ", "")
                if (data === "[DONE]") continue
                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(content))
                  }
                } catch (e) {
                  console.warn("Invalid JSON chunk skipped:", data)
                }
              }
            }

            if (imageUrls.length > 0) {
              controller.enqueue(encoder.encode(`\n__IMAGE_URLS__:${JSON.stringify(imageUrls)}`))
            }
          }

          // === CLAUDE-CODE HANDLER WITH STREAMING ===
          else if (model === "claude-code") {
            const apiKey = process.env.ANTHROPIC_API_KEY
            if (!apiKey) {
              controller.enqueue(encoder.encode(JSON.stringify({ error: "Anthropic API key not configured" })))
              controller.close()
              return
            }

            const anthropic = new Anthropic({ apiKey })
            const anthropicMessages = messages.map((msg: any) => ({
              role: msg.role === "user" ? "user" : "assistant",
              content: msg.content,
            }))

            const stream = await anthropic.messages.stream({
              model: "claude-3-5-sonnet-20240620",
              max_tokens: 4096,
              messages: anthropicMessages,
              temperature: 0.7,
            })

            for await (const event of stream) {
              if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                controller.enqueue(encoder.encode(event.delta.text))
              }
            }

            if (imageUrls.length > 0) {
              controller.enqueue(encoder.encode(`\n__IMAGE_URLS__:${JSON.stringify(imageUrls)}`))
            }
          }

          // === GPT-5-CHAT HANDLER WITH STREAMING ===
          else if (model === "gpt-5-chat") {
            const apiKey = process.env.GPT5_API_KEY
            if (!apiKey) {
              controller.enqueue(encoder.encode(JSON.stringify({ error: "GPT-5 API key not configured" })))
              controller.close()
              return
            }

            const openai = new OpenAI({ apiKey })
            const input = messages
              .map((msg: any) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
              .join("\n")

            const stream = await openai.chat.completions.create({
              model: "gpt-5-nano",
              messages: messages.map((msg: any) => ({
                role: msg.role,
                content: msg.content,
              })),
              stream: true,
            })

            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content
              if (content) {
                controller.enqueue(encoder.encode(content))
              }
            }

            if (imageUrls.length > 0) {
              controller.enqueue(encoder.encode(`\n__IMAGE_URLS__:${JSON.stringify(imageUrls)}`))
            }
          }

          controller.close()
        } catch (error: any) {
          console.error("Streaming error:", error.message)
          controller.enqueue(
            encoder.encode(JSON.stringify({ error: "Failed to process request: " + error.message }))
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error: any) {
    console.error("Request error:", error.message)
    return new Response(JSON.stringify({ error: "Invalid request: " + error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
}

















// import type { NextRequest } from "next/server"
// import axios from "axios"
// import OpenAI from "openai"
// import Anthropic from "@anthropic-ai/sdk"
// import { detectBuildIntent, prepareConversationalPrompt } from "@/lib/prompts"

// interface WebsiteData {
//   title: string
//   description: string
//   components: { type: string; content: string }[]
//   imageUrls?: string[]
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { messages, model, discussMode, language, multiVariant } = await req.json()

//     if (!messages || !Array.isArray(messages) || messages.length === 0) {
//       return new Response(JSON.stringify({ error: "No messages provided" }), {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       })
//     }

//     if (!model || !["gemini", "gpt-oss", "claude-code", "gpt-5-chat"].includes(model)) {
//       return new Response(JSON.stringify({ error: "Invalid or missing model" }), {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       })
//     }

//     // Extract user query from the last message
//     const lastMessage = messages[messages.length - 1]
//     const userQuery = lastMessage.content.trim()
//     const isBuildRequest = discussMode === false ? detectBuildIntent(userQuery) : false
//     const isDiscussMode = discussMode === true || !isBuildRequest

//     console.log("[v0] User query:", userQuery)
//     console.log("[v0] Build intent detected:", isBuildRequest)
//     console.log("[v0] Discuss mode:", isDiscussMode)

//     const encoder = new TextEncoder()
//     const stream = new ReadableStream({
//       async start(controller) {
//         try {
//           if (isDiscussMode) {
//             const conversationalPrompt = prepareConversationalPrompt(userQuery)
//             const conversationalMessages = [{ role: "system", content: conversationalPrompt }, ...messages]

//             if (model === "gemini") {
//               const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY
//               if (!apiKey) {
//                 controller.enqueue(encoder.encode("Sorry, the Gemini API key is not configured."))
//                 controller.close()
//                 return
//               }

//               const geminiModel = "gemini-2.0-flash-exp"
//               const contents = conversationalMessages
//                 .filter((msg) => msg.role !== "system")
//                 .map((msg: any) => ({
//                   role: msg.role === "assistant" ? "model" : "user",
//                   parts: [{ text: msg.content }],
//                 }))

//               contents.unshift({
//                 role: "user",
//                 parts: [{ text: conversationalPrompt }],
//               })

//               const resp = await axios.post(
//                 `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${apiKey}`,
//                 { contents },
//                 {
//                   headers: { "Content-Type": "application/json" },
//                   responseType: "stream",
//                 },
//               )

//               let buffer = ""
//               for await (const chunk of resp.data) {
//                 const text = chunk.toString()
//                 buffer += text
//                 let startIndex = 0
//                 while (true) {
//                   const objectStart = buffer.indexOf("{", startIndex)
//                   if (objectStart === -1) break
//                   let braceCount = 0
//                   let objectEnd = -1
//                   for (let i = objectStart; i < buffer.length; i++) {
//                     if (buffer[i] === "{") braceCount++
//                     if (buffer[i] === "}") braceCount--
//                     if (braceCount === 0) {
//                       objectEnd = i + 1
//                       break
//                     }
//                   }
//                   if (objectEnd !== -1) {
//                     const jsonStr = buffer.substring(objectStart, objectEnd)
//                     try {
//                       const parsed = JSON.parse(jsonStr)
//                       const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text
//                       if (content) {
//                         controller.enqueue(encoder.encode(content))
//                       }
//                     } catch (e) {
//                       // Skip invalid JSON
//                     }
//                     startIndex = objectEnd
//                   } else {
//                     buffer = buffer.substring(startIndex)
//                     break
//                   }
//                 }
//                 if (startIndex > 0) {
//                   buffer = buffer.substring(startIndex)
//                 }
//               }
//             } else if (model === "gpt-oss") {
//               const apiKey = process.env.OPENROUTER_API_KEY
//               if (!apiKey) {
//                 controller.enqueue(encoder.encode(JSON.stringify({ error: "OpenRouter API key not configured" })))
//                 controller.close()
//                 return
//               }

//               const response = await axios.post(
//                 "https://openrouter.ai/api/v1/chat/completions",
//                 {
//                   model: "openai/gpt-4o-mini",
//                   messages: conversationalMessages,
//                   stream: true,
//                 },
//                 {
//                   headers: {
//                     Authorization: `Bearer ${apiKey}`,
//                     "Content-Type": "application/json",
//                   },
//                   responseType: "stream",
//                 },
//               )

//               for await (const chunk of response.data) {
//                 const text = chunk.toString()
//                 const lines = text.split("\n").filter((line: string) => line.trim().startsWith("data: "))
//                 for (const line of lines) {
//                   const data = line.replace("data: ", "")
//                   if (data === "[DONE]") continue
//                   try {
//                     const parsed = JSON.parse(data)
//                     const content = parsed.choices?.[0]?.delta?.content
//                     if (content) {
//                       controller.enqueue(encoder.encode(content))
//                     }
//                   } catch (e) {
//                     console.warn("Invalid JSON chunk skipped")
//                   }
//                 }
//               }
//             } else if (model === "claude-code") {
//               const apiKey = process.env.ANTHROPIC_API_KEY
//               if (!apiKey) {
//                 controller.enqueue(encoder.encode(JSON.stringify({ error: "Anthropic API key not configured" })))
//                 controller.close()
//                 return
//               }

//               const anthropic = new Anthropic({ apiKey })
//               const anthropicMessages = conversationalMessages
//                 .filter((msg) => msg.role !== "system")
//                 .map((msg: any) => ({
//                   role: msg.role === "user" ? "user" : "assistant",
//                   content: msg.content,
//                 }))

//               const stream = await anthropic.messages.stream({
//                 model: "claude-3-5-sonnet-20241022",
//                 max_tokens: 4096,
//                 system: conversationalPrompt,
//                 messages: anthropicMessages,
//                 temperature: 0.7,
//               })

//               for await (const event of stream) {
//                 if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
//                   controller.enqueue(encoder.encode(event.delta.text))
//                 }
//               }
//             } else if (model === "gpt-5-chat") {
//               const apiKey = process.env.GPT5_API_KEY
//               if (!apiKey) {
//                 controller.enqueue(encoder.encode(JSON.stringify({ error: "GPT-5 API key not configured" })))
//                 controller.close()
//                 return
//               }

//               const openai = new OpenAI({ apiKey })
//               const stream = await openai.chat.completions.create({
//                 model: "gpt-4o-mini",
//                 messages: conversationalMessages,
//                 stream: true,
//               })

//               for await (const chunk of stream) {
//                 const content = chunk.choices[0]?.delta?.content
//                 if (content) {
//                   controller.enqueue(encoder.encode(content))
//                 }
//               }
//             }
//           } else {
//             // Build Mode: Generate website data
//             const userQueryClean = userQuery.replace(/.*Now, create an amazing Next.js project for: (.*)/, "$1").trim()
//             let imageUrls: string[] = []
//             try {
//               const unsplashApiKey = process.env.UNSPLASH_API_KEY
//               if (unsplashApiKey) {
//                 const unsplashResponse = await axios.get("https://api.unsplash.com/search/photos", {
//                   params: {
//                     query: userQueryClean || "generic",
//                     per_page: 5,
//                     client_id: unsplashApiKey,
//                   },
//                 })
//                 imageUrls = unsplashResponse.data.results.map((photo: any) => photo.urls.regular)
//               }
//             } catch (error: any) {
//               console.error("[v0] Unsplash API error:", error?.response?.data ?? error.message)
//             }

//             // Generate structured website data
//             const websiteData: WebsiteData = {
//               title: `Generated ${language.charAt(0).toUpperCase() + language.slice(1)} Website`,
//               description: `A website generated for: ${userQueryClean}`,
//               components: [
//                 { type: "header", content: `<header><h1>${userQueryClean}</h1></header>` },
//                 { type: "section", content: `<section><p>This is a sample section for ${userQueryClean}</p></section>` },
//                 { type: "footer", content: `<footer><p>© 2025 ${userQueryClean}</p></footer>` },
//               ],
//               imageUrls,
//             }

//             // If multiVariant, generate multiple variants
//             if (multiVariant) {
//               const variants = [1, 2, 3, 4].map((i) => ({
//                 ...websiteData,
//                 title: `${websiteData.title} (Variant ${i})`,
//                 components: websiteData.components.map((comp) => ({
//                   ...comp,
//                   content: comp.content.replace("sample", `sample variant ${i}`),
//                 })),
//               }))

//               for (const variant of variants) {
//                 controller.enqueue(encoder.encode(`__WEBSITE_DATA__:${JSON.stringify(variant)}\n`))
//               }
//             } else {
//               controller.enqueue(encoder.encode(`__WEBSITE_DATA__:${JSON.stringify(websiteData)}\n`))
//             }
//           }

//           controller.close()
//         } catch (error: any) {
//           console.error("[v0] Streaming error:", error.message)
//           controller.enqueue(encoder.encode(`Sorry, I encountered an error: ${error.message}`))
//           controller.close()
//         }
//       },
//     })

//     return new Response(stream, {
//       headers: {
//         "Content-Type": "text/event-stream",
//         "Cache-Control": "no-cache",
//         Connection: "keep-alive",
//       },
//     })
//   } catch (error: any) {
//     console.error("[v0] Request error:", error.message)
//     return new Response(JSON.stringify({ error: "Invalid request: " + error.message }), {
//       status: 400,
//       headers: { "Content-Type": "application/json" },
//     })
//   }
// }