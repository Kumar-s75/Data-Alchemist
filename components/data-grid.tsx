"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, Save, X, AlertTriangle } from "lucide-react"
import { useData, type Client, type Worker, type Task } from "@/contexts/data-context"

interface DataGridProps {
  data: (Client | Worker | Task)[]
  entityType: "clients" | "workers" | "tasks"
}

export default function DataGrid({ data, entityType }: DataGridProps) {
  const { updateClient, updateWorker, updateTask, validationErrors } = useData()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<any>({})

  const getEntityId = (item: any) => {
    return item.ClientID || item.WorkerID || item.TaskID
  }

  const handleEdit = (item: any) => {
    const id = getEntityId(item)
    setEditingId(id)
    setEditingData({ ...item })
  }

  const handleSave = () => {
    if (!editingId) return

    if (entityType === "clients") {
      updateClient(editingId, editingData)
    } else if (entityType === "workers") {
      updateWorker(editingId, editingData)
    } else if (entityType === "tasks") {
      updateTask(editingId, editingData)
    }

    setEditingId(null)
    setEditingData({})
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingData({})
  }

  const getErrorsForEntity = (entityId: string) => {
    return validationErrors.filter((error) => error.entity === entityId || error.message.includes(entityId))
  }

  const renderCell = (item: any, key: string, value: any) => {
    const entityId = getEntityId(item)
    const isEditing = editingId === entityId
    const errors = getErrorsForEntity(entityId)
    const hasError = errors.some((error) => error.field === key)

    if (isEditing) {
      return (
        <div className="space-y-1">
          <Input
            value={Array.isArray(editingData[key]) ? editingData[key].join(", ") : editingData[key] || ""}
            onChange={(e) => {
              const newValue =
                key === "Skills" || key === "RequiredSkills" || key === "RequestedTaskIDs"
                  ? e.target.value.split(",").map((s) => s.trim())
                  : key === "AvailableSlots" || key === "PreferredPhases"
                    ? e.target.value
                        .split(",")
                        .map((s) => Number.parseInt(s.trim()))
                        .filter((n) => !isNaN(n))
                    : e.target.value

              setEditingData((prev) => ({ ...prev, [key]: newValue }))
            }}
            className={hasError ? "border-red-500" : ""}
          />
          {hasError && <div className="text-xs text-red-500">{errors.find((e) => e.field === key)?.message}</div>}
        </div>
      )
    }

    return (
      <div className={`${hasError ? "bg-red-50 p-1 rounded" : ""}`}>
        {Array.isArray(value) ? (
          <div className="flex flex-wrap gap-1">
            {value.map((item, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          <span className={hasError ? "text-red-700" : ""}>{value}</span>
        )}
        {hasError && <AlertTriangle className="h-3 w-3 text-red-500 inline ml-1" />}
      </div>
    )
  }

  const getColumns = () => {
    if (entityType === "clients") {
      return ["ClientID", "ClientName", "PriorityLevel", "RequestedTaskIDs", "GroupTag"]
    } else if (entityType === "workers") {
      return ["WorkerID", "WorkerName", "Skills", "AvailableSlots", "MaxLoadPerPhase", "WorkerGroup"]
    } else {
      return ["TaskID", "TaskName", "Category", "Duration", "RequiredSkills", "PreferredPhases"]
    }
  }

  const columns = getColumns()

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => {
            const entityId = getEntityId(item)
            const isEditing = editingId === entityId
            const errors = getErrorsForEntity(entityId)

            return (
              <TableRow key={index} className={errors.length > 0 ? "bg-red-50/50" : ""}>
                {columns.map((column) => (
                  <TableCell key={column}>{renderCell(item, column, (item as any)[column])}</TableCell>
                ))}
                <TableCell>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={handleSave}>
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
