import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
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
    }),
  ),
  explanation: z.string(),
})

export async function POST(request: Request) {
  try {
    const { naturalLanguageRule, clients, workers, tasks } = await request.json()

    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: RuleSchema,
      prompt: `
        Convert this natural language business rule into structured rule configuration: "${naturalLanguageRule}"
        
        Available entities:
        - Clients: ${clients.map((c: any) => c.ClientID).join(", ")}
        - Workers: ${workers.map((w: any) => w.WorkerID).join(", ")} (Groups: ${[...new Set(workers.map((w: any) => w.WorkerGroup))].join(", ")})
        - Tasks: ${tasks.map((t: any) => t.TaskID).join(", ")}
        
        Rule types available:
        1. coRun: Tasks that must run together { tasks: [TaskID1, TaskID2] }
        2. slotRestriction: Limit slots for groups { group: string, minCommonSlots: number }
        3. loadLimit: Max load per group { workerGroup: string, maxSlotsPerPhase: number }
        4. phaseWindow: Restrict task to phases { taskId: string, allowedPhases: number[] }
        5. patternMatch: Pattern-based rules { pattern: string, action: string }
        6. precedence: Priority ordering { priority: number, condition: string }
        
        Generate appropriate rule configurations with proper parameters.
      `,
    })

    return Response.json(object)
  } catch (error) {
    console.error("Rule generation error:", error)
    return Response.json({ error: "Failed to generate rules" }, { status: 500 })
  }
}
