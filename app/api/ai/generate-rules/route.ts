import { z } from "zod"

const RuleSchema = z.object({
  rules: z.array(
    z.object({
      type: z.enum(["coRun", "slotRestriction", "loadLimit", "phaseWindow", "patternMatch", "precedence"]),
      name: z.string(),
      description: z.string(),
      parameters: z.record(z.any()),
      confidence: z.number(),
      reasoning: z.string(),
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
      parameters: { max_new_tokens: 1500, temperature: 0.0 },
    }),
  })

  // ✅ Handle non-200 responses
  if (!response.ok) {
    const errorText = await response.text()
    console.error("Hugging Face API Error:", errorText)
    throw new Error("Failed to fetch from Hugging Face API")
  }

  const result = await response.json()

  // ✅ Check both possible Hugging Face response formats
  const generatedText = result?.generated_text || result?.[0]?.generated_text

  if (!generatedText) throw new Error("No response from Hugging Face")

  return generatedText
}

export async function POST(request: Request) {
  try {
    const { naturalLanguageRule, clients, workers, tasks } = await request.json()

    const limitedClients = clients.slice(0, 10).map((c: any) => c.ClientID)
    const limitedWorkers = workers.slice(0, 10).map((w: any) => w.WorkerID)
    const workerGroups = [...new Set(workers.slice(0, 20).map((w: any) => w.WorkerGroup))]
    const limitedTasks = tasks.slice(0, 10).map((t: any) => t.TaskID)

    const prompt = `
      Convert this natural language business rule into structured rule configuration: "${naturalLanguageRule}"
      
      Available entities (sampled):
      - Clients: ${limitedClients.join(", ")}${clients.length > 10 ? " and more..." : ""}
      - Workers: ${limitedWorkers.join(", ")}${workers.length > 10 ? " and more..." : ""} (Groups: ${workerGroups.join(", ")})
      - Tasks: ${limitedTasks.join(", ")}${tasks.length > 10 ? " and more..." : ""}

      Rule types available:
      1. coRun: Tasks that must run together { tasks: [TaskID1, TaskID2] }
      2. slotRestriction: Limit slots for groups { group: string, minCommonSlots: number }
      3. loadLimit: Max load per group { workerGroup: string, maxSlotsPerPhase: number }
      4. phaseWindow: Restrict task to phases { taskId: string, allowedPhases: number[] }
      5. patternMatch: Pattern-based rules { pattern: string, action: string }
      6. precedence: Priority ordering { priority: number, condition: string }

      Generate the rule configuration in this strict JSON format:
      {
        "rules": [
          {
            "type": "string",
            "name": "string",
            "description": "string",
            "parameters": { "paramName": any },
            "confidence": number,
            "reasoning": "string"
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

    const validation = RuleSchema.safeParse(parsed)

    if (!validation.success) {
      console.error("Schema validation failed", validation.error)
      return Response.json({ error: "Response format invalid" }, { status: 500 })
    }

    return Response.json(validation.data)
  } catch (error) {
    console.error("Rule generation error:", error)
    return Response.json({ error: "Failed to generate rules" }, { status: 500 })
  }
}
