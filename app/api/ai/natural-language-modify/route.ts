import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
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
    }),
  ),
  summary: z.string(),
  affected_count: z.number(),
})

export async function POST(request: Request) {
  try {
    const { query, clients, workers, tasks } = await request.json()

    const { object } = await generateObject({
      model: groq("llama3-8b-8192"),
      schema: ModificationSchema,
      prompt: `
        You are an expert data analyst. The user wants to modify data using this natural language request: "${query}"
        
        Current data:
        Clients: ${JSON.stringify(clients.slice(0, 3))}
        Workers: ${JSON.stringify(workers.slice(0, 3))}
        Tasks: ${JSON.stringify(tasks.slice(0, 3))}
        
        Parse the request and suggest specific data modifications. Examples:
        - "Set all frontend workers to qualification level 4"
        - "Increase priority of enterprise clients by 1"
        - "Add React skill to all JavaScript workers"
        - "Set duration of all development tasks to 2 phases"
        
        For each modification:
        1. Identify the exact entities and fields to change
        2. Specify the new values
        3. Provide reasoning for the change
        4. Assess safety (confidence > 0.8 and no data loss)
        5. Calculate confidence level
        
        Be conservative - only suggest modifications you're highly confident about.
      `,
    })

    return Response.json(object)
  } catch (error) {
    console.error("Natural language modification error:", error)
    return Response.json({ error: "Failed to process modification request" }, { status: 500 })
  }
}
