"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Target, Mic, MicOff, Volume2, Brain, Sparkles } from "lucide-react"
import { useData } from "@/contexts/data-context"

interface Scenario {
  id: string
  name: string
  description: string
  parameters: Record<string, any>
  outcomes: {
    efficiency: number
    satisfaction: number
    workload: number
    cost: number
    timeline: number
  }
  aiInsights: string[]
  riskFactors: string[]
}

export default function DecisionTheater() {
  const { clients, workers, tasks, priorityWeights } = useData()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [activeScenario, setActiveScenario] = useState<string>("")
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationProgress, setSimulationProgress] = useState(0)
  const [isNarrating, setIsNarrating] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [currentNarration, setCurrentNarration] = useState("")

  // AI Narrator - Speaks insights and explanations
  const narrateInsight = async (text: string) => {
    if (!voiceEnabled) return

    setCurrentNarration(text)
    setIsNarrating(true)

    // Use Web Speech API for narration
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.1
      utterance.volume = 0.8

      utterance.onend = () => {
        setIsNarrating(false)
        setCurrentNarration("")
      }

      speechSynthesis.speak(utterance)
    }
  }

  // Generate AI-powered scenarios
  const generateScenarios = async () => {
    setIsSimulating(true)
    setSimulationProgress(0)

    try {
      // Simulate AI scenario generation
      const progressSteps = [
        { progress: 20, message: "Analyzing current data patterns..." },
        { progress: 40, message: "Generating alternative scenarios..." },
        { progress: 60, message: "Running predictive simulations..." },
        { progress: 80, message: "Calculating outcome probabilities..." },
        { progress: 100, message: "Preparing decision insights..." },
      ]

      for (const step of progressSteps) {
        setSimulationProgress(step.progress)
        await new Promise((resolve) => setTimeout(resolve, 800))
      }

      // Generate sample scenarios based on current data
      const generatedScenarios: Scenario[] = [
        {
          id: "efficiency-first",
          name: "Efficiency Maximizer",
          description: "Prioritize task completion speed and resource utilization",
          parameters: {
            taskFulfillment: 40,
            workloadBalance: 30,
            skillMatch: 20,
            fairness: 10,
          },
          outcomes: {
            efficiency: 92,
            satisfaction: 78,
            workload: 85,
            cost: 72,
            timeline: 88,
          },
          aiInsights: [
            "This scenario completes 23% more tasks in the same timeframe",
            "Worker utilization increases to 85% average",
            "Risk of burnout in high-performing teams increases by 15%",
          ],
          riskFactors: ["Potential worker burnout", "Uneven workload distribution", "Client satisfaction may decrease"],
        },
        {
          id: "balanced-harmony",
          name: "Balanced Harmony",
          description: "Equal focus on all factors for sustainable operations",
          parameters: {
            taskFulfillment: 25,
            workloadBalance: 25,
            skillMatch: 25,
            fairness: 25,
          },
          outcomes: {
            efficiency: 78,
            satisfaction: 88,
            workload: 72,
            cost: 82,
            timeline: 75,
          },
          aiInsights: [
            "Most sustainable approach for long-term operations",
            "Highest client satisfaction scores predicted",
            "Moderate efficiency with excellent team morale",
          ],
          riskFactors: ["May not meet aggressive deadlines", "Higher operational costs", "Slower task completion rate"],
        },
        {
          id: "client-delight",
          name: "Client Delight Focus",
          description: "Maximize client satisfaction and priority fulfillment",
          parameters: {
            priorityLevel: 45,
            clientSatisfaction: 30,
            taskFulfillment: 15,
            fairness: 10,
          },
          outcomes: {
            efficiency: 68,
            satisfaction: 95,
            workload: 78,
            cost: 88,
            timeline: 82,
          },
          aiInsights: [
            "Highest client retention probability (94%)",
            "Premium pricing opportunities increase by 28%",
            "Strong competitive advantage in client relationships",
          ],
          riskFactors: [
            "Internal team stress from high expectations",
            "Resource allocation inefficiencies",
            "Potential scope creep",
          ],
        },
      ]

      setScenarios(generatedScenarios)
      setActiveScenario(generatedScenarios[0].id)

      // AI Narration
      await narrateInsight(
        "I've generated three strategic scenarios based on your data. Each represents a different approach to resource allocation with unique trade-offs and outcomes.",
      )
    } catch (error) {
      console.error("Scenario generation failed:", error)
    } finally {
      setIsSimulating(false)
      setSimulationProgress(0)
    }
  }

  // Compare scenarios side by side
  const compareScenarios = () => {
    const comparison = scenarios.map((scenario) => ({
      name: scenario.name,
      efficiency: scenario.outcomes.efficiency,
      satisfaction: scenario.outcomes.satisfaction,
      totalScore: Object.values(scenario.outcomes).reduce((sum, val) => sum + val, 0) / 5,
    }))

    const winner = comparison.reduce((best, current) => (current.totalScore > best.totalScore ? current : best))

    narrateInsight(
      `Based on overall performance, the ${winner.name} scenario scores highest with ${Math.round(winner.totalScore)}% average across all metrics.`,
    )
  }

  const getOutcomeColor = (value: number) => {
    if (value >= 85) return "text-green-400 bg-green-500/20"
    if (value >= 70) return "text-yellow-400 bg-yellow-500/20"
    return "text-red-400 bg-red-500/20"
  }

  const activeScenarioData = scenarios.find((s) => s.id === activeScenario)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="h-6 w-6 text-purple-400" />
            AI Decision Theater
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              BETA
            </Badge>
          </CardTitle>
          <CardDescription className="text-white/70">
            Experience your allocation decisions through AI-powered scenario modeling with intelligent narration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button onClick={generateScenarios} disabled={isSimulating} className="btn-primary">
                {isSimulating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Scenarios...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Scenarios
                  </>
                )}
              </Button>

              {scenarios.length > 0 && (
                <Button onClick={compareScenarios} variant="outline" className="glass-button bg-transparent">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Compare All
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`glass-button ${voiceEnabled ? "bg-blue-500/20 border-blue-500/30" : "bg-transparent"}`}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>

              {isNarrating && (
                <div className="flex items-center gap-2 text-blue-400">
                  <Mic className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">AI Narrating...</span>
                </div>
              )}
            </div>
          </div>

          {isSimulating && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70">Generating scenarios...</span>
                <span className="text-sm font-medium text-white">{simulationProgress}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${simulationProgress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scenario Theater */}
      {scenarios.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-white">Available Scenarios</h3>
            {scenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className={`glass-card cursor-pointer transition-all ${
                  activeScenario === scenario.id ? "ring-2 ring-blue-500 bg-blue-500/10" : ""
                }`}
                onClick={() => {
                  setActiveScenario(scenario.id)
                  narrateInsight(`Now viewing ${scenario.name}: ${scenario.description}`)
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-white">{scenario.name}</CardTitle>
                  <CardDescription className="text-sm text-white/70">{scenario.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(scenario.outcomes).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize text-white/60">{key}:</span>
                        <Badge variant="secondary" className={getOutcomeColor(value)}>
                          {value}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Active Scenario Details */}
          {activeScenarioData && (
            <div className="lg:col-span-2 space-y-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white">{activeScenarioData.name}</CardTitle>
                  <CardDescription className="text-white/70">{activeScenarioData.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="outcomes" className="w-full">
                    <TabsList className="agamify-tabs grid w-full grid-cols-3">
                      <TabsTrigger value="outcomes" className="agamify-tab">
                        Outcomes
                      </TabsTrigger>
                      <TabsTrigger value="insights" className="agamify-tab">
                        AI Insights
                      </TabsTrigger>
                      <TabsTrigger value="risks" className="agamify-tab">
                        Risk Factors
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="outcomes" className="space-y-4">
                      {Object.entries(activeScenarioData.outcomes).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="capitalize font-medium text-white">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <Badge className={getOutcomeColor(value)}>{value}%</Badge>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="insights" className="space-y-3">
                      {activeScenarioData.aiInsights.map((insight, index) => (
                        <div key={index} className="p-3 glass-card rounded-lg border-blue-500/30">
                          <div className="flex items-start gap-2">
                            <Brain className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-white/80">{insight}</p>
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="risks" className="space-y-3">
                      {activeScenarioData.riskFactors.map((risk, index) => (
                        <div key={index} className="p-3 glass-card rounded-lg border-yellow-500/30">
                          <div className="flex items-start gap-2">
                            <Target className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-white/80">{risk}</p>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Live Narration Display */}
              {currentNarration && (
                <Card className="glass-card border-blue-500/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Mic className="h-4 w-4 text-blue-400 animate-pulse" />
                      <span className="text-sm font-medium text-blue-400">AI Narrator</span>
                    </div>
                    <p className="text-white/80 italic">"{currentNarration}"</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {scenarios.length === 0 && !isSimulating && (
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto mb-4 text-purple-400 opacity-50" />
              <h3 className="text-lg font-semibold text-white mb-2">Ready for Decision Theater</h3>
              <p className="text-white/60 mb-4">
                Generate AI-powered scenarios to explore different allocation strategies with intelligent insights and
                voice narration.
              </p>
              <Button onClick={generateScenarios} className="btn-primary">
                <Sparkles className="h-4 w-4 mr-2" />
                Start AI Scenario Generation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
