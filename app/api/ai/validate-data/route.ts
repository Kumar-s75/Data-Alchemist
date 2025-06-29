import { z } from "zod"

const ValidationSchema = z.object({
  errors: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      severity: z.enum(["error", "warning", "info"]),
      message: z.string(),
      entity: z.string(),
      field: z.string().optional(),
      suggestion: z.string().optional(),
    })
  ),
  insights: z.array(
    z.object({
      type: z.enum(["pattern", "anomaly", "optimization", "risk"]),
      message: z.string(),
      confidence: z.number(),
      actionable: z.boolean(),
    })
  ),
  recommendations: z.array(
    z.object({
      type: z.enum(["rule_suggestion", "data_improvement", "workflow_optimization"]),
      title: z.string(),
      description: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      implementation: z.string(),
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
      parameters: { max_new_tokens: 800, temperature: 0.7 },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Hugging Face API Error:", errorText)
    throw new Error("Failed to fetch from Hugging Face API")
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
    const { clients, workers, tasks } = await request.json()

    
    const approxPromptSize =
      JSON.stringify(clients.slice(0, 5)).length +
      JSON.stringify(workers.slice(0, 5)).length +
      JSON.stringify(tasks.slice(0, 5)).length

    if (approxPromptSize > 3000) {
      return Response.json({ error: "Input dataset too large for Falcon to process. Please reduce dataset size." }, { status: 400 })
    }

    const prompt = `
      You are an expert resource allocation analyst. Perform comprehensive validation on this dataset:
      
      Clients (${clients.length} records): ${JSON.stringify(clients.slice(0, 5))}
      Workers (${workers.length} records): ${JSON.stringify(workers.slice(0, 5))}
      Tasks (${tasks.length} records): ${JSON.stringify(tasks.slice(0, 5))}
      
      Perform these specific validations:
      1. Missing required columns/fields
      2. Duplicate IDs across entities
      3. Malformed lists (non-numeric in AvailableSlots, etc.)
      4. Out-of-range values (PriorityLevel not 1-5, Duration < 1)
      5. Broken JSON in AttributesJSON
      6. Unknown references (RequestedTaskIDs not in tasks)
      7. Circular co-run dependencies
      8. Conflicting rules vs phase-window constraints
      9. Overloaded workers (AvailableSlots.length < MaxLoadPerPhase)
      10. Phase-slot saturation analysis
      11. Skill-coverage matrix validation
      12. Max-concurrency feasibility checks

      Also provide:
      - Advanced pattern detection
      - Resource optimization insights
      - Rule recommendations based on data patterns
      - Capacity planning suggestions
      - Skill gap analysis

      Return JSON in this strict format:
      {
        "errors": [
          {
            "id": "string",
            "type": "string",
            "severity": "error" | "warning" | "info",
            "message": "string",
            "entity": "string",
            "field": "string (optional)",
            "suggestion": "string (optional)"
          }
        ],
        "insights": [
          {
            "type": "pattern" | "anomaly" | "optimization" | "risk",
            "message": "string",
            "confidence": number,
            "actionable": boolean
          }
        ],
        "recommendations": [
          {
            "type": "rule_suggestion" | "data_improvement" | "workflow_optimization",
            "title": "string",
            "description": "string",
            "priority": "high" | "medium" | "low",
            "implementation": "string"
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

    const validation = ValidationSchema.safeParse(parsed)

    if (!validation.success) {
      console.error("Schema validation failed", validation.error)
      return Response.json({ error: "Response format invalid" }, { status: 500 })
    }

    return Response.json(validation.data)
  } catch (error) {
    console.error("AI validation error:", error)
    return Response.json({ error: "Failed to validate data with AI" }, { status: 500 })
  }
}
