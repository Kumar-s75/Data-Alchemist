import { z } from "zod"

const RuleRecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      type: z.enum(["coRun", "slotRestriction", "loadLimit", "phaseWindow", "patternMatch", "precedence"]),
      title: z.string(),
      description: z.string(),
      reasoning: z.string(),
      confidence: z.number(),
      priority: z.enum(["high", "medium", "low"]),
      parameters: z.record(z.any()),
      affected_entities: z.array(z.string()),
    })
  ),
  patterns_detected: z.array(
    z.object({
      pattern_type: z.string(),
      description: z.string(),
      entities: z.array(z.string()),
      frequency: z.number(),
    })
  ),
})

// ✅ Hugging Face API Call
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

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Hugging Face API error:", response.status, errorText)
    throw new Error(`Hugging Face API error: ${response.status}`)
  }

  const result = await response.json()

  if (!Array.isArray(result) || !result[0]?.generated_text) {
    console.error("Unexpected response format:", result)
    throw new Error("Unexpected response format from Hugging Face API")
  }

  return result[0].generated_text
}

export async function POST(request: Request) {
  try {
    const { clients, workers, tasks, existingRules } = await request.json()

    const reducedClients = clients.slice(0, 50).map(({ ClientID, RequestedTaskIDs, PriorityLevel }: any) => ({
      ClientID,
      RequestedTaskIDs: RequestedTaskIDs.slice(0, 5),
      PriorityLevel,
    }))

    const reducedWorkers = workers.slice(0, 50).map(({ WorkerID, Skills }: any) => ({
      WorkerID,
      Skills: Skills.slice(0, 5),
    }))

    const reducedTasks = tasks.slice(0, 50).map(({ TaskID, RequiredSkills, Duration, Phases }: any) => ({
      TaskID,
      RequiredSkills: RequiredSkills.slice(0, 5),
      Duration,
      Phases: Phases ? Phases.slice(0, 5) : [],
    }))

    const reducedRules = existingRules.slice(0, 50).map(({ id, type, parameters }: any) => ({
      id,
      type,
      parameters,
    }))

    const prompt = `
      Analyze this resource allocation data and recommend business rules based on patterns:

      Clients: ${JSON.stringify(reducedClients)}
      Workers: ${JSON.stringify(reducedWorkers)}
      Tasks: ${JSON.stringify(reducedTasks)}
      Existing Rules: ${JSON.stringify(reducedRules)}

      Look for these patterns and suggest rules:
      (Detailed instruction same as before)
      
      Respond ONLY in this JSON format:
      ${JSON.stringify(RuleRecommendationSchema.shape, null, 2)}
    `

    console.log("Prompt size (characters):", prompt.length)

    // 🔄 Hugging Face call
    const responseText = await callHuggingFace(prompt)

    console.log("Raw response:", responseText)

    // ✅ Try parsing the response into expected schema
    const parsed = RuleRecommendationSchema.safeParse(JSON.parse(responseText))

    if (!parsed.success) {
      console.error("Schema validation failed", parsed.error)
      return Response.json({ error: "Response format invalid" }, { status: 500 })
    }

    return Response.json(parsed.data)
  } catch (error) {
    console.error("Rule recommendation error:", error)
    return Response.json({ error: "Failed to generate rule recommendations" }, { status: 500 })
  }
}
