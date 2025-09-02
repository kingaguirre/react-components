import React, { useCallback } from "react";
import { Table } from "@tanstack/react-table";
import { BodyContainer, NoDataContainer, ExpandedRowContainer } from "./styled";
import {
  EditingCellType,
  SelectedCellType,
  DataTableProps,
} from "../../interface";
import { Row } from "./Row";
import { BUILTIN_COLUMN_IDS } from "../../utils";

interface BodyProps<TData> {
  table: Table<TData>;
  activeRow?: string;
  setEditingCell: any;
  columnError?: string | null;
  columnOrder: string[];
  disabledRows?: string[];
  enableCellEditing: boolean;
  editingCell: EditingCellType;
  selectedCell: SelectedCellType;
  enableColumnDragging?: boolean;
  expandedRowRightOffset?: number;
  setSelectedCell: (cell: SelectedCellType) => void;
  onRowClick?: DataTableProps["onRowClick"];
  onRowDoubleClick?: DataTableProps["onRowDoubleClick"];
  expandedRowContent?: (RowData: any) => React.ReactNode;
  uniqueValueMaps?: Record<
    string,
    string[] | Record<string, number> | undefined
  >;
}

export const Body = <TData,>({
  table,
  activeRow,
  columnOrder,
  columnError,
  editingCell,
  selectedCell,
  disabledRows,
  setEditingCell,
  setSelectedCell,
  enableCellEditing,
  onRowClick,
  onRowDoubleClick,
  expandedRowContent,
  uniqueValueMaps,
  expandedRowRightOffset,
}: BodyProps<TData>) => {
  // 🔎 Detect server/manual mode
  const isServer = Boolean((table.options as any).manualPagination);

  // ⚙️ Pick the correct row model:
  // - server: getRowModel() already represents the fetched page
  // - client: use getPaginationRowModel() to render the current page slice
  const rows = isServer
    ? table.getRowModel().rows
    : table.getPaginationRowModel().rows;

  // 📊 Total records:
  // - server: derive from options.rowCount (set in useReactTable)
  // - client: filtered row count is the true total displayed
  const totalRecords = isServer
    ? ((table.options as any).rowCount ?? rows.length)
    : table.getFilteredRowModel().rows.length;

  // Exclude built-in columns from all/visible leaf columns
  const allLeafColumns = table.getAllLeafColumns();
  const leafColumns = allLeafColumns.filter(
    (c) => !BUILTIN_COLUMN_IDS.has(c.id),
  );
  const visibleLeafColumns = table
    .getVisibleLeafColumns()
    .filter((c) => !BUILTIN_COLUMN_IDS.has(c.id));

  // Memoized row renderer (Row is memoized too)
  const rowContent = useCallback(
    (row: any) => (
      <React.Fragment key={row.id}>
        <Row
          row={row}
          activeRow={activeRow}
          disabledRows={disabledRows}
          onRowClick={onRowClick}
          onRowDoubleClick={onRowDoubleClick}
          enableCellEditing={enableCellEditing}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          selectedCell={selectedCell}
          setSelectedCell={setSelectedCell}
          columnOrder={columnOrder}
          uniqueValueMaps={uniqueValueMaps}
        />
        {row.getIsExpanded() && expandedRowContent && (
          <ExpandedRowContainer
            $expandedRowRightOffset={expandedRowRightOffset}
          >
            {expandedRowContent(row.original)}
          </ExpandedRowContainer>
        )}
      </React.Fragment>
    ),
    [
      activeRow,
      disabledRows,
      onRowClick,
      onRowDoubleClick,
      enableCellEditing,
      editingCell,
      selectedCell,
      setSelectedCell,
      columnOrder,
      uniqueValueMaps,
      expandedRowContent,
      setEditingCell,
    ],
  );

  // Guards
  if (leafColumns.length === 0) {
    return (
      <BodyContainer className="data-table-body-container">
        <NoDataContainer $hasError>
          No column settings configured.
        </NoDataContainer>
      </BodyContainer>
    );
  }

  if (columnError) {
    return (
      <BodyContainer className="data-table-body-container">
        <NoDataContainer $hasError>{columnError}</NoDataContainer>
      </BodyContainer>
    );
  }

  // No data (respect server total)
  if (totalRecords === 0) {
    return (
      <BodyContainer className="data-table-body-container">
        <NoDataContainer>No data to display</NoDataContainer>
      </BodyContainer>
    );
  }

  if (visibleLeafColumns.length === 0) {
    return (
      <BodyContainer className="data-table-body-container">
        <NoDataContainer>All columns are hidden</NoDataContainer>
      </BodyContainer>
    );
  }

  // Big dataset notice applies only to client-side mode
  if (!isServer && totalRecords > 100000) {
    return (
      <BodyContainer className="data-table-body-container">
        <NoDataContainer>
          <b>Notice</b>: Maximum rows set to 100,000. For improved performance
          on large datasets, consider implementing server-side pagination.
        </NoDataContainer>
      </BodyContainer>
    );
  }

  // Main render
  return (
    <BodyContainer className="data-table-body-container">
      {rows.map((row) => rowContent(row))}
    </BodyContainer>
  );
};
