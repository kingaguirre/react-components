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
import { SkeletonBody } from "./SkeletonBody";
import { useHeaderColSizes } from "../../hooks/useHeaderColSizes";

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
  uniqueValueMaps?: Record<string, string[] | Record<string, number> | undefined>;
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
  const isServer = Boolean((table.options as any).manualPagination);

  // Correct row model for render
  const rows = isServer
    ? table.getRowModel().rows
    : table.getPaginationRowModel().rows;

  // Correct total records
  const totalRecords = isServer
    ? ((table.options as any).rowCount ?? rows.length)
    : table.getFilteredRowModel().rows.length;

  // Non-built-in user columns (for guards/messages only)
  const leafColumns = table.getAllLeafColumns().filter((c) => !BUILTIN_COLUMN_IDS.has(c.id));
  const visibleLeafColumns = table.getVisibleLeafColumns().filter((c) => !BUILTIN_COLUMN_IDS.has(c.id));

  // Loading flags from meta
  const meta = ((table.options as any)?.meta ?? {}) as {
    disabled?: boolean;
    serverLoading?: boolean;
    loading?: boolean;
  };
  const isLoading = Boolean(meta.loading || meta.serverLoading);
  
  // Memoized column sizes for the skeleton (includes built-ins via header groups)
  const colSizes = useHeaderColSizes(table, isLoading);

  // Memoized row renderer
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
          <ExpandedRowContainer $expandedRowRightOffset={expandedRowRightOffset}>
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

  // Guards not related to loading
  if (leafColumns.length === 0) {
    return (
      <BodyContainer className="data-table-body-container">
        <NoDataContainer $hasError>No column settings configured.</NoDataContainer>
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

 if (isLoading) {
    const pageSize =
      table.getState()?.pagination?.pageSize ??
      rows.length ??
      10;

    return (
      <BodyContainer className="data-table-body-container">
        <SkeletonBody rows={pageSize} colSizes={colSizes.length ? colSizes : [120]} />
      </BodyContainer>
    );
  }

  // Client-side big dataset notice
  if (!isServer && totalRecords > 100000) {
    return (
      <BodyContainer className="data-table-body-container">
        <NoDataContainer>
          <b>Notice</b>: Maximum rows set to 100,000. For improved performance on large datasets, consider server-side pagination.
        </NoDataContainer>
      </BodyContainer>
    );
  }

  // No data (only when not loading)
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

  // Main render
  return (
    <BodyContainer className="data-table-body-container">
      {rows.map((row) => rowContent(row))}
    </BodyContainer>
  );
};
