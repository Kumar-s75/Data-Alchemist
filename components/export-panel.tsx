"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileText, CheckCircle, AlertTriangle, Package } from "lucide-react"
import { useData } from "@/contexts/data-context"

export default function ExportPanel() {
  const { clients, workers, tasks, businessRules, priorityWeights, validationErrors } = useData()
  const [exportOptions, setExportOptions] = useState({
    clients: true,
    workers: true,
    tasks: true,
    rules: true,
    weights: true,
  })
  const [isExporting, setIsExporting] = useState(false)

  const hasErrors = validationErrors.filter((e) => e.severity === "error").length > 0
  const hasWarnings = validationErrors.filter((e) => e.severity === "warning").length > 0

  const generateCSV = (data: any[], filename: string) => {
    if (data.length === 0) return null

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (Array.isArray(value)) {
              return `"${value.join(", ")}"`
            }
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    return { filename, content: csvContent }
  }

  const generateRulesJSON = () => {
    const rulesConfig = {
      version: "1.0",
      timestamp: new Date().toISOString(),

      // Business Rules
      businessRules: businessRules
        .filter((rule) => rule.active)
        .map((rule) => ({
          id: rule.id,
          type: rule.type,
          name: rule.name,
          description: rule.description,
          parameters: rule.parameters,
          active: rule.active,
        })),

      // Priority Weights Configuration
      prioritizationSettings: {
        weights: priorityWeights,
        totalWeight: Object.values(priorityWeights).reduce((sum, weight) => sum + weight, 0),
        methodology: "multi-criteria-decision-analysis",
        criteria: {
          priorityLevel: {
            description: "Weight given to client priority levels (1-5)",
            weight: priorityWeights.priorityLevel,
            unit: "percentage",
          },
          taskFulfillment: {
            description: "Importance of completing requested tasks",
            weight: priorityWeights.taskFulfillment,
            unit: "percentage",
          },
          fairness: {
            description: "Ensuring equitable distribution across workers",
            weight: priorityWeights.fairness,
            unit: "percentage",
          },
          workloadBalance: {
            description: "Balancing workload to prevent overutilization",
            weight: priorityWeights.workloadBalance,
            unit: "percentage",
          },
          skillMatch: {
            description: "Matching tasks to workers with optimal skills",
            weight: priorityWeights.skillMatch,
            unit: "percentage",
          },
          clientSatisfaction: {
            description: "Overall client satisfaction and relationship management",
            weight: priorityWeights.clientSatisfaction,
            unit: "percentage",
          },
        },
      },

      // Allocation Constraints
      allocationConstraints: {
        enforceSkillRequirements: true,
        respectPhaseWindows: true,
        honorClientPriorities: true,
        maintainWorkloadLimits: true,
        optimizeResourceUtilization: true,
      },

      // Data Quality Metadata
      dataQuality: {
        validationStatus: hasErrors ? "errors" : hasWarnings ? "warnings" : "clean",
        totalErrors: validationErrors.filter((e) => e.severity === "error").length,
        totalWarnings: validationErrors.filter((e) => e.severity === "warning").length,
        lastValidated: new Date().toISOString(),
      },

      // Entity Counts
      entityCounts: {
        totalClients: clients.length,
        totalWorkers: workers.length,
        totalTasks: tasks.length,
        activeRules: businessRules.filter((r) => r.active).length,
      },

      // Configuration Metadata
      configurationMetadata: {
        generatedBy: "Data Alchemist v1.0",
        generatedAt: new Date().toISOString(),
        configurationId: `config-${Date.now()}`,
        readyForProduction: !hasErrors,
      },
    }

    return {
      filename: "allocation-rules-config.json",
      content: JSON.stringify(rulesConfig, null, 2),
    }
  }

  const downloadFile = (filename: string, content: string, type = "text/csv") => {
    const blob = new Blob([content], { type })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    setIsExporting(true)

    // Simulate export processing
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const exports = []

    if (exportOptions.clients && clients.length > 0) {
      const clientsCSV = generateCSV(clients, "clients-cleaned.csv")
      if (clientsCSV) exports.push(clientsCSV)
    }

    if (exportOptions.workers && workers.length > 0) {
      const workersCSV = generateCSV(workers, "workers-cleaned.csv")
      if (workersCSV) exports.push(workersCSV)
    }

    if (exportOptions.tasks && tasks.length > 0) {
      const tasksCSV = generateCSV(tasks, "tasks-cleaned.csv")
      if (tasksCSV) exports.push(tasksCSV)
    }

    if (exportOptions.rules || exportOptions.weights) {
      const rulesJSON = generateRulesJSON()
      exports.push(rulesJSON)
    }

    // Download all files
    exports.forEach((file) => {
      const type = file.filename.endsWith(".json") ? "application/json" : "text/csv"
      downloadFile(file.filename, file.content, type)
    })

    setIsExporting(false)
  }

  const getExportSummary = () => {
    const summary = []
    if (exportOptions.clients) summary.push(`${clients.length} clients`)
    if (exportOptions.workers) summary.push(`${workers.length} workers`)
    if (exportOptions.tasks) summary.push(`${tasks.length} tasks`)
    if (exportOptions.rules) summary.push(`${businessRules.filter((r) => r.active).length} rules`)
    if (exportOptions.weights) summary.push("priority weights")
    return summary.join(", ")
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Package className="h-5 w-5" />
            Export Configuration
          </CardTitle>
          <CardDescription className="text-white/70">
            Download your cleaned data and comprehensive configuration files
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Validation Status */}
          <div className="mb-6">
            <h3 className="font-medium mb-3 text-white">Data Quality Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 glass-card rounded-lg">
                {hasErrors ? (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                )}
                <div>
                  <div className={`font-semibold ${hasErrors ? "text-red-400" : "text-green-400"}`}>
                    {hasErrors ? "Has Errors" : "Clean Data"}
                  </div>
                  <div className="text-sm text-white/60">
                    {validationErrors.filter((e) => e.severity === "error").length} errors
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 glass-card rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div>
                  <div className="font-semibold text-yellow-400">Warnings</div>
                  <div className="text-sm text-white/60">
                    {validationErrors.filter((e) => e.severity === "warning").length} warnings
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 glass-card rounded-lg">
                <FileText className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="font-semibold text-blue-400">Configuration</div>
                  <div className="text-sm text-white/60">
                    {businessRules.filter((r) => r.active).length} rules + weights
                  </div>
                </div>
              </div>
            </div>
          </div>

          {hasErrors && (
            <Alert className="glass-card border-red-500/30 mb-6">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-white">
                Your data contains validation errors. Please fix these issues before exporting for production use.
              </AlertDescription>
            </Alert>
          )}

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="font-medium text-white">Export Options</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white/80">Data Files (CSV)</h4>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-clients"
                    checked={exportOptions.clients}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({ ...prev, clients: checked as boolean }))
                    }
                  />
                  <label htmlFor="export-clients" className="text-sm text-white cursor-pointer">
                    Clients CSV ({clients.length} records)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-workers"
                    checked={exportOptions.workers}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({ ...prev, workers: checked as boolean }))
                    }
                  />
                  <label htmlFor="export-workers" className="text-sm text-white cursor-pointer">
                    Workers CSV ({workers.length} records)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-tasks"
                    checked={exportOptions.tasks}
                    onCheckedChange={(checked) => setExportOptions((prev) => ({ ...prev, tasks: checked as boolean }))}
                  />
                  <label htmlFor="export-tasks" className="text-sm text-white cursor-pointer">
                    Tasks CSV ({tasks.length} records)
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white/80">Configuration Files (JSON)</h4>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-rules"
                    checked={exportOptions.rules}
                    onCheckedChange={(checked) => setExportOptions((prev) => ({ ...prev, rules: checked as boolean }))}
                  />
                  <label htmlFor="export-rules" className="text-sm text-white cursor-pointer">
                    Business Rules ({businessRules.filter((r) => r.active).length} active)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export-weights"
                    checked={exportOptions.weights}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({ ...prev, weights: checked as boolean }))
                    }
                  />
                  <label htmlFor="export-weights" className="text-sm text-white cursor-pointer">
                    Priority Weights & Allocation Settings
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Weights Preview */}
          {exportOptions.weights && (
            <div className="mt-6 p-4 glass-card rounded-lg border-blue-500/30">
              <h4 className="font-medium mb-2 text-white">Priority Weights Configuration</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {Object.entries(priorityWeights).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize text-white/80">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                    <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                      {value}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Summary */}
          <div className="mt-6 p-4 glass-card rounded-lg">
            <h4 className="font-medium mb-2 text-white">Export Summary</h4>
            <p className="text-sm text-white/70 mb-3">Ready to export: {getExportSummary()}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                Data Quality: {hasErrors ? "Needs Attention" : "Good"}
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                Rules: {businessRules.filter((r) => r.active).length} Active
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                Total Records: {clients.length + workers.length + tasks.length}
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                Weights Total: {Object.values(priorityWeights).reduce((sum, weight) => sum + weight, 0)}%
              </Badge>
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-6">
            <Button
              onClick={handleExport}
              disabled={isExporting || Object.values(exportOptions).every((v) => !v)}
              className="w-full btn-primary"
              size="lg"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Preparing Export Package...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Complete Configuration Package
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Instructions */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white">Integration Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-medium border border-blue-500/30">
                1
              </div>
              <div>
                <div className="font-medium text-white">Download Configuration Package</div>
                <div className="text-white/70">
                  Export generates cleaned CSV files and a comprehensive allocation-rules-config.json file
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-medium border border-blue-500/30">
                2
              </div>
              <div>
                <div className="font-medium text-white">Integrate with Resource Allocator</div>
                <div className="text-white/70">
                  Use the JSON configuration file to set up your downstream allocation system with all rules and weights
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-medium border border-blue-500/30">
                3
              </div>
              <div>
                <div className="font-medium text-white">Monitor and Optimize</div>
                <div className="text-white/70">
                  Return to Data Alchemist to refine rules and priorities based on allocation performance
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 glass-card rounded-lg border-yellow-500/30">
            <div className="font-medium text-yellow-400">Configuration File Contents:</div>
            <ul className="text-sm text-white/70 mt-1 space-y-1">
              <li>• Business rules with parameters</li>
              <li>• Priority weights and criteria descriptions</li>
              <li>• Allocation constraints and settings</li>
              <li>• Data quality metadata</li>
              <li>• Entity counts and validation status</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
