import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import { RightIconButton } from "../RightIconButton";
import { Icon } from "src/atoms/Icon";
import { FormControl } from "src/atoms/FormControl";
import { scrollStyle, theme } from "src/styles";
import { useOnClickOutside } from "src/organisms/DataTable/hooks/useOnClickOutside";

let XLSXMod: typeof import("xlsx") | null = null;
async function getXLSX() {
  if (XLSXMod) return XLSXMod;
  XLSXMod = await import("xlsx"); // normal dynamic import, no vite-ignore needed
  return XLSXMod;
}

type ExportFormat = "xlsx" | "csv";

export type DownloadMenuExtraItem = {
  key?: string;
  label: string;
  icon?: string;
  separatorAbove?: boolean;
  disabled?: boolean;
  onClick: (args: {
    fileName: string;
    format: ExportFormat;
    selected: { rows: any[]; count: number };
    all: { rows: any[]; count: number };
  }) => void;
};

export type DownloadControls = {
  fileName?: string;
  format?: ExportFormat;

  /** Include hidden columns from columnSettings by default */
  includeHiddenColumns?: boolean; // default true

  /** Show/hide the filename + format section */
  showConfigSection?: boolean; // default true

  /** Built-in menu visibility toggles */
  showBuiltinSelected?: boolean; // default true
  showBuiltinAll?: boolean; // default true

  labels?: { selected?: string; all?: string };
  icons?: { selected?: string; all?: string };
  extraMenuItems?: DownloadMenuExtraItem[];

  onOpen?: () => void;
  onClose?: () => void;
  onConfigChange?: (cfg: { fileName: string; format: ExportFormat }) => void;
  onDownloading?: (
    kind: "selected" | "all",
    meta: { fileName: string; format: ExportFormat; count: number }
  ) => void;
  onComplete?: (
    kind: "selected" | "all",
    meta: { fileName: string; format: ExportFormat; count: number }
  ) => void;
  onError?: (err: any) => void;
};

export interface DownloadIconDropdownProps {
  controls?: DownloadControls;

  /** Counts displayed in the menu (also used when building extras payload) */
  selectedCount: number;
  allCount: number;

  /** AOA builders should include header row; now receive `{ includeHidden }` */
  getAOAForSelected: (opts?: { includeHidden?: boolean }) => any[][];
  getAOAForAll: (opts?: { includeHidden?: boolean }) => any[][];

  getRowsForSelected?: (opts?: { includeHidden?: boolean }) => any[];
  getRowsForAll?: (opts?: { includeHidden?: boolean }) => any[];

  disabled?: boolean;
  icon?: string;
  title?: string;
  enableRowSelection?: boolean
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translate(-100%, -6px); }
  to   { opacity: 1; transform: translate(-100%, 0); }
`;
const fadeOut = keyframes`
  from { opacity: 1; transform: translate(-100%, 0); }
  to   { opacity: 0; transform: translate(-100%, -6px); }
`;

const MenuWrapper = styled.div<{ $closing?: boolean; $top: number; $left: number }>`
  color: ${theme.colors.default.darker};
  font-family: "Nunito Sans",-apple-system,".SFNSText-Regular","San Francisco",BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif;
  position: fixed;
  top: ${(p) => p.$top}px;
  left: ${(p) => p.$left}px;
  transform: translate(-100%, 0);
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 2px;
  min-width: 280px;
  z-index: 200;
  box-shadow: 0 8px 24px rgba(0,0,0,0.10);
  overflow: hidden;
  will-change: transform, opacity;
  animation: ${(p) => (p.$closing ? fadeOut : fadeIn)} 140ms ease-out;
`;

const HeaderBar = styled.div`
  position: relative;
  background: ${theme.colors.primary.dark};
  color: #fff;
  font-weight: 700;
  font-size: 10px;
  text-transform: uppercase;
  line-height: 1;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  .icon { font-size: 16px; }
`;
const CloseBtn = styled.span`
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border: none; color: #fff; border-radius: 4px;
  cursor: pointer; position: absolute; right: 4px; top: 50%;
  transition: all .3s ease; transform: translateY(-50%);
  &:hover { color: ${theme.colors.default.pale}; }
