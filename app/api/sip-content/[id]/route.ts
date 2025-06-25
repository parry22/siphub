// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { fetchSipContent, extractSipDescription } from "@/lib/github-api"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
  try {
    console.log(`API route: Fetching content for SIP ${id}...`)
    
    // Try to fetch from GitHub API
    try {
      const content = await fetchSipContent(id)

      if (content) {
        const description = extractSipDescription(content)
        console.log(`API route: Successfully fetched content for SIP ${id}`)
        return NextResponse.json({ description, content })
      }
      
      console.log(`API route: No content found for SIP ${id}, using mock data`)
    } catch (error) {
      console.error("API Error:", error)
      console.log(`API route: Error fetching content for SIP ${id}, using mock data`)
    }
    
    // Fallback to mock data if GitHub API fails
    const mockContent = `# SIP-${id}: Mock SIP Content

## Abstract
This is a mock SIP content for SIP-${id}. The actual content could not be fetched from GitHub.

## Motivation
This mock content is provided to ensure the application can still function when the GitHub API is unavailable or rate limited.

## Specification
The mock content includes various sections typically found in a SIP document.

### Technical Details
- Feature 1: Description of feature 1
- Feature 2: Description of feature 2
- Feature 3: Description of feature 3

## Rationale
The rationale for this mock content is to provide a fallback when the GitHub API cannot be accessed.

## Backwards Compatibility
This mock content maintains the expected format and structure of a SIP document.

## Test Cases
- Test case 1: Description
- Test case 2: Description

## Reference Implementation
\`\`\`rust
// This is mock code
fn example_function() -> bool {
    println!("This is a mock implementation");
    true
}
\`\`\`

## Security Considerations
There are no security implications for this mock content.

## Copyright
Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
`
    
    console.log(`API route: Returning mock content for SIP ${id}`)
    const description = extractSipDescription(mockContent)
    return NextResponse.json({ description, content: mockContent })
    
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: `Failed to fetch content for SIP ${id}` },
      { status: 500 }
    )
  }
}
