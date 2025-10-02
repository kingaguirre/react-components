"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import "katex/dist/katex.min.css";
import { theme } from "src/styles";
import {
  Root,
  CodeBlockWrap,
  CopyBtn,
  CopyIcon,
  LangBadge,
  InlineCode,
  TableWrap,
  StyledTable,
  Th,
  Td,
} from "./styled";

/** ---------------- Math normalizer (unchanged logic) ---------------- */
function normalizeMath(input: string): string {
  const LATEX =
    /\\(frac|text|left|right|sqrt|sum|prod|times|cdot|alpha|beta|gamma|pi|begin|end)/;

  const wrapDisplay = (s: string) => `\n$$\n${s.trim()}\n$$\n`;
  const wrapInline = (s: string) => `$${s.trim()}$`;

  const lines = input.split(/\r?\n/);
  let inFence = false;
  let fenceMarker = "";
  let inBracketBlock = false;
  const buf: string[] = [];
  const out: string[] = [];

  const flushBracket = () => {
    const inner = buf.join("\n").trim();
    buf.length = 0;
    inBracketBlock = false;
    if (!inner) return;
    if (LATEX.test(inner)) out.push(wrapDisplay(inner));
    else out.push(inner);
  };

  for (let i = 0; i < lines.length; i++) {
    let L = lines[i];

    const fence = L.match(/^(\s*)(`{3,}|~{3,})/);
    if (fence) {
      if (inBracketBlock) flushBracket();
      const marker = fence[2];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = "";
      }
      out.push(L);
      continue;
    }
    if (inFence) {
      out.push(L);
      continue;
    }

    if (!inBracketBlock && /^\s*\[\s*$/.test(L)) {
      inBracketBlock = true;
      continue;
    }
    if (inBracketBlock) {
      if (/^\s*\]\s*$/.test(L)) {
        flushBracket();
      } else {
        buf.push(L);
      }
      continue;
    }

    L = L.replace(/^\s*\[\s*([\s\S]*?)\s*\]\s*$/g, (_m, inner) =>
      LATEX.test(inner) ? wrapDisplay(inner) : String(inner ?? "").trim(),
    );
    L = L.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_m, inner) =>
      wrapInline(inner),
    );
    L = L.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_m, inner) =>
      wrapDisplay(inner),
    );

    if (LATEX.test(L) && !/[`$]/.test(L) && !/\\\[|\\\(/.test(L)) {
      L = wrapDisplay(L);
    }

    if (/^\s*(?:\\)?[\[\]]\s*$/.test(L)) continue;

    out.push(L);
  }

  if (inBracketBlock) flushBracket();
  return out.join("\n");
}

/** ---------------- Helpers ---------------- */
const stripZW = (s: string) => s.replace(/[\u200B-\u200D\uFEFF]/g, "");
const toText = (n: any): string => {
  if (n == null || n === false) return "";
  if (typeof n === "string" || typeof n === "number") return String(n);
  if (Array.isArray(n)) return n.map(toText).join("");
  if (typeof n === "object" && (n as any).props)
    return toText((n as any).props.children);
  return "";
};
const isBracketOnly = (children: React.ReactNode) => {
  const t = stripZW(toText(children)).trim();
  return t === "[" || t === "]" || t === "\\[" || t === "\\]";
};
type DomProps = {
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  title?: string;
  role?: string;
  href?: string;
};
const pick = <T extends object, K extends keyof T>(
  o: T,
  keys: K[],
): Pick<T, K> =>
  keys.reduce(
    (acc, k) => {
      if ((o as any)[k] !== undefined) (acc as any)[k] = (o as any)[k];
      return acc;
    },
    {} as Pick<T, K>,
  );

/** ---------------- Prettier + Shiki (same approach) ---------------- */
const detectLang = (className?: string): string => {
  if (!className) return "plaintext";
  const m =
    className.match(/language-([\w+-]+)/i) ||
    className.match(/lang(?:uage)?-?([\w+-]+)/i);
  return (m?.[1] || "plaintext").toLowerCase();
};
const looksLikeJson = (s: string) => {
  const t = s.trim();
  return (
    (t.startsWith("{") && t.endsWith("}")) ||
    (t.startsWith("[") && t.endsWith("]"))
  );
};
async function formatWithPrettier(
  code: string,
  lang: string,
): Promise<string | null> {
  const parser =
    lang === "javascript" || lang === "js" || lang === "jsx"
      ? "babel"
      : lang === "typescript" || lang === "ts" || lang === "tsx"
        ? "typescript"
        : lang === "css" || lang === "scss" || lang === "less"
          ? "css"
          : lang === "html" || lang === "xml"
            ? "html"
            : lang === "markdown" || lang === "md"
              ? "markdown"
              : null;
  if (!parser) return null;
  try {
    const [{ default: prettier }, ...plugins] = await Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/babel"),
      import("prettier/plugins/estree"),
      import("prettier/plugins/typescript"),
      import("prettier/plugins/postcss"),
      import("prettier/plugins/html"),
      import("prettier/plugins/markdown"),
    ]);
    const pluginList = plugins.map((m) => m.default).filter(Boolean);
    return prettier.format(code, {
      parser,
      plugins: pluginList,
      printWidth: 100,
      tabWidth: 2,
      singleQuote: true,
      semi: true,
      trailingComma: "all",
    });
  } catch {
    return null;
  }
}

