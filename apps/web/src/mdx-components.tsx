import type { MDXComponents } from "mdx/types";
import React from "react";
import { CodeBlock } from "./components/CodeBlock";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Override the HTML <pre> tag with our custom CodeBlock component
    pre: (props: React.HTMLAttributes<HTMLPreElement>) => <CodeBlock {...props} />,
    ...components,
  };
}
