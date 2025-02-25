import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { DataTable } from './index'
import { ColumnSetting } from './interface'
import { vi } from 'vitest'

window.HTMLElement.prototype.scrollIntoView = function() {}

// Sample data for testing.
const sampleData = [
  { id: '1', firstName: 'John', lastname: 'Doe', role: 'Admin' },
  { id: '2', firstName: 'Jane', lastname: 'Smith', role: 'User' },
  { id: '3', firstName: 'Alice', lastname: 'Johnson', role: 'User' },
  { id: '4', firstName: 'Bob', lastname: 'Brown', role: 'User' },
  { id: '5', firstName: 'Carol', lastname: 'Williams', role: 'Admin' },
  { id: '6', firstName: 'David', lastname: 'Jones', role: 'User' },
  { id: '7', firstName: 'Eva', lastname: 'Miller', role: 'User' },
  { id: '8', firstName: 'Frank', lastname: 'Davis', role: 'Admin' },
  { id: '9', firstName: 'Grace', lastname: 'Garcia', role: 'User' },
  { id: '10', firstName: 'Henry', lastname: 'Martinez', role: 'User' },
]

// Column definitions for various interactions.

// --- For Pinning ---
const columnsPinning: ColumnSetting[] = [
  { title: 'ID', column: 'id', pin: 'pin' },
  { title: 'First Name', column: 'firstName', pin: 'unpin' },
  { title: 'Last Name', column: 'lastname', pin: false },
  { title: 'Role', column: 'role' },
]

// --- For Dragging ---
const columnsDragging: ColumnSetting[] = [
  { title: 'ID', column: 'id', draggable: true },
  { title: 'First Name', column: 'firstName', draggable: true },
  { title: 'Last Name', column: 'lastname', draggable: false },
  { title: 'Role', column: 'role', draggable: undefined },
]

// --- For Sorting ---
const columnsSorting: ColumnSetting[] = [
  { title: 'ID', column: 'id', sort: 'asc' },
  { title: 'First Name', column: 'firstName', sort: 'desc' },
  { title: 'Last Name', column: 'lastname', sort: false },
  { title: 'Role', column: 'role' },
]

// --- For Filtering ---
const columnsFiltering: ColumnSetting[] = [
  { title: 'ID', column: 'id', filter: false },
  {
    title: 'First Name',
    column: 'firstName',
    filter: { type: 'text', filterBy: 'includesString' }
  },
  {
    title: 'Last Name',
    column: 'lastname',
    filter: { type: 'text', filterBy: 'includesStringSensitive' }
  },
  {
    title: 'Role',
    column: 'role',
    filter: {
      type: 'dropdown',
      options: [
        { value: 'Admin', text: 'Admin' },
        { value: 'User', text: 'User' }
      ]
    }
  },
]

// Combined columns definition that includes pinning, sorting, and dragging properties.
const combinedColumns: ColumnSetting[] = [
  { title: 'ID', column: 'id', pin: 'pin', sort: 'asc', draggable: true },
  {
    title: 'First Name',
    column: 'firstName',
    pin: 'unpin',
    sort: 'desc',
    draggable: true,
    filter: { type: 'text', filterBy: 'includesString' },
    editor: {
      validation: (v) =>
        v.string().regex(
          new RegExp('^(?!.*\\s{2,})[A-Za-z]+(?: [A-Za-z]+)*$'),
          'Name can only contain letters and single spaces'
        )
    }
  },
  { title: 'Last Name', column: 'lastname', pin: false, sort: false, draggable: false },
  { title: 'Role', column: 'role' }, // No explicit interactive properties.
]

