export type SIPStatus = "Approved" | "Live" | "Draft" | "Review"

export type SIPCategory =
  | "Dev Tools"
  | "Wallet UX & Security"
  | "Governance / Process"
  | "Staking & Liquid Staking"
  | "Gas / Economics"
  | "Core / Storage"
  | "Crypto Primitives"
  | "Staking & Validators"
  | "Core / Object Lifecycle"
  | "Networking & Mempool"
  | "Interop"

export interface SIP {
  id: number
  title: string
  status: SIPStatus
  summary: string
  detailedDescription: string
  impact: string
  category: SIPCategory
  githubUrl: string
  discussionUrl: string
  dateCreated: string
  dateUpdated: string
}

// GitHub PR interface for real data
export interface GitHubPR {
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
}

// Keep empty array for backward compatibility - real data comes from GitHub API
export const sips: SIP[] = []

// Utility function for backward compatibility - now works with GitHub data
export function getSipById(id: number): SIP | undefined {
  // This function is kept for compatibility but should not be used
  // Real SIP data should be fetched from GitHub API
  return undefined
}

export function getSipsByCategory(category: SIPCategory): SIP[] {
  return []
}

export function getSipsByStatus(status: SIPStatus): SIP[] {
  return []
}

export function searchSips(query: string): SIP[] {
  return []
}

// Helper functions for GitHub PR data
export function mapGitHubStatusToSipStatus(pr: GitHubPR): SIPStatus {
  if (pr.merged_at) return "Live"
  if (pr.state === "closed") return "Draft"
  return "Approved" // Open PRs are considered approved for review
}

export const categories: SIPCategory[] = [
  "Dev Tools",
  "Wallet UX & Security",
  "Governance / Process",
  "Staking & Liquid Staking",
  "Gas / Economics",
  "Core / Storage",
  "Crypto Primitives",
  "Staking & Validators",
  "Core / Object Lifecycle",
  "Networking & Mempool",
  "Interop",
]

export const statuses: SIPStatus[] = ["Approved", "Live", "Draft", "Review"]
