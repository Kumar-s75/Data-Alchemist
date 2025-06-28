"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lightbulb, Plus, X, TrendingUp } from "lucide-react"
import { useData, type BusinessRule } from "@/contexts/data-context"

interface RuleRecommendation {
  type: "coRun" | "slotRestriction" | "loadLimit" | "phaseWindow" | "patternMatch" | "precedence"
  title: string
  description: string
  reasoning: string
  confidence: number
  priority: "high" | "medium" | "low"
  parameters: Record<string, any>
  affected_entities: string[]
}

interface DetectedPattern {
  pattern_type: string
  description: string
  entities: string[]
  frequency: number
}

export default function AIRuleRecommendations() {
  const { clients, workers, tasks, businessRules, addBusinessRule } = useData()
  const [recommendations, setRecommendations] = useState<RuleRecommendation[]>([])
  const [patterns, setPatterns] = useState<DetectedPattern[]>([])
  const [dismissedRecs, setDismissedRecs] = useState<Set<string>>(new Set())
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const generateRecommendations = async () => {
    setIsAnalyzing(true)

    try {
      const response = await fetch("/api/ai/rule-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clients,
          workers,
          tasks,
          existingRules: businessRules,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate recommendations")

      const result = await response.json()
      setRecommendations(result.recommendations)
      setPatterns(result.patterns_detected)
    } catch (error) {
      console.error("Failed to generate rule recommendations:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const acceptRecommendation = (rec: RuleRecommendation) => {
    const newRule: BusinessRule = {
      id: `ai-rec-${Date.now()}`,
      type: rec.type,
      name: rec.title,
      description: `${rec.description} (AI Recommended - ${Math.round(rec.confidence * 100)}% confidence)`,
      parameters: rec.parameters,
      active: true,
    }

    addBusinessRule(newRule)
    dismissRecommendation(rec.title)
  }

  const dismissRecommendation = (title: string) => {
    setDismissedRecs((prev) => new Set([...prev, title]))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-100"
    if (confidence >= 0.6) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  useEffect(() => {
    if (clients.length > 0 || workers.length > 0 || tasks.length > 0) {
      generateRecommendations()
    }
  }, [clients, workers, tasks, businessRules])

  const visibleRecommendations = recommendations.filter((rec) => !dismissedRecs.has(rec.title))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          AI Rule Recommendations
        </CardTitle>
        <CardDescription>
          AI analyzes your data patterns and suggests business rules to optimize resource allocation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isAnalyzing && (
            <Alert>
              <TrendingUp className="h-4 w-4 animate-pulse" />
              <AlertDescription>AI is analyzing data patterns and generating rule recommendations...</AlertDescription>
            </Alert>
          )}

          {patterns.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Detected Patterns</h3>
              <div className="grid gap-2">
                {patterns.map((pattern, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-blue-700">{pattern.pattern_type}</div>
                        <div className="text-sm text-blue-600">{pattern.description}</div>
                        <div className="text-xs text-blue-500 mt-1">
                          Entities: {pattern.entities.join(", ")} • Frequency: {pattern.frequency}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {visibleRecommendations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Rule Recommendations ({visibleRecommendations.length})</h3>
                <Button variant="outline" size="sm" onClick={generateRecommendations}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {visibleRecommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{rec.title}</h4>
                        <Badge className={getPriorityColor(rec.priority)}>{rec.priority} priority</Badge>
                        <Badge className={getConfidenceColor(rec.confidence)}>
                          {Math.round(rec.confidence * 100)}% confident
                        </Badge>
                        <Badge variant="outline">{rec.type}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => acceptRecommendation(rec)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => dismissRecommendation(rec.title)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600">{rec.description}</p>

                    <div className="text-xs text-gray-500">
                      <strong>Reasoning:</strong> {rec.reasoning}
                    </div>

                    <div className="text-xs text-gray-500">
                      <strong>Affected entities:</strong> {rec.affected_entities.join(", ")}
                    </div>

                    <div className="text-xs text-gray-500">
                      <strong>Parameters:</strong> {JSON.stringify(rec.parameters)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {visibleRecommendations.length === 0 && !isAnalyzing && (
            <div className="text-center py-8 text-gray-500">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No rule recommendations available. AI will analyze your data and suggest optimizations.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
