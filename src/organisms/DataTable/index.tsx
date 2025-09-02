import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import {
  RowData,
  ColumnDef,
  SortingState,
  ExpandedState,
  useReactTable,
  getCoreRowModel,
  PaginationState,
  getSortedRowModel,
  RowSelectionState,
  getFacetedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
} from "@tanstack/react-table";
import {
  DataTableProps,
  SelectedCellType,
  EditingCellType,
  ColumnPinningType,
  DataRow,
} from "./interface";
import {
  DataTableWrapper,
  DataTableContainer,
  DataTableContentContainer,
  RowsToDeleteText,
  TableTitle,
} from "./styled";
import * as UTILS from "./utils";
import {
  setActiveTable,
  subscribeActiveTable,
  ensureActiveTableGlobalListeners,
} from "./utils/activeTable";
import * as UTILS_CS from "./utils/columnSettings";
import { MainHeader } from "./components/MainHeader";
import { SettingsPanel } from "./components/MainHeader/SettingsPanel";
import { ColumnHeader } from "./components/ColumnHeader";
import { Body } from "./components/Body";
import { Footer } from "./components/Footer";
import { CellRenderer } from "./components/CellRenderer";
import { transformColumnSettings } from "./utils/columnCreation";
import { SelectColumn } from "./components/SelectColumn";
import { RowActionsColumn } from "./components/RowActionsColumn";
import { useRowActions } from "./hooks/useRowActions";
import { useAutoScroll } from "./hooks/useAutoScroll";
import { useDebouncedColumnSettingsChange } from "./hooks/useDebouncedColumnSettingsChange";
import { useGlobalKeyNavigation } from "./hooks/useGlobalKeyNavigation";
import { useUniqueValueMaps } from "./hooks/useUniqueValueMaps";
import { Alert } from "../../molecules/Alert";
import { ExpanderColumn } from "./components/ExpanderColumn";
import CellCommitWorker from "./workers/cellCommitWorker?worker";

// needed for table body level scope DnD setup
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { arrayMove } from "@dnd-kit/sortable";
import { Button } from "../../atoms/Button";

/** ---------- STABLE DEFAULTS & GUARDS ---------- */
const EMPTY_COL_SETTINGS: ReadonlyArray<any> = Object.freeze([]);

/** No-op stable callback to avoid re-renders when parent doesn't pass one */
const NOOP: (..._args: any[]) => void = () => {};

