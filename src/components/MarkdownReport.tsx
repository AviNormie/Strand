"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownReport({ content }: { content: string }) {
  return (
    <div className="prose-report max-w-none text-[15px] leading-relaxed text-ink/80">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 font-display border-b-2 border-ink pb-2 text-2xl font-bold tracking-tight text-ink first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-display mb-3 mt-8 text-xl font-bold tracking-tight text-ink">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-6 text-lg font-semibold text-ink">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-4 text-base font-semibold text-ink">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-3 leading-relaxed">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-ink">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1.5 pl-5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1.5 pl-5">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium text-ink underline decoration-accent-blue decoration-2 underline-offset-2 hover:decoration-ink"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-accent-yellow/50 px-1.5 py-0.5 font-mono text-xs text-ink">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto rounded-xl border-2 border-ink bg-white p-3 text-xs text-ink">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-accent-yellow pl-4 text-ink/70">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-ink/15" />,
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b-2 border-ink px-2 py-2 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-ink/10 px-2 py-2">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
