"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  FileSpreadsheet,
  Sparkles,
  CheckCircle,
  Wand2,
  Database,
  Users,
  Briefcase,
  FileText,
} from "lucide-react"
import { useData } from "@/contexts/data-context"
import DataGrid from "@/components/data-grid"
import NaturalLanguageSearch from "@/components/natural-language-search"
import * as XLSX from "xlsx"

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

export default function DataIngestion() {
  const { clients, workers, tasks, setClients, setWorkers, setTasks } = useData()
  const [uploadStatus, setUploadStatus] = useState<{
    clients: boolean
    workers: boolean
    tasks: boolean
  }>({
    clients: false,
    workers: false,
    tasks: false,
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      data.push(row)
    }

    return data
  }

  const parseExcel = (buffer: ArrayBuffer): any[] => {
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    return XLSX.utils.sheet_to_json(worksheet)
  }

  const aiEnhancedParsing = async (data: any[], entityType: string): Promise<any[]> => {
    try {
      const headers = Object.keys(data[0] || {})
      const sampleData = data.slice(0, 5)

      const response = await fetch("/api/ai/parse-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers, sampleData, entityType }),
      })

      if (!response.ok) throw new Error("AI parsing failed")

      const aiResult = await response.json()

      return data.map((row) => {
        const transformedRow: any = {}

        aiResult.mappings.forEach((mapping: any) => {
          if (mapping.confidence > 0.7) {
            transformedRow[mapping.mappedColumn] = row[mapping.originalColumn]
          }
        })

        if (entityType === "clients") {
          transformedRow.ClientID = transformedRow.ClientID || `C${Math.random().toString(36).substr(2, 9)}`
          transformedRow.ClientName = transformedRow.ClientName || "Unknown Client"
          transformedRow.PriorityLevel = Number.parseInt(transformedRow.PriorityLevel || "3")
          transformedRow.RequestedTaskIDs = Array.isArray(transformedRow.RequestedTaskIDs)
            ? transformedRow.RequestedTaskIDs
            : (transformedRow.RequestedTaskIDs || "")
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
          transformedRow.GroupTag = transformedRow.GroupTag || "default"
          transformedRow.AttributesJSON = transformedRow.AttributesJSON || "{}"
        } else if (entityType === "workers") {
          transformedRow.WorkerID = transformedRow.WorkerID || `W${Math.random().toString(36).substr(2, 9)}`
          transformedRow.WorkerName = transformedRow.WorkerName || "Unknown Worker"
          transformedRow.Skills = Array.isArray(transformedRow.Skills)
            ? transformedRow.Skills
            : (transformedRow.Skills || "")
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
          transformedRow.AvailableSlots = Array.isArray(transformedRow.AvailableSlots)
            ? transformedRow.AvailableSlots
            : transformedRow.AvailableSlots || [1, 2, 3]
          transformedRow.MaxLoadPerPhase = Number.parseInt(transformedRow.MaxLoadPerPhase || "5")
          transformedRow.WorkerGroup = transformedRow.WorkerGroup || "default"
          transformedRow.QualificationLevel = Number.parseInt(transformedRow.QualificationLevel || "3")
        } else if (entityType === "tasks") {
          transformedRow.TaskID = transformedRow.TaskID || `T${Math.random().toString(36).substr(2, 9)}`
          transformedRow.TaskName = transformedRow.TaskName || "Unknown Task"
          transformedRow.Category = transformedRow.Category || "general"
          transformedRow.Duration = Number.parseInt(transformedRow.Duration || "1")
          transformedRow.RequiredSkills = Array.isArray(transformedRow.RequiredSkills)
            ? transformedRow.RequiredSkills
            : (transformedRow.RequiredSkills || "")
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
          transformedRow.PreferredPhases = Array.isArray(transformedRow.PreferredPhases)
            ? transformedRow.PreferredPhases
            : transformedRow.PreferredPhases || [1, 2, 3]
          transformedRow.MaxConcurrent = Number.parseInt(transformedRow.MaxConcurrent || "1")
        }

        return transformedRow
      })
    } catch (error) {
      console.error("AI parsing failed, falling back to basic parsing:", error)
      return data
    }
  }

  const handleFileUpload = useCallback(
    async (file: File, entityType: "clients" | "workers" | "tasks") => {
      setIsProcessing(true)
      setProcessingProgress(0)

      try {
        const progressSteps = [
          { progress: 20, message: "Reading file..." },
          { progress: 40, message: "Parsing data..." },
          { progress: 60, message: "AI column mapping..." },
          { progress: 80, message: "Data transformation..." },
          { progress: 100, message: "Complete!" },
        ]

        let data: any[] = []

        if (file.name.endsWith(".csv")) {
          const text = await file.text()
          data = parseCSV(text)
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          const buffer = await file.arrayBuffer()
          data = parseExcel(buffer)
        }

        for (const step of progressSteps) {
          setProcessingProgress(step.progress)
          await new Promise((resolve) => setTimeout(resolve, 500))
        }

        const enhancedData = await aiEnhancedParsing(data, entityType)

        if (entityType === "clients") {
          setClients(enhancedData)
        } else if (entityType === "workers") {
          setWorkers(enhancedData)
        } else if (entityType === "tasks") {
          setTasks(enhancedData)
        }

        setUploadStatus((prev) => ({ ...prev, [entityType]: true }))
      } catch (error) {
        console.error("Error processing file:", error)
      } finally {
        setIsProcessing(false)
        setProcessingProgress(0)
      }
    },
    [setClients, setWorkers, setTasks],
  )

  const generateSampleData = () => {
    const sampleClients = [
      {
        ClientID: "C001",
        ClientName: "Acme Corp",
        PriorityLevel: 5,
        RequestedTaskIDs: ["T001", "T002"],
        GroupTag: "enterprise",
        AttributesJSON: '{"budget": 50000, "deadline": "2024-03-01"}',
      },
      {
        ClientID: "C002",
        ClientName: "TechStart Inc",
        PriorityLevel: 3,
        RequestedTaskIDs: ["T003"],
        GroupTag: "startup",
        AttributesJSON: '{"budget": 15000, "deadline": "2024-02-15"}',
      },
    ]

    const sampleWorkers = [
      {
        WorkerID: "W001",
        WorkerName: "Alice Johnson",
        Skills: ["JavaScript", "React", "Node.js"],
        AvailableSlots: [1, 2, 3],
        MaxLoadPerPhase: 3,
        WorkerGroup: "frontend",
        QualificationLevel: 4,
      },
      {
        WorkerID: "W002",
        WorkerName: "Bob Smith",
        Skills: ["Python", "Django", "PostgreSQL"],
        AvailableSlots: [2, 3, 4],
        MaxLoadPerPhase: 2,
        WorkerGroup: "backend",
        QualificationLevel: 5,
      },
    ]

    const sampleTasks = [
      {
        TaskID: "T001",
        TaskName: "Frontend Development",
        Category: "development",
        Duration: 2,
        RequiredSkills: ["JavaScript", "React"],
        PreferredPhases: [1, 2],
        MaxConcurrent: 2,
      },
      {
        TaskID: "T002",
        TaskName: "API Integration",
        Category: "integration",
        Duration: 1,
        RequiredSkills: ["Node.js"],
        PreferredPhases: [2, 3],
        MaxConcurrent: 1,
      },
      {
        TaskID: "T003",
        TaskName: "Database Design",
        Category: "database",
        Duration: 3,
        RequiredSkills: ["PostgreSQL"],
        PreferredPhases: [1, 2, 3],
        MaxConcurrent: 1,
      },
    ]

    setClients(sampleClients)
    setWorkers(sampleWorkers)
    setTasks(sampleTasks)
    setUploadStatus({ clients: true, workers: true, tasks: true })
  }

  const entityConfigs = [
    {
      type: "clients" as const,
      label: "Clients",
      icon: Users,
      color: "text-blue-400",
      description: "Client data with priorities and task requests",
    },
    {
      type: "workers" as const,
      label: "Workers",
      icon: Briefcase,
      color: "text-green-400",
      description: "Worker profiles with skills and availability",
    },
    {
      type: "tasks" as const,
      label: "Tasks",
      icon: FileText,
      color: "text-purple-400",
      description: "Task definitions with requirements and phases",
    },
  ]

  return (
    <motion.div className="space-y-8" variants={staggerContainer} initial="hidden" animate="visible">
      {/* Upload Section */}
      <motion.div variants={cardVariants}>
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                <Upload className="h-6 w-6 text-blue-400" />
              </motion.div>
              Data Upload & Processing
            </CardTitle>
            <CardDescription className="text-white/70">
              Upload your CSV or XLSX files. Our system will automatically map columns and normalize data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" variants={staggerContainer}>
              {entityConfigs.map((config) => {
                const Icon = config.icon
                return (
                  <motion.div key={config.type} variants={cardVariants}>
                    <Card className="glass-card rounded-xl hover:scale-105 transition-all duration-300 border-white/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${config.color}`} />
                          <div>
                            <CardTitle className="text-base text-white">{config.label}</CardTitle>
                            <CardDescription className="text-xs text-white/60">{config.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* File Upload Area */}
                        <div className="relative">
                          <label
                            htmlFor={`file-${config.type}`}
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/30 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-all duration-300 group"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-3 text-white/60 group-hover:text-white/80 transition-colors" />
                              <p className="mb-2 text-sm text-white/80 group-hover:text-white transition-colors">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-white/50">CSV, XLSX files only</p>
                            </div>
                            <Input
                              id={`file-${config.type}`}
                              type="file"
                              accept=".csv,.xlsx,.xls"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(file, config.type)
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={isProcessing}
                            />
                          </label>
                        </div>

                        {/* Alternative Upload Button */}
                        <div className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="glass-button bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all"
                            onClick={() => document.getElementById(`file-${config.type}`)?.click()}
                            disabled={isProcessing}
                          >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Choose File
                          </Button>
                        </div>

                        {/* Upload Status */}
                        <AnimatePresence>
                          {uploadStatus[config.type] && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center gap-2 text-green-400 p-2 bg-green-500/10 rounded-lg border border-green-500/30"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Successfully uploaded</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Processing Indicator */}
                        <AnimatePresence>
                          {isProcessing && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-2 text-blue-400 p-2 bg-blue-500/10 rounded-lg border border-blue-500/30"
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              >
                                <Wand2 className="h-4 w-4" />
                              </motion.div>
                              <span className="text-sm">Processing...</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="pill-badge flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  AI Column Mapping
                </div>
                <div className="pill-badge flex items-center gap-2">
                  <Database className="h-3 w-3" />
                  Data Normalization
                </div>
                <div className="pill-badge flex items-center gap-2">
                  <Wand2 className="h-3 w-3" />
                  Smart Validation
                </div>
              </div>
              <Button onClick={generateSampleData} className="btn-secondary rounded-full px-6">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Load Sample Data
              </Button>
            </div>

            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6"
                >
                  <Alert className="glass-card border-blue-500/30">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <Wand2 className="h-4 w-4 text-blue-400" />
                    </motion.div>
                    <AlertDescription className="text-white">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>AI is processing and mapping your data structure...</span>
                          <span className="text-sm font-medium">{processingProgress}%</span>
                        </div>
                        <Progress value={processingProgress} className="w-full" />
                      </div>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Natural Language Search */}
      <AnimatePresence>
        {(clients.length > 0 || workers.length > 0 || tasks.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
          >
            <NaturalLanguageSearch />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Grids */}
      <AnimatePresence>
        {(clients.length > 0 || workers.length > 0 || tasks.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            variants={cardVariants}
          >
            <Card className="glass-card rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <Database className="h-6 w-6 text-blue-400" />
                  Data Preview & Editing
                </CardTitle>
                <CardDescription className="text-white/70">
                  Review and edit your data inline. Changes are validated in real-time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="clients" className="w-full">
                  <TabsList className="agamify-tabs grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="clients" className="agamify-tab flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Clients</span>
                      <Badge variant="secondary" className="ml-1 bg-white/10 text-white border-white/20">
                        {clients.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="workers" className="agamify-tab flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span className="hidden sm:inline">Workers</span>
                      <Badge variant="secondary" className="ml-1 bg-white/10 text-white border-white/20">
                        {workers.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="agamify-tab flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Tasks</span>
                      <Badge variant="secondary" className="ml-1 bg-white/10 text-white border-white/20">
                        {tasks.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="clients">
                    <DataGrid data={clients} entityType="clients" />
                  </TabsContent>

                  <TabsContent value="workers">
                    <DataGrid data={workers} entityType="workers" />
                  </TabsContent>

                  <TabsContent value="tasks">
                    <DataGrid data={tasks} entityType="tasks" />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
