import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GPT5_API_KEY!,
});

export const runtime = "edge"; // enable streaming for faster responses

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || prompt.trim() === "") {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    // Instruction for improvement
    const systemPrompt = `
You are a professional AI prompt engineer.
Improve the given text prompt so it becomes clearer, more creative, and more detailed.
Make it more suitable for a web app prompt builder or AI assistant.
Do NOT change the core meaning—just make it higher quality.
Return only the improved prompt, no explanations.
`;

    const stream = await client.chat.completions.create({
      model: "gpt-5-chat",
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    });

    // Convert streaming data into a readable stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error improving prompt:", error);
    return NextResponse.json({ error: "Failed to improve prompt" }, { status: 500 });
  }
}
