"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Target, Zap, ArrowUpDown, Grid3X3, Shuffle } from "lucide-react"
import { useData } from "@/contexts/data-context"
import DragDropRanking from "@/components/drag-drop-ranking"
import PairwiseComparison from "@/components/pairwise-comparison"

export default function PrioritizationPanel() {
  const { priorityWeights, setPriorityWeights } = useData()
  const [selectedPreset, setSelectedPreset] = useState<string>("")

  const presets = [
    {
      id: "maximize-fulfillment",
      name: "Maximize Fulfillment",
      description: "Focus on completing as many requested tasks as possible",
      weights: {
        priorityLevel: 15,
        taskFulfillment: 45,
        fairness: 10,
        workloadBalance: 15,
        skillMatch: 10,
        clientSatisfaction: 5,
      },
    },
    {
      id: "fair-distribution",
      name: "Fair Distribution",
      description: "Ensure equitable workload distribution across all workers",
      weights: {
        priorityLevel: 10,
        taskFulfillment: 15,
        fairness: 40,
        workloadBalance: 25,
        skillMatch: 5,
        clientSatisfaction: 5,
      },
    },
    {
      id: "minimize-workload",
      name: "Minimize Workload",
      description: "Keep worker utilization low and manageable",
      weights: {
        priorityLevel: 20,
        taskFulfillment: 10,
        fairness: 15,
        workloadBalance: 40,
        skillMatch: 10,
        clientSatisfaction: 5,
      },
    },
    {
      id: "skill-optimization",
      name: "Skill Optimization",
      description: "Match tasks to workers with the best skill alignment",
      weights: {
        priorityLevel: 15,
        taskFulfillment: 20,
        fairness: 10,
        workloadBalance: 15,
        skillMatch: 35,
        clientSatisfaction: 5,
      },
    },
    {
      id: "client-priority",
      name: "Client Priority Focus",
      description: "Prioritize high-value clients and their satisfaction",
      weights: {
        priorityLevel: 35,
        taskFulfillment: 25,
        fairness: 5,
        workloadBalance: 10,
        skillMatch: 10,
        clientSatisfaction: 15,
      },
    },
    {
      id: "balanced-approach",
      name: "Balanced Approach",
      description: "Equal consideration of all factors",
      weights: {
        priorityLevel: 17,
        taskFulfillment: 17,
        fairness: 17,
        workloadBalance: 17,
        skillMatch: 16,
        clientSatisfaction: 16,
      },
    },
  ]

  const applyPreset = (preset: (typeof presets)[0]) => {
    setPriorityWeights(preset.weights)
    setSelectedPreset(preset.id)
  }

  const updateWeight = (key: keyof typeof priorityWeights, value: number[]) => {
    const newWeights = { ...priorityWeights, [key]: value[0] }

  
    const total = Object.values(newWeights).reduce((sum, weight) => sum + weight, 0)
    if (total !== 100) {
      const factor = 100 / total
      Object.keys(newWeights).forEach((k) => {
        newWeights[k as keyof typeof newWeights] = Math.round(newWeights[k as keyof typeof newWeights] * factor)
      })
    }

    setPriorityWeights(newWeights)
    setSelectedPreset("") 
  }

  const criteriaDescriptions = {
    priorityLevel: "Weight given to client priority levels (1-5)",
    taskFulfillment: "Importance of completing requested tasks",
    fairness: "Ensuring equitable distribution across workers",
    workloadBalance: "Balancing workload to prevent overutilization",
    skillMatch: "Matching tasks to workers with optimal skills",
    clientSatisfaction: "Overall client satisfaction and relationship management",
  }

  const normalizeWeights = () => {
    const total = Object.values(priorityWeights).reduce((sum, weight) => sum + weight, 0)
    if (total !== 100) {
      const factor = 100 / total
      const normalized = Object.keys(priorityWeights).reduce(
        (acc, key) => {
          acc[key as keyof typeof priorityWeights] = Math.round(
            priorityWeights[key as keyof typeof priorityWeights] * factor,
          )
          return acc
        },
        {} as typeof priorityWeights,
      )
      setPriorityWeights(normalized)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5" />
            Prioritization & Weights Configuration
          </CardTitle>
          <CardDescription className="text-white/70">
            Configure how the allocation system should balance different criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="presets" className="w-full">
            <TabsList className="agamify-tabs grid w-full grid-cols-4">
              <TabsTrigger value="presets" className="agamify-tab flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Presets
              </TabsTrigger>
              <TabsTrigger value="sliders" className="agamify-tab flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Sliders
              </TabsTrigger>
              <TabsTrigger value="ranking" className="agamify-tab flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" />
                Ranking
              </TabsTrigger>
              <TabsTrigger value="pairwise" className="agamify-tab flex items-center gap-1">
                <Grid3X3 className="h-3 w-3" />
                Pairwise
              </TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {presets.map((preset) => (
                  <Card
                    key={preset.id}
                    className={`glass-card cursor-pointer transition-all ${
                      selectedPreset === preset.id ? "ring-2 ring-blue-500 bg-blue-500/10" : ""
                    }`}
                    onClick={() => applyPreset(preset)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-white">{preset.name}</CardTitle>
                      <CardDescription className="text-sm text-white/70">{preset.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(preset.weights).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-sm capitalize text-white/80">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                              {value}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 glass-card rounded-lg">
                <h4 className="font-medium mb-2 text-white">Custom Preset</h4>
                <p className="text-sm text-white/70 mb-3">
                  Create your own preset by adjusting weights in other tabs, then save it for future use.
                </p>
                <Button variant="outline" size="sm" className="glass-button bg-transparent">
                  <Shuffle className="h-4 w-4 mr-2" />
                  Save Current as Preset
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="sliders" className="space-y-6">
              {Object.entries(priorityWeights).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="capitalize font-medium text-white">{key.replace(/([A-Z])/g, " $1").trim()}</Label>
                    <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                      {value}%
                    </Badge>
                  </div>
                  <p className="text-sm text-white/60 mb-2">
                    {criteriaDescriptions[key as keyof typeof criteriaDescriptions]}
                  </p>
                  <Slider
                    value={[value]}
                    onValueChange={(newValue) => updateWeight(key as keyof typeof priorityWeights, newValue)}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>
              ))}

              <div className="mt-6 p-4 glass-card rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">Total Weight:</span>
                  <Badge
                    variant={
                      Object.values(priorityWeights).reduce((sum, weight) => sum + weight, 0) === 100
                        ? "default"
                        : "destructive"
                    }
                    className={
                      Object.values(priorityWeights).reduce((sum, weight) => sum + weight, 0) === 100
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }
                  >
                    {Object.values(priorityWeights).reduce((sum, weight) => sum + weight, 0)}%
                  </Badge>
                </div>
                {Object.values(priorityWeights).reduce((sum, weight) => sum + weight, 0) !== 100 && (
                  <div className="mt-2">
                    <p className="text-sm text-red-400 mb-2">Weights should sum to 100% for optimal allocation</p>
                    <Button
                      onClick={normalizeWeights}
                      size="sm"
                      variant="outline"
                      className="glass-button bg-transparent"
                    >
                      Auto-Normalize to 100%
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ranking">
              <DragDropRanking />
            </TabsContent>

            <TabsContent value="pairwise">
              <PairwiseComparison />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

     
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5" />
            Current Weight Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(priorityWeights)
              .sort(([, a], [, b]) => b - a)
              .map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="capitalize font-medium text-white">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                    <span className="text-sm text-white/60">{value}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 glass-card rounded-lg">
              <div className="font-medium text-blue-400">Highest Priority</div>
              <div className="text-sm text-white/70">
                {
                  Object.entries(priorityWeights).reduce(
                    (max, [key, value]) =>
                      value > max.value ? { key: key.replace(/([A-Z])/g, " $1").trim(), value } : max,
                    { key: "", value: 0 },
                  ).key
                }{" "}
                ({Object.values(priorityWeights).reduce((max, value) => Math.max(max, value), 0)}%)
              </div>
            </div>

            <div className="p-3 glass-card rounded-lg">
              <div className="font-medium text-green-400">Balance Score</div>
              <div className="text-sm text-white/70">
                {Math.round(
                  100 - (Math.max(...Object.values(priorityWeights)) - Math.min(...Object.values(priorityWeights))),
                )}
                % balanced
              </div>
            </div>

            <div className="p-3 glass-card rounded-lg">
              <div className="font-medium text-purple-400">Active Criteria</div>
              <div className="text-sm text-white/70">
                {Object.values(priorityWeights).filter((v) => v > 0).length} of {Object.keys(priorityWeights).length}{" "}
                criteria
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
