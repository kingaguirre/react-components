// src/atoms/Grid/index.tsx
import React from "react";
import styled from "styled-components";
import { StyledGrid, StyledGridItem } from "./styled";
import { GridProps, GridItemProps } from "./interface";
import { Icon } from "src/atoms/Icon"; // ⬅️ adjust path if your Icon lives elsewhere

// ── Yellow warning box (modern, subtle, radius: 2px) ─────────────────────────
const WarningBox = styled.div`
  border: 1px solid rgba(245, 158, 11, 0.35); /* amber-ish */
  background: rgba(245, 158, 11, 0.1);
  color: #a16207; /* readable amber */
  padding: 8px 12px;
  margin: 8px;
  border-radius: 2px; /* requested radius */
  font-size: 12px;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 8px;
`;

// ── <GridItem /> ──────────────────────────────────────────────────────────────
export const GridItem: React.FC<GridItemProps> = ({
  children,
  xs,
  sm,
  md,
  lg,
  xl,
  offset,
  order,
  className,
  ...rest
}) => {
  return (
    <StyledGridItem
      data-xs={xs}
      data-sm={sm}
      data-md={md}
      data-lg={lg}
      data-xl={xl}
      data-offset={offset}
      data-order={order}
      $xs={xs}
      $sm={sm}
      $md={md}
      $lg={lg}
      $xl={xl}
      $offset={offset}
      $order={order}
      className={["grid-item-component", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children /* allowed to be empty */}
    </StyledGridItem>
  );
};
GridItem.displayName = "GridItem";

// ── Utils: flatten & validate children (ignore whitespace-only text) ─────────
function flatten(children: React.ReactNode): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (child === null || child === undefined || child === false) return;

    // ignore purely whitespace text nodes to prevent false warnings
    if (typeof child === "string" && child.trim() === "") return;

    if (React.isValidElement(child) && child.type === React.Fragment) {
      out.push(...flatten(child.props.children));
    } else {
      out.push(child);
    }
  });
  return out;
}

function isGridItemElement(node: React.ReactNode): node is React.ReactElement {
  return (
    React.isValidElement(node) &&
    (node.type === GridItem ||
      (node as any).type?.displayName === GridItem.displayName)
  );
}

function getNodeName(node: React.ReactNode): string {
  if (React.isValidElement(node)) {
    const t = node.type as any;
    return t?.displayName || t?.name || String(t);
  }
  return typeof node === "string" || typeof node === "number"
    ? String(node)
    : Object.prototype.toString.call(node);
}

// ── <Grid /> (filters invalid children, shows yellow warning, never throws) ──
export const Grid: React.FC<GridProps> = ({
  children,
  spacing = 16,
  style,
  className,
  ...rest
}) => {
  const flat = flatten(children);
  const valid: React.ReactElement[] = [];
  const invalidNames: string[] = [];

  for (const node of flat) {
    if (isGridItemElement(node)) {
      valid.push(node);
    } else {
      invalidNames.push(getNodeName(node));
    }
  }

  const showEmptyWarning = valid.length === 0;
  const showInvalidWarning = invalidNames.length > 0;

  return (
    <StyledGrid
      spacing={spacing}
      style={style}
      className={["grid-component", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {(showEmptyWarning || showInvalidWarning) && (
        <WarningBox role="alert" data-testid="grid-error">
          <Icon icon="info" />
          <div>
            <strong>Grid warning:</strong>{" "}
            {showEmptyWarning
              ? "Requires at least one <GridItem />."
              : "Only accepts <GridItem /> children."}
            {showInvalidWarning && invalidNames.length > 0 && (
              <> Ignored: {invalidNames.join(", ")}.</>
            )}
          </div>
        </WarningBox>
      )}

      {/* Render only valid GridItem children */}
      {valid.length > 0 ? valid : null}
    </StyledGrid>
  );
};
Grid.displayName = "Grid";
