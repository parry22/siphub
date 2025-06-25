import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