// Our DataTable now accepts its data and column definitions via props.
export const DataTable = <T extends object>({
  dataSource,
  columnSettings,
  onChange,
  enableColumnFiltering = false,
  enableColumnPinning = true,
  enableColumnDragging = true,
  enableColumnSorting = true,
  enableColumnResizing = true,
  enableCellEditing = false,
  enableRowAdding = false,
  enableRowDeleting = false,
  enableSelectedRowDeleting = false,
  enableRowSelection = false,
  enableGlobalFiltering = false,
  headerRightControls = true,
  title,
  cellTextAlignment = "left",
  height,
  maxHeight,
  pageSize = 10,
  pageIndex = 0,
  enableMultiRowSelection = true,
  activeRow,
  selectedRows,
  partialRowDeletionID,
  disabledRows = [],
  disabled = false,
  headerRightElements = [],
  onRowClick,
  onRowDoubleClick,
  onColumnSettingsChange,
  onPageSizeChange,
  onPageIndexChange,
  onSelectedRowsChange,
  expandedRowContent,
  onActiveRowChange,
  selectedCell: selectedCellProp,
  serverMode = false,
  server,
  enableUpload = false,
  uploadControls,
  enableDownload = false,
  downloadControls,
  testId,
}: DataTableProps) => {
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const instanceIdRef = useRef<number>(Date.now() + Math.random());
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const isAutoSizingRef = useRef(false);
  const userSizedColsRef = useRef<Set<string>>(new Set());
  // Always have the freshest data when we need to emit
  const latestDataRef = useRef<DataRow[]>([]);

  // Toast (controlled like showAlert)
  const [toastShow, setToastShow] = useState(false);
  const [toast, setToast] = useState<{
    color: "success" | "info" | "warning" | "danger" | "default";
    title: string;
    message: React.ReactNode;
    icon?: string;
  } | null>(null);

  // --- Server mode state ---
  const [serverTotal, setServerTotal] = useState<number>(0);
  const [serverLoading, setServerLoading] = useState<boolean>(false);
  const fetchSeqRef = useRef(0);
  const globalFilterDebounceRef = useRef<number | null>(null);

  const showToast = React.useCallback(
    (cfg: {
      color: "success" | "info" | "warning" | "danger" | "default";
      title: string;
      message: React.ReactNode;
      icon?: string;
    }) => {
      // ensure re-open even if same message/title fires twice
      setToastShow(false);
      requestAnimationFrame(() => {
        setToast(cfg);
        setToastShow(true);
      });
    },
    [],
  );

  const hideToast = React.useCallback(() => setToastShow(false), []);

  // Auto-reset to first page on filter changes (server mode only)
  const lastFiltersRef = React.useRef({
    global: "",
    cols: JSON.stringify([] as ColumnFiltersState),
  });

  // Page reset suppression controller (covers local edit + parent echo)
  const {
    skipPageResetRef,
    noPageReset,
    suppressPageReset,
    isPageResetSuppressed,
  } = useMemo(() => UTILS.createPageResetController(1200), []);

  // Mark this table instance as active when mounted
  const markActive = () => setActiveTable(instanceIdRef.current);

  const SETTINGS_EMIT_SUPPRESS_MS = 800; // > your debounce inside useDebouncedColumnSettingsChange
  const suppressEmitUntilRef = useRef(0);
  const suppressEmits = (ms: number = SETTINGS_EMIT_SUPPRESS_MS) => {
    // ensure overlapping suppress windows extend, not shrink
    suppressEmitUntilRef.current = Math.max(
      suppressEmitUntilRef.current,
      Date.now() + ms,
    );
  };

  /** Guard: produce a stable, memoized array even when prop is undefined */
  const safeColumnSettings = useMemo(
    () =>
      Array.isArray(columnSettings)
        ? columnSettings
        : (EMPTY_COL_SETTINGS as any[]),
    [columnSettings],
  );

  /** Also guard onColumnSettingsChange to a stable no-op when not provided */
  const safeOnColumnSettingsChange = (onColumnSettingsChange ?? NOOP) as (
    ...a: any[]
  ) => void;

  // Augment rows with a stable internal ID.
  const [data, setData] = useState<DataRow[]>(() =>
    UTILS.initializeDataWithIds(dataSource),
  );

  const [editingCell, setEditingCell] = useState<EditingCellType>(null);
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(UTILS_CS.setDefaultColumnVisibility(safeColumnSettings));
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState<string>("");
  // Use initial pagination state from props:
  const [pagination, setPagination] = useState({ pageIndex, pageSize });
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningType>(
    UTILS_CS.getInitialPinning(safeColumnSettings),
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>(
    UTILS_CS.getInitialSorting(safeColumnSettings),
  );
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState<SelectedCellType>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [columnError, setColumnError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [cellLoading, setCellLoading] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | undefined>(
    activeRow ?? undefined,
  );
  const [isFocused, setIsFocused] = useState(false);

  // Memoize the transformed data from dataSource
  const memoizedData = useMemo(
    () => UTILS.initializeDataWithIds(dataSource),
    [dataSource],
  );

  const uniqueValueMaps = useUniqueValueMaps(data, safeColumnSettings);

  const currentQueryParams = useMemo(() => {
    return {
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      columnFilters,
      globalFilter: globalFilter ?? "",
    };
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    globalFilter,
  ]);

  // Memoized sizing function so we can call it from RO + window.resize
  const applySizing = React.useCallback(() => {
    const el = tableContainerRef.current;
    if (!el) return;

    const defaultSizing = UTILS_CS.getInitialSize(
      safeColumnSettings,
      el.clientWidth,
      columnVisibility,
      {
        enableCellEditing,
        enableRowAdding,
        enableRowDeleting,
        enableRowSelection,
        hasExpandedContent: Boolean(expandedRowContent),
      },
    );

    // block debounced emits for a short window while we programmatically update sizing
    suppressEmits();

    isAutoSizingRef.current = true;
    setColumnSizing((prev) =>
      UTILS.mergeSizing(defaultSizing, prev, userSizedColsRef.current),
    );
    requestAnimationFrame(() => {
      isAutoSizingRef.current = false;
    });
  }, [
    safeColumnSettings,
    columnVisibility,
    enableCellEditing,
    enableRowAdding,
    enableRowDeleting,
    enableRowSelection,
    expandedRowContent,
  ]);

  useLayoutEffect(() => {
    applySizing();

    // Observe container size
    const el = tableContainerRef.current;
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => applySizing())
        : null;
    if (el) ro?.observe(el);

    // Fallback to window resize/orientation changes
    let rafId: number | null = null;
    const onWinResize = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        applySizing();
        rafId = null;
      });
    };
    window.addEventListener("resize", onWinResize);
    window.addEventListener("orientationchange", onWinResize);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", onWinResize);
      window.removeEventListener("orientationchange", onWinResize);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [applySizing]);

  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  // Only update local data state when memoizedData changes.
  useEffect(() => {
    if (isPageResetSuppressed()) {
      noPageReset(() => setData(memoizedData));
    } else {
      setData(memoizedData);
    }

    // clear selection, active row and focused cell
    setRowSelection({});
    setActiveRowId(undefined);
    setSelectedCell(null);

    // if you expose selectedRows via props, notify consumer of reset:
    onSelectedRowsChange?.([]);
  }, [memoizedData, isPageResetSuppressed, noPageReset, onSelectedRowsChange]);

  // Sync when the prop changes
  useEffect(() => {
    setActiveRowId(activeRow ?? undefined);
  }, [activeRow]);

  // --- Sync column visibility and validate settings ---
  useEffect(() => {
    try {
      UTILS.checkUniqueColumns(safeColumnSettings);
      setColumnError(null);
    } catch (err: any) {
      setColumnError(err.message);
    }
  }, [safeColumnSettings]);

  // Wrap column sizing change so we can mark user changes
  type SizingUpdater =
    | Record<string, number>
    | ((prev: Record<string, number>) => Record<string, number>);
  const handleColumnSizingChange = (updaterOrValue: SizingUpdater) => {
    setColumnSizing((prev) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(prev)
          : updaterOrValue;

      // If this came from our auto-sizing, don't mark as user change
      if (!isAutoSizingRef.current) {
        // mark keys that actually changed
        for (const k of Object.keys(next)) {
          if (next[k] !== prev[k]) userSizedColsRef.current.add(k);
        }
      }
      return next;
    });
  };

  const handleResetColumnSettings = () => {
    // block for the whole batch
    suppressEmits(SETTINGS_EMIT_SUPPRESS_MS * 2);

    const defaultColumnVisibility =
      UTILS_CS.setDefaultColumnVisibility(safeColumnSettings);
    setColumnVisibility(defaultColumnVisibility);

    // Reset column sizing to default (empty object, or a computed default if needed)
    setColumnSizing(
      UTILS_CS.getInitialSize(
        safeColumnSettings,
        tableContainerRef.current?.clientWidth ?? 0,
        defaultColumnVisibility,
        {
          enableCellEditing,
          enableRowAdding,
          enableRowDeleting,
          enableRowSelection,
          hasExpandedContent: Boolean(expandedRowContent),
        },
      ),
    );

    // Reset column pinning to its default value
    setColumnPinning(UTILS_CS.getInitialPinning(safeColumnSettings));

    // Reset sorting based on prop columnSettings
    setSorting(UTILS_CS.getInitialSorting(safeColumnSettings));

    // Reset column order based on the current columns (computed with useMemo)
    setColumnOrder(UTILS_CS.getInitialColumnOrder(columns));

    // Reset column filters
    userSizedColsRef.current.clear();
  };

  // --- Sync external selectedRows prop if provided ---
  useEffect(() => {
    if (selectedRows) {
      const newSelection = selectedRows.reduce(
        (acc: Record<string, boolean>, key: string) => ({
          ...acc,
          [key]: true,
        }),
        {},
      );
      setRowSelection(newSelection);
    }
  }, [selectedRows]);

  // --- Row Adding Keyboard Events ---
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      // 1) If there’s an active row selected, clear it and stop.
      if (activeRowId) {
        setActiveRowId(undefined);
      }

      // 2) Cancel cell editing if active.
      if (editingCell) {
        setEditingCell(null);
      }

      // 3) Drop any new rows.
      if (data.some((row) => (row as any).__isNew)) {
        setData(data.filter((row) => !(row as any).__isNew));
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeRowId, editingCell, data]);

  // (Note: initialState only applies on first load.)
  useEffect(() => {
    table.setPageIndex(pageIndex);
  }, [pageIndex /* table instance */]);

  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize /* table instance */]);

  // whenever activeRowId or data changes, notify the consumer
  useEffect(() => {
    if (!onActiveRowChange) return;

    const found = data.find((r) => r.__internalId === activeRowId);

    const sanitized = found
      ? (({ __internalId, ...rest }) => rest)(found)
      : undefined;

    onActiveRowChange(sanitized, found?.__internalId);
  }, [activeRowId, data, onActiveRowChange]);

  useEffect(() => {
    if (!serverMode || !server?.fetcher) return;

    // Debounce on globalFilter only (typing should not hammer the API)
    if (globalFilterDebounceRef.current) {
      window.clearTimeout(globalFilterDebounceRef.current);
      globalFilterDebounceRef.current = null;
    }

    const doFetch = async () => {
      const seq = ++fetchSeqRef.current;
      setServerLoading(true);
      try {
        const { rows, total } = await server.fetcher(currentQueryParams);
        if (seq !== fetchSeqRef.current) return; // stale
        // write data in one shot; keep your page-reset guard intact
        noPageReset(() => setData(UTILS.initializeDataWithIds(rows as any)));
        setServerTotal(total);
      } catch (err) {
        console.error("[DataTable] server fetch failed:", err);
        // leave old data; you can expose a toast if you want
      } finally {
        if (seq === fetchSeqRef.current) setServerLoading(false);
      }
    };

    const delay = server?.debounceMs ?? 350;
    if (currentQueryParams.globalFilter) {
      globalFilterDebounceRef.current = window.setTimeout(doFetch, delay);
      return () => {
        if (globalFilterDebounceRef.current) {
          window.clearTimeout(globalFilterDebounceRef.current);
          globalFilterDebounceRef.current = null;
        }
      };
    } else {
      doFetch();
    }
  }, [
    serverMode,
    server?.fetcher,
    server?.debounceMs,
    currentQueryParams,
    noPageReset,
  ]);

  // Updated handleCellCommit using setDeepValue and getDeepValue.
  const handleCellCommit = (rowId: string, accessor: string, val: any) => {
    setCellLoading(true);

    // cover both local setData and the parent's echo
    suppressPageReset(1200);

    const rowIndex = data.findIndex((r) => r.__internalId === rowId);
    if (rowIndex === -1) {
      setCellLoading(false);
      return;
    }

    const worker = new CellCommitWorker();
    worker.onmessage = (e) => {
      const done = () => {
        setEditingCell(null);
        setCellLoading(false);
        worker.terminate();
      };

      if (e.data.error) {
        // sync fallback
        noPageReset(() => {
          setData((old) => {
            const idx = old.findIndex((r) => r.__internalId === rowId);
            if (idx === -1) return old;
            const cur = UTILS.getDeepValue(old[idx], accessor);
            const curStr = cur == null ? "" : String(cur);
            const newStr = val == null ? "" : String(val);
            if (curStr === newStr) return old;

            const updatedRow = UTILS.setDeepValue(old[idx], accessor, val);
            const updated = old.slice();
            updated[idx] = updatedRow;

            if (!updated[idx].__isNew && onChange) {
              const sanitized = updated.map(
                ({ __internalId, ...rest }) => rest,
              );
              onChange(sanitized);
            }
            return updated;
          });
        });
        return done();
      }

      if (e.data.unchanged) return done();

      if (e.data.updatedRow) {
        const { updatedRow } = e.data;

        // single setData; call onChange inside the same update
        noPageReset(() => {
          setData((old) => {
            const updated = old.slice();
            updated[rowIndex] = updatedRow;

            if (!data[rowIndex].__isNew && onChange) {
              const sanitized = updated.map(
                ({ __internalId, ...rest }) => rest,
              );
              onChange(sanitized);
            }
            return updated;
          });
        });

        return done();
      }

      done();
    };

    worker.onerror = (err) => {
      console.error("Worker encountered an error:", err);
      // same sync fallback as above
      noPageReset(() => {
        setData((old) => {
          const idx = old.findIndex((r) => r.__internalId === rowId);
          if (idx === -1) return old;
          const cur = UTILS.getDeepValue(old[idx], accessor);
          const curStr = cur == null ? "" : String(cur);
          const newStr = val == null ? "" : String(val);
          if (curStr === newStr) return old;

          const updatedRow = UTILS.setDeepValue(old[idx], accessor, val);
          const updated = old.slice();
          updated[idx] = updatedRow;

          if (!updated[idx].__isNew && onChange) {
            const sanitized = updated.map(({ __internalId, ...rest }) => rest);
            onChange(sanitized);
          }
          return updated;
        });
      });
      setEditingCell(null);
      setCellLoading(false);
      worker.terminate();
    };

    worker.postMessage({ rowData: data[rowIndex], accessor, val });
  };

  const handleRowSelectionChange = (
    updaterOrValue:
      | RowSelectionState
      | ((prev: RowSelectionState) => RowSelectionState),
  ) => {
    const newSelection =
      typeof updaterOrValue === "function"
        ? updaterOrValue(rowSelection)
        : updaterOrValue;
    setRowSelection(newSelection);
    onSelectedRowsChange?.(
      Object.keys(newSelection).filter((key) => newSelection[key]),
    );
  };

  const handlePaginationChange = (
    updaterOrValue:
      | PaginationState
      | ((prev: PaginationState) => PaginationState),
  ) => {
    const next =
      typeof updaterOrValue === "function"
        ? updaterOrValue(pagination)
        : updaterOrValue;

    // Ignore internal auto-reset to page 0 triggered by data writes during an edit echo
    if (
      UTILS.shouldIgnoreAutoReset(pagination, next, isPageResetSuppressed())
    ) {
      return;
    }

    setPagination(next);
    if (onPageSizeChange && next.pageSize !== pagination.pageSize)
      onPageSizeChange(next.pageSize);
    if (onPageIndexChange && next.pageIndex !== pagination.pageIndex)
      onPageIndexChange(next.pageIndex);
  };

  // --- Updated handleAddRow using meta.hidden and meta.className ---
  const handleAddRow = () => {
    const newRow = {
      __isNew: true,
      __internalId: "new",
    } as any as T;
    columnSettings.forEach((col) => {
      (newRow as any)[col.column] = "";
    });
    setData((old) => [newRow, ...old] as DataRow[]);

    // Find the first computed column based on its meta properties.
    const firstVisibleColumn: string = UTILS.getFirstVisibleKey(
      columnVisibility,
      columnOrder,
    );
    if (firstVisibleColumn) {
      const newRowId = (newRow as any).__internalId;
      setTimeout(() => {
        setSelectedCell({ rowId: newRowId, columnId: `${firstVisibleColumn}` });
        markActive();
      }, 0);
    }

    showToast({
      color: "info",
      title: "Adding new row",
      message:
        "A new row has been created at the top. Fill in the fields, then click Save to commit it.",
      icon: "plus-circle",
    });
  };

  // Wrap row clicks: update local state, then call user’s handler
  const handleRowClickInternal = (
    row: DataRow,
    __internalId: string,
    e: React.MouseEvent<HTMLElement>,
  ) => {
    setActiveRowId(__internalId);
    markActive(); // 👈 grab focus so this table becomes “active”
    if (onRowClick) onRowClick(row, __internalId, e);
  };

  // --- getRowCanExpand: determine expandability using expandedRowContent ---
  const getRowCanExpand = UTILS.makeRowCanExpand(
    expandedRowContent as (rowOriginal: any) => any,
  );

  // --- Define the expander column if expandedRowContent is provided ---
  const expanderCol = expandedRowContent
    ? ExpanderColumn(expandedRowContent as () => void)
    : null;

  // Transform new column settings into TanStack Table column definitions.
  const transformedColumns = transformColumnSettings<T>(
    safeColumnSettings,
    cellTextAlignment,
  );

  const transformColDef = (colDef: any): any => {
    // If it's a group column, recursively transform its child columns.
    if ("columns" in colDef && Array.isArray(colDef.columns)) {
      return {
        ...colDef,
        columns: colDef.columns.map(transformColDef),
      };
    }

    // Process non-group columns.
    const key: any = colDef.accessorKey || colDef.id;
    let additionalProps = {};
    if (typeof key === "string" && key.includes(".") && !colDef.accessorFn) {
      additionalProps = {
        accessorFn: (row: any) =>
          key
            .split(".")
            .reduce((acc, part) => (acc ? acc[part] : undefined), row),
        id: key,
      };
    }

    return {
      ...colDef,
      ...additionalProps,
      meta: {
        // Merge any existing meta properties and add the isDisabledRow function.
        ...colDef.meta,
        isDisabledRow: (row: any) => disabledRows.includes(row.__internalId),
      },
      cell: (cellProps: any) => (
        <CellRenderer
          {...cellProps}
          {...colDef}
          cellLoading={cellLoading}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          handleCellCommit={handleCellCommit}
          columnFilters={columnFilters}
          globalFilter={globalFilter}
          uniqueValueMaps={uniqueValueMaps}
        />
      ),
    };
  };

  // wrapper that shows a success toast when the saved row was a NEW row
  const { handleSaveRow, handleDelete, handleCancelRow } = useRowActions({
    setData,
    editingCell,
    setEditingCell,
    onChange,
    partialRowDeletionID,
    rowSelection,
    setRowSelection,
  });

  // Wrapper: shows success toast when the saved row was a "new" row
  const handleSaveRowWithToast = React.useCallback(
    (...args: any[]) => {
      const a0 = args[0];
      const oldId: string | undefined =
        typeof a0 === "string" ? a0 : (a0?.__internalId ?? a0?.rowId ?? a0?.id);

      // Was this row marked as new?
      const wasNew = oldId
        ? data.some((r) => r.__internalId === oldId && (r as any).__isNew)
        : data.some((r) => (r as any).__isNew);

      // If it's a new row, assign a real id before saving
      let newId: string | null = null;
      if (wasNew && oldId) {
        newId = Date.now().toString();

        setData((prev) =>
          prev.map((r) =>
            r.__internalId === oldId
              ? { ...r, __internalId: newId!, __isNew: false }
              : r,
          ),
        );

        // If handleSaveRow expects the row object, update args[0] too
        if (typeof a0 === "object" && a0 !== null) {
          args[0] = { ...a0, __internalId: newId, __isNew: false };
        }
      }

      // 🔧 TS2556 fix: use apply instead of spread on an unknown/union fn type
      const ret = handleSaveRow
        ? (handleSaveRow as any).apply(undefined, args)
        : undefined;

      return Promise.resolve(ret)
        .then(() => {
          if (wasNew) {
            // Emit once with the latest sanitized snapshot
            const sanitized = latestDataRef.current.map(
              ({ __internalId, ...rest }) => rest,
            );
            onChange?.(sanitized);

            showToast({
              color: "success",
              title: "Row added",
              message: "Your new row was saved successfully.",
              icon: "check",
            });
          }
        })
        .catch((err) => {
          // Revert id/flag if we changed them
          if (wasNew && oldId && newId) {
            setData((prev) =>
              prev.map((r) =>
                r.__internalId === newId
                  ? { ...r, __internalId: oldId, __isNew: true }
                  : r,
              ),
            );
          }

          showToast({
            color: "danger",
            title: "Save failed",
            message:
              "We couldn’t save the new row. Please review the fields and try again.",
            icon: "remove_circle_outline",
          });

          throw err;
        });
    },
    [handleSaveRow, data, showToast, onChange],
  );

  // Custom Columns
  const actionColumns = [
    enableRowSelection
      ? SelectColumn<T>(disabledRows, enableMultiRowSelection)
      : null,
    ...(enableRowAdding || enableRowDeleting
      ? [
          RowActionsColumn({
            columnSettings: safeColumnSettings,
            handleSaveRow: handleSaveRowWithToast,
            handleCancelRow,
            handleDelete,
            enableRowDeleting,
            disabledRows,
            partialRowDeletionID,
          }),
        ]
      : []),
  ].filter(Boolean) as ColumnDef<RowData, any>[];

  // Prepend selection and row action columns.
  const columns = useMemo<ColumnDef<RowData, any>[]>(() => {
    return [
      ...(expanderCol ? [expanderCol] : []),
      ...actionColumns,
      ...transformedColumns?.map(transformColDef),
    ];
  }, [
    transformedColumns,
    editingCell,
    cellLoading,
    disabledRows,
    expanderCol,
    actionColumns,
    columnFilters,
    globalFilter,
    handleCellCommit,
  ]);

  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    UTILS_CS.getInitialColumnOrder(columns),
  );

  const table = useReactTable<RowData>({
    data,
    columns,
    columnResizeMode: "onChange",
    state: {
      sorting,
      expanded,
      pagination,
      columnOrder,
      rowSelection,
      globalFilter,
      columnSizing,
      columnPinning,
      columnFilters,
      columnVisibility,
    },
    // ---- Add these flags for serverMode ----
    manualPagination: serverMode,
    manualSorting: serverMode,
    manualFiltering: serverMode,
    // ✅ give TanStack the true total; it will compute pageCount for you
    rowCount: serverMode ? serverTotal : undefined,
    pageCount: serverMode
      ? Math.max(
          1,
          Math.ceil((serverTotal || 0) / Math.max(1, pagination.pageSize)),
        )
      : undefined,

    // custom filter functions
    filterFns: {
      dateFilter: UTILS.dateFilter,
      dateRangeFilter: UTILS.dateRangeFilter,
    },

    // enable/disable features
    enableColumnFilters: enableColumnFiltering,
    enableGlobalFilter: enableGlobalFiltering,
    enableSorting: enableColumnSorting,
    enableColumnResizing: enableColumnResizing,
    enableColumnPinning: enableColumnPinning,
    enableMultiRowSelection: enableMultiRowSelection,

    getRowCanExpand,
    getSubRows: (row) => (row as any)?.subRows,
    getRowId: (row, index, parent) =>
      (row as DataRow).__internalId ?? `${parent?.id ?? "root"}:${index}`,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onPaginationChange: handlePaginationChange,
    onRowSelectionChange: handleRowSelectionChange,
    onColumnSizingChange: handleColumnSizingChange,
    onColumnPinningChange: setColumnPinning,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnOrderChange: setColumnOrder,
    getPaginationRowModel: getPaginationRowModel(),

    // Column filter related settings
    getFacetedRowModel: getFacetedRowModel(), // client-side faceting
    getFacetedUniqueValues: getFacetedUniqueValues(), // generate unique values for select filter/autocomplete
    getFacetedMinMaxValues: getFacetedMinMaxValues(), // generate min/max values for range filter

    // Server mode
    ...(serverMode ? {} : { getFilteredRowModel: getFilteredRowModel() }),
    ...(serverMode ? {} : { getSortedRowModel: getSortedRowModel() }),
    ...(serverMode ? {} : { getPaginationRowModel: getPaginationRowModel() }),

    // ✅ do NOT auto-reset page in server mode
    autoResetPageIndex: serverMode
      ? false
      : !(skipPageResetRef.current || isPageResetSuppressed()),
    meta: {
      disabled,
      serverLoading,
    },
  });

  // skip emits caused by window/container resize or other programmatic changes
  const guardedOnColumnSettingsChange = React.useCallback(
    (...args: any[]) => {
      if (Date.now() < suppressEmitUntilRef.current) return;
      safeOnColumnSettingsChange(...args);
    },
    [safeOnColumnSettingsChange],
  );

  useDebouncedColumnSettingsChange({
    columnSettings: safeColumnSettings,
    table,
    onColumnSettingsChange: guardedOnColumnSettingsChange, // <— use the guard
    columnSizing,
    columnPinning,
    sorting,
    columnOrder,
    columnVisibility,
  });

  // Attach global key navigation handler
  useGlobalKeyNavigation({
    selectedCell,
    table,
    enableCellEditing,
    setSelectedCell,
    setEditingCell,
    activeRowId,
    setActiveRowId,
    instanceId: instanceIdRef.current,
  });

  // Auto-scroll when a new cell is selected
  useAutoScroll(selectedCell, tableWrapperRef);

  React.useEffect(() => {
    if (!serverMode) return;

    const globalNow = globalFilter ?? "";
    const colsNow = JSON.stringify(columnFilters);

    const globalChanged = lastFiltersRef.current.global !== globalNow;
    const colsChanged = lastFiltersRef.current.cols !== colsNow;

    if (globalChanged || colsChanged) {
      lastFiltersRef.current = { global: globalNow, cols: colsNow };
      if (table.getState().pagination.pageIndex !== 0) {
        table.setPageIndex(0); // triggers your fetcher with pageIndex=0
      }
    }
  }, [serverMode, globalFilter, columnFilters, table]);

  const handleConfirmDelete = () => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original as DataRow);
    const selectedIds = new Set(selectedRows.map((r) => r.__internalId));
    const total = selectedIds.size;

    if (total === 0) {
      setShowAlert(false);
      return;
    }

    // Group soft-delete semantics
    if (partialRowDeletionID) {
      const isDeleted = (row: any) =>
        (row as any)[partialRowDeletionID] === true;
      const allAlreadyDeleted =
        selectedRows.length > 0 && selectedRows.every(isDeleted);

      let changed = 0;

      setData((old) => {
        const updated = old.map((row) => {
          if (!selectedIds.has(row.__internalId)) return row;

          if (allAlreadyDeleted) {
            // RESTORE ALL: only touch rows that are currently soft-deleted
            if (isDeleted(row)) {
              const next = { ...row };
              delete (next as any)[partialRowDeletionID];
              changed++;
              return next;
            }
            return row;
          } else {
            // DELETE ALL: mark all selected as soft-deleted; do not undo any
            if (!isDeleted(row)) {
              changed++;
              return { ...row, [partialRowDeletionID]: true } as any;
            }
            return row; // already deleted -> leave as-is
          }
        });

        onChange?.(updated.map(({ __internalId, ...rest }) => rest));
        return updated;
      });

      setRowSelection({});
      setShowAlert(false);

      showToast({
        color: "success",
        title: allAlreadyDeleted
          ? "Bulk restore complete"
          : "Bulk soft-delete complete",
        icon: "check",
        message: (
          <div>
            {changed > 0 ? (
              <>
                {allAlreadyDeleted ? "Restored" : "Soft-deleted"}{" "}
                <b>{changed}</b> row{changed > 1 ? "s" : ""}.
              </>
            ) : (
              <>No changes.</>
            )}
          </div>
        ),
      });

      return;
    }

    // Hard delete path (no partialRowDeletionID)
    const deletedCount = total;
    setData((old) => {
      const updated = old.filter(
        (r) => !selectedIds.has((r as any).__internalId),
      );
      onChange?.(updated.map(({ __internalId, ...rest }) => rest));
      return updated;
    });

    setRowSelection({});
    setShowAlert(false);

    showToast({
      color: "success",
      title: "Bulk delete complete",
      icon: "check",
      message: (
        <div>
          Removed <b>{deletedCount}</b> selected row
          {deletedCount > 1 ? "s" : ""}.
        </div>
      ),
    });
  };

  // reorder columns after drag & drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id as string);
        const newIndex = columnOrder.indexOf(over.id as string);
        return arrayMove(columnOrder, oldIndex, newIndex); //this is just a splice util
      });
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );

  const getExpandedRowRightOffset = () =>
    UTILS.getExpandedRowRightOffset(
      enableRowSelection,
      enableRowAdding,
      enableRowDeleting,
    );

  // Parse the selectedCellProp and set the selectedCell state
  useEffect(() => {
    const parsed = UTILS.parseSelectedCellInput(selectedCellProp);
    if (!parsed) return;

    const [r, c] = parsed;
    const internal = UTILS.coordToInternalSelection(
      table,
      r,
      c,
      UTILS.BUILTIN_COLUMN_IDS,
    );
    if (internal) setSelectedCell(internal);
  }, [selectedCellProp, table]);

  useEffect(() => {
    ensureActiveTableGlobalListeners();
    const unsub = subscribeActiveTable((id) => {
      setIsFocused(id === instanceIdRef.current); // drive visual focus from arrow-owner
    });
    return unsub;
  }, []);

  const restoreFocusToTable = React.useCallback(() => {
    // wait a tick so the modal unmounts first
    requestAnimationFrame(() => {
      tableWrapperRef.current?.focus();
      setActiveTable(instanceIdRef.current);
    });
  }, []);

  const handleAlertKeyDownCapture = (e: React.KeyboardEvent) => {
    // Block keystrokes from reaching table/global listeners
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleConfirmDelete();
      restoreFocusToTable();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setShowAlert(false);
      restoreFocusToTable();
      return;
    }
    // For any other key, still stop propagation to avoid accidental edits
    e.stopPropagation();
  };

  // ---------- Export/Import helpers (no table prop leaks) ----------
  const getVisibleNonBuiltInColumns = React.useCallback(() => {
    return table
      .getVisibleLeafColumns()
      .filter((c) => !UTILS.BUILTIN_COLUMN_IDS.has(String(c.id)))
      .map((c) => ({
        id: String(c.id),
        headerText:
          typeof c.columnDef?.header === "string"
            ? (c.columnDef.header as string)
            : String(c.id),
      }));
  }, [table]);

  /* ---------------------------------------------
   Export helpers (AOA + ROWS) — includeHidden aware
  ---------------------------------------------- */
  const getAllExportColumns = React.useCallback(
    (includeHidden?: boolean) => {
      // columnSettings should be the same array you pass to DataTable
      // Default is to include hidden columns in exports
      const wantHidden = includeHidden ?? true;
      return wantHidden
        ? columnSettings
        : columnSettings.filter((c) => !c.hidden);
    },
    [columnSettings],
  );

  const buildAOAFromRowModels = React.useCallback(
    (rowModels: Array<any>, opts?: { includeHidden?: boolean }) => {
      const cols = getAllExportColumns(opts?.includeHidden);
      const header = cols.map((c) => c.title ?? c.column);
      const body = rowModels.map((rm) =>
        cols.map((c) => {
          const v = (rm.original as any)?.[c.column];
          if (Array.isArray(v))
            return v.map((x) => (x == null ? "" : String(x))).join(",");
          if (v == null) return "";
          return v instanceof Date ? v.toISOString() : v;
        }),
      );
      return [header, ...body];
    },
    [getAllExportColumns],
  );

  const buildRowsFromRowModels = React.useCallback(
    (rowModels: Array<any>, opts?: { includeHidden?: boolean }) => {
      const cols = getAllExportColumns(opts?.includeHidden);
      return rowModels.map((rm) => {
        const src = rm.original as Record<string, any>;
        const out: Record<string, any> = {};
        cols.forEach((c) => {
          out[c.column] = src?.[c.column] ?? "";
        });
        return out;
      });
    },
    [getAllExportColumns],
  );

  /* Selected / All builders (AOA) */
  const getAOAForSelected = React.useCallback(
    (opts?: { includeHidden?: boolean }) =>
      buildAOAFromRowModels(table.getSelectedRowModel().rows, opts),
    [buildAOAFromRowModels, table],
  );

  const getAOAForAll = React.useCallback(
    (opts?: { includeHidden?: boolean }) =>
      buildAOAFromRowModels(table.getPrePaginationRowModel().rows, opts),
    [buildAOAFromRowModels, table],
  );

  /* Selected / All builders (ROWS) — for custom menu items */
  const getRowsForSelected = React.useCallback(
    (opts?: { includeHidden?: boolean }) =>
      buildRowsFromRowModels(table.getSelectedRowModel().rows, opts),
    [buildRowsFromRowModels, table],
  );

  const getRowsForAll = React.useCallback(
    (opts?: { includeHidden?: boolean }) =>
      buildRowsFromRowModels(table.getPrePaginationRowModel().rows, opts),
    [buildRowsFromRowModels, table],
  );

  /* Counts */
  const downloadSelectedCount = table.getSelectedRowModel().rows.length;
  const downloadAllCount = table.getPrePaginationRowModel().rows.length;

  // inside DataTable component
  const openBulkConfirm = React.useCallback(() => {
    // show modal
    setShowAlert(true);

    // drop any current focus/selection to avoid edit-mode side effects
    tableWrapperRef.current?.blur();

    // run after the wrapper's onClickCapture RAF so we win the race
    requestAnimationFrame(() => setActiveTable(null));
  }, []);

  // Upload: you still own the prepend here for clarity of data ownership
  const onImportInternal = React.useCallback(
    (alignedRows: Array<Record<string, any>>) => {
      noPageReset(() =>
        setData((old) => {
          const withIds = alignedRows.map((r) => ({
            ...r,
            __internalId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          }));
          const updated = [...withIds, ...old]; // PREPEND
          onChange?.(updated.map(({ __internalId, ...rest }) => rest));
          return updated;
        }),
      );
    },
    [noPageReset, onChange],
  );

  const compose =
    <A extends any[]>(a?: (...args: A) => void, b?: (...args: A) => void) =>
    (...args: A) => {
      try { a?.(...args); } finally { b?.(...args); }
    };

  const mergedUploadControls = React.useMemo(() => ({
    ...(uploadControls ?? {}),
    // run user's onImport first (so they can log), then always run internal
    onImport: compose(uploadControls?.onImport, onImportInternal),
    onOpen: compose(uploadControls?.onOpen, undefined),
    onUpload: compose(uploadControls?.onUpload, undefined),
    onUploading: compose(uploadControls?.onUploading, undefined),
    onError: compose(uploadControls?.onError, undefined),
    onComplete: compose(
      uploadControls?.onComplete,
      (meta: { importedCount: number }) => {
        showToast?.({
          color: "success",
          title: "Import complete",
          message: `Imported ${meta.importedCount} row${meta.importedCount === 1 ? "" : "s"}.`,
          icon: "check",
        });
      }
    ),
  }), [uploadControls, onImportInternal, showToast]);

  const totalSelectedRows = Object.keys(table.getState().rowSelection).filter(
    (key) => (rowSelection as any)[key],
  ).length;
  const showDeleteIcon =
    enableSelectedRowDeleting && enableRowSelection && totalSelectedRows > 0;

  // Derive bulk action mode for the confirm modal
  const selectedRowModels = table.getSelectedRowModel().rows;
  const selectedCount = selectedRowModels.length;

  const allSelectedSoftDeleted =
    !!partialRowDeletionID &&
    selectedCount > 0 &&
    selectedRowModels.every(
      (r) => (r.original as any)[partialRowDeletionID] === true,
    );

  const bulkMode: "restore" | "delete" = allSelectedSoftDeleted
    ? "restore"
    : "delete";

  return (
    <DataTableWrapper
      data-testid={testId}
      ref={tableWrapperRef}
      data-table-instanceid={instanceIdRef.current}
      data-disabled={disabled || serverLoading}
      className={`data-table-wrapper ${isFocused ? "is-focused" : "is-not-focused"}`}
      $disabled={disabled || serverLoading}
      tabIndex={0}
      onClickCapture={() => {
        if (showAlert) return;
        requestAnimationFrame(markActive);
      }}
    >
      {title && <TableTitle className="data-table-title">{title}</TableTitle>}
      <SettingsPanel
        hasTitle={!!title}
        table={table}
        show={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        setDefaultColumnVisibility={() =>
          setColumnVisibility(
            UTILS_CS.setDefaultColumnVisibility(safeColumnSettings),
          )
        }
      />
      <MainHeader
        value={globalFilter ?? ""}
        enableGlobalFiltering={enableGlobalFiltering}
        onChange={(value) => setGlobalFilter(value as string)}
        onClear={() => setGlobalFilter("")}
        isClearDisabled={!globalFilter && columnFilters.length === 0}
        isAddBtnDisabled={data.some((row) => (row as any).__isNew)}
        enableRowAdding={enableRowAdding}
        onClearAllIconClick={() => {
          setGlobalFilter("");
          setColumnFilters([]);
        }}
        isSettingsPanelOpen={showSettingsPanel}
        onSettingsIconClick={() => setShowSettingsPanel(true)}
        onAddBtnClick={handleAddRow}
        showDeleteIcon={showDeleteIcon}
        handleDeleteIconClick={openBulkConfirm}
        handleResetColumnSettings={handleResetColumnSettings}
        headerRightControls={headerRightControls}
        headerRightElements={headerRightElements}
        bulkRestoreMode={allSelectedSoftDeleted}
        enableRowSelection={enableRowSelection}
        getVisibleNonBuiltInColumns={getVisibleNonBuiltInColumns}
        /* AOA builders (built-in menu items use these) */
        downloadSelectedCount={downloadSelectedCount}
        downloadAllCount={downloadAllCount}
        getAOAForSelected={getAOAForSelected}
        getAOAForAll={getAOAForAll}
        /* ROWS builders (extras use these) */
        getRowsForSelected={getRowsForSelected}
        getRowsForAll={getRowsForAll}
        enableDownload={enableDownload}
        enableUpload={enableUpload}
        // controls are still defined on DataTable API
        uploadControls={mergedUploadControls}
        downloadControls={downloadControls}
      />
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <DataTableContainer
          className="data-table-container"
          ref={tableContainerRef}
          style={{ height, maxHeight }}
        >
          <DataTableContentContainer
            style={{ width: table.getCenterTotalSize() }}
          >
            <ColumnHeader
              table={table}
              columnOrder={columnOrder}
              enableColumnDragging={enableColumnDragging}
            />
            <Body
              table={table}
              columnError={columnError}
              columnOrder={columnOrder}
              editingCell={editingCell}
              setEditingCell={setEditingCell}
              enableCellEditing={enableCellEditing}
              selectedCell={selectedCell}
              setSelectedCell={setSelectedCell}
              activeRow={activeRowId}
              onRowClick={handleRowClickInternal}
              onRowDoubleClick={onRowDoubleClick}
              disabledRows={disabledRows}
              enableColumnDragging={enableColumnDragging}
              expandedRowContent={expandedRowContent}
              uniqueValueMaps={uniqueValueMaps}
              expandedRowRightOffset={getExpandedRowRightOffset()}
            />
          </DataTableContentContainer>
        </DataTableContainer>
      </DndContext>
      <Footer
        table={table}
        disabledRows={disabledRows}
        enableRowSelection={enableRowSelection}
      />
      {showDeleteIcon && (
        <Alert
          color={bulkMode === "restore" ? "info" : "danger"}
          title={bulkMode === "restore" ? "Confirm restore" : "Confirm delete"}
          show={showAlert}
          icon={bulkMode === "restore" ? "info" : "dangerous"}
          toast
          placement="bottom-right"
          closeable
          animation="slide"
          onClose={() => setShowAlert(false)}
          onKeyDownCapture={handleAlertKeyDownCapture}
        >
          <RowsToDeleteText $isRestore={bulkMode === "restore"}>
            {bulkMode === "restore" ? (
              <>
                Are you sure you want to <b>restore</b> {selectedCount} selected
                row
                {selectedCount > 1 ? "s" : ""}?
              </>
            ) : (
              <>
                Are you sure you want to <b>delete</b> {selectedCount} selected
                row
                {selectedCount > 1 ? "s" : ""}?
              </>
            )}
          </RowsToDeleteText>
          <Button
            size="sm"
            data-testid="confirm-bulk-delete-button"
            color={bulkMode === "restore" ? "info" : "danger"}
            onClick={handleConfirmDelete}
            autoFocus
          >
            {bulkMode === "restore" ? "Confirm Restore" : "Confirm Delete"}
          </Button>
        </Alert>
      )}

      {toast && (showDeleteIcon || enableRowAdding) && (
        <Alert
          color={toast.color}
          title={toast.title}
          icon={toast.icon}
          show={toastShow}
          toast
          placement="bottom-right"
          animation="slide"
          onClose={hideToast}
        >
          {toast.message}
        </Alert>
      )}
    </DataTableWrapper>
  );
};
