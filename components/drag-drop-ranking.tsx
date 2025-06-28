"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react"
import { useData } from "@/contexts/data-context"

interface CriteriaItem {
  key: string
  name: string
  description: string
  weight: number
}

export default function DragDropRanking() {
  const { priorityWeights, setPriorityWeights } = useData()
  const [criteria, setCriteria] = useState<CriteriaItem[]>([])
  const [draggedItem, setDraggedItem] = useState<number | null>(null)

  const criteriaDescriptions = {
    priorityLevel: "Weight given to client priority levels (1-5)",
    taskFulfillment: "Importance of completing requested tasks",
    fairness: "Ensuring equitable distribution across workers",
    workloadBalance: "Balancing workload to prevent overutilization",
    skillMatch: "Matching tasks to workers with optimal skills",
    clientSatisfaction: "Overall client satisfaction and relationship management",
  }

  useEffect(() => {
    const criteriaArray = Object.entries(priorityWeights).map(([key, weight]) => ({
      key,
      name: key.replace(/([A-Z])/g, " $1").trim(),
      description: criteriaDescriptions[key as keyof typeof criteriaDescriptions],
      weight,
    }))

    // Sort by current weight (highest first)
    criteriaArray.sort((a, b) => b.weight - a.weight)
    setCriteria(criteriaArray)
  }, [priorityWeights])

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newCriteria = [...criteria]
    const [movedItem] = newCriteria.splice(fromIndex, 1)
    newCriteria.splice(toIndex, 0, movedItem)
    setCriteria(newCriteria)
  }

  const moveUp = (index: number) => {
    if (index > 0) {
      moveItem(index, index - 1)
    }
  }

  const moveDown = (index: number) => {
    if (index < criteria.length - 1) {
      moveItem(index, index + 1)
    }
  }

  const applyRanking = () => {
    // Convert ranking to weights (highest rank gets highest weight)
    const totalItems = criteria.length
    const newWeights = { ...priorityWeights }

    criteria.forEach((item, index) => {
      // Use exponential decay for more pronounced differences
      const rank = index + 1
      const weight = Math.round(
        (Math.pow(totalItems - rank + 1, 1.5) /
          criteria.reduce((sum, _, i) => sum + Math.pow(totalItems - i, 1.5), 0)) *
          100,
      )
      newWeights[item.key as keyof typeof priorityWeights] = weight
    })

    // Normalize to ensure sum is 100
    const total = Object.values(newWeights).reduce((sum, weight) => sum + weight, 0)
    const factor = 100 / total
    Object.keys(newWeights).forEach((key) => {
      newWeights[key as keyof typeof newWeights] = Math.round(newWeights[key as keyof typeof newWeights] * factor)
    })

    setPriorityWeights(newWeights)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedItem !== null && draggedItem !== dropIndex) {
      moveItem(draggedItem, dropIndex)
    }
    setDraggedItem(null)
  }

  const getRankColor = (index: number) => {
    const colors = [
      "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", // 1st - Gold
      "bg-gray-500/20 text-gray-400 border-gray-500/30", // 2nd - Silver
      "bg-orange-500/20 text-orange-400 border-orange-500/30", // 3rd - Bronze
      "bg-blue-500/20 text-blue-400 border-blue-500/30", // 4th+
      "bg-green-500/20 text-green-400 border-green-500/30",
      "bg-purple-500/20 text-purple-400 border-purple-500/30",
    ]
    return colors[index] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }

  return (
    <div className="space-y-4">
      <Card className="glass-card rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white">Drag & Drop Ranking</CardTitle>
          <CardDescription className="text-white/70">
            Drag criteria to reorder by importance. Higher position = higher priority in allocation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {criteria.map((item, index) => (
              <div
                key={item.key}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`p-4 border-2 rounded-lg cursor-move transition-all glass-card ${
                  draggedItem === index ? "opacity-50 scale-95" : ""
                } ${getRankColor(index)}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <GripVertical className="h-5 w-5 text-white/40" />
                    <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20">
                      #{index + 1}
                    </Badge>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium capitalize text-white">{item.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                          {item.weight}%
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                            className="h-6 w-6 p-0 glass-button"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveDown(index)}
                            disabled={index === criteria.length - 1}
                            className="h-6 w-6 p-0 glass-button"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-white/70">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-white/60">
              Drag items to reorder, or use arrow buttons. Higher position = higher weight.
            </div>
            <Button onClick={applyRanking} className="btn-primary">
              Apply Ranking to Weights
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