describe('DataTable Column Interactions', () => {
  test('renders pinned columns with proper markers and toggles pinning', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsPinning}
        enableColumnPinning
      />
    )
    // For column 'id' which is pinned, expect the element to have a 'pin' class.
    const pinnedIcon = screen.getByTestId('column-pin-icon-id')
    expect(pinnedIcon).toBeInTheDocument()
    expect(pinnedIcon).toHaveClass('pin')

    // For column 'firstName' which is unpinned, expect the element to have a 'unpin' class.
    const unpinnedIcon = screen.getByTestId('column-pin-icon-firstName')
    expect(unpinnedIcon).toBeInTheDocument()
    expect(unpinnedIcon).toHaveClass('unpin')

    // For column 'lastname', pin is false, so the pin icon should not be rendered.
    const falsePinIcon = screen.queryByTestId('column-pin-icon-lastname')
    expect(falsePinIcon).toBeNull()

    // Simulate a click on the pinned icon to toggle pinning.
    await userEvent.click(pinnedIcon)
    // Wait for the component to update.
    await waitFor(() => {
      expect(screen.getByTestId('column-pin-icon-id')).toHaveClass('unpin')
    })
  })

  test('renders draggable columns with appropriate attributes', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsDragging}
        enableColumnDragging
      />
    )
    // For column 'id' which is draggable (true), check drag handle attribute.
    const dragHandleId = screen.getByTestId('column-drag-handle-id')
    expect(dragHandleId).toBeInTheDocument()

    // For column 'lastname' which is explicitly not draggable (false), check attribute.
    const dragHandleLastname = screen.queryByTestId('column-drag-handle-lastname')
    expect(dragHandleLastname).toBeNull()

    // For column 'role' which is undefined, you can check for existence based on default behavior.
    const dragHandleRole = screen.getByTestId('column-drag-handle-role')
    expect(dragHandleRole).toBeInTheDocument()
  })

  test('allows sorting when header is clicked', async () => {
    const onColumnSettingsChange = vi.fn()
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        enableColumnSorting
        onColumnSettingsChange={onColumnSettingsChange}
      />
    )
    // Assume header for 'First Name' has data-testid 'column-sort-icon-firstName'
    const sortIconId = screen.getByTestId('column-sort-icon-id')
    expect(sortIconId).toBeInTheDocument()
    expect(sortIconId).toHaveClass('sort-asc')

    const sortIconFirstName = screen.getByTestId('column-sort-icon-firstName')
    expect(sortIconFirstName).toBeInTheDocument()
    expect(sortIconFirstName).toHaveClass('sort-desc')

    const sortIconLastName = screen.queryByTestId('column-sort-icon-lastname')
    expect(sortIconLastName).toBeNull()

    // Columns without sort should default to have short
    const sortIconRole = screen.getByTestId('column-sort-icon-role')
    expect(sortIconRole).toBeInTheDocument()
    expect(sortIconId).toHaveClass('sort-asc')

    // Simulate a click on the pinned icon to toggle pinning.
    await userEvent.click(sortIconId)
    // Wait for the component to update.
    await waitFor(() => {
      expect(sortIconId).toHaveClass('sort-desc')
      expect(onColumnSettingsChange).toHaveBeenCalled()
    })
  })

  test('does not render interactive elements when enableColumnPinning, enableColumnSorting, enableColumnDragging and enableColumnFiltering are false', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns}
        enableColumnPinning={false}
        enableColumnSorting={false}
        enableColumnDragging={false}
        enableColumnFiltering={false}
      />
    )
  
    // Verify that no pin icons are rendered.
    expect(screen.queryByTestId('column-pin-icon-id')).toBeNull()
    expect(screen.queryByTestId('column-pin-icon-firstName')).toBeNull()
    expect(screen.queryByTestId('column-pin-icon-lastname')).toBeNull()
    expect(screen.queryByTestId('column-pin-icon-role')).toBeNull()
  
    // Verify that no drag handles are rendered.
    expect(screen.queryByTestId('column-drag-handle-id')).toBeNull()
    expect(screen.queryByTestId('column-drag-handle-firstName')).toBeNull()
    expect(screen.queryByTestId('column-drag-handle-lastname')).toBeNull()
    expect(screen.queryByTestId('column-drag-handle-role')).toBeNull()
  
    // Verify that no sort icons are rendered.
    expect(screen.queryByTestId('column-sort-icon-id')).toBeNull()
    expect(screen.queryByTestId('column-sort-icon-firstName')).toBeNull()
    expect(screen.queryByTestId('column-sort-icon-lastname')).toBeNull()
    expect(screen.queryByTestId('column-sort-icon-role')).toBeNull()

    // Verify that filter for name are not rendered
    expect(screen.queryByTestId('filter-firstName')).toBeNull()
  })

  test('filters rows based on column filter input', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsFiltering}
        enableColumnFiltering
      />
    )
    // Assume the filter input for 'First Name' has data-testid 'filter-firstName'
    const firstNameFilter = screen.getByTestId('filter-firstName')
    await userEvent.clear(firstNameFilter)
    await userEvent.type(firstNameFilter, 'Jane')
  
    // Wait for the filtering to update the UI.
    await waitFor(() => {
      expect(screen.getByText('Jane')).toBeInTheDocument()
      expect(screen.queryByText('John')).toBeNull()
      expect(screen.queryByText('Alice')).toBeNull()
    })
  })

  test('filters last name case sensitively', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsFiltering}
        enableColumnFiltering
      />
    )
    // Assume the filter input for 'Last Name' has data-testid 'filter-lastname'
    const lastnameFilter = screen.getByTestId('filter-lastname')
    await userEvent.clear(lastnameFilter)
    // Type lower-case 'doe' which should not match 'Doe' if case sensitive.
    await userEvent.type(lastnameFilter, 'doe')
    await waitFor(() => {
      expect(screen.queryByText('Doe')).toBeNull()
    })
  
    // Clear and type the correct case 'Doe'
    await userEvent.clear(lastnameFilter)
    await userEvent.type(lastnameFilter, 'Doe')
    await waitFor(() => {
      expect(screen.getByText('Doe')).toBeInTheDocument()
    })
  })
  
  test('filters rows based on dropdown filter for role', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsFiltering}
        enableColumnFiltering
      />
    )
  
    // Assume the Role filter is rendered as a dropdown with data-testid 'filter-role'
    const roleFilter = screen.getByTestId('filter-role')
    await roleFilter.focus()
    await userEvent.click(roleFilter)
  
    // Wait for the dropdown options to appear
    const adminOption = await waitFor(() => screen.getByTestId('Admin'), { timeout: 3000 })
    expect(adminOption).toBeInTheDocument()
    await userEvent.click(adminOption)
  
    // Wait for the filtering to update.
    await waitFor(() => {
      // Only the row with role 'Admin' should be visible.
      const adminElements = screen.getAllByText('Admin')
      expect(adminElements.length).toBeGreaterThan(0)
      // Rows for 'User' roles should not be visible.
      expect(screen.queryByText('User')).toBeNull()
    })
  })
})

