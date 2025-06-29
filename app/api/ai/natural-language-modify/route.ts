import { z } from "zod"

const ModificationSchema = z.object({
  modifications: z.array(
    z.object({
      entity_type: z.enum(["clients", "workers", "tasks"]),
      entity_id: z.string(),
      field: z.string(),
      current_value: z.any(),
      new_value: z.any(),
      reasoning: z.string(),
      confidence: z.number(),
      safe_to_apply: z.boolean(),
    })
  ),
  summary: z.string(),
  affected_count: z.number(),
})

async function callHuggingFace(prompt: string) {
  const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 1500, temperature: 0.0 },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Hugging Face API Error:", errorText)
    throw new Error("Failed to fetch from Hugging Face API")
  }

  const result = await response.json()

  const generatedText = result?.generated_text || result?.[0]?.generated_text

  if (!generatedText) throw new Error("No response from Hugging Face")

  return generatedText
}

export async function POST(request: Request) {
  try {
    const { query, clients, workers, tasks } = await request.json()

    const prompt = `
      You are an expert data analyst. The user wants to modify data using this natural language request: "${query}"

      Current data:
      Clients: ${JSON.stringify(clients.slice(0, 3))}
      Workers: ${JSON.stringify(workers.slice(0, 3))}
      Tasks: ${JSON.stringify(tasks.slice(0, 3))}

      Parse the request and return a JSON object strictly matching this schema:
      {
        "modifications": [
          {
            "entity_type": "clients" | "workers" | "tasks",
            "entity_id": "string",
            "field": "string",
            "current_value": "any",
            "new_value": "any",
            "reasoning": "string",
            "confidence": "number (0-1)",
            "safe_to_apply": "boolean"
          }
        ],
        "summary": "string",
        "affected_count": "number"
      }

      Notes:
      - Only suggest modifications if you are highly confident.
      - Confidence must be > 0.8 to be marked safe.
      - Be extremely precise.
    `

    const responseText = await callHuggingFace(prompt)

    let parsed
    try {
      parsed = JSON.parse(responseText)
    } catch (error) {
      console.error("JSON parsing error", error)
      return Response.json({ error: "Invalid JSON response from Hugging Face" }, { status: 500 })
    }

    const validation = ModificationSchema.safeParse(parsed)

    if (!validation.success) {
      console.error("Schema validation failed", validation.error)
      return Response.json({ error: "Response format invalid" }, { status: 500 })
    }

    return Response.json(validation.data)
  } catch (error) {
    console.error("Natural language modification error:", error)
    return Response.json({ error: "Failed to process modification request" }, { status: 500 })
  }
}
