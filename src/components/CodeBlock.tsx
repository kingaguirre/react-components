import React, { useMemo, useState } from "react";
import { Icon } from "../atoms/Icon";

type CodeBlockProps = {
  code: string;
  highlighted?: string | string[]; // words to highlight
  emphasize?: boolean; // stronger inner ring for highlights
  theme?: "vscode-dark" | "vscode-light";
};

export function CodeBlock({
  code,
  highlighted,
  emphasize = false,
  theme = "vscode-dark",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const highlightedTokens = useMemo(() => {
    if (!highlighted) return [];
    return Array.isArray(highlighted)
      ? highlighted.filter(Boolean)
      : [highlighted];
  }, [highlighted]);

  // VS Code Dark+/Light+ inspired colors (same as earlier version)
  const themeColors =
    theme === "vscode-dark"
      ? {
          bg: "#1E1E1E",
          fg: "#D4D4D4",
          border: "#2D2D2D",
          kw: "#C586C0",
          str: "#CE9178",
          num: "#B5CEA8",
          fn: "#DCDCAA",
          cm: "#6A9955",
          op: "#D4D4D4",
          prop: "#9CDCFE",
          ident: "#D4D4D4",
          jsxTag: "#569CD6",
          jsxAttr: "#9CDCFE",
          jsxPunc: "#808080",
          hiBg: "linear-gradient(90deg, #FCD34D, #FBBF24)",
          hiFg: "#111111",
          hiRing: "0 0 0 2px rgba(251, 191, 36, 0.45) inset",
        }
      : {
          bg: "#FFFFFF",
          fg: "#333333",
          border: "#E5E7EB",
          kw: "#AF00DB",
          str: "#A31515",
          num: "#098658",
          fn: "#795E26",
          cm: "#008000",
          op: "#333333",
          prop: "#001080",
          ident: "#333333",
          jsxTag: "#800000",
          jsxAttr: "#001080",
          jsxPunc: "#6E6E6E",
          hiBg: "linear-gradient(90deg, #FEF3C7, #FDE68A)",
          hiFg: "#7C2D12",
          hiRing: "0 0 0 2px rgba(250, 204, 21, 0.35) inset",
        };

  type TokKind =
    | "plain"
    | "kw"
    | "str"
    | "num"
    | "fn"
    | "cm"
    | "op"
    | "prop"
    | "ident"
    | "jsxTag"
    | "jsxAttr"
    | "jsxPunc";
  type Tok = { v: string; t: TokKind; hit?: boolean };

  const tokens = useMemo(() => {
    const src = code;
    const out: Tok[] = [];
    let i = 0;

    const push = (v: string, t: TokKind = "plain") => {
      if (!v) return;

      // word-boundary highlighting for any of the highlighted tokens (skip inside strings/comments)
      if (highlightedTokens.length && t !== "cm" && t !== "str") {
        const pattern = `\\b(?:${highlightedTokens.map(escapeRegExp).join("|")})\\b`;
        const re = new RegExp(pattern, "g");
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(v))) {
          if (m.index > last) out.push({ v: v.slice(last, m.index), t });
          out.push({ v: m[0], t, hit: true });
          last = re.lastIndex;
        }
        if (last < v.length) out.push({ v: v.slice(last), t });
      } else {
        out.push({ v, t });
      }
    };

    const isWS = (c: string) =>
      c === " " || c === "\t" || c === "\n" || c === "\r";
    const eatWhile = (pred: (c: string) => boolean) => {
      const start = i;
      while (i < src.length && pred(src[i])) i++;
      return src.slice(start, i);
    };

    const reIdent = /[A-Za-z_$][A-Za-z0-9_$-]*/y;
    const reNum =
      /(?:0x[0-9A-Fa-f]+|0b[01]+|0o[0-7]+|\d+(\.\d+)?([eE][+-]?\d+)?)/y;

    const keywords = new Set([
      "const",
      "let",
      "var",
      "function",
      "return",
      "if",
      "else",
      "switch",
      "case",
      "break",
      "default",
      "for",
      "while",
      "do",
      "continue",
      "try",
      "catch",
      "finally",
      "throw",
      "new",
      "class",
      "extends",
      "super",
      "this",
      "typeof",
      "instanceof",
      "in",
      "of",
      "import",
      "from",
      "export",
      "as",
      "await",
      "async",
      "yield",
      "void",
      "delete",
      "true",
      "false",
      "null",
      "undefined",
    ]);

    const readLineComment = () => {
      const start = i;
      i += 2; // //
      while (i < src.length && src[i] !== "\n") i++;
      push(src.slice(start, i), "cm");
    };

    const readBlockComment = () => {
      const start = i;
      i += 2; /* */
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i = Math.min(i + 2, src.length);
      push(src.slice(start, i), "cm");
    };

    while (i < src.length) {
      const ch = src[i];

      // whitespace
      if (isWS(ch)) {
        push(eatWhile(isWS), "plain");
        continue;
      }

      // top-level comments
      if (ch === "/" && src[i + 1] === "/") {
        readLineComment();
        continue;
      }
      if (ch === "/" && src[i + 1] === "*") {
        readBlockComment();
        continue;
      }

      // strings
      if (ch === "'" || ch === '"' || ch === "`") {
        const quote = ch;
        let j = i + 1,
          escaped = false;
        while (j < src.length) {
          const c = src[j];
          if (escaped) {
            escaped = false;
          } else if (c === "\\") {
            escaped = true;
          } else if (c === quote) {
            j++;
            break;
          }
          j++;
        }
        push(src.slice(i, j), "str");
        i = j;
        continue;
      }

      // JSX tags (with comment handling inside the tag)
      if (ch === "<") {
        push("<", "jsxPunc");
        i++;
        if (src[i] === "/") {
          push("/", "jsxPunc");
          i++;
        }

        // tag name
        reIdent.lastIndex = i;
        const tm = reIdent.exec(src);
        if (tm) {
          push(tm[0], "jsxTag");
          i = reIdent.lastIndex;

          // inside tag (attrs) until '>'
          while (i < src.length && src[i] !== ">") {
            // handle comments inside tag area (fixes your inline // comments)
            if (src[i] === "/" && src[i + 1] === "/") {
              readLineComment();
              continue;
            }
            if (src[i] === "/" && src[i + 1] === "*") {
              readBlockComment();
              continue;
            }

            if (isWS(src[i])) {
              push(eatWhile(isWS), "plain");
              continue;
            }

            // braces or '=' belong to ops
            if (src[i] === "{" || src[i] === "}" || src[i] === "=") {
              push(src[i], "op");
              i++;
              continue;
            }
            // self-closing slash
            if (src[i] === "/") {
              push("/", "jsxPunc");
              i++;
              continue;
            }

            // attribute names
            reIdent.lastIndex = i;
            const am = reIdent.exec(src);
            if (am) {
              push(am[0], "jsxAttr");
              i = reIdent.lastIndex;
              continue;
            }

            // fallback single char
            push(src[i], "op");
            i++;
          }

          if (src[i] === ">") {
            push(">", "jsxPunc");
            i++;
          }
          continue;
        }
        // lone '<'
      }

      // numbers
      reNum.lastIndex = i;
      const nm = reNum.exec(src);
      if (nm) {
        push(nm[0], "num");
        i = reNum.lastIndex;
        continue;
      }

      // identifiers / keywords / props / functions
      reIdent.lastIndex = i;
      const im = reIdent.exec(src);
      if (im) {
        const word = im[0];
        const next = src[im.index + word.length];
        const isFunction = next === "(" && src[im.index - 1] !== ".";
        const isProp = src[im.index - 1] === ".";
        if (keywords.has(word)) push(word, "kw");
        else if (isFunction) push(word, "fn");
        else if (isProp) push(word, "prop");
        else push(word, "ident");
        i = reIdent.lastIndex;
        continue;
      }

      // operators / punctuation
      push(ch, "op");
      i++;
    }

    return out;
  }, [code, highlightedTokens, theme]);

  const baseStyle: React.CSSProperties = {
    margin: 0,
    padding: 12,
    background: themeColors.bg,
    color: themeColors.fg,
    borderRadius: 10,
    border: `1px solid ${themeColors.border}`,
    overflowX: "auto",
    fontSize: 12.5,
    lineHeight: 1.58,
    fontFamily:
      'Consolas, "SF Mono", "JetBrains Mono", Menlo, Monaco, "Courier New", monospace',
    tabSize: 2 as any,
    MozTabSize: 2 as any,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Copy button */}
      <button
        onClick={handleCopy}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background:
            theme === "vscode-dark" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.05)",
          border: `1px solid ${themeColors.border}`,
          borderRadius: 8,
          padding: "6px 8px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          color: themeColors.fg,
          fontSize: 12,
          backdropFilter: "blur(2px)",
        }}
        title={copied ? "Copied!" : "Copy code"}
      >
        <Icon icon="filter_none" size={16} />
        {copied ? "Copied" : "Copy"}
      </button>

      <pre style={baseStyle}>
        <code>
          {tokens.map((t, i) => (
            <span
              key={i}
              style={{
                background: t.hit ? themeColors.hiBg : "transparent",
                color: t.hit
                  ? themeColors.hiFg
                  : ((themeColors as any)[t.t] ?? themeColors.fg),
                padding: t.hit ? "0 3px" : undefined,
                borderRadius: t.hit ? 4 : undefined,
                fontWeight: t.hit ? 800 : undefined,
                boxShadow: t.hit && emphasize ? themeColors.hiRing : "none",
                transition: "box-shadow 180ms ease",
                whiteSpace: "pre-wrap",
                cursor: t.hit ? "default" : undefined,
              }}
            >
              {t.v}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