type Highlighter =
  | { type: "shiki1"; highlighter: any; theme: string }
  | { type: "shiki2"; highlighter: any; theme: string };

let shikiCache: Highlighter | null = null;
async function getShiki(): Promise<Highlighter | null> {
  try {
    const m: any = await import("shiki");
    if (m.getHighlighter) {
      const highlighter = await m.getHighlighter({ theme: "light-plus" });
      return { type: "shiki1", highlighter, theme: "light-plus" };
    }
    if (m.createHighlighter) {
      const highlighter = await m.createHighlighter({
        themes: ["light-plus"],
        langs: [
          "javascript",
          "typescript",
          "tsx",
          "json",
          "css",
          "html",
          "markdown",
          "bash",
        ],
      });
      return { type: "shiki2", highlighter, theme: "light-plus" };
    }
    return null;
  } catch {
    return null;
  }
}
async function shikiHighlight(
  code: string,
  lang: string,
): Promise<string | null> {
  if (!shikiCache) shikiCache = await getShiki();
  if (!shikiCache) return null;
  try {
    if (shikiCache.type === "shiki1") {
      const { highlighter, theme } = shikiCache;
      const supported = highlighter.getLoadedLanguages?.() ?? [];
      const useLang = supported.includes(lang) ? lang : "plaintext";
      return highlighter.codeToHtml(code, { lang: useLang, theme });
    } else {
      const { highlighter, theme } = shikiCache;
      const useLang = shikiCache.highlighter.getLoadedLanguages().includes(lang)
        ? lang
        : "plaintext";
      return highlighter.codeToHtml(code, { lang: useLang, theme });
    }
  } catch {
    return null;
  }
}

