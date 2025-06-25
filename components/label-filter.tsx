"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface LabelFilterProps {
  selectedLabels: string[]
  setSelectedLabels: (labels: string[]) => void
  availableLabels: string[]
}

export function LabelFilter({ selectedLabels, setSelectedLabels, availableLabels }: LabelFilterProps) {
  const handleLabelSelect = (label: string) => {
    if (!selectedLabels.includes(label)) {
      setSelectedLabels([...selectedLabels, label])
    }
  }

  const removeLabel = (labelToRemove: string) => {
    setSelectedLabels(selectedLabels.filter((label) => label !== labelToRemove))
  }

  const clearAllLabels = () => {
    setSelectedLabels([])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select onValueChange={handleLabelSelect}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by label" />
          </SelectTrigger>
          <SelectContent>
            {availableLabels
              .filter((label) => !selectedLabels.includes(label))
              .map((label) => (
                <SelectItem key={label} value={label}>
                  {label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {selectedLabels.length > 0 && (
          <button
            onClick={clearAllLabels}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLabels.map((label) => (
            <Badge
              key={label}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => removeLabel(label)}
            >
              {label}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
