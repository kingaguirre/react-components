import React, { ChangeEvent, useMemo } from "react";
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
import { Loader } from "../../../../atoms/Loader";

interface FooterProps<TData> {
  table: Table<TData>;
  disabledRows: string[];
  enableRowSelection?: boolean;
  /** When true, hides the entire RightDetails (rows/pagination) area */
  hideRightDetails?: boolean;
}

interface ExtraRowProps {
  __isNew?: boolean;
  __internalId?: string;
}

type RowDataWithExtras<TData> = TData & ExtraRowProps;

export const Footer = <TData,>({
  table,
  disabledRows,
  enableRowSelection,
  hideRightDetails,
}: FooterProps<TData>) => {
  const hasColumns = useMemo(
    () =>
      table.getVisibleLeafColumns().some((c) => !BUILTIN_COLUMN_IDS.has(c.id)),
    [table],
  );

  const isServer = Boolean((table.options as any).manualPagination);

  const totalRecords = isServer
    ? ((table.options as any).rowCount ?? 0)
    : table.getFilteredRowModel().rows.length;

  const hasTotalRecords = hasColumns && totalRecords > 0;

  const { pageIndex, pageSize } = table.getState().pagination;
  const startRange = totalRecords === 0 ? 0 : pageIndex * pageSize + 1;
  const endRange = Math.min(totalRecords, (pageIndex + 1) * pageSize);

  const isPrevDisabled = !table.getCanPreviousPage();
  const isNextDisabled = !table.getCanNextPage();

  // Selection counts
  const rowSelection = table.getState().rowSelection;
  const totalSelectedRows = Object.keys(rowSelection).filter(
    (key) => (rowSelection as any)[key],
  ).length;

  // Current page rows (server vs client)
  const pageRows = isServer
    ? table.getRowModel().rows
    : table.getPaginationRowModel().rows;

  // Filter out rows that are new or disabled so that they won't be updated on toggle
  const selectablePageRows = pageRows.filter((row) => {
    const original = row.original as RowDataWithExtras<typeof row.original>;
    const isNewRow = !!original.__isNew;
    const isDisabled = disabledRows.includes(original.__internalId ?? "");
    return !(isNewRow || isDisabled);
  });

  const isAllPageSelected =
    selectablePageRows.length > 0 &&
    selectablePageRows.every((row) => row.getIsSelected());
  const isSomePageSelected = selectablePageRows.some((row) =>
    row.getIsSelected(),
  );

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSelected = e.target.checked;
    const newSelection: Record<string, boolean> = {
      ...table.getState().rowSelection,
    };
    pageRows.forEach((row) => {
      const original = row.original as RowDataWithExtras<typeof row.original>;
      const isNewRow = !!original.__isNew;
      const isDisabled = disabledRows.includes(original.__internalId ?? "");
      if (!isNewRow && !isDisabled) {
        newSelection[row.id] = newSelected;
      }
    });
    if (table.options.onRowSelectionChange) {
      table.options.onRowSelectionChange(newSelection);
    } else {
      table.setRowSelection(newSelection);
    }
  };

  const meta = ((table.options as any)?.meta ?? {}) as {
    disabled?: boolean;
    serverLoading?: boolean;
    loading?: boolean;
  };
  const isLoading = Boolean(meta.loading || meta.serverLoading);
  const disabled = Boolean(meta.disabled);

  return hasColumns ? (
    <FooterContainer className="footer-container">
      {hasTotalRecords && enableRowSelection && (
        <SelectRowContainer>
          <CheckboxCell
            checked={isAllPageSelected}
            indeterminate={isSomePageSelected && !isAllPageSelected}
            onChange={handleOnChange}
            text={`Page Rows (${pageRows.length})`}
            rowId="footer"
          />
          {totalSelectedRows > 0 && (
            <SelectedContainer>
              <Icon icon="done_all" /> {formatNumber(totalSelectedRows)} Total
              Selected Row{totalSelectedRows > 1 ? "s" : ""}
            </SelectedContainer>
          )}
        </SelectRowContainer>
      )}

      <FooterDetailsContainer>
        <LeftDetails>
          {hasTotalRecords && (
            <>
              <span>Displaying</span>
              <span>{startRange}</span>
              <span>to</span>
              <span>{endRange}</span>
              <span>of</span>
              <span>{formatNumber(totalRecords)}</span>
              <span>Records</span>
            </>
          )}
        </LeftDetails>

        {!hideRightDetails && (
          <RightDetails $totalCount={countDigits(table.getPageCount())}>
            {isLoading && (
              <span className="loader" data-testid="footer-loader">
                <Loader size="xs" />
              </span>
            )}
            <span>Rows</span>
            <Dropdown
              size="sm"
              value={String(pageSize)}
              onChange={(value) => table.setPageSize(Number(value))}
              clearable={false}
              disabled={!hasTotalRecords || disabled}
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
              disabled={isPrevDisabled || disabled}
              {...(!isPrevDisabled
                ? { onClick: () => table.setPageIndex(0) }
                : {})}
            >
              <Icon icon="first_page" />
            </Button>

            <Button
              data-testid="previous-page-button"
              disabled={isPrevDisabled || disabled}
              {...(!isPrevDisabled
                ? { onClick: () => table.previousPage() }
                : {})}
            >
              <Icon icon="keyboard_arrow_left" />
            </Button>

            <Tooltip
              content={`Jump page (${pageIndex + 1} of ${formatNumber(
                table.getPageCount(),
              )})`}
            >
              <FormControl
                type="number"
                min="1"
                size="sm"
                disabled={!hasTotalRecords || disabled}
                max={table.getPageCount()}
                value={pageIndex + 1}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const page = e.target?.value ? Number(e.target.value) - 1 : 0;
                  table.setPageIndex(page);
                }}
                className="footer-page"
                testId="page-index-input"
                clearable={false}
              />
            </Tooltip>

            <Button
              data-testid="next-page-button"
              disabled={isNextDisabled || disabled}
              {...(!isNextDisabled ? { onClick: () => table.nextPage() } : {})}
            >
              <Icon icon="keyboard_arrow_right" />
            </Button>

            <Button
              data-testid="last-page-button"
              disabled={isNextDisabled || disabled}
              {...(!isNextDisabled
                ? {
                    onClick: () => table.setPageIndex(table.getPageCount() - 1),
                  }
                : {})}
            >
              <Icon icon="last_page" />
            </Button>
          </RightDetails>
        )}
      </FooterDetailsContainer>
    </FooterContainer>
  ) : null;
};
