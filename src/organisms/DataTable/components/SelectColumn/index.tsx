import { ColumnDef } from "@tanstack/react-table";
import { CheckboxCell } from "./CheckboxCell";
import { CellContainer } from "../ColumnHeader/styled";
export const DATA_TABLE_SELECT_ID = "data-table-select";

export const SelectColumn = <T extends object>(
  disabledRows: string[] = [],
  enableMultiRowSelection: boolean = true,
): ColumnDef<T, any> => ({
  id: DATA_TABLE_SELECT_ID,
  size: 30,
  enableResizing: false,
  enablePinning: false,
  enableSorting: false,
  meta: { className: "custom-column" },
  header: ({ table }) => {
    // Use the pre-pagination row model to access all rows regardless of pagination.
    const allRows = table.getPrePaginationRowModel().rows;

    // Compute selectable rows: those that are not new and not disabled.
    const selectableRows = allRows.filter((row) => {
      const isNewRow = !!(row.original as any).__isNew;
      const isRowDisabled = disabledRows.includes(
        (row.original as any).__internalId,
      );
      return !(isNewRow || isRowDisabled);
    });

    // Compute the selection state over all selectable rows.
    const isAllSelected =
      selectableRows.length > 0 &&
      selectableRows.every((row) => row.getIsSelected());
    const someSelected = selectableRows.some((row) => row.getIsSelected());
    const isIndeterminate = someSelected && !isAllSelected;

    const handleChange = (e) => {
      const newSelected = e.target.checked;
      // Start with the current selection state to preserve disabled rows.
      const newSelection: Record<string, boolean> = {
        ...table.getState().rowSelection,
      };

      // Iterate through all rows (across pages) and update only selectable ones.
      allRows.forEach((row) => {
        const isNewRow = !!(row.original as any).__isNew;
        const isRowDisabled = disabledRows.includes(
          (row.original as any).__internalId,
        );
        if (!isNewRow && !isRowDisabled) {
          newSelection[row.id] = newSelected;
        }
      });

      // Trigger the external onRowSelectionChange handler if provided.
      if (table.options.onRowSelectionChange) {
        table.options.onRowSelectionChange(newSelection);
      } else {
        table.setRowSelection(newSelection);
      }
    };

    return enableMultiRowSelection && allRows.length > 0 ? (
      <CellContainer className="custom-column data-table-select-header">
        <CheckboxCell
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onChange={handleChange}
          rowId="header"
        />
      </CellContainer>
    ) : null;
  },
  cell: ({ row }) => {
    const isNewRow = !!(row.original as any).__isNew;
    const isRowDisabled = disabledRows.includes(
      (row.original as any).__internalId,
    );
    // Use 'checkbox' for multi-selection use 'radio' for single-selection.
    const inputType = enableMultiRowSelection ? "checkbox" : "radio";
    return (
      <CellContainer className="custom-column data-table-select-item">
        <CheckboxCell
          type={inputType}
          checked={row.getIsSelected()}
          indeterminate={row.getIsSomeSelected()}
          onChange={row.getToggleSelectedHandler()}
          disabled={isNewRow || isRowDisabled}
          rowId={row.id}
        />
      </CellContainer>
    );
  },
});
