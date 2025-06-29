import { z } from "zod"

const CorrectionSchema = z.object({
  corrections: z.array(
    z.object({
      entity_id: z.string(),
      field: z.string(),
      current_value: z.any(),
      suggested_value: z.any(),
      reasoning: z.string(),
      confidence: z.number(),
      auto_applicable: z.boolean(),
    })
  ),
  bulk_operations: z.array(
    z.object({
      operation: z.enum(["normalize", "standardize", "fill_missing", "remove_duplicates"]),
      description: z.string(),
      affected_count: z.number(),
      preview: z.string(),
    })
  ),
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
      parameters: { max_new_tokens: 1500, temperature: 0.7 }, // Falcon needs temperature for better reasoning
    }),
  })

  // ✅ Added status code check
  if (!response.ok) {
    const errorText = await response.text()
    console.error("Hugging Face API Error:", errorText)
    throw new Error("Failed to fetch from Hugging Face API")
  }

  const result = await response.json()

  // ✅ Support both response formats
  const generatedText = result?.generated_text || result?.[0]?.generated_text

  if (!generatedText) throw new Error("No response from Hugging Face")

  return generatedText
}

export async function POST(request: Request) {
  try {
    const { validationErrors, clients, workers, tasks } = await request.json()

    const prompt = `
      Analyze these validation errors and suggest specific corrections:

      Errors: ${JSON.stringify(validationErrors)}

      Data context:
      Clients: ${JSON.stringify(clients.slice(0, 3))}
      Workers: ${JSON.stringify(workers.slice(0, 3))}
      Tasks: ${JSON.stringify(tasks.slice(0, 3))}

      For each error, suggest:
      1. Specific field corrections with new values
      2. Reasoning for the correction
      3. Confidence level (0-1)
      4. Whether it can be auto-applied safely

      Also suggest bulk operations for common issues like:
      - Normalizing skill names
      - Standardizing group tags
      - Filling missing data with intelligent defaults
      - Removing duplicate entries

      Format your response strictly as this JSON:
      {
        "corrections": [
          {
            "entity_id": "string",
            "field": "string",
            "current_value": any,
            "suggested_value": any,
            "reasoning": "string",
            "confidence": number,
            "auto_applicable": boolean
          }
        ],
        "bulk_operations": [
          {
            "operation": "normalize" | "standardize" | "fill_missing" | "remove_duplicates",
            "description": "string",
            "affected_count": number,
            "preview": "string"
          }
        ]
      }
    `

    const responseText = await callHuggingFace(prompt)

    let parsed
    try {
      parsed = JSON.parse(responseText)
    } catch (error) {
      console.error("JSON parsing error", error)
      return Response.json({ error: "Invalid JSON response from Hugging Face" }, { status: 500 })
    }

    const validation = CorrectionSchema.safeParse(parsed)

    if (!validation.success) {
      console.error("Schema validation failed", validation.error)
      return Response.json({ error: "Response format invalid" }, { status: 500 })
    }

    return Response.json(validation.data)
  } catch (error) {
    console.error("Correction suggestion error:", error)
    return Response.json({ error: "Failed to generate corrections" }, { status: 500 })
  }
}
