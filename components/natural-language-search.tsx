"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Sparkles, Filter } from "lucide-react"
import { useData } from "@/contexts/data-context"

export default function NaturalLanguageSearch() {
  const { clients, workers, tasks } = useData()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const processNaturalLanguageQuery = async (query: string) => {
    setIsSearching(true)

    try {
      const response = await fetch("/api/ai/natural-language-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, clients, workers, tasks }),
      })

      if (!response.ok) throw new Error("Search failed")

      const searchParams = await response.json()

      
      let filteredResults: any[] = []

      searchParams.target_entities.forEach((entityType: string) => {
        let entityData = entityType === "clients" ? clients : entityType === "workers" ? workers : tasks

        searchParams.filters.forEach((filter: any) => {
          entityData = entityData.filter((item: any) => {
            const fieldValue = item[filter.field]

            switch (filter.operator) {
              case "equals":
                return fieldValue === filter.value
              case "greater_than":
                return Number(fieldValue) > Number(filter.value)
              case "less_than":
                return Number(fieldValue) < Number(filter.value)
              case "contains":
                return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase())
              case "in":
                return Array.isArray(fieldValue)
                  ? fieldValue.some((v: any) => filter.value.includes(v))
                  : filter.value.includes(fieldValue)
              default:
                return true
            }
          })
        })

        filteredResults = [...filteredResults, ...entityData]
      })

      setResults(filteredResults)
    } catch (error) {
      console.error("AI search failed:", error)
    
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = () => {
    if (query.trim()) {
      processNaturalLanguageQuery(query)
    }
  }

  const getEntityType = (item: any) => {
    if (item.ClientID) return "client"
    if (item.WorkerID) return "worker"
    if (item.TaskID) return "task"
    return "unknown"
  }

  const getEntityName = (item: any) => {
    return item.ClientName || item.WorkerName || item.TaskName || "Unknown"
  }

  const getEntityId = (item: any) => {
    return item.ClientID || item.WorkerID || item.TaskID || "Unknown"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Natural Language Search
        </CardTitle>
        <CardDescription>
          Search your data using plain English. Try: "Tasks with duration more than 2 phases" or "Workers with
          JavaScript skills"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="e.g., 'Show me high priority clients' or 'Workers available in phase 2'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

      
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm text-gray-500">Try these:</span>
          {[
            "Tasks with duration more than 1 phase",
            "Workers with JavaScript skills",
            "High priority clients",
            "Workers available in phase 2",
          ].map((sample) => (
            <Button
              key={sample}
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery(sample)
                processNaturalLanguageQuery(sample)
              }}
              className="text-xs"
            >
              {sample}
            </Button>
          ))}
        </div>

    
        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Search Results ({results.length})</span>
            </div>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {results.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {getEntityType(item)}
                    </Badge>
                    <span className="font-medium">{getEntityName(item)}</span>
                    <span className="text-sm text-gray-500">({getEntityId(item)})</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {getEntityType(item) === "task" && `Duration: ${item.Duration} phases`}
                    {getEntityType(item) === "worker" && `Skills: ${item.Skills.join(", ")}`}
                    {getEntityType(item) === "client" && `Priority: ${item.PriorityLevel}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {query && results.length === 0 && !isSearching && (
          <div className="text-center py-4 text-gray-500">
            No results found for "{query}". Try rephrasing your search.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
