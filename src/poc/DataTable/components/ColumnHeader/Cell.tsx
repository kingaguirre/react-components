import React from 'react'
import { Header, flexRender } from '@tanstack/react-table'
import { CellContainer, CellContent, Resizer, IconContainer, DragHandle, LeftIconContainer, CellFilterPlaceholder } from '../ColumnHeader/styled'
import { getColumnStyles } from '../../utils'
import { DATA_TABLE_SELECT_ID } from '../SelectColumn'
import { Filter } from '../ColumnHeader/Filter'
import { renderToStaticMarkup } from 'react-dom/server'

// needed for row & cell level scope DnD setup
import { useSortable } from '@dnd-kit/sortable'
import Icon from '@atoms/Icon'
import { DATA_TABLE_ROW_ACTION_ID } from '../RowActionsColumn'

export const Cell = ({ header, table }: {
  header: Header<unknown, unknown>
  table: any
}) => {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({ id: header.column.id })
  const isPinLeft = header.column.getIsPinned() === 'left'
  const colDef = header.column.columnDef
  const colMeta: any = colDef.meta
  // custom column to ignore
  const noDND = header.column.id === DATA_TABLE_SELECT_ID || header.column.id === DATA_TABLE_ROW_ACTION_ID
  const hasDND = true /** TODO: add column setting to control */
  const hasPin = header.column.getCanPin()
  const hasSort = header.column.getCanSort()

  const rawHeader =
    typeof colDef.header === 'function'
      ? colDef.header(header.getContext())
      : colDef.header

  let headerText = rawHeader

  if (React.isValidElement(rawHeader)) {
    // Convert the React element to a static markup string.
    const html = renderToStaticMarkup(rawHeader)
    // Strip HTML tags to extract the plain text.
    headerText = html.replace(/<[^>]+>/g, '')
  }

  return (
    <CellContainer className='cell-container'
      ref={setNodeRef}
      style={{ ...getColumnStyles(header.column, isDragging, transform), width: `${header.getSize()}px` }}
    >
      {/** DND */}
      {!noDND && hasDND && (
        <DragHandle {...attributes} {...listeners}>
          <Icon icon='drag_indicator' />
        </DragHandle>
      )}

      {/** Cell Text */}
      <CellContent
        className='cell-content'
        $hasDND={hasDND && !noDND}
        $hasPin={hasPin}
        $hasSort={hasSort}
        $align={colMeta?.align}
      >
        <span title={headerText}>{flexRender(colDef.header, header.getContext())}</span>
      </CellContent>

      {/** Filter */}
      {header.column.getCanFilter() ? <Filter column={header.column} /> : <CellFilterPlaceholder/>}

      {/** Pinning and Sorting */}
      {(hasPin || hasSort) && (
        <LeftIconContainer>
          {/** Pinning */}
          {hasPin && (
            <IconContainer
              title={`${isPinLeft ? 'Unpin' : 'Pin'} ${headerText}`}
              className={`pin-container ${isPinLeft ? 'pin' : 'unpin'}`}
              onClick={() => header.column.pin(isPinLeft ? false : 'left')}
            >
              <Icon icon='push_pin' />
            </IconContainer>
          )}
          {hasSort && (
            <IconContainer
              className={`sort-container`}
              onClick={header.column.getToggleSortingHandler()}
              title={
                header.column.getCanSort()
                  ? header.column.getNextSortingOrder() === 'asc'
                    ? 'Sort ascending'
                    : header.column.getNextSortingOrder() === 'desc'
                      ? 'Sort descending'
                      : 'Clear sort'
                  : undefined
              }
            >
              <Icon icon={{
                asc: 'keyboard_arrow_up',
                desc: 'keyboard_arrow_down'
              }[header.column.getIsSorted() as string] ?? 'unfold_more'}
              />
            </IconContainer>
          )}
        </LeftIconContainer>
      )}

      {/** Resize handler */}
      {header.column.getCanResize() && (
        <Resizer
          {...{
            onDoubleClick: () => header.column.resetSize(),
            onMouseDown: header.getResizeHandler(),
            onTouchStart: header.getResizeHandler(),
            className: `column-resizer ${table.options.columnResizeDirection
              } ${header.column.getIsResizing() ? 'is-resizing' : ''
              }`
          }}
        />
      )}
    </CellContainer>
  )
}
