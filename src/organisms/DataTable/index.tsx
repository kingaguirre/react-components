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
}: DataTableProps) => {
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const instanceIdRef = useRef<number>(Date.now() + Math.random());
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const isAutoSizingRef = useRef(false);
  const userSizedColsRef = useRef<Set<string>>(new Set());

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
  const [data, setData] = useState<DataRow[]>(
    () => UTILS.initializeDataWithIds(dataSource),
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
  const [columnPinning, setColumnPinning] =
    useState<ColumnPinningType>(
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
    if (UTILS.shouldIgnoreAutoReset(pagination, next, isPageResetSuppressed())) {
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
  };

  // Use custom hook to get action handlers.
  const { handleSaveRow, handleDelete, handleCancelRow } = useRowActions({
    setData,
    editingCell,
    setEditingCell,
    onChange,
    partialRowDeletionID,
    rowSelection,
    setRowSelection,
  });

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

  // Custom Columns
  const actionColumns = [
    enableRowSelection
      ? SelectColumn<T>(disabledRows, enableMultiRowSelection)
      : null,
    ...(enableRowAdding || enableRowDeleting
      ? [
          RowActionsColumn({
            columnSettings: safeColumnSettings,
            handleSaveRow,
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
    filterFns: {
      dateFilter: UTILS.dateFilter,
      dateRangeFilter: UTILS.dateRangeFilter,
    },
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

    // ✅ only reset when we're not in an edit commit window
    autoResetPageIndex: !(skipPageResetRef.current || isPageResetSuppressed()),
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

  const handleConfirmDelete = () => {
    const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
    // Delete records when modal is confirmed
    const selectedIds = new Set(
      selectedRows.map((r) => (r as any).__internalId),
    );

    setData((old) => {
      const updated: any = old.filter(
        (r) => !selectedIds.has((r as any).__internalId),
      );
      if (onChange) onChange(updated.map(({ __internalId, ...rest }) => rest));
      return updated;
    });
    // Clear selection after bulk delete
    setRowSelection({});
    // Close the modal
    setShowAlert(false);
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

  const totalSelectedRows = Object.keys(table.getState().rowSelection).filter(
    (key) => (rowSelection as any)[key],
  ).length;
  const showDeleteIcon =
    enableSelectedRowDeleting && enableRowSelection && totalSelectedRows > 0;

  return (
    <DataTableWrapper
      ref={tableWrapperRef}
      data-table-instanceid={instanceIdRef.current}
      className={`data-table-wrapper ${isFocused ? "is-focused" : "is-not-focused"}`}
      $disabled={disabled}
      tabIndex={0}
      onClickCapture={() => requestAnimationFrame(markActive)}
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
        handleDeleteIconClick={() => setShowAlert(true)}
        handleResetColumnSettings={handleResetColumnSettings}
        headerRightControls={headerRightControls}
        headerRightElements={headerRightElements}
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
          color="danger"
          title="Confirm"
          show={showAlert}
          toast
          placement="bottom-right"
          closeable
          animation="slide"
          onClose={() => setShowAlert(false)}
        >
          <RowsToDeleteText>
            Are you sure you want to delete <b>{totalSelectedRows}</b> row
            {totalSelectedRows > 1 ? "s" : ""}?
          </RowsToDeleteText>
          <Button
            size="sm"
            data-testid="confirm-bulk-delete-button"
            color="danger"
            onClick={handleConfirmDelete}
          >
            Confirm Delete
          </Button>
        </Alert>
      )}
    </DataTableWrapper>
  );
};
