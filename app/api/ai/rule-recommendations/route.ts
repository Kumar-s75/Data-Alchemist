import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
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
    }),
  ),
  patterns_detected: z.array(
    z.object({
      pattern_type: z.string(),
      description: z.string(),
      entities: z.array(z.string()),
      frequency: z.number(),
    }),
  ),
})

export async function POST(request: Request) {
  try {
    const { clients, workers, tasks, existingRules } = await request.json()

    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: RuleRecommendationSchema,
      prompt: `
        Analyze this resource allocation data and recommend business rules based on patterns:
        
        Clients: ${JSON.stringify(clients)}
        Workers: ${JSON.stringify(workers)}
        Tasks: ${JSON.stringify(tasks)}
        Existing Rules: ${JSON.stringify(existingRules)}
        
        Look for these patterns and suggest rules:
        
        1. Co-run opportunities:
           - Tasks with identical or overlapping skill requirements
           - Tasks frequently requested together by clients
           - Tasks with similar durations and phases
        
        2. Load balancing needs:
           - Worker groups with uneven capacity
           - Overloaded teams vs underutilized teams
        
        3. Phase optimization:
           - Tasks that should be restricted to specific phases
           - Phase conflicts or bottlenecks
        
        4. Skill-based restrictions:
           - Tasks requiring rare skills
           - Worker specialization patterns
        
        5. Priority-based rules:
           - High-priority clients with conflicting requirements
           - Precedence rules for critical tasks
        
        For each recommendation:
        - Explain the detected pattern
        - Suggest specific rule parameters
        - Estimate impact and confidence
        - Identify affected entities
        
        Avoid suggesting rules that already exist or conflict with existing ones.
      `,
    })

    return Response.json(object)
  } catch (error) {
    console.error("Rule recommendation error:", error)
    return Response.json({ error: "Failed to generate rule recommendations" }, { status: 500 })
  }
}
