"use client";

import React, { useState, useRef } from "react";

export function CodeBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = () => {
    if (preRef.current) {
      // Get text excluding potential UI decorations from rehype-pretty-code
      const text = preRef.current.textContent || "";
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="relative group my-6 rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden">
      <div className="absolute right-3 top-3 z-10">
        <button
          onClick={handleCopy}
          className="px-2.5 py-1 text-xs rounded border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre ref={preRef} className="p-4 overflow-x-auto text-sm leading-relaxed" {...props}>
        {children}
      </pre>
    </div>
  );
}
