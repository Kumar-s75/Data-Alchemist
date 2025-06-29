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
    })
  ),
  explanation: z.string(),
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
      parameters: { max_new_tokens: 1000, temperature: 0.0 },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error("Hugging Face API Error:", text)
    throw new Error("Failed to fetch from Hugging Face API")
  }

  const result = await response.json()

  // Handle both response formats
  const generatedText = result?.generated_text || result?.[0]?.generated_text

  if (!generatedText) throw new Error("No response from Hugging Face")

  return generatedText
}

export async function POST(request: Request) {
  try {
    const { query, clients, workers, tasks } = await request.json()

    const prompt = `
      Convert this natural language query into structured search parameters in strict JSON format.

      Query: "${query}"

      Available data:
      - Clients: ${clients.length} records with fields: ClientID, ClientName, PriorityLevel (1-5), RequestedTaskIDs, GroupTag, AttributesJSON
      - Workers: ${workers.length} records with fields: WorkerID, WorkerName, Skills, AvailableSlots, MaxLoadPerPhase, WorkerGroup, QualificationLevel
      - Tasks: ${tasks.length} records with fields: TaskID, TaskName, Category, Duration, RequiredSkills, PreferredPhases, MaxConcurrent

      Sample data:
      Clients: ${JSON.stringify(clients.slice(0, 2))}
      Workers: ${JSON.stringify(workers.slice(0, 2))}
      Tasks: ${JSON.stringify(tasks.slice(0, 2))}

      Return a JSON response strictly matching this schema:
      {
        "query_type": "filter" | "aggregate" | "comparison" | "relationship",
        "target_entities": ["clients", "workers", "tasks"],
        "filters": [
          {
            "entity": "clients" | "workers" | "tasks",
            "field": "string",
            "operator": "equals" | "greater_than" | "less_than" | "contains" | "in" | "not_in",
            "value": "any"
          }
        ],
        "explanation": "string"
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

    const validation = SearchSchema.safeParse(parsed)

    if (!validation.success) {
      console.error("Schema validation failed", validation.error)
      return Response.json({ error: "Response format invalid" }, { status: 500 })
    }

    return Response.json(validation.data)
  } catch (error) {
    console.error("Natural language search error:", error)
    return Response.json({ error: "Failed to process search query" }, { status: 500 })
  }
}
