"use client"

import { useState, useMemo, useEffect } from "react"
import { HeroGeometric } from "@/components/ui/shape-landing-hero"
import { SipList } from "@/components/sip-list"
import { StatisticsCards } from "@/components/statistics-cards"
import { FiltersSection } from "@/components/filters-section"
import { categories } from "@/lib/data"
import { getCategoriesForSip } from "@/lib/utils"

interface GitHubPR {
  id: number
  number: number
  title: string
  state: string
  merged_at: string | null
  created_at: string
  updated_at: string
  html_url: string
  user: {
    login: string
    avatar_url: string
  }
  labels: Array<{
    name: string
    color: string
  }>
  body?: string
  comments?: number
  review_comments?: number
  total_comments?: number
}

export default function Home() {
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  
  // Data states
  const [sips, setSips] = useState<GitHubPR[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch SIPs data on component mount
  useEffect(() => {
    const fetchSips = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/sips')
        if (!response.ok) {
          throw new Error('Failed to fetch SIPs')
        }
        const data = await response.json()
        setSips(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching SIPs:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch SIPs')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSips()
  }, [])

  // Extract available labels and statuses from the fetched SIPs data
  const { availableLabels, availableStatuses } = useMemo(() => {
    const labels = new Set<string>()
    const statuses = new Set<string>()

    sips.forEach((sip) => {
      sip.labels.forEach((label) => {
        labels.add(label.name)
      })
      
      // Add the PR state (open/closed)
      statuses.add(sip.state)
      
      // Add "merged" status if the PR was merged
      if (sip.merged_at) {
        statuses.add("merged")
      }
    })

    return {
      availableLabels: Array.from(labels).sort(),
      availableStatuses: Array.from(statuses).sort(),
    }
  }, [sips])

  // Filter SIPs based on search query, selected labels, status, and categories
  const filteredSips = useMemo(() => {
    return sips.filter((sip) => {
      // Search filter - searches in title, body, author, and labels
      const searchMatch =
        searchQuery === "" ||
        sip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sip.body && sip.body.toLowerCase().includes(searchQuery.toLowerCase())) ||
        sip.user.login.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sip.labels.some((label) => label.name.toLowerCase().includes(searchQuery.toLowerCase()))

      // Label filter - matches if any selected label is present
      const labelMatch =
        selectedLabels.length === 0 ||
        selectedLabels.some((selectedLabel) => sip.labels.some((label) => label.name === selectedLabel))

      // Status filter - matches exact status
      let statusMatch = selectedStatus === ""
      if (selectedStatus === "merged") {
        statusMatch = !!sip.merged_at
      } else if (selectedStatus !== "") {
        statusMatch = sip.state === selectedStatus
      }

      // Category filter - matches if SIP's category is in selected categories
      const sipCategoriesArr = getCategoriesForSip(sip as any)
      const categoryMatch =
        selectedCategories.length === 0 ||
        sipCategoriesArr.some((cat: string) => selectedCategories.includes(cat))

      return searchMatch && labelMatch && statusMatch && categoryMatch
    })
  }, [searchQuery, selectedLabels, selectedStatus, selectedCategories, sips])
  
  return (
    <div>
      <HeroGeometric 
        badge="Sui Digest"
        title1="Keep Track Of Sui Ecosystem"
      />
      
      <div className="container mx-auto py-12 px-4 md:px-6">
        <StatisticsCards sips={sips} loading={loading} />
        
        <div className="mt-12">
          {/* Filters Section */}
          <div className="mb-8">
            <FiltersSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedLabels={selectedLabels}
              setSelectedLabels={setSelectedLabels}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              availableLabels={availableLabels}
              availableStatuses={availableStatuses}
              availableCategories={categories}
              filteredCount={filteredSips.length}
              totalCount={sips.length}
              loading={loading}
            />
          </div>
          
          <SipList sips={filteredSips} loading={loading} error={error} />
        </div>
      </div>
    </div>
  )
}
