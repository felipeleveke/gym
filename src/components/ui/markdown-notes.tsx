import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownNotesProps {
  content: string;
  className?: string;
}

export function MarkdownNotes({ content, className }: MarkdownNotesProps) {
  return (
    <div className={cn('text-sm', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Personalizar el renderizado de algunos elementos
          h1: ({ children }) => <h1 className="text-base font-semibold mt-2 mb-1 text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-medium mt-1 mb-0.5 text-foreground">{children}</h3>,
          p: ({ children }) => <p className="text-sm my-1 text-muted-foreground">{children}</p>,
          ul: ({ children }) => <ul className="text-sm my-1 list-disc pl-4 text-muted-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="text-sm my-1 list-decimal pl-4 text-muted-foreground">{children}</ol>,
          li: ({ children }) => <li className="my-0.5 text-muted-foreground">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
          code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs text-foreground">{children}</code>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-muted pl-3 italic my-2 text-muted-foreground">{children}</blockquote>
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

