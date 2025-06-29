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

export async function POST(request: Request) {
  try {
    const { clients, workers, tasks, existingRules } = await request.json()

    // ✅ Limit the number of records to control token size
    const reducedClients = clients.slice(0, 50).map(({ ClientID, RequestedTaskIDs, PriorityLevel }:any) => ({
      ClientID,
      RequestedTaskIDs: RequestedTaskIDs.slice(0, 5), // Limit nested arrays
      PriorityLevel,
    }))

    const reducedWorkers = workers.slice(0, 50).map(({ WorkerID, Skills }:any) => ({
      WorkerID,
      Skills: Skills.slice(0, 5),
    }))

    const reducedTasks = tasks.slice(0, 50).map(({ TaskID, RequiredSkills, Duration, Phases }:any) => ({
      TaskID,
      RequiredSkills: RequiredSkills.slice(0, 5),
      Duration,
      Phases: Phases ? Phases.slice(0, 5) : [],
    }))

    const reducedRules = existingRules.slice(0, 50).map(({ id, type, parameters }:any) => ({
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
    `

    // ✅ Log prompt size to monitor token limits
    console.log("Prompt size (characters):", prompt.length)

    const { object } = await generateObject({
      model: groq("llama3-8b-8192"),
      schema: RuleRecommendationSchema,
      prompt: prompt,
    })

    return Response.json(object)
  } catch (error) {
    console.error("Rule recommendation error:", error)
    return Response.json({ error: "Failed to generate rule recommendations" }, { status: 500 })
  }
}
