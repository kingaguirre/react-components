import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ButtonIcon } from "./styled";
import { Icon } from "../../../../atoms/Icon";

export const DATA_TABLE_EXPANDER_ID = "data-table-expander";
export function ExpanderColumn<T>(
  expandedRowContent: (rowData?: any) => void | undefined,
): ColumnDef<T, any> {
  return {
    id: DATA_TABLE_EXPANDER_ID,
    enableSorting: false,
    enableColumnFilter: false,
    enablePinning: false,
    size: 30,
    meta: { className: "custom-column" },
    cell: ({ row }) => {
      // Call the expandedRowContent function to determine if this row is expandable.
      const content = expandedRowContent
        ? expandedRowContent(row.original)
        : null;

      if (content != null) {
        return (
          <ButtonIcon
            className={row.getIsExpanded() ? "expanded" : ""}
            onClick={(e) => {
              e.stopPropagation();
              row.getToggleExpandedHandler()();
            }}
            data-testid={`expand-row-${row.id}`}
          >
            <Icon icon={row.getIsExpanded() ? "remove" : "add"} />
          </ButtonIcon>
        );
      }
    },
  };
}
