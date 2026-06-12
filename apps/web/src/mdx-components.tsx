import type { MDXComponents } from "mdx/types";
import type { HTMLAttributes } from "react";
import { CodeBlock } from "./components/code-block";
import { Quiz } from "./components/mdx/quiz";
import { Callout } from "./components/mdx/callout";
import { CodeTabs } from "./components/mdx/code-tabs";
import { DocLinks } from "./components/mdx/doc-links";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // HTML <pre> を独自の CodeBlock(コピー機能付き)に差し替え
    pre: (props: HTMLAttributes<HTMLPreElement>) => <CodeBlock {...props} />,
    // MDX から名前で使える学習用コンポーネント群
    Quiz,
    Callout,
    CodeTabs,
    DocLinks,
    ...components,
  };
}
