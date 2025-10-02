// src/organisms/ChatWidget/markdown/MarkdownContent.tsx
import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { theme } from "src/styles";

export const toPlainText = (node: any): string => {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toPlainText).join("");
  if (typeof node === "object" && (node as any).props)
    return toPlainText((node as any).props?.children);
  return "";
};

// Named so paragraph renderer can recognize it if you later want to.
export function MarkdownCode({
  inline,
  className,
  children,
  ...props
}: {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return inline ? (
    <code className={className} {...props}>
      {children}
    </code>
  ) : (
    <pre className={className}>
      <code {...props}>{children}</code>
    </pre>
  );
}

// Small style helpers so we don’t rely on global CSS
const styles = {
  tableWrap: {
    width: "100%",
    overflowX: "auto" as const,
    WebkitOverflowScrolling: "touch" as const,
    overscrollBehaviorX: "contain" as const,
    margin: "8px 0",
    border: `1px solid ${theme.colors.lightA}`,
    borderRadius: '2px'
  },
  table: {
    borderCollapse: "collapse" as const,
    // Let content define width; will overflow wrapper and become scrollable
    width: "max-content",
    minWidth: "100%",
  },
  th: {
    textAlign: "left" as const,
    fontWeight: 600,
    borderBottom: `1px solid ${theme.colors.lightA}`,
    padding: "6px 10px",
    whiteSpace: "nowrap" as const,
    backgroundColor: theme.colors.lightA,
  },
  td: {
    borderBottom: `1px solid ${theme.colors.lightA}`,
    padding: "6px 10px",
    verticalAlign: "top" as const,
    whiteSpace: "nowrap" as const, // prevents cells from forcing line breaks that widen rows unpredictably
  },
};

const MarkdownComponents: Components = {
  // Use a <div> for paragraphs to avoid <pre> under <p> hydration warnings
  p: ({ children, ...rest }) => <div {...rest}>{children}</div>,

  // FIX: keep children so link text renders
  a: ({ node, children, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),

  code: MarkdownCode as any,

  // Make tables horizontally scrollable in a narrow chat box
  table: ({ children, ...props }) => (
    <div style={styles.tableWrap}>
      <table {...props} style={styles.table}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => <thead {...props}>{children}</thead>,
  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
  th: ({ children, style, ...props }) => (
    <th {...props} style={{ ...styles.th, ...style }}>
      {children}
    </th>
  ),
  td: ({ children, style, ...props }) => (
    <td {...props} style={{ ...styles.td, ...style }}>
      {children}
    </td>
  ),
};

const MarkdownContent = React.memo(function MarkdownContent({
  value,
}: {
  value: string;
}) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
      {value}
    </ReactMarkdown>
  );
});

export default MarkdownContent;
