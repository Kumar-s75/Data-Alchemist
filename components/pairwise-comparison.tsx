"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"
import { useData } from "@/contexts/data-context"

interface Comparison {
  criteriaA: string
  criteriaB: string
  preference: number // 1-9 scale (1 = equal, 9 = extremely more important)
}

export default function PairwiseComparison() {
  const { priorityWeights, setPriorityWeights } = useData()
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [currentComparison, setCurrentComparison] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const criteria = Object.keys(priorityWeights)
  const criteriaNames = {
    priorityLevel: "Client Priority Level",
    taskFulfillment: "Task Fulfillment",
    fairness: "Fairness",
    workloadBalance: "Workload Balance",
    skillMatch: "Skill Matching",
    clientSatisfaction: "Client Satisfaction",
  }

  const scaleLabels = {
    1: "Equal importance",
    2: "Slightly more important",
    3: "Moderately more important",
    4: "Moderately to strongly more important",
    5: "Strongly more important",
    6: "Strongly to very strongly more important",
    7: "Very strongly more important",
    8: "Very to extremely strongly more important",
    9: "Extremely more important",
  }

  useEffect(() => {
    // Generate all pairwise comparisons
    const pairs: Comparison[] = []
    for (let i = 0; i < criteria.length; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        pairs.push({
          criteriaA: criteria[i],
          criteriaB: criteria[j],
          preference: 1, // Default to equal
        })
      }
    }
    setComparisons(pairs)
    setCurrentComparison(0)
    setIsComplete(false)
  }, [])

  const updateComparison = (preference: number) => {
    const newComparisons = [...comparisons]
    newComparisons[currentComparison].preference = preference
    setComparisons(newComparisons)
  }

  const nextComparison = () => {
    if (currentComparison < comparisons.length - 1) {
      setCurrentComparison(currentComparison + 1)
    } else {
      setIsComplete(true)
      calculateWeights()
    }
  }

  const previousComparison = () => {
    if (currentComparison > 0) {
      setCurrentComparison(currentComparison - 1)
    }
  }

  const resetComparisons = () => {
    const resetComparisons = comparisons.map((comp) => ({ ...comp, preference: 1 }))
    setComparisons(resetComparisons)
    setCurrentComparison(0)
    setIsComplete(false)
  }

  const calculateWeights = () => {
    // Simplified AHP calculation
    const n = criteria.length
    const matrix: number[][] = Array(n)
      .fill(null)
      .map(() => Array(n).fill(1))

    // Fill the comparison matrix
    comparisons.forEach((comp) => {
      const indexA = criteria.indexOf(comp.criteriaA)
      const indexB = criteria.indexOf(comp.criteriaB)

      matrix[indexA][indexB] = comp.preference
      matrix[indexB][indexA] = 1 / comp.preference
    })

    // Calculate geometric mean of each row (simplified eigenvector calculation)
    const weights = matrix.map((row) => {
      const product = row.reduce((prod, val) => prod * val, 1)
      return Math.pow(product, 1 / n)
    })

    // Normalize weights
    const sum = weights.reduce((total, weight) => total + weight, 0)
    const normalizedWeights = weights.map((weight) => Math.round((weight / sum) * 100))

    // Apply to priority weights
    const newWeights = { ...priorityWeights }
    criteria.forEach((criterion, index) => {
      newWeights[criterion as keyof typeof priorityWeights] = normalizedWeights[index]
    })

    setPriorityWeights(newWeights)
  }

  const progress = ((currentComparison + 1) / comparisons.length) * 100

  if (comparisons.length === 0) {
    return <div className="text-white">Loading comparisons...</div>
  }

  const current = comparisons[currentComparison]

  return (
    <div className="space-y-4">
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white">Pairwise Comparison (Analytic Hierarchy Process)</CardTitle>
          <CardDescription className="text-white/70">
            Compare criteria two at a time to build a weight matrix. This method provides more accurate relative
            weights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isComplete ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                  Comparison {currentComparison + 1} of {comparisons.length}
                </Badge>
                <Progress value={progress} className="w-1/2" />
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium text-white">
                  Which criterion is more important for resource allocation?
                </h3>

                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="p-4 border-2 border-blue-500/30 rounded-lg bg-blue-500/10">
                      <h4 className="font-medium text-blue-400">
                        {criteriaNames[current.criteriaA as keyof typeof criteriaNames]}
                      </h4>
                    </div>
                  </div>

                  <div className="text-2xl font-bold text-white/40">VS</div>

                  <div className="text-center">
                    <div className="p-4 border-2 border-green-500/30 rounded-lg bg-green-500/10">
                      <h4 className="font-medium text-green-400">
                        {criteriaNames[current.criteriaB as keyof typeof criteriaNames]}
                      </h4>
                    </div>
                  </div>
                </div>

                <RadioGroup
                  value={current.preference.toString()}
                  onValueChange={(value) => updateComparison(Number.parseInt(value))}
                  className="space-y-3"
                >
                  {Object.entries(scaleLabels).map(([value, label]) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value} id={value} />
                      <Label htmlFor={value} className="flex-1 cursor-pointer text-white">
                        <div className="flex justify-between">
                          <span>{label}</span>
                          <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                            {value}/9
                          </Badge>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={previousComparison}
                  disabled={currentComparison === 0}
                  className="glass-button bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <Button onClick={resetComparisons} variant="outline" className="glass-button bg-transparent">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All
                </Button>

                <Button onClick={nextComparison} className="btn-primary">
                  {currentComparison === comparisons.length - 1 ? "Calculate Weights" : "Next"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-green-400">
                <h3 className="text-lg font-medium">Pairwise Comparison Complete!</h3>
                <p className="text-sm text-white/70">
                  Weights have been calculated and applied based on your comparisons.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                {Object.entries(priorityWeights).map(([key, weight]) => (
                  <div key={key} className="p-3 glass-card rounded-lg">
                    <div className="font-medium capitalize text-white">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                    <div className="text-2xl font-bold text-blue-400">{weight}%</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={resetComparisons} variant="outline" className="glass-button bg-transparent">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
                <Button onClick={() => setCurrentComparison(0)} className="btn-primary">
                  Review Comparisons
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
