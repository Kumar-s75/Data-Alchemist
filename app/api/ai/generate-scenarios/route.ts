import { z } from "zod"

const ScenarioSchema = z.object({
  scenarios: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      parameters: z.record(z.number()),
      predictedOutcomes: z.object({
        efficiency: z.number(),
        satisfaction: z.number(),
        workload: z.number(),
        cost: z.number(),
        timeline: z.number(),
      }),
      aiInsights: z.array(z.string()),
      riskFactors: z.array(z.string()),
      confidence: z.number(),
    })
  ),
  recommendation: z.string(),
  tradeoffAnalysis: z.string(),
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
    console.error("Hugging Face API error:", response.status, errorText)
    throw new Error(`Hugging Face API error: ${response.status}`)
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
    const { clients, workers, tasks, currentWeights } = await request.json()

    const truncatedWeights = Object.fromEntries(Object.entries(currentWeights).slice(0, 5))
    const weightsSummary = Object.keys(currentWeights).slice(0, 5).join(", ") + (Object.keys(currentWeights).length > 5 ? " and more..." : "")

    const prompt = `
      You are an expert resource allocation strategist. Generate 3-4 distinct scenarios for resource allocation based on this data:

      Current Data:
      - Clients: ${clients.length} (${clients.filter((c: any) => c.PriorityLevel >= 4).length} high priority)
      - Workers: ${workers.length} across ${[...new Set(workers.map((w: any) => w.WorkerGroup))].length} groups
      - Tasks: ${tasks.length} requiring ${[...new Set(tasks.flatMap((t: any) => t.RequiredSkills))].length} unique skills

      Current Weights Summary: ${weightsSummary}

      For each scenario:
      1. Create a unique strategic approach (efficiency-first, balanced, client-focused, innovation-driven, etc.)
      2. Adjust priority weights to reflect the strategy
      3. Predict realistic outcomes (0-100 scale) for:
         - Efficiency
         - Satisfaction
         - Workload
         - Cost
         - Timeline
      4. Provide 3-4 specific AI insights
      5. Identify 2-3 key risk factors
      6. Rate confidence level (0-1)

      Make scenarios distinctly different with clear trade-offs. Focus on actionable insights.

      Return JSON in this exact format:
      {
        "scenarios": [
          {
            "id": "string",
            "name": "string",
            "description": "string",
            "parameters": { "parameter_name": number },
            "predictedOutcomes": { "efficiency": number, "satisfaction": number, "workload": number, "cost": number, "timeline": number },
            "aiInsights": ["string"],
            "riskFactors": ["string"],
            "confidence": number
          }
        ],
        "recommendation": "string",
        "tradeoffAnalysis": "string"
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

    const validation = ScenarioSchema.safeParse(parsed)

    if (!validation.success) {
      console.error("Schema validation failed", validation.error)
      return Response.json({ error: "Response format invalid" }, { status: 500 })
    }

    return Response.json(validation.data)
  } catch (error) {
    console.error("Scenario generation error:", error)
    return Response.json({ error: "Failed to generate scenarios" }, { status: 500 })
  }
}
