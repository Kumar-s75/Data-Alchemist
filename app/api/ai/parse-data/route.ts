import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
import { z } from "zod"

const DataMappingSchema = z.object({
  mappings: z.array(
    z.object({
      originalColumn: z.string(),
      mappedColumn: z.string(),
      confidence: z.number(),
      reasoning: z.string(),
    }),
  ),
  suggestions: z.array(
    z.object({
      type: z.enum(["missing_data", "data_quality", "normalization"]),
      message: z.string(),
      field: z.string().optional(),
    }),
  ),
})

export async function POST(request: Request) {
  try {
    const { headers, sampleData, entityType } = await request.json()

    const expectedColumns = {
      clients: ["ClientID", "ClientName", "PriorityLevel", "RequestedTaskIDs", "GroupTag", "AttributesJSON"],
      workers: [
        "WorkerID",
        "WorkerName",
        "Skills",
        "AvailableSlots",
        "MaxLoadPerPhase",
        "WorkerGroup",
        "QualificationLevel",
      ],
      tasks: ["TaskID", "TaskName", "Category", "Duration", "RequiredSkills", "PreferredPhases", "MaxConcurrent"],
    }

    const { object } = await generateObject({
      model: groq("llama-3.1-70b-versatile"),
      schema: DataMappingSchema,
      prompt: `
        You are an expert data analyst. I have uploaded a ${entityType} dataset with these column headers: ${headers.join(", ")}
        
        Expected columns for ${entityType}: ${expectedColumns[entityType as keyof typeof expectedColumns].join(", ")}
        
        Sample data (first 3 rows): ${JSON.stringify(sampleData.slice(0, 3))}
        
        Please:
        1. Map the uploaded columns to the expected schema columns
        2. Provide confidence scores (0-1) for each mapping
        3. Give reasoning for each mapping decision
        4. Suggest data quality improvements or missing data issues
        
        Be intelligent about mapping - for example:
        - "ID" or "id" should map to the appropriate ID field
        - "Name" or "name" should map to the name field
        - "Priority" should map to "PriorityLevel"
        - "Available_Slots" or "slots" should map to "AvailableSlots"
      `,
    })

    return Response.json(object)
  } catch (error) {
    console.error("AI parsing error:", error)
    return Response.json({ error: "Failed to process data with AI" }, { status: 500 })
  }
}
