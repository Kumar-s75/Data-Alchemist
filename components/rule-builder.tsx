"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Sparkles, Settings, MessageSquare } from "lucide-react"
import { useData, type BusinessRule } from "@/contexts/data-context"
import AIRuleRecommendations from "@/components/ai-rule-recommendations"

export default function RuleBuilder() {
  const { businessRules, addBusinessRule, updateBusinessRule, removeBusinessRule, clients, workers, tasks } = useData()
  const [selectedRuleType, setSelectedRuleType] = useState<string>("")
  const [ruleParameters, setRuleParameters] = useState<Record<string, any>>({})
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("")
  const [isProcessingNL, setIsProcessingNL] = useState(false)

  const ruleTypes = [
    { value: "coRun", label: "Co-Run Tasks", description: "Tasks that must run together" },
    { value: "slotRestriction", label: "Slot Restriction", description: "Limit slots for specific groups" },
    { value: "loadLimit", label: "Load Limit", description: "Maximum load per worker group" },
    { value: "phaseWindow", label: "Phase Window", description: "Restrict tasks to specific phases" },
    { value: "patternMatch", label: "Pattern Match", description: "Rules based on patterns" },
    { value: "precedence", label: "Precedence Override", description: "Priority-based rule ordering" },
  ]

  const createRule = () => {
    if (!selectedRuleType) return

    const newRule: BusinessRule = {
      id: `rule-${Date.now()}`,
      type: selectedRuleType as any,
      name: ruleParameters.name || `${selectedRuleType} Rule`,
      description: ruleParameters.description || "",
      parameters: { ...ruleParameters },
      active: true,
    }

    addBusinessRule(newRule)
    setSelectedRuleType("")
    setRuleParameters({})
  }

  const processNaturalLanguageRule = async () => {
    setIsProcessingNL(true)

    try {
      const response = await fetch("/api/ai/generate-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naturalLanguageRule: naturalLanguageInput,
          clients,
          workers,
          tasks,
        }),
      })

      if (!response.ok) throw new Error("Rule generation failed")

      const aiRules = await response.json()

      // Add all generated rules
      aiRules.rules.forEach((rule: any) => {
        const newRule: BusinessRule = {
          id: `ai-rule-${Date.now()}-${Math.random()}`,
          type: rule.type,
          name: rule.name,
          description: `${rule.description} (AI Generated - ${Math.round(rule.confidence * 100)}% confidence)`,
          parameters: rule.parameters,
          active: true,
        }

        addBusinessRule(newRule)
      })

      setNaturalLanguageInput("")
    } catch (error) {
      console.error("AI rule generation failed:", error)
      // Fallback to simple rule generation
    } finally {
      setIsProcessingNL(false)
    }
  }

  const renderRuleParameters = () => {
    switch (selectedRuleType) {
      case "coRun":
        return (
          <div className="space-y-4">
            <div>
              <Label>Task IDs (comma-separated)</Label>
              <Input
                placeholder="T001, T002, T003"
                value={ruleParameters.tasks?.join(", ") || ""}
                onChange={(e) =>
                  setRuleParameters((prev) => ({
                    ...prev,
                    tasks: e.target.value.split(",").map((t) => t.trim()),
                  }))
                }
              />
            </div>
          </div>
        )

      case "loadLimit":
        return (
          <div className="space-y-4">
            <div>
              <Label>Worker Group</Label>
              <Select onValueChange={(value) => setRuleParameters((prev) => ({ ...prev, workerGroup: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select worker group" />
                </SelectTrigger>
                <SelectContent>
                  {[...new Set(workers.map((w) => w.WorkerGroup))].map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Max Slots Per Phase</Label>
              <Input
                type="number"
                placeholder="5"
                value={ruleParameters.maxSlotsPerPhase || ""}
                onChange={(e) =>
                  setRuleParameters((prev) => ({ ...prev, maxSlotsPerPhase: Number.parseInt(e.target.value) }))
                }
              />
            </div>
          </div>
        )

      case "phaseWindow":
        return (
          <div className="space-y-4">
            <div>
              <Label>Task ID</Label>
              <Select onValueChange={(value) => setRuleParameters((prev) => ({ ...prev, taskId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.TaskID} value={task.TaskID}>
                      {task.TaskID} - {task.TaskName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Allowed Phases (comma-separated)</Label>
              <Input
                placeholder="1, 2, 3"
                value={ruleParameters.allowedPhases?.join(", ") || ""}
                onChange={(e) =>
                  setRuleParameters((prev) => ({
                    ...prev,
                    allowedPhases: e.target.value
                      .split(",")
                      .map((p) => Number.parseInt(p.trim()))
                      .filter((n) => !isNaN(n)),
                  }))
                }
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Business Rules Configuration
          </CardTitle>
          <CardDescription>Create and manage business rules for resource allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ui-builder" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ui-builder">Rule Builder</TabsTrigger>
              <TabsTrigger value="natural-language" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Natural Language
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ui-builder" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Rule Type</Label>
                  <Select value={selectedRuleType} onValueChange={setSelectedRuleType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rule type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rule Name</Label>
                  <Input
                    placeholder="Enter rule name"
                    value={ruleParameters.name || ""}
                    onChange={(e) => setRuleParameters((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what this rule does"
                  value={ruleParameters.description || ""}
                  onChange={(e) => setRuleParameters((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {renderRuleParameters()}

              <Button onClick={createRule} disabled={!selectedRuleType} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </TabsContent>

            <TabsContent value="natural-language" className="space-y-4">
              <div>
                <Label>Describe Your Rule in Plain English</Label>
                <Textarea
                  placeholder="e.g., 'Tasks T001 and T002 should always run together' or 'Limit frontend workers to maximum 3 tasks per phase'"
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-500">Examples:</span>
                {[
                  "Tasks T001 and T002 should run together",
                  "Limit backend workers to 2 tasks per phase",
                  "Task T003 can only run in phase 1 and 2",
                ].map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    size="sm"
                    onClick={() => setNaturalLanguageInput(example)}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>

              <Button
                onClick={processNaturalLanguageRule}
                disabled={!naturalLanguageInput.trim() || isProcessingNL}
                className="w-full"
              >
                {isProcessingNL ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Rule with AI
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Rule Recommendations */}
      <AIRuleRecommendations />

      {/* Active Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Active Rules ({businessRules.length})</CardTitle>
          <CardDescription>Manage your configured business rules</CardDescription>
        </CardHeader>
        <CardContent>
          {businessRules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No rules configured yet. Create your first rule above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {businessRules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{rule.type}</Badge>
                      <h3 className="font-medium">{rule.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.active}
                        onCheckedChange={(checked) => updateBusinessRule(rule.id, { active: checked })}
                      />
                      <Button size="sm" variant="outline" onClick={() => removeBusinessRule(rule.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{rule.description}</p>

                  <div className="text-xs text-gray-500">
                    <strong>Parameters:</strong> {JSON.stringify(rule.parameters, null, 2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
