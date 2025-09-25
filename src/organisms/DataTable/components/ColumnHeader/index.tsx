import React from "react";
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

export const ColumnHeader: React.FC<Props> = ({
  table,
  columnOrder,
  enableColumnDragging,
}) => {
  // Header groups are already memoized inside TanStack, but wrap just in case
  const headerGroups = table.getHeaderGroups();

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
