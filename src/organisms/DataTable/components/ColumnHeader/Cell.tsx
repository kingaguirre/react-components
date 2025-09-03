import React, { memo, useMemo } from "react";
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

type Props = {
  header: Header<unknown, unknown>;
  table: any;
  enableColumnDragging?: boolean;
};

const CellComponent: React.FC<Props> = ({
  header,
  table,
  enableColumnDragging,
}) => {
  const colDef: any = header.column.columnDef;
  const colMeta: any = colDef.meta;

  // safer id for DnD: use column.id (accessorKey may be undefined for groups)
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({ id: header.column.id });

  const isCustomColumn = CUSTOM_COLUMN.includes(header.column.id);
  const isGroupHeader = Boolean(colDef.columns?.length);
  const canPin = header.column.getCanPin() && !isCustomColumn;
  const canSort = header.column.getCanSort() && !isCustomColumn;
  const isPinnedLeft = header.column.getIsPinned() === "left";
  const hasDND =
    !!enableColumnDragging && colMeta?.draggable !== false && !isCustomColumn;

  // Scan once for "any filterable" to preserve original behavior
  const hasFilterableColumn = useMemo(
    () => table.getAllLeafColumns().some((c: any) => c.getCanFilter()),
    [table],
  );

  const rawHeader = useMemo(() => {
    const hdr =
      typeof colDef.header === "function"
        ? colDef.header(header.getContext())
        : colDef.header;
    return hdr;
  }, [colDef.header, header]);

  const headerText = typeof rawHeader === "string" ? rawHeader : "";

  // ❗️Use CURRENT sort state for class (so it updates immediately after click)
  const currentSort = header.column.getIsSorted() as "asc" | "desc" | false;
  const sortClass =
    currentSort === "asc"
      ? "sort-asc"
      : currentSort === "desc"
        ? "sort-desc"
        : "no-sort";

  // Keep tooltip title from NEXT sort state
  const nextSort = header.column.getNextSortingOrder();
  const sortTitle =
    nextSort === "asc"
      ? "Sort ascending"
      : nextSort === "desc"
        ? "Sort descending"
        : "Clear sort";

  const columnFilter = header.column.getCanFilter() ? (
    <Filter column={header.column} />
  ) : (
    <CellFilterPlaceholder />
  );

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
          {/* DND */}
          {hasDND && !isGroupHeader && !isPinnedLeft && (
            <DragHandle
              {...attributes}
              {...listeners}
              data-testid={`column-drag-handle-${header.column.id}`}
            >
              <Icon icon="drag_indicator" />
            </DragHandle>
          )}

          {/* Cell Text */}
          <CellContent
            className="cell-content"
            $hasDND={hasDND && !isPinnedLeft}
            $hasPin={canPin}
            $hasSort={canSort}
            $align={colMeta?.align}
            data-testid={`cell-content-${header.column.id}`}
          >
            <span title={headerText}>
              {flexRender(colDef.header, header.getContext())}
            </span>
          </CellContent>

          {/* Filter (only render if any column is filterable to match original behavior) */}
          {hasFilterableColumn
            ? header.isPlaceholder || isGroupHeader
              ? null
              : columnFilter
            : null}

          {/* Pinning and Sorting */}
          {(canPin || canSort) && !isGroupHeader && (
            <LeftIconContainer
              data-testid={`left-icon-container-${header.column.id}`}
            >
              {/* Pin */}
              {canPin && (
                <IconContainer
                  className={`pin-container ${isPinnedLeft ? "pin" : "unpin"}`}
                  onClick={() =>
                    header.column.pin(isPinnedLeft ? false : "left")
                  }
                  data-testid={`column-pin-icon-${header.column.id}`}
                >
                  <Tooltip
                    type="title"
                    content={`${isPinnedLeft ? "Unpin" : "Pin"} ${headerText}`}
                  >
                    <Icon icon="push_pin" />
                  </Tooltip>
                </IconContainer>
              )}

              {/* Sort */}
              {canSort && (
                <IconContainer
                  className={`sort-container ${sortClass}`}
                  onClick={header.column.getToggleSortingHandler()}
                  data-testid={`column-sort-icon-${header.column.id}`}
                >
                  <Tooltip type="title" content={sortTitle}>
                    <Icon
                      icon={
                        currentSort === "asc"
                          ? "keyboard_arrow_up"
                          : currentSort === "desc"
                            ? "keyboard_arrow_down"
                            : "unfold_more"
                      }
                    />
                  </Tooltip>
                </IconContainer>
              )}
            </LeftIconContainer>
          )}
        </>
      )}

      {/* Resize handler */}
      {header.column.getCanResize() && !isCustomColumn && (
        <Resizer
          onDoubleClick={() => header.column.resetSize()}
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={`column-resizer ${table.options.columnResizeDirection} ${
            header.column.getIsResizing() ? "is-resizing" : ""
          }`}
          data-testid={`resizer-${header.column.id}`}
        />
      )}
    </CellContainer>
  );
};

export const Cell = memo(
  CellComponent,
  (a, b) =>
    a.header === b.header &&
    a.table === b.table &&
    a.enableColumnDragging === b.enableColumnDragging,
);
