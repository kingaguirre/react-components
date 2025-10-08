"use client";

import styled, { keyframes, css } from "styled-components";
import { theme, scrollStyle } from "../../styles";

/* ====== Floating layout ====== */
export const RootPortalWrap = styled.div<{
  $position: "bottom-right" | "bottom-left";
  $offset: number;
  $zIndex: number;
}>`
  position: fixed;
  bottom: ${({ $offset }) => $offset}px;
  ${({ $position, $offset }) =>
    $position === "bottom-right"
      ? css`
          right: ${$offset}px;
        `
      : css`
          left: ${$offset}px;
        `}
  z-index: ${({ $zIndex }) => $zIndex};
  display: flex;
  flex-direction: column;
  align-items: ${({ $position }) =>
    $position === "bottom-right" ? "flex-end" : "flex-start"};
  gap: 12px;
`;

export const LauncherFab = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 2px solid ${theme.colors.primary.dark};
  background: radial-gradient(
    ellipse at 30% 30%,
    #fff 0%,
    ${theme.colors.primary.pale} 90%
  );
  color: ${theme.colors.primary.base};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.1),
    0 0 0 4px ${theme.colors.primary.pale};
  cursor: pointer;
  transition: ${theme.transition};
  outline: none;

  &:hover {
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
  position: relative;
`;

export const UnreadDot = styled.span`
  position: absolute;
  top: -3px;
  right: -8px;
  min-width: 18px;
  height: 18px;
  padding: 0;
  border-radius: 9px;
  background: #dc3545;
  color: white;
  font-size: 10px;
  line-height: 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const WindowMount = styled.div<{
  $position: "bottom-right" | "bottom-left";
  $maxW: number;
  $zIndex: number;
  $offset: number;
}>`
  position: fixed;
  ${({ $position }) =>
    $position === "bottom-right" ? "right: 16px;" : "left: 16px;"}
  bottom: ${({ $offset }) => $offset}px;
  width: ${({ $maxW }) => $maxW}px;
  z-index: ${({ $zIndex }) => $zIndex};
`;

export const AnimatedPanel = styled.div<{
  $open: boolean;
  $pos?: "bottom-right" | "bottom-left";
  $animReady?: boolean;
}>`
  will-change: transform, opacity;
  transform: ${({ $open, $pos = "bottom-right" }) =>
    $open
      ? "translate3d(0,0,0) scale(1)"
      : $pos === "bottom-right"
        ? "translate3d(8px,8px,0) scale(.98)"
        : "translate3d(-8px,8px,0) scale(.98)"};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition: ${({ $animReady }) =>
    $animReady ? "transform 200ms ease, opacity 200ms ease" : "none"};
`;

/* ====== Pinned layout ====== */
export const PanelFill = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0; /* critical to allow inner scroll areas to size */
`;

export const PinnedMount = styled.div<{
  $side: "right" | "left";
  $maxW: number;
  $zIndex: number;
  $fixed: boolean;
  $active: boolean;
}>`
  position: ${({ $fixed }) => ($fixed ? "fixed" : "absolute")};
  top: 0;
  bottom: 0;
  ${({ $side }) => ($side === "right" ? "right: 0;" : "left: 0;")}
  width: 0;
  overflow: visible;
  z-index: ${({ $zIndex }) => $zIndex};
  pointer-events: none;
  height: 100%;
  max-height: 100%;
  contain: layout style;
  isolation: isolate;
  transform: translateZ(0);
  visibility: ${({ $active }) => ($active ? "visible" : "hidden")};
`;

export const PinnedHandleLayer = styled.div<{
  $zIndex: number;
  $fixed: boolean;
}>`
  /* NEW prop */
  position: ${({ $fixed }) => ($fixed ? "fixed" : "absolute")}; /* CHANGED */
  inset: 0;
  z-index: ${({ $zIndex }) => $zIndex};
  pointer-events: none;
`;

export const PinnedHandle = styled.button<{
  $side: "right" | "left";
  $offset: number;
}>`
  position: absolute;
  top: 50%;
  ${({ $side, $offset }) =>
    $side === "right" ? `right:${$offset}px;` : `left:${$offset}px;`}
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 2px solid ${theme.colors.primary.dark};
  background: radial-gradient(
    ellipse at 30% 30%,
    #fff 0%,
    ${theme.colors.primary.pale} 90%
  );
  color: ${theme.colors.primary.base};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.1),
    0 0 0 4px ${theme.colors.primary.pale};
  cursor: pointer;
  outline: none;
  transition: ${theme.transition};
  pointer-events: all; /* re-enable on the actual button */

  &:hover {
    transform: translateY(-50%) scale(1.03);
  }
  &:active {
    transform: translateY(-50%) scale(1);
  }
