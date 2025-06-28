import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
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
    }),
  ),
  recommendation: z.string(),
  tradeoffAnalysis: z.string(),
})

export async function POST(request: Request) {
  try {
    const { clients, workers, tasks, currentWeights, constraints } = await request.json()

    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: ScenarioSchema,
      prompt: `
        You are an expert resource allocation strategist. Generate 3-4 distinct scenarios for resource allocation based on this data:
        
        Current Data:
        - Clients: ${clients.length} (${clients.filter((c: any) => c.PriorityLevel >= 4).length} high priority)
        - Workers: ${workers.length} across ${[...new Set(workers.map((w: any) => w.WorkerGroup))].length} groups
        - Tasks: ${tasks.length} requiring ${[...new Set(tasks.flatMap((t: any) => t.RequiredSkills))].length} unique skills
        
        Current Weights: ${JSON.stringify(currentWeights)}
        
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
      `,
    })

    return Response.json(object)
  } catch (error) {
    console.error("Scenario generation error:", error)
    return Response.json({ error: "Failed to generate scenarios" }, { status: 500 })
  }
}
