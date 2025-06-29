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
  const response = await fetch("https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 800, temperature: 0.7 },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Hugging Face API error:", response.status, errorText)
    throw new Error(`Hugging Face API error: ${response.status}`)
  }

  const result = await response.json()

  let generatedText = null
  if (Array.isArray(result) && result[0]?.generated_text) {
    generatedText = result[0].generated_text
  } else if (typeof result?.generated_text === "string") {
    generatedText = result.generated_text
  }

  if (!generatedText) {
    console.error("Unexpected response format:", result)
    throw new Error("Unexpected response format from Hugging Face API")
  }

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

      Return JSON in this strict format:
      {
        "modifications": [
          {
            "entity_type": "clients" | "workers" | "tasks",
            "entity_id": "string",
            "field": "string",
            "current_value": any,
            "new_value": any,
            "reasoning": "string",
            "confidence": number,
            "safe_to_apply": boolean
          }
        ],
        "summary": "string",
        "affected_count": number
      }

      Notes:
      - Only suggest modifications if confidence > 0.8 to be safe.
      - Be extremely precise and return only valid JSON.
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
    console.error("Modification processing error:", error)
    return Response.json({ error: "Failed to process modification request" }, { status: 500 })
  }
}
