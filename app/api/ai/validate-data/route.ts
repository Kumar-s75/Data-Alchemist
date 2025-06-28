import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
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
    }),
  ),
  insights: z.array(
    z.object({
      type: z.enum(["pattern", "anomaly", "optimization", "risk"]),
      message: z.string(),
      confidence: z.number(),
      actionable: z.boolean(),
    }),
  ),
  recommendations: z.array(
    z.object({
      type: z.enum(["rule_suggestion", "data_improvement", "workflow_optimization"]),
      title: z.string(),
      description: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      implementation: z.string(),
    }),
  ),
})

export async function POST(request: Request) {
  try {
    const { clients, workers, tasks } = await request.json()

    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: ValidationSchema,
      prompt: `
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
        
        Focus on actionable insights that improve allocation efficiency.
      `,
    })

    return Response.json(object)
  } catch (error) {
    console.error("AI validation error:", error)
    return Response.json({ error: "Failed to validate data with AI" }, { status: 500 })
  }
}
