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

    // Limit prompt size
    const limitedClients = clients.slice(0, 10).map((c: any) => c.ClientID)
    const limitedWorkers = workers.slice(0, 10).map((w: any) => w.WorkerID)
    const workerGroups = [...new Set(workers.slice(0, 20).map((w: any) => w.WorkerGroup))]
    const limitedTasks = tasks.slice(0, 10).map((t: any) => t.TaskID)

    const { object } = await generateObject({
      model: groq("llama3-8b-8192"),
      schema: RuleSchema,
      prompt: `
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
        
        Generate appropriate rule configurations with proper parameters.
      `,
    })

    return Response.json(object)
  } catch (error) {
    console.error("Rule generation error:", error)
    return Response.json({ error: "Failed to generate rules" }, { status: 500 })
  }
}
