"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, ArrowRight, GitPullRequest, AlertCircle, MessageCircle, GitMerge } from "lucide-react"
import { sipCategories } from "@/lib/sip-categories"
import type { SIPCategory } from "@/lib/data"

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

interface SipListProps {
  sips: GitHubPR[]
  loading: boolean
  error: string | null
}

// Session storage keys for component state
const COMPONENT_STORAGE_KEYS = {
  VISIBLE_SIPS: "sip_list_visible_count",
  COMMENT_COUNTS: "sip_list_comment_counts",
  SIP_DESCRIPTIONS: "sip_list_descriptions",
}

export function SipList({ sips, loading, error }: SipListProps) {
  const [visibleSips, setVisibleSips] = useState(12)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const observerRef = useRef<HTMLDivElement>(null)
  const initRef = false // Changed to false to ensure useEffect runs once

  // Get comment count with rate limiting and caching
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({})
  const [fetchingComments, setFetchingComments] = useState<Set<number>>(new Set())

  // Add state for SIP descriptions
  const [sipDescriptions, setSipDescriptions] = useState<Record<number, string>>({})
  const [fetchingSipContent, setFetchingSipContent] = useState<Set<number>>(new Set())

  // Load cached comment counts from session storage
  useEffect(() => {
    if (initRef) return

    try {
      const cachedVisibleSips = sessionStorage.getItem(COMPONENT_STORAGE_KEYS.VISIBLE_SIPS)
      const cachedCommentCounts = sessionStorage.getItem(COMPONENT_STORAGE_KEYS.COMMENT_COUNTS)
      const cachedSipDescriptions = sessionStorage.getItem(COMPONENT_STORAGE_KEYS.SIP_DESCRIPTIONS)

      if (cachedVisibleSips) {
        const count = Number.parseInt(cachedVisibleSips, 10)
        if (!isNaN(count) && count > 12) {
          setVisibleSips(count)
        }
      }

      if (cachedCommentCounts) {
        const counts = JSON.parse(cachedCommentCounts)
        setCommentCounts(counts)
      }

      if (cachedSipDescriptions) {
        const descriptions = JSON.parse(cachedSipDescriptions)
        setSipDescriptions(descriptions)
      }

      setIsInitialized(true)
    } catch (error) {
      console.error("Error loading component state from session storage:", error)
      setIsInitialized(true)
    }
  }, []) // Empty dependency array means this runs once on mount

  // Save comment counts to session storage
  useEffect(() => {
    if (!isInitialized) return

    try {
      sessionStorage.setItem(COMPONENT_STORAGE_KEYS.VISIBLE_SIPS, visibleSips.toString())
      sessionStorage.setItem(COMPONENT_STORAGE_KEYS.COMMENT_COUNTS, JSON.stringify(commentCounts))
      sessionStorage.setItem(COMPONENT_STORAGE_KEYS.SIP_DESCRIPTIONS, JSON.stringify(sipDescriptions))
    } catch (error) {
      console.error("Error saving component state:", error)
    }
  }, [visibleSips, commentCounts, sipDescriptions, isInitialized])

  // Fetch comment counts with rate limiting (max 3 concurrent requests)
  useEffect(() => {
    const fetchCommentCounts = async () => {
      if (loading || !sips.length) return

      const visibleSipNumbers = sips.slice(0, visibleSips).map((sip) => sip.number)
      const sipNumbersToFetch = visibleSipNumbers.filter(
        (sipNumber) => {
          const sipObj = sips.find((s) => s.number === sipNumber)
          const hasTotalComments = sipObj && sipObj.total_comments !== undefined
          return !hasTotalComments && commentCounts[sipNumber] === undefined && !fetchingComments.has(sipNumber)
        },
      )

      if (sipNumbersToFetch.length === 0) return

      // Limit concurrent requests to avoid rate limiting
      const batchSize = 3
      const batches = []
      for (let i = 0; i < sipNumbersToFetch.length; i += batchSize) {
        batches.push(sipNumbersToFetch.slice(i, i + batchSize))
      }

      for (const batch of batches) {
        // Mark as fetching
        setFetchingComments((prev) => new Set([...prev, ...batch]))

        // Process batch with delay between requests
        const promises = batch.map(async (sipNumber, index) => {
          // Add delay between requests in the same batch
          if (index > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * index))
          }

          try {
            const response = await fetch(`/api/comments/${sipNumber}`)
            if (response.ok) {
              const data = await response.json()
              const count = Array.isArray(data) ? data.length : (data.count || 0)
              return { sipNumber, count }
            }
          } catch (error) {
            console.error(`Error fetching comments for SIP ${sipNumber}:`, error)
          }
          return { sipNumber, count: 0 }
        })

        try {
          const results = await Promise.all(promises)

          // Update comment counts
          setCommentCounts((prev) => {
            const updated = { ...prev }
            results.forEach(({ sipNumber, count }) => {
              updated[sipNumber] = count
            })
            return updated
          })
        } catch (error) {
          console.error("Error processing comment batch:", error)
        }

        // Remove from fetching set
        setFetchingComments((prev) => {
          const updated = new Set(prev)
          batch.forEach((sipNumber) => updated.delete(sipNumber))
          return updated
        })

        // Add delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }
    }

    fetchCommentCounts()
  }, [sips, visibleSips, loading, commentCounts, fetchingComments])

  // Add this new useEffect to fetch SIP content
  useEffect(() => {
    const fetchSipDescriptions = async () => {
      if (loading || !sips.length) return

      const visibleSipNumbers = sips.slice(0, visibleSips).map((sip) => sip.number)
      const sipNumbersToFetch = visibleSipNumbers.filter(
        (sipNumber) => sipDescriptions[sipNumber] === undefined && !fetchingSipContent.has(sipNumber),
      )

      if (sipNumbersToFetch.length === 0) return

      // Limit concurrent requests to avoid rate limiting
      const batchSize = 2
      const batches = []
      for (let i = 0; i < sipNumbersToFetch.length; i += batchSize) {
        batches.push(sipNumbersToFetch.slice(i, i + batchSize))
      }

      for (const batch of batches) {
        // Mark as fetching
        setFetchingSipContent((prev) => new Set([...prev, ...batch]))

        // Process batch with delay between requests
        const promises = batch.map(async (sipNumber, index) => {
          // Add delay between requests in the same batch
          if (index > 0) {
            await new Promise((resolve) => setTimeout(resolve, 2000 * index))
          }

          try {
            // First check if we have a manual description
            const manualDescription = getSipPageDescription(sipNumber)
            if (manualDescription) {
              return { sipNumber, description: manualDescription }
            }

            // Otherwise fetch from API
            const response = await fetch(`/api/sip-content/${sipNumber}`)
            if (response.ok) {
              const data = await response.json()
              return { sipNumber, description: data.description || "No description available." }
            } else {
              // On error, provide a fallback description without showing error
              console.log(`Could not fetch SIP content for ${sipNumber}, using fallback`)
              return { sipNumber, description: "No description available." }
            }
          } catch (error) {
            // Silently handle errors with fallback
            console.log(`Error fetching SIP content for ${sipNumber}:`, error)
            return { sipNumber, description: "No description available." }
          }
        })

        try {
          const results = await Promise.all(promises)

          // Update SIP descriptions
          setSipDescriptions((prev) => {
            const updated = { ...prev }
            results.forEach(({ sipNumber, description }) => {
              updated[sipNumber] = description
            })
            return updated
          })
        } catch (error) {
          console.error("Error processing SIP content batch:", error)
        }

        // Remove from fetching set
        setFetchingSipContent((prev) => {
          const updated = new Set(prev)
          batch.forEach((sipNumber) => updated.delete(sipNumber))
          return updated
        })

        // Add delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
      }
    }

    fetchSipDescriptions()
  }, [sips, visibleSips, loading, sipDescriptions, fetchingSipContent])

  const loadMore = useCallback(() => {
    if (isLoadingMore || visibleSips >= sips.length) return

    setIsLoadingMore(true)

    // Simulate loading delay for better UX
    setTimeout(() => {
      setVisibleSips((prev) => Math.min(prev + 6, sips.length))
      setIsLoadingMore(false)
    }, 800)
  }, [isLoadingMore, visibleSips, sips.length])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && visibleSips < sips.length) {
          loadMore()
        }
      },
      { threshold: 0.1 },
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [loadMore, isLoadingMore, visibleSips, sips.length])

  useEffect(() => {
    if (sips.length > 0 && visibleSips > sips.length) {
      setVisibleSips(Math.min(visibleSips, sips.length))
    }
  }, [sips.length, visibleSips])

  const getStatusBadge = (pr: GitHubPR) => {
    // Check if PR was merged
    if (pr.merged_at) {
      return (
        <Badge className="bg-purple-500/20 text-purple-500 hover:bg-purple-500/20 flex items-center gap-1.5 border border-purple-500/20">
          <GitMerge className="h-3 w-3" /> {/* GitHub-style merged icon ONLY on chips */}
          MERGED
        </Badge>
      )
    }

    const isOpen = pr.state === "open"

    if (isOpen) {
      return (
        <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/20 flex items-center gap-1.5 border border-green-500/20">
          <div className="relative">
            <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 h-1.5 w-1.5 bg-green-500 rounded-full animate-ping"></div>
          </div>
          OPEN
        </Badge>
      )
    } else {
      return <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/20 border border-red-500/20">CLOSED</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Helper to get category from the explicit mapping
  const getSipCategory = (sipNumber: number): SIPCategory | undefined => {
    return sipCategories[sipNumber]
  }

  // Get category badge with black fill and white stroke
  const getCategoryBadge = (category: SIPCategory) => {
    return (
      <Badge
        variant="outline"
        className="bg-black text-white border-white/10 text-xs font-medium px-3 py-1 rounded-full hover:bg-black/90"
      >
        {category}
      </Badge>
    )
  }

  // New helper function to format and truncate descriptions for card display
  const formatAndTruncateDescription = (text: string | undefined, maxLength = 180): string => {
    if (!text) return "No description available."

    // 1. Clean up common Markdown formatting
    const cleanText = text
      .replace(/^#+\s*/gm, "") // Remove markdown headers (e.g., # Title)
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold (e.g., **bold**)
      .replace(/\*(.*?)\*/g, "$1") // Remove italics (e.g., *italic*)
      .replace(/`(.*?)`/g, "$1") // Remove inline code (e.g., `code`)
      .replace(/\[(.*?)\]$$.*?$$/g, "$1") // Remove links, keep text (e.g., [text](url))
      .replace(/\[(.*?)\]\[.*?\]/g, "$1") // Remove reference links, keep text
      .replace(/^-+\s*/gm, "") // Remove list hyphens
      .replace(/^\s*[*-]\s*/gm, "") // Remove bullet points
      .replace(/(\r\n|\n|\r){2,}/g, "\n\n") // Preserve explicit paragraph breaks
      .trim()

    // 2. Take the first few paragraphs/lines up to maxLength
    let result = ""
    let currentLength = 0
    const lines = cleanText.split("\n") // Split by single newlines to process line by line

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.length === 0 && currentLength > 0) {
        // Add a paragraph break if it's an empty line and we've already added content
        if (currentLength + 2 <= maxLength) {
          // Account for '\n\n'
          result += "\n\n"
          currentLength += 2
        } else {
          break // No space for new paragraph
        }
      } else if (trimmedLine.length > 0) {
        // Add space if not the very beginning and not a new paragraph
        const spaceToAdd = currentLength > 0 && !result.endsWith("\n\n") ? 1 : 0

        if (currentLength + trimmedLine.length + spaceToAdd <= maxLength) {
          if (spaceToAdd > 0) {
            result += " "
            currentLength += 1
          }
          result += trimmedLine
          currentLength += trimmedLine.length
        } else {
          // If adding the whole line exceeds maxLength, truncate the current line
          const remainingLength = maxLength - currentLength - (spaceToAdd > 0 ? 3 : 0) // Account for " ..."
          if (remainingLength > 0) {
            let truncatedLine = trimmedLine.substring(0, remainingLength)
            const lastSpace = truncatedLine.lastIndexOf(" ")
            if (lastSpace > 0) {
              truncatedLine = truncatedLine.substring(0, lastSpace)
            }
            result += truncatedLine
          }
          break // Max length reached
        }
      }
    }

    // 3. Add ellipsis if truncated
    if (result.length < cleanText.length && result.length > 0) {
      if (!result.endsWith("...")) {
        result += "..."
      }
    } else if (result.length === 0 && cleanText.length > 0) {
      // Fallback for very short maxLength or complex initial text
      result =
        cleanText.substring(0, Math.min(cleanText.length, maxLength)) + (cleanText.length > maxLength ? "..." : "")
    }

    return result.trim()
  }

  // Helper function to format and truncate descriptions for card display
  const formatCardDescription = (description: string, maxWords = 20): string => {
    if (!description) return "No description available."

    const words = description.split(" ")
    if (words.length <= maxWords) {
      return description
    }

    return words.slice(0, maxWords).join(" ") + "..."
  }

  // Get description from SIP page data - returns full string
  const getSipPageDescription = (sipNumber: number): string | null => {
    const sipPageDescriptions: Record<number, string> = {
      58: 'This SIP, titled "Add more tx_context," is a proposal to improve how smart contracts work on the Sui blockchain. Specifically, it suggests adding two new tools (or functions) to a part of Sui\'s programming system called the tx_context module. These tools help developers create smarter and more secure transactions that involve multiple people signing off on them.',
      57: "SIP-57 proposes adding a new feature called UpgradedPackageEvent to the Sui blockchain's framework. This event would automatically notify developers when a smart contract package (a bundle of code) is upgraded. The event includes details like the original package's address, making it easier to track changes. This improves transparency and helps developers monitor updates to the packages their applications rely on.",
      56: 'The "Attestation Registry" SIP, proposed by Sidestream Labs, introduces a new system on the Sui blockchain to help users figure out if a smart contract package or module is safe and trustworthy. A "package" or "module" is like a bundle of code that powers apps on Sui, such as a digital wallet or a game. Right now, there\'s no easy way for users to know if a package is secure or reliable before using it. This SIP creates a central registry—a kind of public bulletin board—where experts (called "attesters") can post trust signals, or "attestations," about a package\'s quality or safety.',
      55: 'SIP-55, titled "Infallible PTBs," is a proposal by Aftermath Finance to improve how transactions work on the Sui blockchain. It introduces a new feature called "infallible Programmable Transaction Blocks" (PTBs). A PTB is like a shopping list of tasks (or operations) that are bundled together into a single transaction on Sui. Right now, if any one task in a PTB fails, the entire transaction fails, and all changes are undone.',
      54: 'The "One-Click Trading" SIP, proposed by Aftermath Finance, suggests improvements to the Sui Wallet Standard, a set of rules that defines how wallets (apps that manage your blockchain assets) interact with Sui-based applications. The goal is to add a feature called "one-click trading" (1CT), which lets users set up their wallet to automatically approve certain transactions without needing to click "Approve" every time.',
      53: 'SIP-53, titled "Singleton Ability," proposed by Aftermath Finance, introduces a new feature to the Move programming language used on the Sui blockchain. This feature, called the "singleton" ability, ensures that only one instance of a specific type of object (like a digital certificate or key) can ever exist. Think of it like a unique item in a game—there can only be one legendary sword, and no duplicates are allowed.',
      52: "SIP-52, proposed by Aftermath Finance, introduces a new feature to the Sui blockchain's framework by adding a destroy_zero function to two important structures in the Sui token system: TreasuryCap and Supply. These structures are used to manage the creation (minting) and destruction (burning) of tokens, like digital coins or rewards in an app.",
      51: 'The "Block Streaming" SIP, proposed by Mingwei Tian from Mysten Labs, aims to make the Sui blockchain faster by allowing validators to stream uncommitted consensus blocks directly to full nodes.',
      50: "This amendment to SIP-1 simplifies categories for Standard-type SIPs by merging the Networking category into Core, reducing them to four: Core, Interface, Framework, and Application.",
      49: 'The "Revert SIP-45" SIP, proposed by moonshiesty, aims to undo a previous change introduced in SIP-45, which enforced a deterministic block order for transactions on the Sui blockchain.',
      48: 'The "Revert SIP-45: Deterministic Block Ordering" SIP, proposed by moonshiesty, revokes the changes introduced in SIP-45, which implemented deterministic transaction ordering based on gas prices. This reversal is proposed due to evidence that SIP-45 inadvertently increased MEV (Miner Extractable Value) risks by making it easier for searchers to execute strategies like front-running, back-running, and sandwich attacks.',
      47: 'The "Update to Sip-9" SIP, proposed by Joy Wang and Brandon Williams from Mysten Labs, enhances the Sui blockchain by adding support for a new "passkey" signature scheme. This allows users to sign transactions using passkeys, a secure and user-friendly authentication method supported by devices like phones, laptops, and security keys (e.g., Yubikeys).',
      46: 'The "Custom Transfer Handler Support for Sui Wallet" SIP, proposed by Tushar Sengar, introduces a new standard for the Sui wallet to handle assets with complex transfer requirements, such as NFTs (non-fungible tokens) or governance tokens.',
      45: 'The "Prioritized Transaction Submission" SIP, proposed by Shio Coder, introduces deterministic block ordering based on gas price by increasing the max gas value and adjusting validator behavior.',
      44: 'The "Multi-Address Object Usage in Transactions" SIP, proposed by Cyril Morlet, aims to enhance the Sui blockchain\'s transaction system by allowing a single transaction to use objects (like coins, NFTs, or other digital assets) owned by multiple addresses, as long as all owners sign the transaction.',
      43: 'The "Add Arden as a zkLogin OpenID provider" SIP, proposed by Arden, enables email-based authentication on Sui by whitelisting Arden as an OpenID Connect (OIDC) provider for zkLogin.',
      42: 'The "Add Karrier One as a zkLogin OpenID provider" SIP, proposed by Andrew Buchanan, enables phone number-based authentication on Sui by whitelisting Karrier One as an OpenID Connect (OIDC) provider for zkLogin.',
      41: 'The "Secure Shared Object Access with Version Scoping" SIP, proposed by Yudi Chen, introduces a mechanism to improve the safety of shared object interactions in the Sui network by implementing version scoping.',
      40: 'The "Expose temp_freeze & temp_unfreeze in transfer.move" SIP, proposed by Sarthak, extends the functionality of Sui\'s transfer.move module by introducing temp_freeze_object and temp_unfreeze_object functions.',
      39: 'The "Lowering the validator set barrier to entry" SIP, proposed by Sam Blackshear, updates the admission rules for joining the Sui validator set.',
      38: 'The "Introduction of Verifiable Delay Functions (VDFs) to Sui Framework" SIP, proposed by Jonas Lindstrøm, integrates Verifiable Delay Functions (VDFs) into the Sui blockchain.',
      37: 'The "Expose ProgrammableTransaction Data in TxContext" SIP, proposed by Thouny, enhances the Sui Framework by modifying the TxContext struct to include data about the Programmable Transaction Block (PTB) being executed.',
      36: 'The "Passkey Session based signature scheme support" SIP, proposed by Joy Wang, introduces a session-based passkey signature mechanism to the Sui protocol.',
      35: 'The "FanTV OpenID Whitelist" SIP, proposed by Jaswant Kumar, seeks to whitelist FanTV\'s custom OpenID provider for zkLogin on the Sui blockchain.',
      34: 'The "FanTV OpenID Whitelist" SIP, proposed by Jaswant Kumar, proposes whitelisting FanTV\'s custom OpenID provider to enable zkLogin with mobile number authentication across the Sui ecosystem.',
      33: 'The "Allow StakedSui objects to be redeemed in same epoch" SIP, proposed by ripleys, removes a protocol-level restriction that prevents redeeming a StakedSui object within the same epoch it was created.',
      32: 'The "Allow StakedSui objects to be redeemed in same epoch" SIP, proposed by ripleys, removes a protocol-level restriction that prevents redeeming a StakedSui object within the same epoch it was created.',
      31: 'The "Merge StakedSui Objects Across Different Activation Epochs" SIP, proposed by ripleys, introduces a new Lst object to the Sui Framework that allows StakedSui objects from different epochs to be transformed into fungible, epoch-independent tokens.',
      30: 'The "Adding WebAuthn Support to zkLogin" SIP, proposed by DaoAuth, introduces optional WebAuthn integration into zkLogin for enhanced security, convenience, and user familiarity.',
      29: 'The "BLS-12381 Encryption Public Key On-Chain Discoverability" SIP, proposed by Joy Wang, standardizes a data structure to publish BLS encryption public keys on-chain.',
      28: 'The "BLS-12381 Encryption Key Storage in Wallet" SIP, proposed by Joy Wang, standardizes the derivation path for BLS-12381 encryption keys from a wallet\'s master private key.',
      27: 'The "BLS-12381 Encryption Key Management for Non Private Key Wallet" SIP, authored by Joy Wang, introduces a server-side method to derive encryption keys for wallets that do not store a master private key—such as zkLogin or Multisig wallets.',
      26: 'The "BLS-12381 Encryption Key Storage in Wallet" SIP, authored by Joy Wang, defines the derivation path standard for BLS-12381 encryption keys within wallets, while also allowing for custodial key generation for keyless wallets like zkLogin.',
      25: 'The "BLS-12381 Encryption Key Storage in Wallet" SIP, authored by Joy Wang, defines the derivation path standard for BLS-12381 encryption keys within non-custodial wallets and also proposes a custodial alternative via a centralized key server for keyless wallets such as zkLogin.',
      24: 'The "MultiSig Cache Storage" SIP, authored by Pika (RandyPen), proposes an enhancement to MultiSig transaction workflows by allowing validator nodes to cache partially signed transactions and automatically combine them when threshold conditions are met.',
      23: 'The "BLS-12381 Encryption Key Derivation Path from Master Private Key" SIP, authored by Author TBD, introduces a standardized derivation path for BLS-12381 encryption keys within Sui wallets.',
      22: 'The "Coin Metadata V2" SIP, authored by @damirka, introduces a modular and decentralized system for managing CoinMetadata in the Sui blockchain.',
      21: 'The "Keypairs in Files Should Be AES-128 Encoded" SIP, proposed by oday0311@hotmail.com, enhances the security of Sui\'s keypair storage system by replacing base64 encoding with AES-128-CBC encryption in configuration files like sui.keystore, network.yaml, and fullnode.yaml.',
      20: 'The "Native Stake" SIP, proposed by Pika, enhances the security of native staking on Sui by introducing a new non-transferable object called NativeStakedSui.',
      19: 'The "Soft Bundle API" SIP, proposed by Shio Coder, introduces a new way to bundle and sequence multiple Sui transactions with different signers using a soft bundling mechanism.',
      18: 'The "Dependency Update Check API" SIP, proposed by kairoski03, introduces a standardized API protocol for checking the latest versions of package dependencies in Sui smart contracts.',
      17: 'The "Code Verification API" SIP, proposed by kairoski03, introduces a standard verification protocol that enables users and developers to validate and access the source code of any on-chain Sui Move package using its package ID.',
      16: 'The "Add More tx_context" SIP, proposed by Eason Chen (EasonC13), extends the capabilities of the tx_context module in Move to expose additional transaction metadata: the gas sender, a full list of transaction signers, and signer verification.',
      15: 'The "Use Bech32 encoding for private key in wallets import and exports" SIP, proposed by Joy Wang, introduces a safer and more distinct format for representing Sui private keys by switching from 32-byte Hex encoding to a 33-byte Bech32-encoded string with a 1-byte flag.',
      14: 'The "New struct MatchedOrderMetadata in deepbook" SIP, proposed by Sarthak, introduces a new struct in the Sui Framework\'s DeepBook module that returns detailed metadata for matched orders when placing trades.',
      13: 'The "BigVector Data Structure" SIP introduces a scalable vector-like abstraction for storing large or growing datasets within smart contracts using dynamic fields.',
      12: 'The "Poseidon in SUI Move" SIP, proposed by Jonas Lindstrøm, adds support for the Poseidon cryptographic hash function to the Sui Move framework.',
      11: "This SIP introduces Action Primitive—a new object type that transforms user interactions into on-chain, programmable, and composable objects.",
      10: 'The "MultiSig Cache Storage" SIP, proposed by Pika (RandyPen), enhances the Sui blockchain\'s MultiSig transaction mechanism by enabling validator nodes to directly cache and manage participant signatures, removing the need for an off-chain intermediary server.',
      9: 'The "WebAuthn Signature Scheme Support" SIP, proposed by Krešimir Klas and Kostas Chalkias, introduces a new webauthn signature scheme to Sui, enabling users to sign transactions using WebAuthn authenticators (like passkeys, Yubikeys, iPhones, and Android devices).',
      8: 'The "Minor Changes to SIP-6" SIP introduces modular improvements to Sui\'s staking system by exposing internal staking pool exchange rate data via public and friend-accessible functions.',
      7: 'The "Improving Deepbook Composability" SIP, proposed by Kinshuk, Sarthak, Aditya, and Ananya, introduces a key enhancement to the Deepbook package by adding the store ability to the Pool struct.',
      6: 'The "StakedSui Improvements" SIP, proposed by Kevin from Aftermath Finance, enhances the composability, transparency, and programmability of Sui\'s staking system by giving the StakedSui object the store ability and introducing new non-entry functions that return StakedSui and Coin<SUI> objects directly.',
      5: 'The "Structured Derivative Standard" SIP, proposed by the Torai.money team, introduces a novel asset standard on Sui that enables complex financial instruments like Collateralized Debt Obligations (CDOs) and Mortgage-Backed Securities (MBS) to exist in decentralized finance.',
    }

    const fullDescription = sipPageDescriptions[sipNumber]
    return fullDescription || null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent className="flex-grow">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error loading SIPs: {error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {sips.slice(0, visibleSips).map((sip) => {
          // Get comment count prioritizing available total_comments from API, then fallback to fetched count
          const hasTotal = sip.total_comments !== undefined
          const fetchedCount = commentCounts[sip.number]
          const isLoadingComments = !hasTotal && fetchedCount === undefined
          const commentCount = hasTotal ? sip.total_comments! : fetchedCount ?? 0

          const sipCategory = getSipCategory(sip.number)
          // Prioritize manual description, then PR body
          const rawDescription = getSipPageDescription(sip.number) || sip.body

          const sipDescription = sipDescriptions[sip.number]
          const isLoadingSipContent = fetchingSipContent.has(sip.number)
          const displayDescription = sipDescription
            ? formatCardDescription(sipDescription)
            : isLoadingSipContent
              ? "Loading description..."
              : "No description available."

          return (
            <Card key={sip.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex gap-2">{getStatusBadge(sip)}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {/* Comment count badge - hide when count is 0 and not loading */}
                    {isLoadingComments || commentCount > 0 ? (
                      <Badge variant="secondary" className="flex items-center gap-1.5 text-xs font-medium">
                        <MessageCircle className="h-3 w-3" />
                        {isLoadingComments ? "..." : commentCount}
                      </Badge>
                    ) : null}
                    <div className="flex items-center gap-1">
                      <GitPullRequest className="h-4 w-4" />#{sip.number}
                    </div>
                  </div>
                </div>
                <CardTitle className="line-clamp-2 text-lg leading-tight">{sip.title}</CardTitle>
                {/* Display the truncated description */}
                <div className="text-sm text-muted-foreground leading-relaxed break-all overflow-x-auto">{displayDescription}</div>
                <CardDescription className="text-xs">
                  Created: {formatDate(sip.created_at)}
                  {sip.updated_at !== sip.created_at && ` • Updated: ${formatDate(sip.updated_at)}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <img
                    src={sip.user.avatar_url || "/placeholder.svg"}
                    alt={sip.user.login}
                    className="h-5 w-5 rounded-full"
                  />
                  <span>by {sip.user.login}</span>
                </div>

                {/* Category badge with black fill and white stroke */}
                {sipCategory && <div className="mb-3">{getCategoryBadge(sipCategory)}</div>}

                <div className="flex flex-wrap gap-1 mb-2">
                  {sip.labels.slice(0, 3).map((label) => (
                    <Badge
                      key={label.name}
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: `#${label.color}`, color: `#${label.color}` }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                  {sip.labels.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{sip.labels.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-2">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    window.open(sip.html_url, "_blank", "noopener,noreferrer")
                  }}
                  className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  GitHub
                </button>
                <Link
                  href={`/sips/${sip.number}`}
                  className="inline-flex items-center gap-1 text-xs hover:text-foreground transition-colors"
                >
                  Details
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {visibleSips < sips.length && (
        <div ref={observerRef} className="flex justify-center py-8">
          {isLoadingMore && (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={`skeleton-${i}`} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {sips.length === 0 && !loading && (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">No SIPs found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
