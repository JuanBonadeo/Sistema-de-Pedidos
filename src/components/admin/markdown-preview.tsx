"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

/**
 * Renders markdown with Tailwind styles tuned for the chatbot prompt editor.
 * Kept small on purpose — we don't need full typography plugins here.
 */
export function MarkdownPreview({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose-chatbot max-w-none overflow-y-auto rounded-md border border-zinc-200 bg-white p-4 text-sm leading-relaxed text-zinc-800",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-4 text-xl font-bold text-zinc-900 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-5 text-base font-bold text-zinc-900 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1.5 mt-4 text-sm font-semibold text-zinc-900 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-700 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-2 text-sm leading-relaxed text-zinc-700">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-2 list-disc space-y-1 pl-5 text-sm text-zinc-700 marker:text-zinc-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 list-decimal space-y-1 pl-5 text-sm text-zinc-700 marker:text-zinc-400">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-zinc-700">{children}</em>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code
                  className={cn(
                    "block overflow-auto rounded-md bg-zinc-900 p-3 font-mono text-xs leading-snug text-emerald-200",
                    className,
                  )}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.8em] text-zinc-800">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-3 overflow-auto rounded-md bg-zinc-900 p-3 font-mono text-xs leading-snug text-emerald-200">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-4 border-zinc-300 bg-zinc-50 px-3 py-2 text-sm italic text-zinc-700">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-zinc-200" />,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-full border border-zinc-200 text-xs">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-zinc-200 bg-zinc-50 px-2 py-1 text-left font-semibold text-zinc-900">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-zinc-100 px-2 py-1 text-zinc-700">
              {children}
            </td>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