`;
const HeaderTitle = styled.div`
  display: inline-flex; align-items: center; gap: 8px;
`;

const Section = styled.div`
  padding: 8px 12px;
  ${scrollStyle}
  &:nth-child(2) {
    background: ${theme.colors.lightB};
    border-bottom: 1px solid ${theme.colors.default.pale};
  }
`;
const FieldRow = styled.div`
  display: flex; align-items: center; gap: 8px; margin-top: 4px;
  .form-control-wrapper { border-bottom: none; }
  > * { flex: 1; }
`;
const Label = styled.span`
  font-size: 12px; min-width: 68px; max-width: 68px;
`;
const MenuItem = styled.button<{ disabled?: boolean; $separatorAbove?: boolean }>`
  width: 100%; text-align: left; padding: 8px 10px; border: none; background: transparent; font-size: 12px;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
  display: flex; align-items: center; gap: 8px;
  transition: all .3s ease; color: ${theme.colors.default.darker}; border-radius: 2px;
  ${(p) => p.$separatorAbove ? `border-top: 1px solid ${theme.colors.default.pale}; margin-top: 4px; padding-top: 12px;` : ""}
  .icon { font-size: 16px; }
  ${(p) => (p.disabled ? "" : `
    &:hover { background: ${theme.colors.primary.pale}; color: ${theme.colors.primary.darker}; }
    &:active { background: #c8e4fb; }
  `)};
`;
const RowCount = styled.span`
  color: ${theme.colors.default.dark}; font-size: 12px; margin-left: auto;
