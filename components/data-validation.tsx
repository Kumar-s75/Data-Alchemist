"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Sparkles, Lightbulb } from "lucide-react"
import { useData, type ValidationError } from "@/contexts/data-context"
import AICorrectionPanel from "@/components/ai-correction-panel"
// Add imports at the top
import { useComprehensiveValidation } from "@/components/comprehensive-validation"
import NaturalLanguageModifier from "@/components/natural-language-modifier"

// Update the component to use comprehensive validation
export default function DataValidation() {
  const { clients, workers, tasks, validationErrors, setValidationErrors } = useData()
  const { runComprehensiveValidation, isValidating: isValidatingComprehensive } = useComprehensiveValidation()
  const [isValidating, setIsValidating] = useState(false)
  const [validationProgress, setValidationProgress] = useState(0)
  const [suggestions, setSuggestions] = useState<
    Array<{
      id: string
      message: string
      action: string
      severity: "info" | "warning"
    }>
  >([])

  // Add AI validation function
  const runAIValidation = async () => {
    try {
      const response = await fetch("/api/ai/validate-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clients, workers, tasks }),
      })

      if (!response.ok) throw new Error("AI validation failed")

      const aiValidation = await response.json()

      // Convert AI insights to validation errors
      const aiErrors = aiValidation.errors.map((error: any) => ({
        ...error,
        id: `ai-${error.id}`,
      }))

      // Add AI recommendations as suggestions
      const aiSuggestions = aiValidation.recommendations.map((rec: any) => ({
        id: `ai-rec-${Math.random()}`,
        message: `${rec.title}: ${rec.description}`,
        action: rec.implementation,
        severity: rec.priority === "high" ? "warning" : "info",
      }))

      setValidationErrors((prev) => [...prev, ...aiErrors])
      setSuggestions((prev) => [...prev, ...aiSuggestions])
    } catch (error) {
      console.error("AI validation failed:", error)
    }
  }

  // Replace the existing runValidation with comprehensive validation
  const runValidation = async () => {
    setIsValidating(true)
    setValidationProgress(0)
    const errors: ValidationError[] = []
    const newSuggestions: any[] = []

    // Simulate validation progress
    const validationSteps = [
      "Checking required fields...",
      "Validating IDs and references...",
      "Checking data ranges...",
      "Analyzing relationships...",
      "Running AI-enhanced validations...",
    ]

    for (let i = 0; i < validationSteps.length; i++) {
      setValidationProgress((i + 1) * 20)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // 1. Missing required columns
    clients.forEach((client) => {
      if (!client.ClientID) {
        errors.push({
          id: `missing-client-id-${Math.random()}`,
          type: "missing-required",
          severity: "error",
          message: "Missing required ClientID",
          entity: client.ClientName || "Unknown Client",
          field: "ClientID",
        })
      }
      if (!client.ClientName) {
        errors.push({
          id: `missing-client-name-${Math.random()}`,
          type: "missing-required",
          severity: "error",
          message: "Missing required ClientName",
          entity: client.ClientID || "Unknown",
          field: "ClientName",
        })
      }
    })

    // 2. Duplicate IDs
    const clientIds = clients.map((c) => c.ClientID).filter(Boolean)
    const workerIds = workers.map((w) => w.WorkerID).filter(Boolean)
    const taskIds = tasks.map((t) => t.TaskID).filter(Boolean)

    const duplicateClients = clientIds.filter((id, index) => clientIds.indexOf(id) !== index)
    const duplicateWorkers = workerIds.filter((id, index) => workerIds.indexOf(id) !== index)
    const duplicateTasks = taskIds.filter((id, index) => taskIds.indexOf(id) !== index)

    duplicateClients.forEach((id) => {
      errors.push({
        id: `duplicate-client-${id}`,
        type: "duplicate-id",
        severity: "error",
        message: `Duplicate ClientID: ${id}`,
        entity: id,
        suggestion: "Rename one of the duplicate IDs",
      })
    })

    // 3. Out-of-range values
    clients.forEach((client) => {
      if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
        errors.push({
          id: `invalid-priority-${client.ClientID}`,
          type: "out-of-range",
          severity: "error",
          message: `PriorityLevel must be between 1-5, got ${client.PriorityLevel}`,
          entity: client.ClientID,
          field: "PriorityLevel",
          suggestion: "Set priority level between 1 and 5",
        })
      }
    })

    tasks.forEach((task) => {
      if (task.Duration < 1) {
        errors.push({
          id: `invalid-duration-${task.TaskID}`,
          type: "out-of-range",
          severity: "error",
          message: `Duration must be >= 1, got ${task.Duration}`,
          entity: task.TaskID,
          field: "Duration",
          suggestion: "Set duration to at least 1 phase",
        })
      }
    })

    // 4. Unknown references
    clients.forEach((client) => {
      client.RequestedTaskIDs.forEach((taskId) => {
        if (!taskIds.includes(taskId)) {
          errors.push({
            id: `unknown-task-${client.ClientID}-${taskId}`,
            type: "unknown-reference",
            severity: "error",
            message: `Client ${client.ClientID} references unknown TaskID: ${taskId}`,
            entity: client.ClientID,
            field: "RequestedTaskIDs",
            suggestion: "Remove invalid task reference or add the missing task",
          })
        }
      })
    })

    // 5. Skill coverage matrix
    const allRequiredSkills = [...new Set(tasks.flatMap((task) => task.RequiredSkills))]
    const allWorkerSkills = [...new Set(workers.flatMap((worker) => worker.Skills))]

    allRequiredSkills.forEach((skill) => {
      if (!allWorkerSkills.includes(skill)) {
        errors.push({
          id: `missing-skill-${skill}`,
          type: "skill-coverage",
          severity: "warning",
          message: `No worker has required skill: ${skill}`,
          entity: "Skills",
          suggestion: "Add a worker with this skill or remove the skill requirement",
        })
      }
    })

    // AI-enhanced suggestions
    if (clients.length > 0 && workers.length > 0) {
      const highPriorityClients = clients.filter((c) => c.PriorityLevel >= 4).length
      const totalWorkers = workers.length

      if (highPriorityClients > totalWorkers) {
        newSuggestions.push({
          id: "capacity-warning",
          message: `You have ${highPriorityClients} high-priority clients but only ${totalWorkers} workers. Consider adding more workers or adjusting priorities.`,
          action: "Review capacity planning",
          severity: "warning",
        })
      }
    }

    // Check for potential co-run opportunities
    const tasksBySkills = tasks.reduce(
      (acc, task) => {
        const skillKey = task.RequiredSkills.sort().join(",")
        if (!acc[skillKey]) acc[skillKey] = []
        acc[skillKey].push(task.TaskID)
        return acc
      },
      {} as Record<string, string[]>,
    )

    Object.entries(tasksBySkills).forEach(([skills, taskIds]) => {
      if (taskIds.length > 1) {
        newSuggestions.push({
          id: `corun-suggestion-${skills}`,
          message: `Tasks ${taskIds.join(", ")} require similar skills (${skills}). Consider creating a co-run rule.`,
          action: "Create co-run rule",
          severity: "info",
        })
      }
    })

    // Add AI validation step
    setValidationProgress(80)
    await runAIValidation()

    setValidationErrors(errors)
    setSuggestions(newSuggestions)
    setValidationProgress(100)
    setIsValidating(false)
  }

  useEffect(() => {
    if (clients.length > 0 || workers.length > 0 || tasks.length > 0) {
      runValidation()
    }
  }, [clients, workers, tasks])

  const errorCount = validationErrors.filter((e) => e.severity === "error").length
  const warningCount = validationErrors.filter((e) => e.severity === "warning").length

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Validation Summary
          </CardTitle>
          <CardDescription>Real-time validation with AI-enhanced error detection and suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <div className="font-semibold text-red-700">{errorCount} Errors</div>
                <div className="text-sm text-gray-600">Must be fixed</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-semibold text-yellow-700">{warningCount} Warnings</div>
                <div className="text-sm text-gray-600">Should be reviewed</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-semibold text-green-700">
                  {Math.max(0, clients.length + workers.length + tasks.length - validationErrors.length)} Valid
                </div>
                <div className="text-sm text-gray-600">Records passed</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Enhanced
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Real-time
              </Badge>
            </div>
            <Button onClick={runValidation} disabled={isValidating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? "animate-spin" : ""}`} />
              Re-validate
            </Button>
          </div>

          {isValidating && (
            <div className="mt-4">
              <Progress value={validationProgress} className="w-full" />
              <div className="text-sm text-gray-600 mt-1">Validating data... {validationProgress}%</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              AI Suggestions
            </CardTitle>
            <CardDescription>Smart recommendations based on your data patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <Alert
                  key={suggestion.id}
                  className={
                    suggestion.severity === "warning" ? "border-yellow-200 bg-yellow-50" : "border-blue-200 bg-blue-50"
                  }
                >
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{suggestion.message}</span>
                      <Button size="sm" variant="outline">
                        {suggestion.action}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {validationErrors.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Validation Issues</CardTitle>
              <CardDescription>Issues found in your data that need attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validationErrors.map((error) => (
                  <Alert key={error.id} variant={error.severity === "error" ? "destructive" : "default"}>
                    {error.severity === "error" ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{error.message}</div>
                          <div className="text-sm opacity-80">
                            Entity: {error.entity} {error.field && `• Field: ${error.field}`}
                          </div>
                          {error.suggestion && <div className="text-sm mt-1 opacity-90">💡 {error.suggestion}</div>}
                        </div>
                        <Badge variant={error.severity === "error" ? "destructive" : "secondary"}>{error.type}</Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add AI Correction Panel */}
          <AICorrectionPanel />
        </>
      )}

      {validationErrors.length === 0 &&
        !isValidating &&
        (clients.length > 0 || workers.length > 0 || tasks.length > 0) && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-700 mb-2">All Validations Passed!</h3>
                <p className="text-gray-600">Your data looks clean and ready for rule configuration.</p>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Add Natural Language Modifier */}
      {(clients.length > 0 || workers.length > 0 || tasks.length > 0) && <NaturalLanguageModifier />}
    </div>
  )
}
