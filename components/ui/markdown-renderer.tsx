// @ts-nocheck
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Separator } from './separator';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Remove SIP metadata table if present
  const formattedContent = React.useMemo(() => {
    if (!content) return '';
    
    // Check if content starts with a markdown table that looks like a SIP metadata table
    if (content.trim().startsWith('|') && 
        (content.includes('| SIP-Number |') || 
         content.includes('|SIP-Number|') || 
         content.includes('| Title |'))) {
      
      // Find where the table ends (usually after a blank line)
      const parts = content.split('\n\n');
      const tableSection = parts[0];
      const restOfContent = parts.slice(1).join('\n\n');
      
      // Check if this is indeed a SIP metadata table by looking for key patterns
      const isSipMetadataTable = tableSection.includes('SIP-Number') || 
                                (tableSection.includes('Title') && 
                                 tableSection.includes('Author') && 
                                 tableSection.includes('Type'));
      
      if (isSipMetadataTable) {
        // Remove the table completely
        return restOfContent;
      }
    }
    
    return content;
  }, [content]);

  return (
    <div className={cn("prose prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none", className)}>
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4 border-b pb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-6 mb-3" {...props} />,
          p: ({ node, ...props }) => <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />,
          a: ({ node, ...props }) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
          ul: ({ node, ...props }) => <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />,
          li: ({ node, ...props }) => <li className="mt-2" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="mt-6 border-l-2 pl-6 italic" {...props} />,
          code: ({ node, inline, className, children, ...props }) => {
            return <code className="bg-muted px-1 py-0.5 rounded" {...props}>{children}</code>
          },
          hr: ({ node, ...props }) => <Separator className="my-8" {...props} />,
          table: ({ node, ...props }) => <table className="min-w-full my-6 border-collapse" {...props} />,
          thead: ({ node, ...props }) => <thead className="bg-muted" {...props} />,
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => <tr className="border-b last:border-none" {...props} />,
          th: ({ node, ...props }) => <th className="border px-2 py-1 text-left font-semibold" {...props} />,
          td: ({ node, ...props }) => <td className="border px-2 py-1" {...props} />,
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
} 