/** ---------------- Block code renderer ---------------- */
const BlockCode: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  const raw = useMemo(
    () => toText(children ?? "").replace(/\n$/, ""),
    [children],
  );
  const lang = useMemo(() => detectLang(className), [className]);
  const [text, setText] = useState(raw);
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const tt = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      // JSON → pretty (fast)
      if (lang === "json" || looksLikeJson(raw)) {
        try {
          const val = JSON.parse(raw);
          const pretty = JSON.stringify(val, null, 2);
          if (!alive) return;
          setText(pretty);
          const colored = await shikiHighlight(pretty, "json");
          if (alive) setHtml(colored);
          return;
        } catch {
          /* fallthrough */
        }
      }
      // Prettier (optional)
      const pretty = (await formatWithPrettier(raw, lang)) ?? raw;
      if (!alive) return;
      setText(pretty);
      // Shiki (optional)
      const colored = await shikiHighlight(pretty, lang);
      if (!alive) return;
      setHtml(colored);
    })();
    return () => {
      alive = false;
      if (tt.current) window.clearTimeout(tt.current);
    };
  }, [raw, lang]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (tt.current) window.clearTimeout(tt.current);
      tt.current = window.setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <CodeBlockWrap>
      <LangBadge>{lang}</LangBadge>
      <CopyBtn onClick={onCopy} aria-label="Copy code">
        <CopyIcon icon={copied ? "check" : "copy"} />
        {copied ? "Copied" : "Copy"}
      </CopyBtn>
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className={className}>
          <code>{text}</code>
        </pre>
      )}
    </CodeBlockWrap>
  );
};

/** ---------------- Markdown components ---------------- */
const MarkdownComponents: Components = {
  p: ({ children, ...rest }) => {
    if (isBracketOnly(children)) return null;
    const safed = pick(rest as DomProps, [
      "className",
      "style",
      "id",
      "title",
      "role",
    ]);
    return <div {...safed}>{children}</div>;
  },
  li: (props) => {
    const { children, ...rest } = props as any;
    if (isBracketOnly(children)) return null;
    const safed = pick(rest as DomProps, [
      "className",
      "style",
      "id",
      "title",
      "role",
    ]);
    return <li {...safed}>{children}</li>;
  },
  h1: (props) => {
    const { children, ...rest } = props as any;
    if (isBracketOnly(children)) return null;
    return (
      <h1
        {...pick(rest as DomProps, [
          "className",
          "style",
          "id",
          "title",
          "role",
        ])}
      >
        {children}
      </h1>
    );
  },
  h2: (props) => {
    const { children, ...rest } = props as any;
    if (isBracketOnly(children)) return null;
    return (
      <h2
        {...pick(rest as DomProps, [
          "className",
          "style",
          "id",
          "title",
          "role",
        ])}
      >
        {children}
      </h2>
    );
  },
  h3: (props) => {
    const { children, ...rest } = props as any;
    if (isBracketOnly(children)) return null;
    return (
      <h3
        {...pick(rest as DomProps, [
          "className",
          "style",
          "id",
          "title",
          "role",
        ])}
      >
        {children}
      </h3>
    );
  },
  h4: (props) => {
    const { children, ...rest } = props as any;
    if (isBracketOnly(children)) return null;
    return (
      <h4
        {...pick(rest as DomProps, [
          "className",
          "style",
          "id",
          "title",
          "role",
        ])}
      >
        {children}
      </h4>
    );
  },
  h5: (props) => {
    const { children, ...rest } = props as any;
    if (isBracketOnly(children)) return null;
    return (
      <h5
        {...pick(rest as DomProps, [
          "className",
          "style",
          "id",
          "title",
          "role",
        ])}
      >
        {children}
      </h5>
    );
  },
  h6: (props) => {
    const { children, ...rest } = props as any;
    if (isBracketOnly(children)) return null;
    return (
      <h6
        {...pick(rest as DomProps, [
          "className",
          "style",
          "id",
          "title",
          "role",
        ])}
      >
        {children}
      </h6>
    );
  },

  a: (props) => {
    const { children } = props as any;
    const href = (props as any).href as string | undefined;
    const safed = pick(props as DomProps, [
      "className",
      "style",
      "title",
      "href",
    ]);
    const isData = typeof href === "string" && href.startsWith("data:");
    return (
      <a
        {...safed}
        target="_blank"
        rel="noopener noreferrer"
        // make data: links download instead of rendering as a huge page
        download={isData ? "" : undefined}
      >
        {children}
      </a>
    );
  },

  code: (props) => {
    const { inline, className, children } = props as any;
    if (inline)
      return <InlineCode className={className}>{children}</InlineCode>;
    return <BlockCode className={className}>{children}</BlockCode>;
  },

  table: (props) => (
    <TableWrap>
      <StyledTable>{(props as any).children}</StyledTable>
    </TableWrap>
  ),
  thead: (p) => <thead>{(p as any).children}</thead>,
  tbody: (p) => <tbody>{(p as any).children}</tbody>,
  tr: (p) => <tr>{(p as any).children}</tr>,
  th: (p) => <Th>{(p as any).children}</Th>,
  td: (p) => <Td>{(p as any).children}</Td>,
};

