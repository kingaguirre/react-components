import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ButtonIcon } from "./styled";
import { Icon } from "../../../../atoms/Icon";

export const DATA_TABLE_EXPANDER_ID = "data-table-expander";

export function ExpanderColumn<T>(
  expandedRowContent: (rowData?: any) => React.ReactNode | void | undefined,
): ColumnDef<T, any> {
  return {
    id: DATA_TABLE_EXPANDER_ID,
    enableSorting: false,
    enableColumnFilter: false,
    enablePinning: false,
    size: 30,
    meta: { className: "custom-column" },
    cell: ({ row }) => {
      // compute once; avoids double calls and preserves original semantics
      const content = expandedRowContent?.(row.original) ?? null;
      if (content == null) return null;

      const isExpanded = row.getIsExpanded();
      const toggle = row.getToggleExpandedHandler();

      return (
        <ButtonIcon
          className={isExpanded ? "expanded" : ""}
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          data-testid={`expand-row-${row.id}`}
        >
          <Icon icon={isExpanded ? "remove" : "add"} />
        </ButtonIcon>
      );
    },
  };
}
