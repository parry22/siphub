"use client"

import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface CategoryChipsProps {
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  availableCategories: string[]
}

export function CategoryChips({ selectedCategories, setSelectedCategories, availableCategories }: CategoryChipsProps) {
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const clearAllCategories = () => {
    setSelectedCategories([])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filter by Category</h3>
        {selectedCategories.length > 0 && (
          <button
            onClick={clearAllCategories}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Horizontally scrollable container */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {availableCategories.map((category) => {
            const isSelected = selectedCategories.includes(category)
            return (
              <Badge
                key={category}
                variant="outline"
                className={`
                  flex-shrink-0 cursor-pointer select-none transition-all duration-200 
                  px-4 py-2 text-sm font-medium rounded-full border
                  ${
                    isSelected
                      ? "bg-black text-white border-white/10 hover:bg-black/90 shadow-sm"
                      : "bg-transparent text-foreground border-border hover:bg-muted/50"
                  }
                  hover:scale-105 active:scale-95
                `}
                onClick={() => toggleCategory(category)}
              >
                <span className="whitespace-nowrap">{category}</span>
                {isSelected && <X className="ml-1.5 h-3 w-3 flex-shrink-0" />}
              </Badge>
            )
          })}
        </div>

        {/* Fade effect for scroll indication */}
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>

      {selectedCategories.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedCategories.length} category{selectedCategories.length === 1 ? "" : "ies"} selected
        </div>
      )}
    </div>
  )
}