`;

export const SidePanel = styled.div<{
  $side: "right" | "left";
  $maxW: number;
  $open: boolean;
  $animReady?: boolean;
}>`
  position: absolute;
  top: 0;
  bottom: 0;
  ${({ $side }) => ($side === "right" ? "right: 0;" : "left: 0;")}
  width: ${({ $maxW }) => $maxW}px;
  height: 100%;
  /* Only clickable when open */
  pointer-events: ${({ $open }) => ($open ? "all" : "none")};

  /* Off-canvas base state; transform-only = no layout */
  transform: ${({ $side, $open }) =>
    $open
      ? "translate3d(0,0,0)"
      : $side === "right"
        ? "translate3d(100%,0,0)"
        : "translate3d(-100%,0,0)"};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition: ${({ $animReady }) =>
    $animReady ? "transform 220ms ease, opacity 220ms ease" : "none"};
  will-change: transform, opacity;
  backface-visibility: hidden;

  display: flex;
  flex-direction: column;
  max-height: 100%;
  min-height: 0;
`;

/* Side handle tab for pinned mode */
export const SideHandle = styled.button<{
  $side: "right" | "left";
  $offset: number;
  $zIndex: number;
}>`
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  ${({ $side, $offset }) =>
    $side === "right" ? `right: ${$offset}px;` : `left: ${$offset}px;`}
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 2px solid ${theme.colors.primary.dark};
  background: radial-gradient(
    ellipse at 30% 30%,
    #fff 0%,
    ${theme.colors.primary.pale} 90%
  );
  color: ${theme.colors.primary.base};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  z-index: ${({ $zIndex }) => $zIndex};
  outline: none;
  transition: ${theme.transition};

  &:hover {
    transform: translateY(-50%) scale(1.03);
  }
  &:active {
    transform: translateY(-50%) scale(1);
  }
`;

/* ====== Shared internals ====== */
export const Messages = styled.div<{ $fixedH?: number }>`
  overflow: auto;
  padding: 6px 8px;
  background: ${theme.colors.light.pale};
  border: 1px solid ${theme.colors.light.lighter};
  border-bottom: none;
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
  min-height: 0;
  ${scrollStyle}
  ${({ $fixedH }) =>
    $fixedH
      ? css`
          height: ${$fixedH}px;
          overflow-y: auto;
        `
      : css`
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
        `}

  code {
    padding: 2px 5px;
    border-radius: 3px;
    border: 1px solid rgb(236, 244, 249);
    color: rgba(46, 52, 56, 0.9);
    background-color: rgb(247, 250, 252);
    flex: 0 0 auto;
    font-family:
      ui-monospace, Menlo, Monaco, "Roboto Mono", "Oxygen Mono",
      "Ubuntu Monospace", "Source Code Pro", "Droid Sans Mono", "Courier New",
      monospace;
    font-size: 12px;
    word-break: break-word;
    white-space: normal;
    max-width: 100%;
    margin: 0px 4px 4px 0px;
    line-height: 13px;
  }
  hr {
    border-color: transparent;
    border-bottom-color: ${theme.colors.default.pale};
  }
`;

export const Row = styled.div<{ $mine?: boolean }>`
  display: flex;
  margin: 8px 0;
  justify-content: ${({ $mine }) => ($mine ? "flex-end" : "flex-start")};
`;

export const Bubble = styled.div<{
  $mine?: boolean;
  $error?: boolean;
  $notice?: boolean;
}>`
  max-width: 84%;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 13px;
  white-space: normal;
  word-wrap: break-word;
  line-height: 1.35;

  background: ${({ $mine, $error }) =>
    $error
      ? theme.colors.danger.lighter
      : $mine
        ? theme.colors.primary.pale
        : "#fff"};
  color: ${({ $error }) =>
    $error ? theme.colors.danger.dark : theme.colors.default.darker};
  border: 1px solid
    ${({ $mine, $error }) =>
      $error
        ? theme.colors.danger.base
        : $mine
          ? theme.colors.primary.light
          : theme.colors.light.lighter};

  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  ${({ $notice }) =>
    $notice &&
    css`
      background: ${theme.colors?.warning?.pale};
      border: 1px solid ${theme.colors?.warning?.base};
      color: ${theme.colors?.warning?.dark};
    `}

  p {
    margin-bottom: 10px;
    &:last-child {
      margin-bottom: 0;
    }
  }

  ol,
  ul {
    padding-left: 16px;
    li:marker {
      display: inline-block;
    }
  }
`;

export const MetaLine = styled.div<{ $mine?: boolean }>`
  margin-top: -6px;
  font-size: 9px;
  color: ${theme.colors.light.base};
  text-align: ${({ $mine }) => ($mine ? "right" : "left")};
`;

export const Footer = styled.form`
  background: white;
`;

export const InputWrap = styled.div`
  position: relative;
  display: flex;
