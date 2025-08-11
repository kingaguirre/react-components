import React, { memo } from "react";
import { Header, flexRender } from "@tanstack/react-table";
import {
  CellContainer,
  CellContent,
  Resizer,
  IconContainer,
  DragHandle,
  LeftIconContainer,
  CellFilterPlaceholder,
} from "../ColumnHeader/styled";
import { getColumnStyles, CUSTOM_COLUMN } from "../../utils/columnSettings";
import { Filter } from "../ColumnHeader/Filter";
import { useSortable } from "@dnd-kit/sortable";
import { Icon } from "../../../../atoms/Icon";
import { Tooltip } from "../../../../atoms/Tooltip";

export const Cell = memo(
  ({
    header,
    table,
    enableColumnDragging,
  }: {
    header: Header<unknown, unknown>;
    table: any;
    enableColumnDragging?: boolean;
  }) => {
    const isPinLeft = header.column.getIsPinned() === "left";
    const colDef: any = header.column.columnDef;
    const colMeta: any = colDef.meta;
    const { attributes, isDragging, listeners, setNodeRef, transform } =
      useSortable({ id: colDef.accessorKey });
    const isCustomColumn = CUSTOM_COLUMN.includes(header.column.id);
    const hasDND =
      enableColumnDragging && colMeta?.draggable !== false && !isCustomColumn;
    const hasPin = header.column.getCanPin() && !isCustomColumn;
    const hasSort = header.column.getCanSort() && !isCustomColumn;
    const hasFilterableColumn = table
      .getAllLeafColumns()
      .some((column) => column.getCanFilter());
    const isGroupHeader = colDef.columns?.length > 0;

    const rawHeader =
      typeof colDef.header === "function"
        ? colDef.header(header.getContext())
        : colDef.header;

    const headerText = typeof rawHeader === "string" ? rawHeader : "";
    const cellPlaceholder =
      header.isPlaceholder || isGroupHeader ? null : <CellFilterPlaceholder />;
    const columnFilter = header.column.getCanFilter() ? (
      <Filter column={header.column} />
    ) : (
      cellPlaceholder
    );

    const getSortDetails = () => {
      if (header.column.getCanSort()) {
        if (header.column.getNextSortingOrder() === "asc") {
          return {
            className: "no-sort",
            title: "Sort ascending",
          };
        } else if (header.column.getNextSortingOrder() === "desc") {
          return {
            className: "sort-asc",
            title: "Sort descending",
          };
        } else {
          return {
            className: "sort-desc",
            title: "Clear sort",
          };
        }
      }
      return {
        className: "",
        title: "",
      };
    };

    return (
      <CellContainer
        className="cell-container"
        ref={setNodeRef}
        style={{
          ...getColumnStyles(header.column, isDragging, transform),
          width: header.getSize(),
        }}
        data-testid={`cell-container-${header.column.id}`}
      >
        {header.isPlaceholder ? null : (
          <>
            {/** DND */}
            {hasDND && !isGroupHeader && !isPinLeft && (
              <DragHandle
                {...attributes}
                {...listeners}
                data-testid={`column-drag-handle-${header.column.id}`}
              >
                <Icon icon="drag_indicator" />
              </DragHandle>
            )}

            {/** Cell Text */}
            <CellContent
              className="cell-content"
              $hasDND={hasDND && !isPinLeft}
              $hasPin={hasPin}
              $hasSort={hasSort}
              $align={colMeta?.align}
              data-testid={`cell-content-${header.column.id}`}
            >
              <span title={headerText}>
                {flexRender(colDef.header, header.getContext())}
              </span>
            </CellContent>

            {/** Filter */}
            {hasFilterableColumn ? columnFilter : null}

            {/** Pinning and Sorting */}
            {(hasPin || hasSort) && !isGroupHeader && (
              <LeftIconContainer
                data-testid={`left-icon-container-${header.column.id}`}
              >
                {/** Pinning */}
                {hasPin && (
                  <IconContainer
                    className={`pin-container ${isPinLeft ? "pin" : "unpin"}`}
                    onClick={() =>
                      header.column.pin(isPinLeft ? false : "left")
                    }
                    data-testid={`column-pin-icon-${header.column.id}`}
                  >
                    <Tooltip
                      type="title"
                      content={`${isPinLeft ? "Unpin" : "Pin"} ${headerText}`}
                    >
                      <Icon icon="push_pin" />
                    </Tooltip>
                  </IconContainer>
                )}
                {hasSort && (
                  <IconContainer
                    className={`sort-container ${getSortDetails().className}`}
                    onClick={header.column.getToggleSortingHandler()}
                    data-testid={`column-sort-icon-${header.column.id}`}
                  >
                    <Tooltip type="title" content={getSortDetails().title}>
                      <Icon
                        icon={
                          {
                            asc: "keyboard_arrow_up",
                            desc: "keyboard_arrow_down",
                          }[header.column.getIsSorted() as string] ??
                          "unfold_more"
                        }
                      />
                    </Tooltip>
                  </IconContainer>
                )}
              </LeftIconContainer>
            )}
          </>
        )}

        {/** Resize handler */}
        {header.column.getCanResize() && !isCustomColumn && (
          <Resizer
            onDoubleClick={() => header.column.resetSize()}
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            className={`column-resizer ${table.options.columnResizeDirection} ${header.column.getIsResizing() ? "is-resizing" : ""}`}
            data-testid={`resizer-${header.column.id}`}
          />
        )}
      </CellContainer>
    );
  },
);
