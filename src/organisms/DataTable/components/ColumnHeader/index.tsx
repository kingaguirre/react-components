import React, { memo, useMemo } from "react";
import { ColumnHeaderContainer, ColumnHeaderGroupContainer } from "./styled";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Cell } from "./Cell";

type Props = {
  table: any;
  columnOrder: string[];
  enableColumnDragging?: boolean;
};

const ColumnHeaderComponent: React.FC<Props> = ({
  table,
  columnOrder,
  enableColumnDragging,
}) => {
  // Header groups are already memoized inside TanStack, but wrap just in case
  const headerGroups = useMemo(() => table.getHeaderGroups(), [table]);

  return (
    <ColumnHeaderContainer className="column-header-container">
      {headerGroups.map((headerGroup: any) => (
        <ColumnHeaderGroupContainer
          className="column-header-group-container"
          key={headerGroup.id}
        >
          <SortableContext
            items={columnOrder}
            strategy={horizontalListSortingStrategy}
          >
            {headerGroup.headers.map((header: any) => (
              <Cell
                key={header.id}
                header={header}
                table={table}
                enableColumnDragging={enableColumnDragging}
              />
            ))}
          </SortableContext>
        </ColumnHeaderGroupContainer>
      ))}
    </ColumnHeaderContainer>
  );
};

export const ColumnHeader = memo(
  ColumnHeaderComponent,
  (a, b) =>
    a.table === b.table &&
    a.enableColumnDragging === b.enableColumnDragging &&
    a.columnOrder === b.columnOrder, // referential equality is fine; table sets this stably
);
