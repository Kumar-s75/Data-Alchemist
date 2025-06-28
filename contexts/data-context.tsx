"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface Client {
  ClientID: string
  ClientName: string
  PriorityLevel: number
  RequestedTaskIDs: string[]
  GroupTag: string
  AttributesJSON: string
}

export interface Worker {
  WorkerID: string
  WorkerName: string
  Skills: string[]
  AvailableSlots: number[]
  MaxLoadPerPhase: number
  WorkerGroup: string
  QualificationLevel: number
}

export interface Task {
  TaskID: string
  TaskName: string
  Category: string
  Duration: number
  RequiredSkills: string[]
  PreferredPhases: number[]
  MaxConcurrent: number
}

export interface ValidationError {
  id: string
  type: string
  severity: "error" | "warning"
  message: string
  entity: string
  field?: string
  suggestion?: string
}

export interface BusinessRule {
  id: string
  type: "coRun" | "slotRestriction" | "loadLimit" | "phaseWindow" | "patternMatch" | "precedence"
  name: string
  description: string
  parameters: Record<string, any>
  active: boolean
}

export interface PriorityWeights {
  priorityLevel: number
  taskFulfillment: number
  fairness: number
  workloadBalance: number
  skillMatch: number
  clientSatisfaction: number
}

interface DataContextType {
  clients: Client[]
  workers: Worker[]
  tasks: Task[]
  validationErrors: ValidationError[]
  businessRules: BusinessRule[]
  priorityWeights: PriorityWeights
  setClients: (clients: Client[]) => void
  setWorkers: (workers: Worker[]) => void
  setTasks: (tasks: Task[]) => void
  setValidationErrors: (errors: ValidationError[]) => void
  addBusinessRule: (rule: BusinessRule) => void
  updateBusinessRule: (id: string, rule: Partial<BusinessRule>) => void
  removeBusinessRule: (id: string) => void
  setPriorityWeights: (weights: PriorityWeights) => void
  updateClient: (id: string, client: Partial<Client>) => void
  updateWorker: (id: string, worker: Partial<Worker>) => void
  updateTask: (id: string, task: Partial<Task>) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([])
  const [priorityWeights, setPriorityWeights] = useState<PriorityWeights>({
    priorityLevel: 20,
    taskFulfillment: 25,
    fairness: 20,
    workloadBalance: 15,
    skillMatch: 15,
    clientSatisfaction: 5,
  })

  const addBusinessRule = (rule: BusinessRule) => {
    setBusinessRules((prev) => [...prev, rule])
  }

  const updateBusinessRule = (id: string, updates: Partial<BusinessRule>) => {
    setBusinessRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)))
  }

  const removeBusinessRule = (id: string) => {
    setBusinessRules((prev) => prev.filter((rule) => rule.id !== id))
  }

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) => prev.map((client) => (client.ClientID === id ? { ...client, ...updates } : client)))
  }

  const updateWorker = (id: string, updates: Partial<Worker>) => {
    setWorkers((prev) => prev.map((worker) => (worker.WorkerID === id ? { ...worker, ...updates } : worker)))
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((task) => (task.TaskID === id ? { ...task, ...updates } : task)))
  }

  return (
    <DataContext.Provider
      value={{
        clients,
        workers,
        tasks,
        validationErrors,
        businessRules,
        priorityWeights,
        setClients,
        setWorkers,
        setTasks,
        setValidationErrors,
        addBusinessRule,
        updateBusinessRule,
        removeBusinessRule,
        setPriorityWeights,
        updateClient,
        updateWorker,
        updateTask,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
