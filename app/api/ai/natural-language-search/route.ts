import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
import { z } from "zod"

const SearchSchema = z.object({
  query_type: z.enum(["filter", "aggregate", "comparison", "relationship"]),
  target_entities: z.array(z.enum(["clients", "workers", "tasks"])),
  filters: z.array(
    z.object({
      entity: z.string(),
      field: z.string(),
      operator: z.enum(["equals", "greater_than", "less_than", "contains", "in", "not_in"]),
      value: z.any(),
    }),
  ),
  explanation: z.string(),
})

export async function POST(request: Request) {
  try {
    const { query, clients, workers, tasks } = await request.json()

    const { object } = await generateObject({
      model: groq("llama3-8b-8192"),
      schema: SearchSchema,
      prompt: `
        Convert this natural language query into structured search parameters: "${query}"
        
        Available data:
        - Clients: ${clients.length} records with fields: ClientID, ClientName, PriorityLevel (1-5), RequestedTaskIDs, GroupTag, AttributesJSON
        - Workers: ${workers.length} records with fields: WorkerID, WorkerName, Skills, AvailableSlots, MaxLoadPerPhase, WorkerGroup, QualificationLevel
        - Tasks: ${tasks.length} records with fields: TaskID, TaskName, Category, Duration, RequiredSkills, PreferredPhases, MaxConcurrent
        
        Sample data context:
        Clients: ${JSON.stringify(clients.slice(0, 2))}
        Workers: ${JSON.stringify(workers.slice(0, 2))}
        Tasks: ${JSON.stringify(tasks.slice(0, 2))}
        
        Parse the query and return structured filters that can be applied to find matching records.
      `,
    })

    return Response.json(object)
  } catch (error) {
    console.error("Natural language search error:", error)
    return Response.json({ error: "Failed to process search query" }, { status: 500 })
  }
}
