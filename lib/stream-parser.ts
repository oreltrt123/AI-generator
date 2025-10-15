export type StreamEvent = {
  type: "thinking" | "reasoning" | "file" | "complete" | "error"
  data: any
}

export async function parseStreamResponse(response: Response, onEvent: (event: StreamEvent) => void): Promise<void> {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error("No response body")
  }

  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6)
        if (data === "[DONE]") {
          return
        }

        try {
          const event = JSON.parse(data) as StreamEvent
          onEvent(event)
        } catch (err) {
          console.error("Failed to parse stream event:", err)
        }
      }
    }
  }
}
