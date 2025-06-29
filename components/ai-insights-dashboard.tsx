"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp, Zap, AlertCircle, CheckCircle } from "lucide-react"
import { useData } from "@/contexts/data-context"

interface AIInsight {
  type: "optimization" | "risk" | "opportunity" | "pattern"
  title: string
  description: string
  impact: "high" | "medium" | "low"
  confidence: number
  actionable: boolean
  metrics?: Record<string, number>
}

export default function AIInsightsDashboard() {
  const { clients, workers, tasks } = useData()
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const generateInsights = async () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    // Simulate AI analysis progress
    const progressSteps = [
      "Analyzing resource capacity...",
      "Identifying skill gaps...",
      "Detecting workload patterns...",
      "Evaluating priority conflicts...",
      "Generating optimization recommendations...",
    ]

    for (let i = 0; i < progressSteps.length; i++) {
      setAnalysisProgress((i + 1) * 20)
      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    // Generate sample insights based on actual data
    const generatedInsights: AIInsight[] = []

    // Capacity Analysis
    const totalDemand = clients.reduce((sum, client) => sum + client.RequestedTaskIDs.length, 0)
    const totalCapacity = workers.reduce((sum, worker) => sum + worker.MaxLoadPerPhase, 0)

    if (totalDemand > totalCapacity * 0.8) {
      generatedInsights.push({
        type: "risk",
        title: "Capacity Constraint Risk",
        description: `Current demand (${totalDemand} tasks) is approaching capacity limits (${totalCapacity} max slots). Consider adding resources or adjusting priorities.`,
        impact: "high",
        confidence: 0.85,
        actionable: true,
        metrics: { demand: totalDemand, capacity: totalCapacity, utilization: (totalDemand / totalCapacity) * 100 },
      })
    }

    // Skill Gap Analysis
    const requiredSkills = [...new Set(tasks.flatMap((task) => task.RequiredSkills))]
    const availableSkills = [...new Set(workers.flatMap((worker) => worker.Skills))]
    const missingSkills = requiredSkills.filter((skill) => !availableSkills.includes(skill))

    if (missingSkills.length > 0) {
      generatedInsights.push({
        type: "risk",
        title: "Critical Skill Gaps Detected",
        description: `${missingSkills.length} required skills are not available in your workforce: ${missingSkills.join(", ")}`,
        impact: "high",
        confidence: 0.95,
        actionable: true,
        metrics: { missingSkills: missingSkills.length, totalSkills: requiredSkills.length },
      })
    }

    // Workload Distribution
    const workerGroups = [...new Set(workers.map((w) => w.WorkerGroup))]
    const groupCapacities = workerGroups.map((group) => ({
      group,
      capacity: workers.filter((w) => w.WorkerGroup === group).reduce((sum, w) => sum + w.MaxLoadPerPhase, 0),
    }))

    const maxCapacity = Math.max(...groupCapacities.map((g) => g.capacity))
    const minCapacity = Math.min(...groupCapacities.map((g) => g.capacity))

    if (maxCapacity > minCapacity * 2) {
      generatedInsights.push({
        type: "optimization",
        title: "Unbalanced Team Capacity",
        description: `Significant capacity imbalance detected across teams. Consider redistributing resources for better utilization.`,
        impact: "medium",
        confidence: 0.75,
        actionable: true,
        metrics: { maxCapacity, minCapacity, imbalanceRatio: maxCapacity / minCapacity },
      })
    }

    // Co-run Opportunities
  const tasksBySkills = tasks.reduce(
  (acc, task) => {
    const skillKey = (Array.isArray(task.RequiredSkills) ? task.RequiredSkills : [])
      .map((skill) => skill.trim())
      .sort()
      .join(",")
    if (!acc[skillKey]) acc[skillKey] = []
    acc[skillKey].push(task.TaskID)
    return acc
  },
  {} as Record<string, string[]>,
)


    const corunOpportunities = Object.entries(tasksBySkills).filter(([_, taskIds]) => taskIds.length > 1)

    if (corunOpportunities.length > 0) {
      generatedInsights.push({
        type: "opportunity",
        title: "Co-run Optimization Opportunities",
        description: `Found ${corunOpportunities.length} groups of tasks with similar skill requirements that could benefit from co-run rules.`,
        impact: "medium",
        confidence: 0.8,
        actionable: true,
        metrics: { opportunities: corunOpportunities.length },
      })
    }

    // Priority Analysis
    const highPriorityClients = clients.filter((c) => c.PriorityLevel >= 4).length
    const totalClients = clients.length

    if (highPriorityClients > totalClients * 0.6) {
      generatedInsights.push({
        type: "pattern",
        title: "Priority Inflation Detected",
        description: `${Math.round((highPriorityClients / totalClients) * 100)}% of clients have high priority (4-5). Consider reviewing priority assignments for better differentiation.`,
        impact: "medium",
        confidence: 0.7,
        actionable: true,
        metrics: {
          highPriority: highPriorityClients,
          total: totalClients,
          percentage: (highPriorityClients / totalClients) * 100,
        },
      })
    }

    setInsights(generatedInsights)
    setAnalysisProgress(100)
    setIsAnalyzing(false)
  }

  useEffect(() => {
    if (clients.length > 0 || workers.length > 0 || tasks.length > 0) {
      generateInsights()
    }
  }, [clients, workers, tasks])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "optimization":
        return <TrendingUp className="h-5 w-5 text-blue-600" />
      case "risk":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case "opportunity":
        return <Zap className="h-5 w-5 text-green-600" />
      case "pattern":
        return <Brain className="h-5 w-5 text-purple-600" />
      default:
        return <CheckCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-700"
      case "medium":
        return "bg-yellow-100 text-yellow-700"
      case "low":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Insights & Recommendations
        </CardTitle>
        <CardDescription>
          Advanced AI analysis of your resource allocation setup with actionable recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAnalyzing && (
          <div className="space-y-3 mb-6">
            <Progress value={analysisProgress} className="w-full" />
            <div className="text-sm text-gray-600">
              AI is analyzing your data patterns and generating insights... {analysisProgress}%
            </div>
          </div>
        )}

        {insights.length === 0 && !isAnalyzing && (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">AI insights will appear here once your data is analyzed</p>
            <Button onClick={generateInsights}>
              <Brain className="h-4 w-4 mr-2" />
              Generate AI Insights
            </Button>
          </div>
        )}

        {insights.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">AI-Generated Insights ({insights.length})</h3>
              <Button variant="outline" size="sm" onClick={generateInsights}>
                <Brain className="h-4 w-4 mr-2" />
                Refresh Analysis
              </Button>
            </div>

            <div className="grid gap-4">
              {insights.map((insight, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge className={getImpactColor(insight.impact)}>{insight.impact} impact</Badge>
                        <Badge variant="outline">{Math.round(insight.confidence * 100)}% confidence</Badge>
                        {insight.actionable && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            Actionable
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{insight.description}</p>

                      {insight.metrics && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(insight.metrics).map(([key, value]) => (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {key}: {typeof value === "number" ? Math.round(value) : value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
