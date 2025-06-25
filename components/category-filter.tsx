"use client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CategoryFilterProps {
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  availableCategories: string[]
}

export function CategoryFilter({ selectedCategory, setSelectedCategory, availableCategories }: CategoryFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10">
          Category: {selectedCategory ? <span className="font-medium">{selectedCategory}</span> : <span>All</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setSelectedCategory("")}>
          All
          {selectedCategory === "" && <span className="ml-auto text-muted-foreground">✓</span>}
        </DropdownMenuItem>
        {availableCategories.map((category) => (
          <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)}>
            {category}
            {selectedCategory === category && <span className="ml-auto text-muted-foreground">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
