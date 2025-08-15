import React, { ChangeEvent } from "react";
import { Table } from "@tanstack/react-table";
import { FooterContainer } from "./styled";
import { CheckboxCell } from "../SelectColumn/CheckboxCell";
import {
  SelectRowContainer,
  FooterDetailsContainer,
  LeftDetails,
  RightDetails,
  Button,
  SelectedContainer,
} from "./styled";
import { formatNumber, countDigits } from "../../../../utils";
import { Dropdown } from "../../../../molecules/Dropdown";
import { Icon } from "../../../../atoms/Icon";
import { FormControl } from "../../../../atoms/FormControl";
import { Tooltip } from "../../../../atoms/Tooltip";
import { BUILTIN_COLUMN_IDS } from "../../utils";

interface FooterProps<TData> {
  table: Table<TData>;
  disabledRows: string[];
  enableRowSelection?: boolean;
}

interface ExtraRowProps {
  __isNew?: boolean;
  __internalId?: string;
}

// Assuming your row data is of type TData, you can intersect it with ExtraRowProps:
type RowDataWithExtras<TData> = TData & ExtraRowProps;

export const Footer = <TData,>({
  table,
  disabledRows,
  enableRowSelection,
}: FooterProps<TData>) => {
  const hasColumns =
    table.getVisibleLeafColumns().filter((c) => !BUILTIN_COLUMN_IDS.has(c.id))
      .length > 0;
  const hasTotalRecords = table.getRowModel().rows.length > 0 && hasColumns;
  const totalFilteredRecords = table.getFilteredRowModel().rows.length;
  const endRange =
    (table.getState().pagination.pageIndex + 1) *
    table.getState().pagination.pageSize;
  // Set correct end range
  const _endRange =
    totalFilteredRecords > endRange ? endRange : totalFilteredRecords;

  const isPrevDisabled = !table.getCanPreviousPage();
  const isNextDisabled = !table.getCanNextPage();

  // Inside your footer component's render function:
  const rowSelection = table.getState().rowSelection;
  // Count only truthy selection values
  const totalSelectedRows = Object.keys(rowSelection).filter(
    (key) => rowSelection[key],
  ).length;

  // Get the visible page rows
  const pageRows = table.getRowModel().rows;

  // Filter out rows that are new or disabled so that they won't be updated on toggle
  const selectablePageRows = pageRows.filter((row) => {
    // Cast the original data to our extended type
    const original = row.original as RowDataWithExtras<typeof row.original>;
    const isNewRow = !!original.__isNew;
    const isDisabled = disabledRows.includes(original.__internalId ?? "");
    return !(isNewRow || isDisabled);
  });

  // Compute if all or some of the selectable page rows are selected
  const isAllPageSelected =
    selectablePageRows.length > 0 &&
    selectablePageRows.every((row) => row.getIsSelected());
  const isSomePageSelected = selectablePageRows.some((row) =>
    row.getIsSelected(),
  );

  const handleOnChange = (e) => {
    const newSelected = e.target.checked;
    // Start with the current selection state so disabled rows are preserved.
    const newSelection: Record<string, boolean> = {
      ...table.getState().rowSelection,
    };
    // Only update selection for selectable (visible) rows.
    pageRows.forEach((row) => {
      const original = row.original as RowDataWithExtras<typeof row.original>;
      const isNewRow = !!original.__isNew;
      const isDisabled = disabledRows.includes(original.__internalId ?? "");
      if (!isNewRow && !isDisabled) {
        newSelection[row.id] = newSelected;
      }
    });
    // Use the onRowSelectionChange callback to update the controlled state.
    if (table.options.onRowSelectionChange) {
      table.options.onRowSelectionChange(newSelection);
    } else {
      table.setRowSelection(newSelection);
    }
  };

  return hasColumns ? (
    <FooterContainer className="footer-container">
      {hasTotalRecords && enableRowSelection && (
        <SelectRowContainer>
          <CheckboxCell
            checked={isAllPageSelected}
            indeterminate={isSomePageSelected && !isAllPageSelected}
            onChange={handleOnChange}
            text={`Page Rows (${table.getRowModel().rows.length})`}
            rowId="footer"
          />
          {totalSelectedRows > 0 && (
            <SelectedContainer>
              <Icon icon="done_all" /> {formatNumber(totalSelectedRows)} Total
              Selected Row
              {totalSelectedRows > 1 ? "s" : ""}
            </SelectedContainer>
          )}
        </SelectRowContainer>
      )}
      <FooterDetailsContainer>
        <LeftDetails>
          {hasTotalRecords && (
            <>
              <span>Displaying</span>
              <span>
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}
              </span>
              <span>to</span>
              <span>{_endRange}</span>
              <span>of</span>
              <span>{formatNumber(totalFilteredRecords)}</span>
              <span>Records</span>
              {/* <Button title='Refresh' onClick={() => rerender()}><Icon icon='refresh'></Icon></Button> */}
            </>
          )}
        </LeftDetails>
        <RightDetails $totalCount={countDigits(table.getPageCount())}>
          <span>Rows</span>
          <Dropdown
            size="sm"
            value={table.getState().pagination.pageSize.toString()}
            onChange={(value) => table.setPageSize(Number(value))}
            clearable={false}
            disabled={!hasTotalRecords}
            options={[
              { text: "5", value: "5" },
              { text: "10", value: "10" },
              { text: "20", value: "20" },
              { text: "30", value: "30" },
              { text: "40", value: "40" },
              { text: "50", value: "50" },
            ]}
            testId="page-size-input"
          />
          <Button
            data-testid="first-page-button"
            disabled={isPrevDisabled}
            {...(!isPrevDisabled
              ? {
                  onClick: () => table.setPageIndex(0),
                }
              : {})}
          >
            <Icon icon="first_page" />
          </Button>
          <Button
            data-testid="previous-page-button"
            disabled={isPrevDisabled}
            {...(!isPrevDisabled
              ? {
                  onClick: () => table.previousPage(),
                }
              : {})}
          >
            <Icon icon="keyboard_arrow_left" />
          </Button>

          <Tooltip
            content={`Jump page (${table.getState().pagination.pageIndex + 1} of ${formatNumber(table.getPageCount())})`}
          >
            <FormControl
              type="number"
              min="1"
              size="sm"
              disabled={!hasTotalRecords}
              max={table.getPageCount()}
              value={table.getState().pagination.pageIndex + 1}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const page = e.target?.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
              className="footer-page"
              testId="page-index-input"
            />
          </Tooltip>
          <Button
            data-testid="next-page-button"
            disabled={isNextDisabled}
            {...(!isNextDisabled
              ? {
                  onClick: () => table.nextPage(),
                }
              : {})}
          >
            <Icon icon="keyboard_arrow_right" />
          </Button>
          <Button
            data-testid="last-page-button"
            disabled={isNextDisabled}
            {...(!isNextDisabled
              ? {
                  onClick: () => table.setPageIndex(table.getPageCount() - 1),
                }
              : {})}
          >
            <Icon icon="last_page" />
          </Button>
        </RightDetails>
      </FooterDetailsContainer>
    </FooterContainer>
  ) : null;
};
