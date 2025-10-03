// src/organisms/FormRenderer/components/ErrorSummary.tsx
import React, { useEffect, useRef, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Panel } from "../../../../molecules/Panel";
import { DataTable } from "../../../../organisms/DataTable";
import type { ColumnSetting } from "../../../../organisms/DataTable/interface";
import { Dock, ContentWrap } from "./styled";

export type ErrorSummaryItem = {
  field: string; // full path (for scroll/focus)
  label: string; // leaf/pretty field name
  valueText: string; // current value, stringified
  message: string; // validation message
};

type Props = {
  /** Mount into DOM only when true */
  visible: boolean;
  /** Expanded (true) vs header-only (false) */
  open: boolean;
  items: ErrorSummaryItem[];

  /** Toggle open/closed; only the chevron icon triggers this */
  onToggle: (open: boolean) => void;

  /** Scroll/focus to an error field */
  onItemClick: (fieldPath: string) => void;

  bottomOffset?: number;
  width?: number;
  title?: string;
  /** Increment this on each invalid submit to re-trigger pulse */
  pulseKey?: number;
};

export const ErrorSummary: React.FC<Props> = ({
  visible,
  open,
  items,
  onToggle,
  onItemClick,
  bottomOffset = 12,
  width = 850,
  title = "Error Summary",
  pulseKey = 0,
}) => {
  if (!visible || items.length === 0) return null;

  const dockRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Close on click anywhere *outside* the dock, and on Escape (with safe focus handling)
  useEffect(() => {
    if (!open) return;

    const closeDock = () => {
      const content = contentRef.current;
      const active = document.activeElement as HTMLElement | null;
      if (content && active && content.contains(active)) {
        dockRef.current?.focus?.({ preventScroll: true });
        active.blur?.();
      }
      onToggle(false);
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (dockRef.current && target && !dockRef.current.contains(target)) {
        closeDock();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDock();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onToggle]);

  // Manage focus + inert/aria-hidden on collapsible content to avoid a11y warning
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const active = document.activeElement as HTMLElement | null;
    const containsFocus = !!(active && content.contains(active));

    if (!open) {
      if (containsFocus) {
        dockRef.current?.focus?.({ preventScroll: true });
        active?.blur?.();
      }
      content.setAttribute("inert", "");
      content.setAttribute("aria-hidden", "true");
    } else {
      content.removeAttribute("inert");
      content.setAttribute("aria-hidden", "false");
    }

    return () => {
      content.removeAttribute("inert");
      content.removeAttribute("aria-hidden");
    };
  }, [open]);

  const rowCount = Math.min(items.length, 5);
  const chevronIcon = open ? "keyboard_arrow_down" : "keyboard_arrow_up";
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPulse(false);
    const id = requestAnimationFrame(() => {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1200); // sync with CSS animation if any
      return () => clearTimeout(t);
    });
    return () => cancelAnimationFrame(id);
  }, [visible, pulseKey]);

  // Shape rows for DataTable (keep fieldPath hidden but accessible on row click)
  const rows = items.map((it, i) => ({
    __internalId: `${it.field}-${i}`,
    fieldPath: it.field,
    label: it.label,
    valueText: it.valueText,
    message: it.message,
  }));

  // Minimal, read-only columns
  const columns: ColumnSetting[] = [
    {
      title: "Field",
      column: "label",
      cell: ({ rowValue }) => <strong>{rowValue.label}</strong>,
    },
    {
      title: "Current value",
      column: "valueText",
      cell: ({ rowValue }) => (
        <span style={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
          {String(rowValue.valueText ?? "")}
        </span>
      ),
    },
    {
      title: "Message",
      column: "message",
      cell: ({ rowValue }) => (
        <span style={{ color: "var(--danger-dark, #c0392b)" }}>
          {String(rowValue.message ?? "")}
        </span>
      ),
    },
    // Hidden helper column so we can read the field path on row click
    { title: "", column: "fieldPath", hidden: true },
  ];

  const el = (
    <Dock
      ref={dockRef}
      role="region"
      aria-live="polite"
      aria-label="Form issues dock"
      tabIndex={-1} // focusable fallback target
      data-pulse={pulse ? "true" : "false"}
      $bottomOffset={bottomOffset}
      $width={width}
    >
      <Panel
        title={title}
        color="danger"
        isSubHeader
        noPadding
        rightDetails={[{ value: String(items.length), valueColor: "danger" }]}
        rightIcons={[
          {
            icon: chevronIcon,
            tooltip: open ? "Hide errors" : "Show errors",
          },
        ]}
        onHeaderClick={() => {
          if (open) {
            const content = contentRef.current;
            const active = document.activeElement as HTMLElement | null;
            if (content && active && content.contains(active)) {
              dockRef.current?.focus?.({ preventScroll: true });
              active.blur?.();
            }
          }
          onToggle(!open);
        }}
        className="error-summary-panel"
      >
        <ContentWrap
          ref={contentRef}
          $open={open}
          $rowCount={rowCount}
          // aria-hidden managed by effect to avoid conflicts when focused
        >
          <div>
            <DataTable
              dataSource={rows}
              columnSettings={columns}
              maxHeight="175px"
              headerRightControls={false}
              enableColumnDragging={false}
              enableColumnPinning={false}
              enableColumnResizing={false}
              enableColumnSorting={false}
              hideFooter
              pageSize={items.length}
              onRowClick={(rowData) => {
                const path = (rowData as any)?.fieldPath as string;
                if (path) onItemClick(path);
                // blur before collapsing
                const content = contentRef.current;
                const active = document.activeElement as HTMLElement | null;
                if (content && active && content.contains(active)) {
                  dockRef.current?.focus?.({ preventScroll: true });
                  active.blur?.();
                }
                onToggle(false);
              }}
              className="error-summary-table"
            />
          </div>
        </ContentWrap>
      </Panel>
    </Dock>
  );

  return createPortal(el, document.body);
};
