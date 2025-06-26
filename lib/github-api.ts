import { cache } from 'react'

// Server-side GitHub API functions
interface GitHubPR {
  id: number
  number: number
  title: string
  body?: string
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
  comments: number
  review_comments: number
  total_comments: number
}

interface GitHubComment {
  id: number
  user: {
    login: string
    avatar_url: string
  }
  created_at: string
  updated_at: string
  body: string
  html_url: string
}

interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
  }
  html_url: string
}

interface GitHubCommitFile {
  filename: string
  status: string
  raw_url: string
}

interface GitHubCommitDetails {
  sha: string
  files: GitHubCommitFile[]
}

interface GitHubResponse<T> {
  rateLimited: boolean
  data: T
  reset?: number
  retryAfter?: number
}

// GitHub API configuration
const GITHUB_API_BASE = "https://api.github.com"
const REPO_OWNER = "sui-foundation"
const REPO_NAME = "sips"
const REPO_PATH = `${REPO_OWNER}/${REPO_NAME}`

// Cache durations
const CACHE_DURATION = {
  SIPS: 60 * 60 * 1000, // 1 hour
  CONTENT: 24 * 60 * 60 * 1000, // 24 hours
  COMMENTS: 30 * 60 * 1000, // 30 minutes
}

// In-memory cache
const apiCache = new Map<string, { data: any; timestamp: number }>()

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function for exponential backoff
async function withBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error | null = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const waitTime = Math.pow(2, i) * 1000
      console.log(`Retrying after ${waitTime}ms due to error: ${lastError.message}`)
      await delay(waitTime)
    }
  }
  
  if (lastError) {
    throw lastError
  }
  
  throw new Error("Unknown error in withBackoff")
}

async function getGitHubHeaders(): Promise<Record<string, string>> {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT
  
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    }
  }
  
  // If no token, use basic headers (subject to stricter rate limits)
  console.warn("No GitHub token found. Using unauthenticated requests with lower rate limits.")
  return {
    Accept: "application/vnd.github.v3+json",
  }
}

// Wrapper function for GitHub API calls with rate limit handling and caching
async function fetchWithRateLimit<T>(url: string, options: RequestInit = {}, useCache = true): Promise<GitHubResponse<T>> {
  // Check cache first if enabled
  const cacheKey = `${url}-${JSON.stringify(options)}`
  if (useCache && apiCache.has(cacheKey)) {
    const cachedData = apiCache.get(cacheKey)!
    const now = Date.now()
    
    // Determine cache duration based on URL
    let cacheDuration = CACHE_DURATION.SIPS
    if (url.includes("/contents/")) {
      cacheDuration = CACHE_DURATION.CONTENT
    } else if (url.includes("/comments")) {
      cacheDuration = CACHE_DURATION.COMMENTS
    }
    
    // Return cached data if it's still fresh
    if (now - cachedData.timestamp < cacheDuration) {
      console.log(`Using cached data for: ${url}`)
      return { rateLimited: false, data: cachedData.data }
    } else {
      // Remove stale cache entry
      apiCache.delete(cacheKey)
    }
  }

  try {
    const response = await fetch(url, options)
    
    // Log rate limit information for debugging
    const rateLimit = {
      limit: response.headers.get("x-ratelimit-limit"),
      remaining: response.headers.get("x-ratelimit-remaining"),
      reset: response.headers.get("x-ratelimit-reset"),
      used: response.headers.get("x-ratelimit-used"),
    }
    
    console.log(`Rate limit info for ${url}:`, rateLimit)

    // Check for rate limit
    if (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0") {
      const resetTime = response.headers.get("x-ratelimit-reset")
      const retryAfter = response.headers.get("retry-after")
      
      return {
        rateLimited: true,
        data: [] as unknown as T,
        reset: resetTime ? parseInt(resetTime) : undefined,
        retryAfter: retryAfter ? parseInt(retryAfter) : undefined,
      }
    }
    
    // Handle other errors
    if (!response.ok) {
      let errorMessage = `GitHub API error: ${response.status}`

      try {
        const text = await response.text()
        if (text.toLowerCase().includes("rate limit") || text.toLowerCase().includes("too many")) {
          return {
            rateLimited: true,
            data: [] as unknown as T,
            reset: response.headers.get("x-ratelimit-reset") ? parseInt(response.headers.get("x-ratelimit-reset") || "0") : undefined,
          }
        }

        // Try to parse as JSON if it looks like JSON
        if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
          const errorData = JSON.parse(text)
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } else if (text) {
          errorMessage = text.substring(0, 100)
        }
      } catch (parseError) {
        // If we can't parse the error, use status-based message
        if (response.status === 404) {
          errorMessage = "Repository not found"
        }
      }

      throw new Error(errorMessage)
    }

    // Parse successful response
    const text = await response.text()

    if (!text.trim()) {
      return { rateLimited: false, data: [] as unknown as T }
    }
    
    try {
      const data = JSON.parse(text)
      
      // Cache the response if caching is enabled
      if (useCache) {
        apiCache.set(cacheKey, { data, timestamp: Date.now() })
      }
      
      return { rateLimited: false, data }
    } catch (error) {
      console.error("Failed to parse GitHub response as JSON:", text.substring(0, 200))
      throw new Error("Invalid response from GitHub API")
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("rate limit")) {
      return {
        rateLimited: true,
        data: [] as unknown as T,
        reset: undefined,
      }
    }
    throw error
  }
}

