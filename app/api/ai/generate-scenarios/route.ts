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
      parameters: { max_new_tokens: 1500, temperature: 0.7 }, // Falcon typically benefits from some creativity
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Hugging Face API Error:", response.status, errorText)
    throw new Error(`Failed to fetch from Hugging Face API: ${response.status}`)
  }

  const result = await response.json()

  const generatedText = result?.generated_text || result?.[0]?.generated_text

  if (!generatedText) throw new Error("No response from Hugging Face")

  return generatedText
}

export async function POST(request: Request) {
  try {
    const { clients, workers, tasks, currentWeights, constraints } = await request.json()

    const truncatedWeights = Object.fromEntries(
      Object.entries(currentWeights).slice(0, 5)
    )
    const weightsSummary = Object.keys(currentWeights).slice(0, 5).join(", ") + (Object.keys(currentWeights).length > 5 ? " and more..." : "")

    const approxPromptLength = JSON.stringify(truncatedWeights).length + clients.length * 10 + workers.length * 10 + tasks.length * 10
    if (approxPromptLength > 4000) {
      return Response.json({ error: "Dataset too large for processing. Please reduce the dataset size." }, { status: 400 })
    }

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
         - Efficiency (task completion rate)
         - Satisfaction (client happiness)
         - Workload (worker utilization balance)
         - Cost (resource cost efficiency)
         - Timeline (delivery speed)
      4. Provide 3-4 specific AI insights about what this scenario achieves
      5. Identify 2-3 key risk factors
      6. Rate confidence level (0-1) in predictions

      Make scenarios distinctly different with clear trade-offs. Include quantitative insights where possible.
      Focus on actionable business intelligence that helps decision-making.

      Return a JSON object strictly matching this schema:
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
