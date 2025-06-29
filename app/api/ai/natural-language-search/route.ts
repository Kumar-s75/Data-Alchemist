import { z } from "zod"

const SearchSchema = z.object({
  query_type: z.enum(["filter", "aggregate", "comparison", "relationship"]),
  target_entities: z.array(z.enum(["clients", "workers", "tasks"])),
  filters: z.array(
    z.object({
      entity: z.enum(["clients", "workers", "tasks"]),
      field: z.string(),
      operator: z.enum(["equals", "greater_than", "less_than", "contains", "in", "not_in"]),
      value: z.any(),
    })
  ),
  explanation: z.string(),
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
    const text = await response.text()
    console.error("Hugging Face API Error:", text)
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
    throw new Error("No response from Hugging Face")
  }

  return generatedText.trim()
}

export async function POST(request: Request) {
  try {
    const { query, clients, workers, tasks } = await request.json()

    const approxPromptSize =
      query.length +
      JSON.stringify(clients.slice(0, 2)).length +
      JSON.stringify(workers.slice(0, 2)).length +
      JSON.stringify(tasks.slice(0, 2)).length

    if (approxPromptSize > 3000) {
      return Response.json({ error: "Input dataset too large for Falcon to process. Please reduce dataset size." }, { status: 400 })
    }

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

      Respond ONLY in this strict JSON format:
      {
        "query_type": "filter" | "aggregate" | "comparison" | "relationship",
        "target_entities": ["clients", "workers", "tasks"],
        "filters": [
          {
            "entity": "clients" | "workers" | "tasks",
            "field": "string",
            "operator": "equals" | "greater_than" | "less_than" | "contains" | "in" | "not_in",
            "value": any
          }
        ],
        "explanation": "string"
      }
    `

    const responseText = await callHuggingFace(prompt)

    let parsed
    try {
      // Sometimes Falcon wraps JSON in additional quotes, handle that
      const cleanText = responseText.trim().replace(/^"|"$/g, "").replace(/\\"/g, '"')
      parsed = JSON.parse(cleanText)
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