// Fetch all SIPs
export async function fetchAllSips(): Promise<GitHubResponse<GitHubPR[]>> {
  try {
    const headers = await getGitHubHeaders()
    let allPRs: GitHubPR[] = []
    let page = 1
    const perPage = 30 // Reduced from 50 to avoid hitting rate limits
    let retryCount = 0
    const maxRetries = 3

    console.log("Starting to fetch SIPs from GitHub...")

    // Fetch all pages to get all SIPs
    while (true) {
      try {
        console.log(`Fetching page ${page}...`)

        // Use exponential backoff for API requests
        const response = await withBackoff(() => 
          fetchWithRateLimit<GitHubPR[]>(
            `${GITHUB_API_BASE}/repos/${REPO_PATH}/pulls?state=all&per_page=${perPage}&page=${page}`,
            {
              headers,
              next: { revalidate: 600 },
            },
            true // Enable caching
          )
        )

        if (response.rateLimited) {
          console.log("Rate limited while fetching SIPs")
          
          // If we have some data already, return what we have
          if (allPRs.length > 0) {
            console.log(`Returning ${allPRs.length} SIPs due to rate limit`)
            return { rateLimited: false, data: allPRs }
          }
          
          // Otherwise return the rate limit response
          return response
        }

        const data = response.data

        if (!Array.isArray(data) || data.length === 0) {
          console.log(`No more data on page ${page}, stopping`)
          break
        }

        // Ensure comment counts are properly calculated and logged
        const dataWithTotalComments = data.map((pr) => {
          // GitHub API provides comment counts only on some responses. Treat them as optional.
          const hasIssueComments = Object.prototype.hasOwnProperty.call(pr, "comments") && typeof (pr as any).comments === "number"
          const hasReviewComments = Object.prototype.hasOwnProperty.call(pr, "review_comments") && typeof (pr as any).review_comments === "number"

          const issueComments = hasIssueComments ? (pr as any).comments : undefined
          const reviewComments = hasReviewComments ? (pr as any).review_comments : undefined

          const totalComments =
            issueComments !== undefined || reviewComments !== undefined
              ? (issueComments || 0) + (reviewComments || 0)
              : undefined

          // Enhanced debug logging
          console.log(`SIP #${pr.number} (${pr.title.substring(0, 50)}...):`)
          console.log(`  - issue_comments: ${issueComments}`)
          console.log(`  - review_comments: ${reviewComments}`)
          console.log(`  - total_comments: ${totalComments}`)
          console.log(`  - raw data:`, {
            comments: (pr as any).comments,
            review_comments: (pr as any).review_comments,
          })

          // Conditionally attach comment-related fields only if we actually have them
          return {
            ...pr,
            ...(issueComments !== undefined ? { comments: issueComments } : {}),
            ...(reviewComments !== undefined ? { review_comments: reviewComments } : {}),
            ...(totalComments !== undefined ? { total_comments: totalComments } : {}),
          }
        })

        allPRs = [...allPRs, ...dataWithTotalComments]
        console.log(`Fetched page ${page}: ${data.length} PRs (total: ${allPRs.length})`)

        // If we got less than perPage results, we're on the last page
        if (data.length < perPage) {
          console.log("Reached last page")
          break
        }

        page++
        retryCount = 0 // Reset retry count on successful request

        // Add delay between requests to avoid rate limiting
        await delay(1000) // Increased from 500ms to 1000ms
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error)
        
        retryCount++
        
        if (retryCount > maxRetries) {
          console.log(`Max retries (${maxRetries}) reached for page ${page}`)
          
          // If we have some data, return what we have
          if (allPRs.length > 0) {
            console.log(`Returning ${allPRs.length} SIPs due to error on page ${page}`)
            break
          }
          
          // If no data yet, re-throw the error
          throw error
        }
        
        // Exponential backoff
        const backoffTime = Math.pow(2, retryCount) * 1000
        console.log(`Retrying page ${page} after ${backoffTime}ms (attempt ${retryCount}/${maxRetries})`)
        await delay(backoffTime)
      }
    }

    console.log(`Fetched ${allPRs.length} total PRs from GitHub`)

    // Sort SIPs: Open first, then by creation date (newest first)
    allPRs.sort((a, b) => {
      // First priority: Open PRs come first
      if (a.state === "open" && b.state !== "open") return -1
      if (b.state === "open" && a.state !== "open") return 1

      // Second priority: Among same state, newest first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    console.log(`Returning ${allPRs.length} SIPs`)
    return { rateLimited: false, data: allPRs }
  } catch (error) {
    console.error("Error fetching SIPs:", error)
    throw error
  }
}

// Fetch details for a specific PR (SIP)
export async function fetchPRDetails(id: string): Promise<GitHubPR | null> {
  try {
    const headers = await getGitHubHeaders()
    
    console.log(`Fetching PR details for SIP ${id}`)
    
    const response = await withBackoff(() => 
      fetchWithRateLimit<GitHubPR>(
        `${GITHUB_API_BASE}/repos/${REPO_PATH}/pulls/${id}`,
        {
          headers,
          next: { revalidate: 300 },
        }
      )
    )
    
    if (!response.rateLimited) {
      return response.data
    }

    // If rate limited, attempt to find details in cached list of all SIPs
    console.log(`Rate limited while fetching PR details for SIP ${id}. Falling back to cached SIP list if available.`)
    try {
      const allSipsResponse = await fetchAllSips()
      if (Array.isArray(allSipsResponse.data) && allSipsResponse.data.length) {
        const sip = allSipsResponse.data.find((pr) => pr.number.toString() === id)
        if (sip) {
          console.log(`Found SIP ${id} in cached list, returning cached details`)
          return sip as GitHubPR
        }
      }
    } catch (fallbackError) {
      console.error(`Fallback to cached SIP list failed for SIP ${id}:`, fallbackError)
    }
    
    return null
  } catch (error) {
    console.error(`Error fetching PR details for SIP ${id}:`, error)
    // Attempt final fallback to cached list or mock data
    try {
      const allSipsResponse = await fetchAllSips()
      const sip = allSipsResponse.data.find((pr) => pr.number.toString() === id)
      if (sip) return sip as GitHubPR
    } catch {}
    return null
  }
}

// Cached version of fetchPRDetails
export const fetchPRDetailsCached = cache(fetchPRDetails)

// Fetch comments for a PR (SIP)
export async function fetchPRComments(id: string): Promise<GitHubComment[]> {
  try {
    const headers = await getGitHubHeaders()
    
    console.log(`Fetching comments for SIP ${id}`)
    
    // Fetch both issue comments and PR review comments
    const [issueResponse, reviewResponse] = await Promise.allSettled([
      withBackoff(() => 
        fetchWithRateLimit<GitHubComment[]>(`${GITHUB_API_BASE}/repos/${REPO_PATH}/issues/${id}/comments`, {
          headers,
          next: { revalidate: 300 },
        })
      ),
      withBackoff(() => 
        fetchWithRateLimit<GitHubComment[]>(`${GITHUB_API_BASE}/repos/${REPO_PATH}/pulls/${id}/comments`, {
          headers,
          next: { revalidate: 300 },
        })
      )
    ])
    
    const issueComments = issueResponse.status === 'fulfilled' && !issueResponse.value.rateLimited 
      ? issueResponse.value.data 
      : []
    
    const reviewComments = reviewResponse.status === 'fulfilled' && !reviewResponse.value.rateLimited 
      ? reviewResponse.value.data 
      : []
    
    // Combine and sort all comments by date
    const allComments = [...issueComments, ...reviewComments]
    allComments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    return allComments
  } catch (error) {
    console.error(`Error fetching comments for SIP ${id}:`, error)
    return []
  }
}

// Cached version of fetchPRComments
export const fetchPRCommentsCached = cache(fetchPRComments)

// Fetch commits for a PR (SIP)
export async function fetchPRCommits(prNumber: string): Promise<GitHubCommit[]> {
  try {
    const headers = await getGitHubHeaders()
    
    console.log(`Fetching commits for SIP ${prNumber}`)
    
    const response = await withBackoff(() => 
      fetchWithRateLimit<GitHubCommit[]>(
        `${GITHUB_API_BASE}/repos/${REPO_PATH}/pulls/${prNumber}/commits`,
        {
          headers,
          next: { revalidate: 300 },
        }
      )
    )
    
    if (response.rateLimited) {
      console.log(`Rate limited while fetching commits for SIP ${prNumber}`)
      return []
    }
    
    return response.data
  } catch (error) {
    console.error(`Error fetching commits for SIP ${prNumber}:`, error)
    return []
  }
}

// Cached version of fetchPRCommits
export const fetchPRCommitsCached = cache(fetchPRCommits)

// Fetch details for a specific commit
export async function fetchCommitDetails(commitSha: string): Promise<GitHubCommitDetails | null> {
  try {
    const headers = await getGitHubHeaders()
    
    console.log(`Fetching commit details for ${commitSha}`)
    
    const response = await withBackoff(() => 
      fetchWithRateLimit<GitHubCommitDetails>(
        `${GITHUB_API_BASE}/repos/${REPO_PATH}/commits/${commitSha}`,
        {
          headers,
          next: { revalidate: 300 },
        }
      )
    )
    
    if (response.rateLimited) {
      console.log(`Rate limited while fetching commit details for ${commitSha}`)
      return null
    }
    
    return response.data
  } catch (error) {
    console.error(`Error fetching commit details for ${commitSha}:`, error)
    return null
  }
}

// Cached version of fetchCommitDetails
export const fetchCommitDetailsCached = cache(fetchCommitDetails)

// Fetch content of a SIP
export async function fetchSipContent(prNumber: string): Promise<string | null> {
  try {
    // Get commits for the PR
    const commits = await fetchPRCommitsCached(prNumber)
    if (commits.length === 0) {
      console.log(`No commits found for SIP ${prNumber}. Attempting to fall back to PR body…`)

      // Try PR details first – this requires only one GitHub request and succeeds even when
      // the /commits endpoint is rate-limited.
      try {
        const prDetails = await fetchPRDetails(prNumber)
        if (prDetails && prDetails.body) {
          return stripSipMetadataTable(`# ${prDetails.title}\n\n${prDetails.body}`)
        }
      } catch (e) {
        console.warn(`Fallback to PR body failed for SIP ${prNumber}:`, e)
      }

      console.log(`PR body unavailable; using placeholder content for SIP ${prNumber}`)
      return stripSipMetadataTable(generateMockSipContent(prNumber))
    }

    // Get the first commit (usually contains the SIP file)
    const firstCommit = commits[0]
    const commitDetails = await fetchCommitDetailsCached(firstCommit.sha)

    if (!commitDetails || !commitDetails.files) {
      console.log(`No commit details or files found for SIP ${prNumber}, using fallback content`)
      return stripSipMetadataTable(generateMockSipContent(prNumber))
    }

    // Try multiple patterns to find the SIP file
    // 1. First try to find a markdown file with "sip" in the name (most common pattern)
    // 2. Then try any markdown file
    // 3. Then try any added file
    const sipPatterns = [
      (file: GitHubCommitFile) => file.filename.endsWith(".md") && file.filename.toLowerCase().includes("sip"),
      (file: GitHubCommitFile) => file.filename.endsWith(".md"),
      (file: GitHubCommitFile) => file.status === "added" || file.status === "modified"
    ]

    let sipFile = null
    for (const pattern of sipPatterns) {
      sipFile = commitDetails.files.find(pattern)
      if (sipFile && sipFile.raw_url) {
        break
      }
    }

    // If we still couldn't find a file, try to use the PR body as fallback content
    if (!sipFile || !sipFile.raw_url) {
      // Try to get PR details as fallback
      const prDetails = await fetchPRDetails(prNumber)
      if (prDetails && prDetails.body) {
        return stripSipMetadataTable(`# ${prDetails.title}\n\n${prDetails.body}`)
      }
      console.log(`No SIP file or PR body found for SIP ${prNumber}, using fallback content`)
      return stripSipMetadataTable(generateMockSipContent(prNumber))
    }

    // Fetch the raw content of the SIP file
    try {
      const contentResponse = await fetch(sipFile.raw_url, {
        next: { revalidate: 300 },
      })

      if (!contentResponse.ok) {
        // If we can't fetch the raw content, try to use PR body as fallback
        const prDetails = await fetchPRDetails(prNumber)
        if (prDetails && prDetails.body) {
          return stripSipMetadataTable(`# ${prDetails.title}\n\n${prDetails.body}`)
        }
        console.log(`Failed to fetch raw content for SIP ${prNumber}, using fallback content`)
        return stripSipMetadataTable(generateMockSipContent(prNumber))
      }

      const content = await contentResponse.text()
      return stripSipMetadataTable(content)
    } catch (error) {
      // If raw content fetch fails, try PR body as fallback
      const prDetails = await fetchPRDetails(prNumber)
      if (prDetails && prDetails.body) {
        return stripSipMetadataTable(`# ${prDetails.title}\n\n${prDetails.body}`)
      }
      console.log(`Error fetching raw content for SIP ${prNumber}, using fallback content:`, error)
      return stripSipMetadataTable(generateMockSipContent(prNumber))
    }
  } catch (error) {
    console.error("Error fetching SIP content:", error)
    return stripSipMetadataTable(generateMockSipContent(prNumber))
  }
}

// Generate mock SIP content when GitHub API fails
function generateMockSipContent(sipId: string): string {
  return `| SIP-Number | ${sipId} |
| ---: | :--- |
| Title | SIP-${sipId}: Placeholder Title |
| Description | This is a placeholder description for SIP-${sipId}. The actual content could not be fetched from GitHub. |
| Author | Unknown |
| Editor | |
| Type | Standard |
| Category | Framework |
| Created | 2023-01-01 |
| Comments-URI | |
| Status | |
| Requires | |

## Abstract

This is a placeholder content for SIP-${sipId}. The actual content could not be fetched from GitHub due to API limitations or network issues.

## Motivation

This placeholder is provided to ensure the application can still display something when the GitHub API is unavailable or rate limited.

## Specification

The placeholder includes various sections typically found in a SIP document to maintain the expected format and structure.

### Technical Details
- Feature 1: Description of feature 1
- Feature 2: Description of feature 2
- Feature 3: Description of feature 3

## Rationale

The rationale for this placeholder is to provide a fallback when the GitHub API cannot be accessed.

## Backwards Compatibility

This placeholder maintains the expected format and structure of a SIP document.

## Test Cases

- Test case 1: Description
- Test case 2: Description

## Reference Implementation

\`\`\`rust
// This is placeholder code
fn example_function() -> bool {
    println!("This is a placeholder implementation");
    true
}
\`\`\`

## Security Considerations

There are no security implications for this placeholder content.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
`
}

// Helper to remove the metadata table that some SIPs include at the top of the document.
// The table always starts with a row like "| SIP-Number |" and ends at the first blank line
// (or the first line that no longer starts with "|"). We want to drop that whole block
// while leaving the rest of the markdown untouched so it renders cleanly in the UI.
function stripSipMetadataTable(content: string): string {
  if (!content) return content

  const lines = content.split("\n")
  let metadataStart = -1
  let metadataEnd = -1

  // Locate the first line that begins the metadata table. We specifically look for
  // the canonical first cell "| SIP-Number" but fall back to any line that starts
  // with a pipe character if that is not found (to be future-proof).
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith("| SIP-Number") || trimmed.startsWith("|SIP-Number")) {
      metadataStart = i
      break
    }
  }

  // No metadata table found – return original content unchanged.
  if (metadataStart === -1) {
    return content
  }

  // Walk forward until we reach the end of the contiguous block of lines that start
  // with a pipe or a header separator line (e.g. "| ---:" etc.). We also include a
  // trailing blank line if present so that the main content starts cleanly.
  for (let i = metadataStart; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (trimmed.startsWith("|")) {
      metadataEnd = i
      continue
    }
    // Stop at first non-table, non-empty line (but allow one blank line after table).
    if (trimmed === "") {
      metadataEnd = i
    }
    break
  }

  // Remove the slice metadataStart..metadataEnd inclusive.
  const cleanedLines = lines.slice(0, metadataStart).concat(lines.slice(metadataEnd + 1))
  return cleanedLines.join("\n").trimStart()
}