`;

export const ChatTextarea = styled.textarea`
  width: 100%;
  resize: none;
  min-height: 70px;
  max-height: 140px;
  padding: 10px 12px 24px;
  border-radius: 2px;
  border: 1px solid ${theme.colors.light.lighter};
  background: #fff;
  color: ${theme.colors.default.darker};
  line-height: 1.35;
  font-size: 12px;
  outline: none;
  overflow-y: auto;
  transition: all 0.3s ease;
  ${scrollStyle}

  &:focus {
    border-color: ${theme.colors.primary.light};
    box-shadow: 0 0 0 4px ${theme.colors.primary.pale};
  }
  &:disabled {
    background-color: ${theme.colors.light.pale};
    cursor: not-allowed;
  }
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0 0;
`;

export const IconBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid ${theme.colors.light.lighter};
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: ${theme.transition};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const IconDock = styled.div`
  position: absolute;
  bottom: 1px;
  left: 1px;
  right: 1px;
  gap: 6px;
  pointer-events: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${theme.colors.lightB};
  height: 24px;
  padding: 2px;
  /* border-top: 1px solid ${theme.colors.light.lighter}; */
  > * {
    pointer-events: auto;
  }
  > div {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }
`;

export const IconGhostBtn = styled.button`
  width: 20px;
  height: 18px;
  border-radius: 1px;
  font-size: 18px;
  padding: 0;
  border: none;
  color: ${theme.colors.primary.base};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: ${theme.transition};

  &:hover:not(:disabled) {
    color: ${theme.colors.primary.dark};
  }
  &:active:not(:disabled) {
    color: ${theme.colors.primary.darker};
  }
  &:disabled {
    cursor: not-allowed;
    color: ${theme.colors.default.light};
  }
`;

export const RightCluster = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

export const HistoryWrap = styled.div`
  position: relative;
  display: inline-flex;
  > span {
    color: white !important;
  }
`;

export const HistoryDropdown = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 260px;
  max-height: 300px;
  overflow: auto;
  background: #fff;
  border: 1px solid ${theme.colors.light.lighter};
  border-radius: 2px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  z-index: 10000;
  ${scrollStyle}
`;

export const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  cursor: pointer;
  color: #333;
  position: relative;
  transition: all 0.3s ease;

  .dropdown-title {
    font-size: 12px;
    font-weight: 400;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: inherit;
    width: 100%;
  }

  .meta {
    font-size: 8px;
    color: #888;
  }

  .item-actions {
    display: inline-flex;
    transition: opacity 140ms ease;
  }

  &:hover {
    background: ${theme.colors.primary.pale};
    .dropdown-title {
      color: ${theme.colors.primary.base};
    }
  }

  &.active {
    outline: none;
    background: ${theme.colors.primary.base};

    .item-actions .icon,
    .meta,
    .dropdown-title {
      color: white !important;
    }
    &:hover {
      background: ${theme.colors.primary.dark};
    }
  }
`;

export const ActionIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  transition: all 0.15s ease;

  > .icon {
    transition: all 0.15s ease;
    color: #888 !important;
  }

  &:hover {
    background: rgba(17, 24, 39, 0.6);
    > .icon {
      color: white !important;
    }
  }

  &.danger {
    > .icon {
      color: #b91c1c !important;
    }
    &:hover {
      background: rgba(220, 38, 38, 0.8);
      > .icon {
        color: white !important;
      }
    }
  }
`;

export const DropdownEmpty = styled.div`
  padding: 6px 8px;
  font-size: 10px;
  color: ${theme.colors.light.base};
`;

const bounce = keyframes`
  0%, 80%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
  40% { transform: translateY(-4px) scale(1.05); opacity: 1; }
`;

export const TypingIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
`;

export const Dot = styled.span<{
  $variant?: "light" | "base" | "dark";
  $delay?: number;
}>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $variant = "base" }) =>
    $variant === "light"
      ? theme.colors.primary.light
      : $variant === "dark"
        ? theme.colors.primary.dark
        : theme.colors.primary.base};
  animation: ${bounce} 1s infinite ease-in-out;
  animation-delay: ${({ $delay = 0 }) => `${$delay}ms`};
`;

export const AttachmentChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px;
  border-radius: 2px;
  box-shadow: 0 0 0 1px ${theme.colors.primary.light};
  background: ${theme.colors.primary.pale};
  color: ${theme.colors.primary.base};
  font-size: 11px;
  line-height: 1;
  max-width: 160px;
  max-height: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  align-self: center;
  margin-top: 4px;
  margin-left: 2px;
  cursor: default;
`;

export const AttachmentName = styled.span<{ $baseW?: number }>`
  display: inline-flex;
  align-items: baseline;
  white-space: nowrap;

  .base {
    max-width: ${(p) => p.$baseW ?? 100}px;
    overflow: hidden; /* just in case parent shrinks unexpectedly */
    text-overflow: clip; /* we middle-truncate in JS; no extra ellipsis */
    white-space: nowrap;
  }

  .ext {
    flex: 0 0 auto;
  }
`;

export const AttachmentRemove = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  padding: 0;
  margin: 0;
  line-height: 0;

  &:hover {
    opacity: 0.9;
  }
  &:active {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

export const Description = styled.div`
  font-size: 11px;
  color: ${theme.colors.default.base};
  margin-bottom: 6px;
  line-height: 1.2;
  > b {
    color: ${theme.colors.default.dark};
    background: linear-gradient(135deg, ${theme.colors.primary.dark}, ${theme.colors.primary.base}, ${theme.colors.secondary.base}, ${theme.colors.secondary.dark});
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent; /* crucial for WebKit */
  }
`