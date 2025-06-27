import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SIPCategory } from "./data"
import { sipCategories } from "./sip-categories"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to convert SIPs data to Excel format
export function exportToExcel(sips: any[]) {
  // Create CSV content
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Add headers
  csvContent += "Number,Title,Status,Created Date,Updated Date,Author,Labels\n";
  
  // Add data rows
  sips.forEach(sip => {
    const status = sip.state === "open" ? "Open" : sip.merged_at ? "Merged" : "Closed";
    const labels = sip.labels.map((label: any) => label.name).join(", ");
    
    // Format the row and escape any commas in text fields
    const row = [
      sip.number,
      `"${sip.title.replace(/"/g, '""')}"`, // Escape quotes in title
      status,
      sip.created_at,
      sip.updated_at,
      sip.user.login,
      `"${labels.replace(/"/g, '""')}"` // Escape quotes in labels
    ];
    
    csvContent += row.join(",") + "\n";
  });
  
  // Create download link
  const encodedUri = encodeURI(csvContent);
  return encodedUri;
}

// Mapping from keywords in label names to SIP categories
const labelCategoryMap: Record<string, SIPCategory> = {
  core: "Core",
  storage: "Storage",
  wallet: "Wallet UX & Security",
  security: "Wallet UX & Security",
  governance: "Governance",
  process: "Process",
  staking: "Staking & Liquid Staking",
  "liquid staking": "Staking & Liquid Staking",
  validator: "Staking & Validators",
  validators: "Staking & Validators",
  gas: "Gas",
  economics: "Economics",
  crypto: "Crypto Primitives",
  primitive: "Crypto Primitives",
  networking: "Networking & Mempool",
  mempool: "Networking & Mempool",
  interop: "Interop",
}

// Derive ALL categories from labels and mapping; returns array
export function getCategoriesForSip(pr: { number: number; labels: { name: string }[] }): SIPCategory[] {
  const set = new Set<SIPCategory>()

  for (const { name } of pr.labels) {
    const lower = name.toLowerCase()
    for (const key in labelCategoryMap) {
      if (lower === key || lower.includes(key)) {
        set.add(labelCategoryMap[key])
      }
    }
  }

  // include categories from static mapping
  const staticCats = sipCategories[pr.number]
  if (staticCats && staticCats.length) staticCats.forEach(c => set.add(c))

  // default fallback when none
  if (set.size === 0) set.add("Dev Tools")

  return Array.from(set)
}
