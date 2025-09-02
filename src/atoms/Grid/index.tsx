// src/atoms/Grid/index.tsx
import React from "react";
import styled from "styled-components";
import { StyledGrid, StyledGridItem } from "./styled";
import { GridProps, GridItemProps } from "./interface";
import { Icon } from "src/atoms/Icon";

// ── Yellow warning box ──────────────────────────────
const WarningBox = styled.div`
  border: 1px solid rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.1);
  color: #a16207;
  padding: 8px 12px;
  margin: 8px;
  border-radius: 2px;
  font-size: 12px;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 8px;
`;

// ── <GridItem /> ────────────────────────────────────
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
      {children}
    </StyledGridItem>
  );
};
GridItem.displayName = "GridItem";

// ── helpers ─────────────────────────────────────────
function flatten(children: React.ReactNode): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (child === null || child === undefined || child === false) return;
    if (typeof child === "string" && child.trim() === "") return;
    if (React.isValidElement(child) && child.type === React.Fragment) {
      out.push(...flatten(child.props.children));
    } else {
      out.push(child);
    }
  });
  return out;
}

function isGridItemElement(node: React.ReactNode): boolean {
  if (!React.isValidElement(node)) return false;
  const t: any = node.type;
  return t === GridItem || t?.displayName === GridItem.displayName;
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

// ── <Grid /> ───────────────────────────────────────
export const Grid: React.FC<GridProps> = ({
  children,
  spacing = 16,
  style,
  className,
  debugWarnings = false,
  ...rest
}) => {
  if (!debugWarnings) {
    // relaxed mode: allow any children, no warnings, no filtering
    return (
      <StyledGrid
        spacing={spacing}
        style={style}
        className={["grid-component", className].filter(Boolean).join(" ")}
        {...rest}
      >
        {children}
      </StyledGrid>
    );
  }

  // strict mode: filter children, show warnings
  const flat = flatten(children);
  const valid: React.ReactElement[] = [];
  const invalidNames: string[] = [];

  for (const node of flat) {
    if (isGridItemElement(node)) {
      valid.push(node as any);
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

      {/* render only valid children in strict mode */}
      {valid.length > 0 ? valid : null}
    </StyledGrid>
  );
};
Grid.displayName = "Grid";