`;

/** merge helpers */
const NOOP = () => {};
const compose =
  <T extends any[]>(a?: (...args: T) => void, b?: (...args: T) => void) =>
  (...args: T) => { try { a?.(...args); } finally { b?.(...args); } };

export const DownloadIconDropdown: React.FC<DownloadIconDropdownProps> = ({
  controls,
  selectedCount,
  allCount,
  getAOAForSelected,
  getAOAForAll,
  disabled,
  icon = "file_download",
  title = "Download",
  enableRowSelection,
  getRowsForSelected,
  getRowsForAll
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const closeTimer = useRef<number | null>(null);
  const outsideReadyRef = useRef(false);

  const cfg = React.useMemo(() => {
    const defaultLabels = { selected: "Download selected", all: "Download all" };
    const defaultIcons  = { selected: "done_all",            all: "playlist_add_check" };

    const dHandlers = {
      onOpen: NOOP,
      onClose: NOOP,
      onConfigChange: NOOP as (cfg: { fileName: string; format: ExportFormat }) => void,
      onDownloading: NOOP as (k: "selected" | "all", m: { fileName: string; format: ExportFormat; count: number }) => void,
      onComplete: NOOP as (k: "selected" | "all", m: { fileName: string; format: ExportFormat; count: number }) => void,
      onError: NOOP as (err: any) => void,
    };

    return {
      fileName: controls?.fileName ?? "data",
      format: (controls?.format ?? "xlsx") as ExportFormat,
      includeHiddenColumns: controls?.includeHiddenColumns ?? true,     // default TRUE
      showConfigSection: controls?.showConfigSection ?? true,           // default TRUE
      showBuiltinSelected: controls?.showBuiltinSelected ?? true,       // default TRUE
      showBuiltinAll: controls?.showBuiltinAll ?? true,                 // default TRUE

      labels: { ...defaultLabels, ...(controls?.labels ?? {}) },
      icons: { ...defaultIcons, ...(controls?.icons ?? {}) },
      extraMenuItems: controls?.extraMenuItems ?? [],

      onOpen: compose(dHandlers.onOpen, controls?.onOpen),
      onClose: compose(dHandlers.onClose, controls?.onClose),
      onConfigChange: compose(dHandlers.onConfigChange, controls?.onConfigChange),
      onDownloading: compose(dHandlers.onDownloading, controls?.onDownloading),
      onComplete: compose(dHandlers.onComplete, controls?.onComplete),
      onError: compose(dHandlers.onError, controls?.onError),
    };
  }, [controls]);

  const [name, setName] = useState(cfg.fileName);
  const [fmt, setFmt] = useState<ExportFormat>(cfg.format);
  useEffect(() => setFmt(cfg.format), [cfg.format]);
  useEffect(() => {
    setName((prev) => (prev.trim().length === 0 ? cfg.fileName : prev));
  }, [cfg.fileName]);
  const hasValidName = name.trim().length > 0;

  /** AOA builders — pass includeHidden flag (functions may ignore it; that’s fine) */
  const buildSelectedAOA = useCallback(() => {
    return getAOAForSelected?.({ includeHidden: cfg.includeHiddenColumns }) ?? [];
  }, [getAOAForSelected, cfg.includeHiddenColumns]);

  const buildAllAOA = useCallback(() => {
    return getAOAForAll?.({ includeHidden: cfg.includeHiddenColumns }) ?? [];
  }, [getAOAForAll, cfg.includeHiddenColumns]);

  // builders for rows payload
  const buildSelectedRows = useCallback(() => {
    return getRowsForSelected?.({ includeHidden: cfg.includeHiddenColumns }) ?? [];
  }, [getRowsForSelected, cfg.includeHiddenColumns]);

  const buildAllRows = useCallback(() => {
    return getRowsForAll?.({ includeHidden: cfg.includeHiddenColumns }) ?? [];
  }, [getRowsForAll, cfg.includeHiddenColumns]);

  // payload for extras now uses rows
  const payloadForExtras = useCallback(() => {
    return {
      fileName: name,
      format: fmt,
      selected: { rows: buildSelectedRows(), count: selectedCount },
      all: { rows: buildAllRows(), count: allCount },
    };
  }, [buildSelectedRows, buildAllRows, name, fmt, selectedCount, allCount]);

  const downloadSheetFromAOA = async (
    aoa: any[][],
    kind: "selected" | "all",
    count: number
  ) => {
    if (!hasValidName) return;
    try {
      cfg.onDownloading(kind, { fileName: name, format: fmt, count });

      const XLSX = await getXLSX();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");

      const base = (name || "data-table").trim() || "data-table";
      const ext = fmt === "csv" ? ".csv" : ".xlsx";
      const filename = base.toLowerCase().endsWith(ext) ? base : base + ext;

      if (fmt === "csv") {
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = filename; a.click();
        URL.revokeObjectURL(a.href);
      } else {
        const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = filename; a.click();
        URL.revokeObjectURL(a.href);
      }

      cfg.onComplete(kind, { fileName: name, format: fmt, count });
    } catch (e) {
      console.error(e);
      cfg.onError(e);
    }
  };

  const measureAnchor = () => {
    const el = triggerRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.bottom, left: r.right };
  };

  const openMenu = () => {
    if (closing) return;
    if (name.trim().length === 0) setName(cfg.fileName);
    if (!fmt) setFmt(cfg.format);

    const m = measureAnchor();
    if (!m) return;
    setCoords(m);
    setOpen(true);
    cfg.onOpen();

    outsideReadyRef.current = false;
    window.setTimeout(() => { outsideReadyRef.current = true; }, 180);
  };

  const positionMenu = useCallback(() => {
    if (!open) return;
    const m = measureAnchor();
    if (!m) return;
    setCoords(m);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    positionMenu();
    const onScrollOrResize = () => positionMenu();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && closeMenu(true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, positionMenu]);

  const closeMenu = (animate = false) => {
    if (!open) return;
    if (name.trim().length === 0) setName(cfg.fileName);
    outsideReadyRef.current = false;

    if (animate) {
      setClosing(true);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
      closeTimer.current = window.setTimeout(() => {
        setClosing(false); setOpen(false); setCoords(null); cfg.onClose();
      }, 140);
    } else {
      setOpen(false); setCoords(null); cfg.onClose();
    }
  };

  useOnClickOutside(
    menuRef,
    () => { if (open && outsideReadyRef.current && !closing) closeMenu(true); },
    { ignoreClassNames: "dl-trigger" },
  );

  const shouldRenderPortal = open && coords !== null;
  const builtInLabels = { selected: cfg.labels.selected!, all: cfg.labels.all! };
  const builtInIcons  = { selected: cfg.icons.selected!,   all: cfg.icons.all! };

  const showSelectedItem = enableRowSelection && cfg.showBuiltinSelected;

  return (
    <div ref={triggerRef} className="dl-trigger" style={{ position: "relative", display: "inline-block" }}>
      <RightIconButton
        icon={icon}
        title={title}
        onClick={() => (open ? closeMenu(true) : openMenu())}
        disabled={disabled}
        isAction={open}
        testId="download-icon"
      />

      {shouldRenderPortal && typeof document !== "undefined" &&
        createPortal(
          <MenuWrapper
            ref={menuRef}
            role="menu"
            aria-label="Download options"
            $top={coords!.top}
            $left={coords!.left}
            $closing={closing}
          >
            <HeaderBar>
              <CloseBtn aria-label="Close" title="Close" onClick={(e) => { e.stopPropagation(); closeMenu(true); }}>
                <Icon icon="clear" />
              </CloseBtn>
              <HeaderTitle>
                <Icon icon="file_download" />
                {title || "Download"}
              </HeaderTitle>
            </HeaderBar>

            {/* Config section (filename + format) */}
            {cfg.showConfigSection && (
              <Section>
                <FieldRow>
                  <Label>File name</Label>
                  <FormControl
                    type="text"
                    size="sm"
                    value={name}
                    placeholder="file-name"
                    onChange={(val: any) => {
                      const v = typeof val === "string" ? val : val?.target?.value ?? "";
                      setName(v);
                      cfg.onConfigChange({ fileName: v, format: fmt });
                    }}
                  />
                </FieldRow>
                <FieldRow style={{ marginTop: 8 }}>
                  <Label>Format</Label>
                  <FormControl
                    type="radio-group"
                    size="sm"
                    name="dl-format"
                    value={fmt}
                    options={[
                      { text: "Excel (.xlsx)", value: "xlsx" },
                      { text: "CSV (.csv)", value: "csv" },
                    ]}
                    onChange={(v: any) => {
                      const newFmt = (typeof v === "string" ? v : v?.target?.value) as ExportFormat;
                      setFmt(newFmt);
                      cfg.onConfigChange({ fileName: name, format: newFmt });
                    }}
                  />
                </FieldRow>
              </Section>
            )}

            {/* Built-ins + extras */}
            <Section style={{ padding: 6, maxHeight: 140, overflow: "auto" }}>
              {showSelectedItem && (
                <MenuItem
                  role="menuitem"
                  onClick={async () => {
                    closeMenu(true);
                    if (!selectedCount || !hasValidName) return;
                    await downloadSheetFromAOA(buildSelectedAOA(), "selected", selectedCount);
                  }}
                  disabled={selectedCount === 0 || !hasValidName}
                  title={!hasValidName ? "Enter a file name to enable download" : undefined}
                >
                  <Icon icon={builtInIcons.selected} />
                  {builtInLabels.selected}
                  <RowCount>({selectedCount})</RowCount>
                </MenuItem>
              )}
              {cfg.showBuiltinAll && (
                <MenuItem
                  role="menuitem"
                  onClick={async () => {
                    closeMenu(true);
                    if (!allCount || !hasValidName) return;
                    await downloadSheetFromAOA(buildAllAOA(), "all", allCount);
                  }}
                  disabled={allCount === 0 || !hasValidName}
                  title={!hasValidName ? "Enter a file name to enable download" : undefined}
                >
                  <Icon icon={builtInIcons.all} />
                  {builtInLabels.all}
                  <RowCount>({allCount})</RowCount>
                </MenuItem>
              )}

              {(cfg.extraMenuItems ?? []).map((it) => (
                <MenuItem
                  key={it.key ?? it.label}
                  role="menuitem"
                  onClick={() => {
                    const payload = payloadForExtras();
                    closeMenu(true);
                    it.onClick(payload);
                  }}
                  disabled={!!it.disabled}
                  $separatorAbove={!!it.separatorAbove}
                >
                  {it.icon ? <Icon icon={it.icon} /> : null}
                  {it.label}
                </MenuItem>
              ))}
            </Section>
          </MenuWrapper>,
          document.body,
        )}
    </div>
  );
};