// Cached version of fetchSipContent
export const fetchSipContentCached = cache(fetchSipContent)

// Helper function to extract description from SIP content
export function extractSipDescription(content: string): string {
  if (!content) return "No description available."

  // Try to find the Abstract or Summary section
  const abstractMatch = content.match(/##\s*Abstract\s*\n([\s\S]*?)(?=\n##|\n#|$)/i)
  if (abstractMatch) {
    return cleanMarkdownText(abstractMatch[1].trim())
  }

  const summaryMatch = content.match(/##\s*Summary\s*\n([\s\S]*?)(?=\n##|\n#|$)/i)
  if (summaryMatch) {
    return cleanMarkdownText(summaryMatch[1].trim())
  }

  // Fallback to first paragraph after title
  const lines = content.split("\n")
  let description = ""
  let foundTitle = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty lines and metadata
    if (!trimmed || trimmed.startsWith("---") || trimmed.startsWith("|")) {
      continue
    }

    // Skip title lines
    if (trimmed.startsWith("#")) {
      foundTitle = true
      continue
    }

    // Once we found a title, collect the next non-empty content
    if (foundTitle && trimmed.length > 0) {
      description += trimmed + " "

      // Stop after we have enough content
      if (description.length > 200) {
        break
      }
    }
  }

  return cleanMarkdownText(description.trim()) || "No description available."
}

// Helper function to clean markdown text
function cleanMarkdownText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.*?)\*/g, "$1") // Remove italics
    .replace(/`(.*?)`/g, "$1") // Remove inline code
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links, keep text
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
}

// Fetch commits for a specific SIP
export async function fetchCommits(sipId: string): Promise<GitHubResponse<GitHubCommit[]>> {
  try {
    const commits = await fetchPRCommitsCached(sipId)
    return { rateLimited: false, data: commits }
  } catch (error) {
    console.error(`Error in fetchCommits for SIP ${sipId}:`, error)
    return { rateLimited: false, data: [] }
  }
}

// Fetch comments for a specific SIP
export async function fetchComments(sipId: string): Promise<GitHubResponse<GitHubComment[]>> {
  try {
    const comments = await fetchPRCommentsCached(sipId)
    return { rateLimited: false, data: comments }
  } catch (error) {
    console.error(`Error in fetchComments for SIP ${sipId}:`, error)
    return { rateLimited: false, data: [] }
  }
}

// Cached version of fetchAllSips to reduce API calls
export const fetchAllSipsCached = cache(fetchAllSips)
