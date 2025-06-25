"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface LabelChipsProps {
  selectedLabels: string[]
  setSelectedLabels: (labels: string[]) => void
  availableLabels: string[]
}

export function LabelChips({ selectedLabels, setSelectedLabels, availableLabels }: LabelChipsProps) {
  const toggleLabel = (label: string) => {
    if (selectedLabels.includes(label)) {
      setSelectedLabels(selectedLabels.filter((l) => l !== label))
    } else {
      setSelectedLabels([...selectedLabels, label])
    }
  }

  const clearAllLabels = () => {
    setSelectedLabels([])
  }

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  if (availableLabels.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Filter by Labels:</h3>
        {selectedLabels.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllLabels} className="h-7 px-3 text-xs">
            Clear all
          </Button>
        )}
      </div>

      {/* Desktop view - wrapped chips */}
      <div className="hidden sm:flex flex-wrap gap-2.5">
        {availableLabels.map((label) => {
          const isSelected = selectedLabels.includes(label)
          const displayLabel = capitalizeFirstLetter(label)
          return (
            <Badge
              key={label}
              variant={isSelected ? "default" : "outline"}
              className={`
                cursor-pointer transition-all duration-200 ease-in-out
                px-4 py-2.5 text-sm font-medium
                hover:scale-105 hover:shadow-sm
                ${
                  isSelected
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "hover:bg-muted hover:text-foreground border-2"
                }
                flex items-center gap-1.5
                min-h-[36px]
                rounded-full
              `}
              onClick={() => toggleLabel(label)}
            >
              <span>{displayLabel}</span>
              {isSelected && <X className="h-3.5 w-3.5 ml-1" />}
            </Badge>
          )
        })}
      </div>

      {/* Mobile view - horizontal scrollable */}
      <div className="sm:hidden">
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-2.5 min-w-max">
            {availableLabels.map((label) => {
              const isSelected = selectedLabels.includes(label)
              const displayLabel = capitalizeFirstLetter(label)
              return (
                <Badge
                  key={label}
                  variant={isSelected ? "default" : "outline"}
                  className={`
                    cursor-pointer transition-all duration-200 ease-in-out
                    px-4 py-2.5 text-sm font-medium
                    hover:scale-105 hover:shadow-sm
                    ${
                      isSelected
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        : "hover:bg-muted hover:text-foreground border-2"
                    }
                    flex items-center gap-1.5
                    min-h-[36px]
                    rounded-full
                    whitespace-nowrap
                    flex-shrink-0
                  `}
                  onClick={() => toggleLabel(label)}
                >
                  <span>{displayLabel}</span>
                  {isSelected && <X className="h-3.5 w-3.5 ml-1" />}
                </Badge>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
