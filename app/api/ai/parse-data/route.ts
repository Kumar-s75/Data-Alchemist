import { z } from "zod"

const DataMappingSchema = z.object({
  mappings: z.array(
    z.object({
      originalColumn: z.string(),
      mappedColumn: z.string(),
      confidence: z.number(),
      reasoning: z.string(),
    })
  ),
  suggestions: z.array(
    z.object({
      type: z.enum(["missing_data", "data_quality", "normalization"]),
      message: z.string(),
      field: z.string().optional(),
    })
  ),
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
      parameters: { max_new_tokens: 1500, temperature: 0.0 }, // Keep temperature low for deterministic output
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error("Hugging Face API Error:", text)
    throw new Error("Failed to fetch from Hugging Face API")
  }

  const result = await response.json()

  // Supports both response structures
  const generatedText = result?.generated_text || result?.[0]?.generated_text

  if (!generatedText) throw new Error("No response from Hugging Face")

  return generatedText
}

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

    const prompt = `
      You are an expert data analyst. I have uploaded a ${entityType} dataset with these column headers: ${headers.join(", ")}
      
      Expected columns for ${entityType}: ${expectedColumns[entityType as keyof typeof expectedColumns].join(", ")}
      
      Sample data (first 3 rows): ${JSON.stringify(sampleData.slice(0, 3))}
      
      Please:
      1. Map the uploaded columns to the expected schema columns
      2. Provide confidence scores (0-1) for each mapping
      3. Give reasoning for each mapping decision
      4. Suggest data quality improvements or missing data issues

      Respond ONLY in the following JSON format:
      {
        "mappings": [
          {
            "originalColumn": "",
            "mappedColumn": "",
            "confidence": 0.0,
            "reasoning": ""
          }
        ],
        "suggestions": [
          {
            "type": "missing_data",
            "message": "",
            "field": ""
          }
        ]
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

    const validation = DataMappingSchema.safeParse(parsed)

    if (!validation.success) {
      console.error("Schema validation failed", validation.error)
      return Response.json({ error: "Response format invalid" }, { status: 500 })
    }

    return Response.json(validation.data)
  } catch (error) {
    console.error("AI parsing error:", error)
    return Response.json({ error: "Failed to process data with AI" }, { status: 500 })
  }
}