describe('DataTable Row Features and Events', () => {
  test('renders rows with correct pagination (pageSize and pageIndex)', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={0}  // Page index starts at 0.
        pageSize={2}
      />
    )
    // Assume each row has role='row' header row + 2 data rows.
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBe(2)
  })

  test('renders disabled rows with correct class', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        disabledRows={['2']}
      />
    )
    // Assume disabled rows have data-testid 'row-{rowId}' and a class 'disabled'
    const disabledRow = screen.getByTestId('row-2')
    expect(disabledRow).toHaveClass('disabled')
  })

  test('renders selected rows with proper markers', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        selectedRows={['1', '2']}
      />
    )
    // Assume selected rows have a class 'selected'
    const row1 = screen.getByTestId('row-1')
    const row3 = screen.getByTestId('row-2')
    expect(row1).toHaveClass('selected')
    expect(row3).toHaveClass('selected')
  })

  test('highlights the active row correctly', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        activeRow='2'
      />
    )
    // Assume the active row gets a class 'active' and data-testid 'row-2'
    const activeRow = screen.getByTestId('row-2')
    expect(activeRow).toHaveClass('active')
  })

  test('calls onRowClick when a row is clicked', async () => {
    const onRowClick = vi.fn()
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        onRowClick={onRowClick}
      />
    )
  
    // Assume each row is rendered with data-testid='row-{id}'
    const row1 = screen.getByTestId('row-1')
    await userEvent.click(row1)
  
    await waitFor(() => {
      expect(onRowClick).toHaveBeenCalled()
      expect(onRowClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: '2', firstName: 'Jane', lastname: 'Smith', role: 'User' }),
        expect.any(Object) // or expect.any(MouseEvent)
      )
    })

  })

  test('calls onRowDoubleClick when a row is double-clicked', async () => {
    const onRowDoubleClick = vi.fn()
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        onRowDoubleClick={onRowDoubleClick}
      />
    )
    
     // Assume each row is rendered with data-testid='row-{id}'
     const row2 = screen.getByTestId('row-2')
     await userEvent.dblClick(row2)
   
     await waitFor(() => {
       expect(onRowDoubleClick).toHaveBeenCalled()
       expect(onRowDoubleClick).toHaveBeenCalledWith(
         expect.objectContaining({ id: '3', firstName: 'Alice', lastname: 'Johnson', role: 'User' }),
         expect.any(Object) // or expect.any(MouseEvent)
       )
     })
  })

  test('calls onPageIndexChange when page index inputis changed', async () => {
    const onPageIndexChange = vi.fn()
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={2}
        onPageIndexChange={onPageIndexChange}
      />
    )
    // Assume there is a page size input with data-testid 'page-size-input'
    const pageIndexInput = screen.getByTestId('page-index-input')
    // Clearing input will turn the page index to default 1
    await userEvent.clear(pageIndexInput)

    await waitFor(() => {
      expect(onPageIndexChange).toHaveBeenCalledWith(0)
    })
  })

  test('calls onPageIndexChange for all pagination controls and disables buttons accordingly', async () => {
    const onPageIndexChange = vi.fn()
    const { rerender } = render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={0}       // Start at first page (index 0)
        pageSize={3}        // With 10 items and pageSize 3, last page index should be 3
        onPageIndexChange={onPageIndexChange}
      />
    )
  
    // --- Check initial state on the first page (pageIndex 0) ---
    const firstPageButton = screen.getByTestId('first-page-button')
    const previousPageButton = screen.getByTestId('previous-page-button')
    const nextPageButton = screen.getByTestId('next-page-button')
    const lastPageButton = screen.getByTestId('last-page-button')
  
    expect(firstPageButton).toBeInTheDocument()
    expect(previousPageButton).toBeInTheDocument()
    expect(nextPageButton).toBeInTheDocument()
    expect(lastPageButton).toBeInTheDocument()
  
    // First page: first and previous should be disabled
    expect(firstPageButton).toBeDisabled()
    expect(previousPageButton).toBeDisabled()
  
    // Next and last should be enabled on first page.
    expect(nextPageButton).toBeEnabled()
    expect(lastPageButton).toBeEnabled()
  
    // --- Test Next Page Button ---
    // Click next: from pageIndex 0 -> 1.
    await userEvent.click(nextPageButton)
    await waitFor(() => {
      expect(onPageIndexChange).toHaveBeenCalledWith(1)
    })
    onPageIndexChange.mockClear()
  
    // --- Test Previous Page Button ---
    // Rerender with pageIndex=2 so that clicking previous goes to index 1.
    rerender(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={2}
        pageSize={3}
        onPageIndexChange={onPageIndexChange}
      />
    )
  
    // Now that we are not on the first page, first and previous should be enabled.
    expect(screen.getByTestId('first-page-button')).toBeEnabled()
    expect(screen.getByTestId('previous-page-button')).toBeEnabled()
  
    await userEvent.click(screen.getByTestId('previous-page-button'))
    await waitFor(() => {
      expect(onPageIndexChange).toHaveBeenCalledWith(1)
    })
    onPageIndexChange.mockClear()
  
    // --- Test First Page Button ---
    // Rerender with pageIndex=2 so that clicking first goes to index 0.
    rerender(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={2}
        pageSize={3}
        onPageIndexChange={onPageIndexChange}
      />
    )
  
    await userEvent.click(screen.getByTestId('first-page-button'))
    await waitFor(() => {
      expect(onPageIndexChange).toHaveBeenCalledWith(0)
    })
    onPageIndexChange.mockClear()
  
    // Rerender with pageIndex=0 to reflect first page
    rerender(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={0}
        pageSize={3}
        onPageIndexChange={onPageIndexChange}
      />
    )
  
    // Now, first and previous should be disabled again.
    expect(screen.getByTestId('first-page-button')).toBeDisabled()
    expect(screen.getByTestId('previous-page-button')).toBeDisabled()
  
    // --- Test Last Page Button ---
    // Rerender with pageIndex=0 so that clicking last goes to index 3.
    rerender(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={0}
        pageSize={3}
        onPageIndexChange={onPageIndexChange}
      />
    )
  
    await userEvent.click(screen.getByTestId('last-page-button'))
    await waitFor(() => {
      expect(onPageIndexChange).toHaveBeenCalledWith(3)
    })
    onPageIndexChange.mockClear()
  
    // Rerender with pageIndex=3 to reflect the last page
    rerender(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={3}
        pageSize={3}
        onPageIndexChange={onPageIndexChange}
      />
    )
  
    // On the last page, next and last should be disabled.
    expect(screen.getByTestId('next-page-button')).toBeDisabled()
    expect(screen.getByTestId('last-page-button')).toBeDisabled()
  })
  
  test('calls onSelectedRowsChange when row selection changes', async () => {
    const onSelectedRowsChange = vi.fn()
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        enableRowSelection
        enableMultiRowSelection
        onSelectedRowsChange={onSelectedRowsChange}
      />
    )

    // Assume each row has a selection checkbox with data-testid 'select-row-{id}'
    const checkboxRow1 = screen.getByTestId('select-row-1')
    await userEvent.click(checkboxRow1)
    await waitFor(() => {
      expect(onSelectedRowsChange).toHaveBeenCalledWith(['1'])
    })
  
    // Toggle another row.
    const checkboxRow2 = screen.getByTestId('select-row-2')
    await userEvent.click(checkboxRow2)
    await waitFor(() => {
      expect(onSelectedRowsChange).toHaveBeenCalledWith(['1', '2'])
    })
  
    // Select all: Assume header checkbox has data-testid 'select-row-header'
    const checkboxHeader = screen.getByTestId('select-row-header')
    await userEvent.click(checkboxHeader)
    await waitFor(() => {
      expect(onSelectedRowsChange).toHaveBeenCalledWith(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
    })
  })

  test('retains disabled row selection when toggling select all', async () => {
    const onSelectedRowsChange = vi.fn()
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        enableRowSelection
        enableMultiRowSelection
        // Assume row with id '2' is disabled.
        disabledRows={['2']}
        // Initially, no rows are selected.
        selectedRows={['1', '2']}
        onSelectedRowsChange={onSelectedRowsChange}
      />
    )
  
    // Assume header checkbox has data-testid 'select-row-header'
    const checkboxHeader = screen.getByTestId('select-row-header')

    // First click: select all.
    await userEvent.click(checkboxHeader)

    await waitFor(() => {
      // All rows should be selected (assuming sampleData has 10 rows with IDs '1' to '10')
      expect(onSelectedRowsChange).toHaveBeenCalledWith(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
    })

    // Second click: unselect all selectable rows, leaving disabled rows selected.
    await userEvent.click(checkboxHeader)

    await waitFor(() => {
      // Expect that only the disabled row remains selected.
      // In this example, row with id '2' is disabled.
      const disabledRow = screen.getByTestId('row-2')
      expect(disabledRow).toHaveClass('disabled')
      expect(disabledRow).toHaveClass('selected')
    })
    
  })

  test('renders expanded row content when expandedRowContent is provided', async () => {
    // Provide a simple expanded row content renderer.
    const expandedContent = (rowData) => <div data-testid={`expanded-${rowData.id}`}>Extra: {rowData.firstName}</div>
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        expandedRowContent={expandedContent}
      />
    )
    // Assume each row has an 'expand' button with data-testid 'expand-row-{id}'
    const expandButtonRow1 = screen.getByTestId('expand-row-0')
    userEvent.click(expandButtonRow1)
    await waitFor(() => {
      expect(screen.getByTestId('expanded-1')).toBeInTheDocument()
      expect(screen.getByTestId('expanded-1')).toHaveTextContent('Extra: John')
    })
  })

  test('does not trigger row events when DataTable is disabled', async () => {
    const onRowClick = vi.fn()
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        onRowClick={onRowClick}
        disabled={true}
      />
    )
    const row1 = screen.getByTestId('row-1')
    await userEvent.click(row1)
    // Disabled table should not trigger any row click events.
    expect(onRowClick).not.toHaveBeenCalled()
  })
  
})