/** ---------------- HTML sanitization schema ---------------- */
const schema = {
  ...defaultSchema,
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    "*": [
      ...(defaultSchema.attributes?.["*"] || []),
      // allow utility classes + ids + inline styles + data-*
      "className",
      "class",
      "id",
      "style",
      ["data-*", "data"],
    ],
    a: [
      ...(defaultSchema.attributes?.a || []),
      "target",
      "rel",
      "href",
      "name",
      "title",
      "download",
    ],
    img: [
      ...(defaultSchema.attributes?.img || []),
      "src",
      "srcset",
      "sizes",
      "alt",
      "title",
      "width",
      "height",
      "loading",
      "decoding",
    ],
    iframe: [
      ...(defaultSchema.attributes?.iframe || []),
      "src",
      "title",
      "width",
      "height",
      "allow",
      "allowfullscreen",
      "loading",
      "referrerpolicy",
    ],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    // permit common layout/semantic tags
    "section",
    "article",
    "header",
    "footer",
    "main",
    "nav",
    "figure",
    "figcaption",
    "video",
    "audio",
    "source",
    "picture",
    "track",
    "time",
    "mark",
    "details",
    "summary",
    "small",
    "kbd",
    "var",
    "samp",
    "abbr",
    "sup",
    "sub",
    "del",
    "ins",
    "u",
    "hr",
    "br",
    "iframe",
  ],
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https", "data"],
    // add 'data' and 'blob' so inline/Blob downloads survive sanitization
    href: ["http", "https", "mailto", "tel", "sms", "data", "blob"],
  },
};

/** ---------------- Component ---------------- */
const MarkdownContent = React.memo(function MarkdownContent({
  value,
  allowHtml = true,
}: {
  value: string;
  /** If true, raw HTML inside markdown is parsed (sanitized). */
  allowHtml?: boolean;
}) {
  const normalized = normalizeMath(value);

  return (
    <Root data-md-root>
      {/* Scoped anchors + inline-code wrapping fallback */}
      <style>{`
        [data-md-root] .katex-display {
          display: block;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          max-width: 100%;
        }
        [data-md-root] .katex-display > .katex {
          display: inline-block;
          white-space: nowrap;
          background: ${theme.colors?.lightB};
          border: 1px solid ${theme.colors.lightA};
          border-radius: 2px;
          padding: 10px 12px;
          font-size: 0.92em;
          line-height: 1.35;
        }
        [data-md-root] .katex { font-size: 0.95em; }
        [data-md-root] .katex .base { line-height: 1.1; }

        [data-md-root] a {
          transition: all .2s ease;
          color: ${theme.colors.primary.base};
          text-decoration: underline;
          word-break: break-word;
        }
        [data-md-root] a:active, [data-md-root] a:hover { color: ${theme.colors.primary.light}; }

        /* Ensure stray inline <code> also wraps */
        [data-md-root] :not(pre) > code {
          display: inline-block;
          max-width: 100%;
          white-space: break-spaces;
          overflow-wrap: anywhere;
          word-break: break-word;
          line-break: anywhere;
          background: transparent;
        }
      `}</style>

      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          ...(allowHtml ? [rehypeRaw, [rehypeSanitize, schema]] : ([] as any)),
        ]}
        components={MarkdownComponents}
      >
        {normalized}
      </ReactMarkdown>
    </Root>
  );
});

export default MarkdownContent;
