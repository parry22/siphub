"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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
}

interface StatisticsCardsProps {
  sips: GitHubPR[]
  loading: boolean
}

export function StatisticsCards({ sips, loading }: StatisticsCardsProps) {
  const statusCounts = useMemo(() => {
    if (loading || sips.length === 0) return { open: 0, closed: 0, merged: 0, total: 0 }

    const open = sips.filter((sip) => sip.state === "open" && !sip.merged_at).length
    const closed = sips.filter((sip) => sip.state === "closed" && !sip.merged_at).length
    const merged = sips.filter((sip) => sip.merged_at).length

    return {
      open,
      closed,
      merged,
      total: sips.length,
    }
  }, [sips, loading])

  if (loading) {
    return (
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="transition-all hover:shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {/* 2 columns on mobile (2x2 grid), 4 columns on desktop (1x4 grid) */}
      <Card className="transition-all hover:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Total SIPs</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xl sm:text-2xl font-bold">{statusCounts.total}</div>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 leading-tight">
            <span>Open SIPs</span>
            <div className="relative">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 h-1.5 w-1.5 bg-green-500 rounded-full animate-ping"></div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xl sm:text-2xl font-bold text-green-600">{statusCounts.open}</div>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Closed SIPs</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xl sm:text-2xl font-bold text-red-600">{statusCounts.closed}</div>
        </CardContent>
      </Card>

      {/* Merged SIPs Card - NO ICON in stats */}
      <Card className="transition-all hover:shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Merged SIPs</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xl sm:text-2xl font-bold text-purple-600">{statusCounts.merged}</div>
        </CardContent>
      </Card>
    </div>
  )
}
