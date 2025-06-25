"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface StatusFilterProps {
  selectedStatus: string
  setSelectedStatus: (status: string) => void
  availableStatuses: string[]
}

export function StatusFilter({ selectedStatus, setSelectedStatus, availableStatuses }: StatusFilterProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (status: string) => {
    if (status === selectedStatus) {
      setSelectedStatus("")
    } else {
      setSelectedStatus(status)
    }
    setOpen(false)
  }

  // Capitalize first letter of each status
  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const displayStatuses = ["All Status", ...availableStatuses.map(capitalizeFirstLetter)]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-[140px] justify-between h-10"
        >
          <span className="truncate">{selectedStatus ? capitalizeFirstLetter(selectedStatus) : "All Status"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search status..." />
          <CommandList>
            <CommandEmpty>No status found.</CommandEmpty>
            <CommandGroup>
              {displayStatuses.map((status, index) => {
                const originalStatus = index === 0 ? "" : availableStatuses[index - 1]
                return (
                  <CommandItem key={status} value={status} onSelect={() => handleSelect(originalStatus)}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        (status === "All Status" ? selectedStatus === "" : selectedStatus === originalStatus)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {status}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
