// components/MarkdownContent/styled.tsx
"use client";
import styled from "styled-components";
import { theme } from "src/styles";
import { Icon } from "../../../../atoms/Icon";

export const CODE_MAX_HEIGHT = 420;

export const Root = styled.div`
  /* Fix flex overflows in chat bubbles */
  min-width: 0;
`;

export const CodeBlockWrap = styled.div`
  position: relative;
  margin: 10px 0;
  display: block;
  width: 100%;
  max-width: 100%;

  /* Shiki output <pre class="shiki"><code>… */
  .shiki,
  pre {
    display: block;
    background: #f7fafc !important;
    color: #1f2328;
    border: 1px solid ${theme.colors.lightA};
    border-radius: 2px;
    padding: 10px 2px 6px;
    margin: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: auto; /* no wrap; scroll sideways */
    overflow-y: auto; /* cap tall blocks */
    max-height: ${CODE_MAX_HEIGHT}px;
    -webkit-overflow-scrolling: touch;

    word-break: normal !important;
    overflow-wrap: normal !important;
  }

  /* Never wrap code lines in fenced blocks */
  .shiki code,
  .shiki code .line {
    white-space: pre !important;
    text-wrap: nowrap;
    display: block;
    border: none !important;
    line-height: 1;
  }
`;

export const CopyBtn = styled.button`
  position: sticky;
  top: 0;
  float: right;
  font-size: 10px;

  display: inline-flex;
  align-items: center;
  gap: 4px;

  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid ${theme.colors.lightA};
  background: #fff;
  color: #333;
  cursor: pointer;
  opacity: 0.9;
  transition:
    opacity 0.15s ease,
    transform 0.06s ease-out,
    background 0.15s ease;
  z-index: 1;

  &:hover {
    opacity: 1;
  }
  &:active {
    transform: scale(0.98);
  }
`;

export const CopyIcon = styled(Icon).attrs({ size: 10 })``;

export const LangBadge = styled.span`
  position: sticky;
  top: 0;
  float: left;
  font-size: 10px;
  color: #6a737d;
  background: #ffffffc4;
  border: 1px solid ${theme.colors.lightA};
  border-radius: 4px;
  padding: 2px 6px;
  pointer-events: none;
`;

export const InlineCode = styled.code`
  /* Inline code: NO background; allow wrapping to avoid overflow */
  background: transparent;
  border-radius: 0;
  padding: 0;

  display: inline-block; /* so max-width/wrap apply */
  max-width: 100%;
  white-space: break-spaces; /* preserve spaces + wrap */
  overflow-wrap: anywhere;
  word-break: break-word;
  line-break: anywhere;

  font:
    0.88em ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    "Courier New",
    monospace;
  color: inherit;
`;

/* Tables */
export const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  margin: 8px 0;
  border: 1px solid ${theme.colors.lightA};
  border-radius: 2px;
`;

export const StyledTable = styled.table`
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
`;

export const Th = styled.th`
  text-align: left;
  font-weight: 600;
  border-bottom: 1px solid ${theme.colors.lightA};
  padding: 6px 10px;
  white-space: nowrap;
  background-color: ${theme.colors.lightA};
`;

export const Td = styled.td`
  border-bottom: 1px solid ${theme.colors.lightA};
  padding: 6px 10px;
  vertical-align: top;
  white-space: nowrap;
`;
