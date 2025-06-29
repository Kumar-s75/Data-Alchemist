import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
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
    }),
  ),
  bulk_operations: z.array(
    z.object({
      operation: z.enum(["normalize", "standardize", "fill_missing", "remove_duplicates"]),
      description: z.string(),
      affected_count: z.number(),
      preview: z.string(),
    }),
  ),
})

export async function POST(request: Request) {
  try {
    const { validationErrors, clients, workers, tasks } = await request.json()

    const { object } = await generateObject({
      model: groq("llama3-8b-8192"),
      schema: CorrectionSchema,
      prompt: `
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
      `,
    })

    return Response.json(object)
  } catch (error) {
    console.error("Correction suggestion error:", error)
    return Response.json({ error: "Failed to generate corrections" }, { status: 500 })
  }
}
