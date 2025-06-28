"use client"

import { useState } from "react"
import { useData, type ValidationError } from "@/contexts/data-context"

export function useComprehensiveValidation() {
  const { clients, workers, tasks, businessRules, setValidationErrors } = useData()
  const [isValidating, setIsValidating] = useState(false)

  const runComprehensiveValidation = async () => {
    setIsValidating(true)
    const errors: ValidationError[] = []

    try {
      // 1. Missing required columns
      clients.forEach((client, index) => {
        if (!client.ClientID) {
          errors.push({
            id: `missing-client-id-${index}`,
            type: "missing-required",
            severity: "error",
            message: "Missing required ClientID",
            entity: `Client-${index}`,
            field: "ClientID",
            suggestion: "Add a unique ClientID",
          })
        }
        if (!client.ClientName) {
          errors.push({
            id: `missing-client-name-${index}`,
            type: "missing-required",
            severity: "error",
            message: "Missing required ClientName",
            entity: client.ClientID || `Client-${index}`,
            field: "ClientName",
            suggestion: "Add a descriptive client name",
          })
        }
      })

      // 2. Duplicate IDs
      const clientIds = clients.map((c) => c.ClientID).filter(Boolean)
      const workerIds = workers.map((w) => w.WorkerID).filter(Boolean)
      const taskIds = tasks.map((t) => t.TaskID).filter(Boolean)

      const findDuplicates = (arr: string[], type: string) => {
        const duplicates = arr.filter((item, index) => arr.indexOf(item) !== index)
        duplicates.forEach((id) => {
          errors.push({
            id: `duplicate-${type}-${id}`,
            type: "duplicate-id",
            severity: "error",
            message: `Duplicate ${type}ID: ${id}`,
            entity: id,
            suggestion: `Rename one of the duplicate ${type} IDs`,
          })
        })
      }

      findDuplicates(clientIds, "Client")
      findDuplicates(workerIds, "Worker")
      findDuplicates(taskIds, "Task")

      // 3. Malformed lists
      workers.forEach((worker) => {
        if (worker.AvailableSlots && Array.isArray(worker.AvailableSlots)) {
          const invalidSlots = worker.AvailableSlots.filter((slot) => typeof slot !== "number" || slot < 1)
          if (invalidSlots.length > 0) {
            errors.push({
              id: `malformed-slots-${worker.WorkerID}`,
              type: "malformed-list",
              severity: "error",
              message: `Invalid AvailableSlots: ${invalidSlots.join(", ")}`,
              entity: worker.WorkerID,
              field: "AvailableSlots",
              suggestion: "AvailableSlots must be positive integers",
            })
          }
        }
      })

      // 4. Out-of-range values
      clients.forEach((client) => {
        if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
          errors.push({
            id: `invalid-priority-${client.ClientID}`,
            type: "out-of-range",
            severity: "error",
            message: `PriorityLevel must be 1-5, got ${client.PriorityLevel}`,
            entity: client.ClientID,
            field: "PriorityLevel",
            suggestion: "Set priority between 1 and 5",
          })
        }
      })

      tasks.forEach((task) => {
        if (task.Duration < 1) {
          errors.push({
            id: `invalid-duration-${task.TaskID}`,
            type: "out-of-range",
            severity: "error",
            message: `Duration must be ≥ 1, got ${task.Duration}`,
            entity: task.TaskID,
            field: "Duration",
            suggestion: "Set duration to at least 1 phase",
          })
        }
      })

      // 5. Broken JSON in AttributesJSON
      clients.forEach((client) => {
        if (client.AttributesJSON) {
          try {
            JSON.parse(client.AttributesJSON)
          } catch (e) {
            errors.push({
              id: `broken-json-${client.ClientID}`,
              type: "broken-json",
              severity: "error",
              message: "Invalid JSON in AttributesJSON",
              entity: client.ClientID,
              field: "AttributesJSON",
              suggestion: "Fix JSON syntax or use empty object {}",
            })
          }
        }
      })

      // 6. Unknown references
      clients.forEach((client) => {
        client.RequestedTaskIDs.forEach((taskId) => {
          if (!taskIds.includes(taskId)) {
            errors.push({
              id: `unknown-task-${client.ClientID}-${taskId}`,
              type: "unknown-reference",
              severity: "error",
              message: `Client ${client.ClientID} references unknown TaskID: ${taskId}`,
              entity: client.ClientID,
              field: "RequestedTaskIDs",
              suggestion: "Remove invalid task reference or add the missing task",
            })
          }
        })
      })

      // 7. Circular co-run groups (simplified check)
      const coRunRules = businessRules.filter((rule) => rule.type === "coRun" && rule.active)
      // This would need a more sophisticated graph algorithm for full circular dependency detection
      if (coRunRules.length > 0) {
        // Build adjacency graph for co-run relationships
        const coRunGraph: Record<string, string[]> = {}

        coRunRules.forEach((rule) => {
          const tasks = rule.parameters.tasks || []
          tasks.forEach((taskA: string) => {
            if (!coRunGraph[taskA]) coRunGraph[taskA] = []
            tasks.forEach((taskB: string) => {
              if (taskA !== taskB && !coRunGraph[taskA].includes(taskB)) {
                coRunGraph[taskA].push(taskB)
              }
            })
          })
        })

        // Detect cycles using DFS
        const visited = new Set<string>()
        const recursionStack = new Set<string>()

        const hasCycle = (node: string): boolean => {
          if (recursionStack.has(node)) return true
          if (visited.has(node)) return false

          visited.add(node)
          recursionStack.add(node)

          const neighbors = coRunGraph[node] || []
          for (const neighbor of neighbors) {
            if (hasCycle(neighbor)) return true
          }

          recursionStack.delete(node)
          return false
        }

        Object.keys(coRunGraph).forEach((taskId) => {
          if (!visited.has(taskId) && hasCycle(taskId)) {
            errors.push({
              id: `circular-corun-${taskId}`,
              type: "circular-dependency",
              severity: "error",
              message: `Circular co-run dependency detected involving task ${taskId}`,
              entity: taskId,
              suggestion: "Remove one of the co-run relationships to break the cycle",
            })
          }
        })
      }

      // 8. Conflicting rules vs phase-window constraints
      const phaseWindowRules = businessRules.filter((rule) => rule.type === "phaseWindow" && rule.active)
      const loadLimitRules = businessRules.filter((rule) => rule.type === "loadLimit" && rule.active)

      phaseWindowRules.forEach((phaseRule) => {
        const taskId = phaseRule.parameters.taskId
        const allowedPhases = phaseRule.parameters.allowedPhases || []

        // Find the task
        const task = tasks.find((t) => t.TaskID === taskId)
        if (!task) return

        // Check if task's preferred phases conflict with phase window
        const conflictingPhases = task.PreferredPhases.filter((phase) => !allowedPhases.includes(phase))
        if (conflictingPhases.length > 0) {
          errors.push({
            id: `phase-conflict-${taskId}`,
            type: "rule-conflict",
            severity: "error",
            message: `Task ${taskId} preferred phases [${conflictingPhases.join(", ")}] conflict with phase window rule [${allowedPhases.join(", ")}]`,
            entity: taskId,
            suggestion: "Update task preferred phases or modify phase window rule",
          })
        }

        // Check if workers available in allowed phases can handle the task
        const requiredSkills = task.RequiredSkills
        const qualifiedWorkers = workers.filter((worker) =>
          requiredSkills.every((skill) => worker.Skills.includes(skill)),
        )

        const availableInPhases = qualifiedWorkers.filter((worker) =>
          allowedPhases.some((phase) => worker.AvailableSlots.includes(phase)),
        )

        if (availableInPhases.length === 0) {
          errors.push({
            id: `no-workers-phase-window-${taskId}`,
            type: "rule-conflict",
            severity: "error",
            message: `No qualified workers available in phases [${allowedPhases.join(", ")}] for task ${taskId}`,
            entity: taskId,
            suggestion: "Expand phase window or ensure qualified workers are available in these phases",
          })
        }
      })

      // Check load limit conflicts with co-run rules
      coRunRules.forEach((coRunRule) => {
        const coRunTasks = coRunRule.parameters.tasks || []

        coRunTasks.forEach((taskId: string) => {
          const task = tasks.find((t) => t.TaskID === taskId)
          if (!task) return

          // Find workers who can do this task
          const qualifiedWorkers = workers.filter((worker) =>
            task.RequiredSkills.every((skill) => worker.Skills.includes(skill)),
          )

          // Check if load limits would prevent co-run execution
          loadLimitRules.forEach((loadRule) => {
            const workerGroup = loadRule.parameters.workerGroup
            const maxSlots = loadRule.parameters.maxSlotsPerPhase

            const groupWorkers = qualifiedWorkers.filter((w) => w.WorkerGroup === workerGroup)
            const totalGroupCapacity = groupWorkers.reduce((sum, w) => sum + Math.min(w.MaxLoadPerPhase, maxSlots), 0)
            const coRunDemand = coRunTasks.length * task.Duration

            if (totalGroupCapacity < coRunDemand) {
              errors.push({
                id: `load-limit-corun-conflict-${taskId}`,
                type: "rule-conflict",
                severity: "warning",
                message: `Load limit for group ${workerGroup} (${maxSlots} slots) may prevent co-run execution of tasks [${coRunTasks.join(", ")}]`,
                entity: taskId,
                suggestion: "Increase load limit or modify co-run grouping",
              })
            }
          })
        })
      })

      // 9. Overloaded workers
      workers.forEach((worker) => {
        if (worker.AvailableSlots && worker.AvailableSlots.length < worker.MaxLoadPerPhase) {
          errors.push({
            id: `overloaded-worker-${worker.WorkerID}`,
            type: "overloaded-worker",
            severity: "warning",
            message: `Worker ${worker.WorkerID} has fewer available slots (${worker.AvailableSlots.length}) than max load (${worker.MaxLoadPerPhase})`,
            entity: worker.WorkerID,
            field: "MaxLoadPerPhase",
            suggestion: "Reduce MaxLoadPerPhase or increase AvailableSlots",
          })
        }
      })

      // 10. Phase-slot saturation
      const phaseCapacity: Record<number, number> = {}
      const phaseDemand: Record<number, number> = {}

      workers.forEach((worker) => {
        worker.AvailableSlots.forEach((phase) => {
          phaseCapacity[phase] = (phaseCapacity[phase] || 0) + worker.MaxLoadPerPhase
        })
      })

      tasks.forEach((task) => {
        task.PreferredPhases.forEach((phase) => {
          phaseDemand[phase] = (phaseDemand[phase] || 0) + task.Duration
        })
      })

      Object.keys(phaseDemand).forEach((phase) => {
        const phaseNum = Number.parseInt(phase)
        const demand = phaseDemand[phaseNum]
        const capacity = phaseCapacity[phaseNum] || 0

        if (demand > capacity) {
          errors.push({
            id: `phase-saturation-${phase}`,
            type: "phase-saturation",
            severity: "warning",
            message: `Phase ${phase} is oversaturated: demand ${demand} > capacity ${capacity}`,
            entity: `Phase-${phase}`,
            suggestion: "Add more workers to this phase or redistribute tasks",
          })
        }
      })

      // 11. Skill-coverage matrix
      const allRequiredSkills = [...new Set(tasks.flatMap((task) => task.RequiredSkills))]
      const allWorkerSkills = [...new Set(workers.flatMap((worker) => worker.Skills))]

      allRequiredSkills.forEach((skill) => {
        if (!allWorkerSkills.includes(skill)) {
          errors.push({
            id: `missing-skill-${skill}`,
            type: "skill-coverage",
            severity: "error",
            message: `No worker has required skill: ${skill}`,
            entity: "Skills",
            suggestion: "Add a worker with this skill or remove the skill requirement",
          })
        }
      })

      // 12. Max-concurrency feasibility
      tasks.forEach((task) => {
        const qualifiedWorkers = workers.filter((worker) =>
          task.RequiredSkills.every((skill) => worker.Skills.includes(skill)),
        )

        if (task.MaxConcurrent > qualifiedWorkers.length) {
          errors.push({
            id: `max-concurrency-${task.TaskID}`,
            type: "max-concurrency",
            severity: "warning",
            message: `Task ${task.TaskID} MaxConcurrent (${task.MaxConcurrent}) exceeds qualified workers (${qualifiedWorkers.length})`,
            entity: task.TaskID,
            field: "MaxConcurrent",
            suggestion: "Reduce MaxConcurrent or train more workers in required skills",
          })
        }
      })

      setValidationErrors(errors)
    } catch (error) {
      console.error("Validation error:", error)
    } finally {
      setIsValidating(false)
    }
  }

  return { runComprehensiveValidation, isValidating }
}
