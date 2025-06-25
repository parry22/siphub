"use client"

import { SearchBar } from "@/components/search-bar"
import { StatusFilter } from "@/components/status-filter"
import { CategoryChips } from "@/components/category-chips"
import { LabelFilter } from "@/components/label-filter"

interface FiltersSectionProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedLabels: string[]
  setSelectedLabels: (labels: string[]) => void
  selectedStatus: string
  setSelectedStatus: (status: string) => void
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  availableLabels: string[]
  availableStatuses: string[]
  availableCategories: string[]
  filteredCount: number
  totalCount: number
  loading: boolean
}

// Helper function to capitalize first letter
const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function FiltersSection({
  searchQuery,
  setSearchQuery,
  selectedLabels,
  setSelectedLabels,
  selectedStatus,
  setSelectedStatus,
  selectedCategories,
  setSelectedCategories,
  availableLabels,
  availableStatuses,
  availableCategories,
  filteredCount,
  totalCount,
  loading,
}: FiltersSectionProps) {
  return (
    <div className="space-y-6">
      {/* Search and Status Filter Row with Label Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="flex gap-3">
          <StatusFilter
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            availableStatuses={availableStatuses}
          />
          <LabelFilter
            selectedLabels={selectedLabels}
            setSelectedLabels={setSelectedLabels}
            availableLabels={availableLabels}
          />
        </div>
      </div>

      {/* Category Chips */}
      <CategoryChips
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        availableCategories={availableCategories}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} SIPs
          {searchQuery && <span> matching "{searchQuery}"</span>}
          {selectedCategories.length > 0 && <span> with categories: {selectedCategories.join(", ")}</span>}
          {selectedLabels.length > 0 && (
            <span> with labels: {selectedLabels.map(capitalizeFirstLetter).join(", ")}</span>
          )}
          {selectedStatus && <span> with status: {capitalizeFirstLetter(selectedStatus)}</span>}
        </p>
        {loading && <span className="text-xs text-muted-foreground">Syncing with GitHub...</span>}
      </div>
    </div>
  )
}
