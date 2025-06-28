"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit3, Wand2, CheckCircle, AlertTriangle } from "lucide-react"
import { useData } from "@/contexts/data-context"

interface Modification {
  entity_type: "clients" | "workers" | "tasks"
  entity_id: string
  field: string
  current_value: any
  new_value: any
  reasoning: string
  confidence: number
  safe_to_apply: boolean
}

export default function NaturalLanguageModifier() {
  const { clients, workers, tasks, updateClient, updateWorker, updateTask } = useData()
  const [query, setQuery] = useState("")
  const [modifications, setModifications] = useState<Modification[]>([])
  const [selectedMods, setSelectedMods] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  const processModificationRequest = async () => {
    setIsProcessing(true)

    try {
      const response = await fetch("/api/ai/natural-language-modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, clients, workers, tasks }),
      })

      if (!response.ok) throw new Error("Modification processing failed")

      const result = await response.json()
      setModifications(result.modifications)

      // Auto-select safe, high-confidence modifications
      const autoSelect = new Set(
        result.modifications
          .filter((mod: Modification) => mod.safe_to_apply && mod.confidence > 0.8)
          .map((mod: Modification, index: number) => index.toString()),
      )
      setSelectedMods(autoSelect)
    } catch (error) {
      console.error("Failed to process modification request:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const applyModifications = async () => {
    setIsApplying(true)

    try {
      modifications.forEach((mod, index) => {
        if (selectedMods.has(index.toString())) {
          const updates = { [mod.field]: mod.new_value }

          switch (mod.entity_type) {
            case "clients":
              updateClient(mod.entity_id, updates)
              break
            case "workers":
              updateWorker(mod.entity_id, updates)
              break
            case "tasks":
              updateTask(mod.entity_id, updates)
              break
          }
        }
      })

      // Clear applied modifications
      setModifications((prev) => prev.filter((_, index) => !selectedMods.has(index.toString())))
      setSelectedMods(new Set())
      setQuery("")
    } catch (error) {
      console.error("Failed to apply modifications:", error)
    } finally {
      setIsApplying(false)
    }
  }

  const toggleModification = (index: string) => {
    setSelectedMods((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
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
          <Edit3 className="h-5 w-5 text-blue-600" />
          Natural Language Data Modification
        </CardTitle>
        <CardDescription>
          Describe changes you want to make to your data in plain English, and AI will suggest specific modifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Textarea
              placeholder="e.g., 'Set all frontend workers to qualification level 4' or 'Increase priority of enterprise clients by 1' or 'Add React skill to all JavaScript workers'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Examples:</span>
            {[
              "Set all frontend workers to qualification level 4",
              "Increase priority of enterprise clients by 1",
              "Add React skill to all JavaScript workers",
              "Set duration of all development tasks to 2 phases",
            ].map((example) => (
              <Button key={example} variant="outline" size="sm" onClick={() => setQuery(example)} className="text-xs">
                {example}
              </Button>
            ))}
          </div>

          <Button onClick={processModificationRequest} disabled={!query.trim() || isProcessing} className="w-full">
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing with AI...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Modifications
              </>
            )}
          </Button>

          {modifications.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">Suggested Modifications ({modifications.length})</h3>
                  <Badge variant="secondary">{selectedMods.size} selected</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMods(new Set(modifications.map((_, i) => i.toString())))}
                  >
                    Select All
                  </Button>
                  <Button onClick={applyModifications} disabled={selectedMods.size === 0 || isApplying}>
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
                {modifications.map((mod, index) => {
                  const isSelected = selectedMods.has(index.toString())

                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${isSelected ? "bg-blue-50 border-blue-200" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleModification(index.toString())}
                          className="mt-1"
                        />

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{mod.entity_id}</Badge>
                              <Badge variant="secondary">{mod.field}</Badge>
                              <Badge className={getConfidenceColor(mod.confidence)}>
                                {Math.round(mod.confidence * 100)}% confident
                              </Badge>
                              {mod.safe_to_apply && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Safe to apply
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-red-600">Current:</span>
                              <div className="bg-red-50 p-2 rounded mt-1">{JSON.stringify(mod.current_value)}</div>
                            </div>
                            <div>
                              <span className="font-medium text-green-600">New:</span>
                              <div className="bg-green-50 p-2 rounded mt-1">{JSON.stringify(mod.new_value)}</div>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600">
                            <strong>Reasoning:</strong> {mod.reasoning}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {modifications.length === 0 && !isProcessing && query && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No modifications could be generated for this request. Try rephrasing or being more specific.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
