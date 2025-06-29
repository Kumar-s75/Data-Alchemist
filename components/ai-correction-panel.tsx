"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Wand2, CheckCircle, AlertTriangle, Zap } from "lucide-react"
import { useData } from "@/contexts/data-context"

interface Correction {
  entity_id: string
  field: string
  current_value: any
  suggested_value: any
  reasoning: string
  confidence: number
  auto_applicable: boolean
}

interface BulkOperation {
  operation: string
  description: string
  affected_count: number
  preview: string
}

export default function AICorrectionPanel() {
  const { clients, workers, tasks, validationErrors, updateClient, updateWorker, updateTask } = useData()
  const [corrections, setCorrections] = useState<Correction[]>([])
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([])
  const [selectedCorrections, setSelectedCorrections] = useState<Set<string>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  const generateCorrections = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch("/api/ai/suggest-corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validationErrors, clients, workers, tasks }),
      })

      if (!response.ok) throw new Error("Failed to generate corrections")

      const result = await response.json()
      setCorrections(result.corrections)
      setBulkOperations(result.bulk_operations)

      
      const autoSelect = new Set(
        result.corrections
          .filter((c: Correction) => c.auto_applicable && c.confidence > 0.8)
          .map((c: Correction) => `${c.entity_id}-${c.field}`),
      )
      setSelectedCorrections(autoSelect)
    } catch (error) {
      console.error("Failed to generate corrections:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const applyCorrections = async () => {
    setIsApplying(true)

    try {
      corrections.forEach((correction) => {
        const correctionId = `${correction.entity_id}-${correction.field}`
        if (selectedCorrections.has(correctionId)) {
          const updates = { [correction.field]: correction.suggested_value }

          
          if (clients.some((c) => c.ClientID === correction.entity_id)) {
            updateClient(correction.entity_id, updates)
          } else if (workers.some((w) => w.WorkerID === correction.entity_id)) {
            updateWorker(correction.entity_id, updates)
          } else if (tasks.some((t) => t.TaskID === correction.entity_id)) {
            updateTask(correction.entity_id, updates)
          }
        }
      })

     
      setCorrections((prev) => prev.filter((c) => !selectedCorrections.has(`${c.entity_id}-${c.field}`)))
      setSelectedCorrections(new Set())
    } catch (error) {
      console.error("Failed to apply corrections:", error)
    } finally {
      setIsApplying(false)
    }
  }

  const toggleCorrection = (correctionId: string) => {
    setSelectedCorrections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(correctionId)) {
        newSet.delete(correctionId)
      } else {
        newSet.add(correctionId)
      }
      return newSet
    })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-100"
    if (confidence >= 0.6) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          AI-Powered Error Corrections
        </CardTitle>
        <CardDescription>Let AI analyze your validation errors and suggest specific corrections</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {corrections.length === 0 && !isGenerating && (
            <div className="text-center py-8">
              <Wand2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                Generate AI-powered suggestions to fix validation errors automatically
              </p>
              <Button onClick={generateCorrections} disabled={validationErrors.length === 0}>
                <Zap className="h-4 w-4 mr-2" />
                Generate Smart Corrections
              </Button>
            </div>
          )}

          {isGenerating && (
            <Alert>
              <Wand2 className="h-4 w-4 animate-pulse" />
              <AlertDescription>
                AI is analyzing your data and generating intelligent correction suggestions...
              </AlertDescription>
            </Alert>
          )}

          {corrections.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">Suggested Corrections ({corrections.length})</h3>
                  <Badge variant="secondary">{selectedCorrections.size} selected</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCorrections(new Set(corrections.map((c) => `${c.entity_id}-${c.field}`)))}
                  >
                    Select All
                  </Button>
                  <Button onClick={applyCorrections} disabled={selectedCorrections.size === 0 || isApplying}>
                    {isApplying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Applying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Apply Selected
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {corrections.map((correction, index) => {
                  const correctionId = `${correction.entity_id}-${correction.field}`
                  const isSelected = selectedCorrections.has(correctionId)

                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${isSelected ? "bg-blue-50 border-blue-200" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleCorrection(correctionId)}
                          className="mt-1"
                        />

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{correction.entity_id}</Badge>
                              <Badge variant="secondary">{correction.field}</Badge>
                              <Badge className={getConfidenceColor(correction.confidence)}>
                                {Math.round(correction.confidence * 100)}% confident
                              </Badge>
                              {correction.auto_applicable && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Safe to auto-apply
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-red-600">Current:</span>
                              <div className="bg-red-50 p-2 rounded mt-1">
                                {JSON.stringify(correction.current_value)}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-green-600">Suggested:</span>
                              <div className="bg-green-50 p-2 rounded mt-1">
                                {JSON.stringify(correction.suggested_value)}
                              </div>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600">
                            <strong>Reasoning:</strong> {correction.reasoning}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {bulkOperations.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-3">Bulk Operations</h3>
              <div className="space-y-2">
                {bulkOperations.map((operation, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{operation.description}</div>
                          <div className="text-sm opacity-80">
                            Affects {operation.affected_count} records • Preview: {operation.preview}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Apply {operation.operation}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
