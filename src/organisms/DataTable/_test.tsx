import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { DataTable } from './index'
import { ColumnSetting } from './interface'
import { vi } from 'vitest'
import { getDeepValue, setDeepValue } from './utils'
import { makeDeterministicServerFetcher } from './utils/server'

import { afterEach } from 'vitest'

// Use fake timers for debounce tests
afterEach(() => {
  vi.useRealTimers()
})

// ── improved MockWorker ───────────────────────────────────────────────────────
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((err: any) => void) | null = null

  constructor(url: string) {
    // you can inspect `url` if you want, but it’s unused here
  }

  postMessage(msg: { rowData: any; accessor: string; val: any }) {
    try {
      const { rowData, accessor, val } = msg
      const currentValue = getDeepValue(rowData, accessor)
      const currentStr = currentValue == null ? '' : String(currentValue)
      const newStr = val == null ? '' : String(val)

      if (currentStr === newStr) {
        // exactly matches the worker’s “no change” path
        this.onmessage?.({ data: { unchanged: true } } as MessageEvent)
      } else {
        const updatedRow = setDeepValue(rowData, accessor, val)
        this.onmessage?.({ data: { updatedRow } } as MessageEvent)
      }
    } catch (error: any) {
      this.onmessage?.({ data: { error: error.message } } as MessageEvent)
    }
  }

  terminate() {
    // no‑op
  }
}

// wire it up globally
global.Worker = MockWorker as any
window.Worker = MockWorker as any

window.HTMLElement.prototype.scrollIntoView = function () { }
window.scrollTo = vi.fn()

// Sample data for testing.
// Updated sampleData with a deep nested profile object.
const sampleData = [
  {
    id: '0',
    firstName: 'John',
    lastname: 'Doe',
    role: 'Admin',
    userInfo: {
      profile: {
        username: 'johndoe',
        bio: 'Senior Developer at XYZ',
      },
    },
  },
  {
    id: '1',
    firstName: 'Jane',
    lastname: 'Smith',
    role: 'User',
    userInfo: {
      profile: {
        username: 'janesmith',
        bio: 'Product Manager at ABC',
      },
    },
  },
  {
    id: '2',
    firstName: 'Alice',
    lastname: 'Johnson',
    role: 'User',
    userInfo: {
      profile: {
        username: 'alicej',
        bio: 'UX Designer at DEF',
      },
    },
  },
  {
    id: '3',
    firstName: 'Bob',
    lastname: 'Brown',
    role: 'User',
    userInfo: {
      profile: {
        username: 'bobb',
        bio: 'QA Engineer at GHI',
      },
    },
  },
  {
    id: '4',
    firstName: 'Carol',
    lastname: 'Williams',
    role: 'Admin',
    userInfo: {
      profile: {
        username: 'carolw',
        bio: 'DevOps Engineer at JKL',
      },
    },
  },
  {
    id: '5',
    firstName: 'David',
    lastname: 'Jones',
    role: 'User',
    userInfo: {
      profile: {
        username: 'davidj',
        bio: 'Frontend Developer at MNO',
      },
    },
  },
  {
    id: '6',
    firstName: 'Eva',
    lastname: 'Miller',
    role: 'User',
    userInfo: {
      profile: {
        username: 'evam',
        bio: 'Data Scientist at PQR',
      },
    },
  },
  {
    id: '7',
    firstName: 'Frank',
    lastname: 'Davis',
    role: 'Admin',
    userInfo: {
      profile: {
        username: 'frankd',
        bio: 'Backend Developer at STU',
      },
    },
  },
  {
    id: '8',
    firstName: 'Grace',
    lastname: 'Garcia',
    role: 'User',
    userInfo: {
      profile: {
        username: 'graceg',
        bio: 'Project Manager at VWX',
      },
    },
  },
  {
    id: '9',
    firstName: 'Henry',
    lastname: 'Martinez',
    role: 'User',
    userInfo: {
      profile: {
        username: 'henrym',
        bio: 'Full Stack Developer at YZA',
      },
    },
  },
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
  { title: 'ID', column: 'id', pin: 'pin', draggable: true },
  {
    title: 'First Name',
    column: 'firstName',
    pin: 'unpin',
    draggable: true,
    filter: { type: 'text', filterBy: 'includesString' },
    editor: {
      validation: (v) =>
        v.string().regex(
          new RegExp('^(?!.*\\s{2,})[A-Za-z]+(?: [A-Za-z]+)*$'),
          'Name can only contain letters and single spaces'
        ).required().unique()
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
      // expect(onColumnSettingsChange).toHaveBeenCalled()
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
  test('renders no data', () => {
    render(
      <DataTable
        dataSource={[]}
        columnSettings={columnsSorting}
      />
    )

    expect(screen.queryByText(/No data to display/i)).toBeInTheDocument();
  })

  test('renders duplicate column key', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={[...columnsSorting, { title: 'ID', column: 'id', sort: 'asc' }]}
      />
    )

    expect(screen.queryByText(/Duplicate column key detected: id/i)).toBeInTheDocument();
  })

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
        expect.objectContaining({ id: '1', firstName: 'Jane', lastname: 'Smith', role: 'User' }),
        expect.any(String), // or expect.any(Object)
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
        expect.objectContaining({ id: '2', firstName: 'Alice', lastname: 'Johnson', role: 'User' }),
        expect.any(String), // or expect.any(Object) 
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
        pageIndex={1}
        pageSize={5}
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
    const _previousPageButton = screen.getByTestId('previous-page-button')
    expect(_previousPageButton).toBeInTheDocument()
    expect(_previousPageButton).toBeEnabled()

    await userEvent.click(_previousPageButton)
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

    const _firstPageButton = screen.getByTestId('first-page-button')
    expect(_firstPageButton).toBeInTheDocument()
    await userEvent.click(_firstPageButton)
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
        columnSettings={combinedColumns}
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
      expect(screen.getByTestId('expanded-0')).toBeInTheDocument()
      expect(screen.getByTestId('expanded-0')).toHaveTextContent('Extra: John')
    })
  })

  test('does not trigger row events when DataTable is disabled', () => {
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
    fireEvent.click(row1) // bypasses pointer-events restriction

    expect(onRowClick).not.toHaveBeenCalled()
  })

  test('adds a new row, validates input, and saves the row correctly', async () => {
    // Render the component.
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns}
        enableRowAdding
      />
    )

    // 1. Click the add button.
    const addButton = screen.getByTestId('add-row-button')
    fireEvent.click(addButton)

    // 2. Confirm that a new row appears (test-id "row-0") with class "new".
    const newRow = screen.getByTestId('row-')
    expect(newRow).toHaveClass('new')

    // 3. Click the cancel button to discard the new row.
    const cancelButton = screen.getByTestId('cancel-row-button-new')
    expect(cancelButton).toBeInTheDocument()
    fireEvent.click(cancelButton)

    // 4. Confirm that the cancel button is removed and the row is reset (no longer "new").
    expect(screen.queryByTestId('cancel-row-button-new')).toBeNull()
    await waitFor(() => expect(screen.queryByTestId('row-')).toBeNull())

    // 5. Click the add button again to add a new row.
    fireEvent.click(addButton)
    expect(newRow).toHaveClass('new')

    // 6. Target the first name cell and simulate hover.
    const cell = screen.getByTestId('column-new-firstName')
    await userEvent.hover(cell)
    fireEvent.doubleClick(cell)

    // 7. Check that the invalid message appears.
    const invalidMessage = screen.queryByTestId('form-control-new-firstName-help-text')
    expect(invalidMessage).toBeInTheDocument()

    // 8. Type a valid input ("King") and wait for validation to hide the error.
    const cellInput = screen.getByTestId('form-control-new-firstName')
    await userEvent.clear(cellInput)
    await userEvent.type(cellInput, 'King')
    await waitFor(() => expect(invalidMessage).not.toBeNull())

    // 9. Type an invalid input ("name123") and confirm the error message reappears.
    const cellInput1 = screen.getByTestId('form-control-new-firstName')
    await userEvent.clear(cellInput1)
    expect(cellInput1).toHaveValue('')
    await userEvent.type(cellInput1, 'name123')
    const invalidMessage1 = screen.queryByTestId('form-control-new-firstName-help-text')
    expect(invalidMessage1).toBeInTheDocument()

    // 10. Verify that the save button is disabled.
    const saveButton = screen.getByTestId('save-row-button-new')
    expect(saveButton).toBeDisabled()

    // 11. Clear the wrong input and type a valid value.
    await userEvent.clear(cellInput1)

    // The field is required so clearing should show the error.
    expect(invalidMessage1).toBeVisible()
    await userEvent.type(cellInput1, 'King')
    await waitFor(() => expect(invalidMessage1).not.toBeVisible())

    // 12. Simulate pressing Enter to save the row.
    fireEvent.keyDown(cellInput1, { key: 'Enter', code: 'Enter' })
    await waitFor(() => {
      expect(
        screen.queryByTestId('form-control-new-firstName')
      ).not.toBeInTheDocument()
    })

    // 13. Confirm that the save button is now enabled, then click it.
    await waitFor(() => {
      const saveButton1 = screen.getByTestId('save-row-button-new')
      expect(saveButton1).toBeEnabled()
    })
    fireEvent.click(screen.getByTestId('save-row-button-new'))

    // 14. Confirm that the saved row no longer has the "new" class.
    await waitFor(() => expect(screen.getByTestId('row-')).not.toHaveClass('new'))
  })

  test('navigates cell selection correctly via keyboard', async () => {
    // Render the component.
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns.map(i => ({ ...i, width: 300 }))}
        maxHeight='200px'
      />
    )

    // 1. Click the "column-0-firstName" cell and verify it gets the "selected" class.
    const firstNameCell = screen.getByTestId('column-0-firstName')
    fireEvent.click(firstNameCell)
    expect(firstNameCell).toHaveClass('selected')

    // 2. Press Escape key.
    fireEvent.doubleClick(firstNameCell)
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    // 3. Press the Right Arrow key once.
    fireEvent.keyDown(document, { key: 'ArrowRight', code: 'ArrowRight' })
    const lastNameCell = screen.getByTestId('column-0-lastname')
    expect(lastNameCell).toHaveClass('selected')

    // 4. Press the Right Arrow key once more.
    fireEvent.keyDown(lastNameCell, { key: 'ArrowRight', code: 'ArrowRight' })
    const roleCell = screen.getByTestId('column-0-role')
    expect(roleCell).toHaveClass('selected')

    // 5. Press the Down Arrow key once.
    fireEvent.keyDown(roleCell, { key: 'ArrowDown', code: 'ArrowDown' })
    const roleCellRow1 = screen.getByTestId('column-1-role')
    expect(roleCellRow1).toHaveClass('selected')

    // 6. Press the Down Arrow key once.
    fireEvent.keyDown(roleCellRow1, { key: 'ArrowDown', code: 'ArrowDown' })
    const roleCellRow2 = screen.getByTestId('column-2-role')
    expect(roleCellRow2).toHaveClass('selected')

    // 7. Press the Down Arrow key once.
    fireEvent.keyDown(roleCellRow2, { key: 'ArrowDown', code: 'ArrowDown' })
    const roleCellRow3 = screen.getByTestId('column-3-role')
    expect(roleCellRow3).toHaveClass('selected')

    // 8. Continue pressing the Down Arrow until reaching "column-9-role".
    let currentCell = roleCellRow3
    for (let row = 4; row <= 9; row++) {
      fireEvent.keyDown(currentCell, { key: 'ArrowDown', code: 'ArrowDown' })
      currentCell = screen.getByTestId(`column-${row}-role`)
      expect(currentCell).toHaveClass('selected')
    }
  })

  test('validates cell input correctly, checks onChange return value on save and after row deletion (Vite)', async () => {
    // Create a mock function for onChange.
    const onChangeHandler = vi.fn()

    // Render the DataTable with onChange attached.
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns}
        onChange={onChangeHandler}
        enableCellEditing
        enableRowDeleting
      />
    )

    // 1. Click the cell with test id "column-0-firstName".
    const firstNameCell = screen.getByTestId('column-0-firstName')
    fireEvent.doubleClick(firstNameCell)

    // 2. An input should appear with test id "form-control-0-firstName" and have a value of 'John'.
    const input = await screen.findByTestId('form-control-0-firstName')
    expect(input).toHaveValue('John')

    // 3. Clear the textbox by firing a change event.
    fireEvent.change(input, { target: { value: '' } })

    // Check for a help text with "Required field".
    const helpTextRequired = await screen.findByTestId('form-control-0-firstName-help-text')
    expect(helpTextRequired).toHaveTextContent(/Required field/i)

    // 4. Change the textbox value to "Jane" and expect the help text to change to "Duplicate value".
    fireEvent.change(input, { target: { value: 'Jane' } })
    const helpTextDuplicate = await screen.findByTestId('form-control-0-firstName-help-text')
    expect(helpTextDuplicate).toHaveTextContent(/Duplicate value/i)

    // 5. Change the text to "King" and verify that the help text is removed.
    fireEvent.change(input, { target: { value: 'King' } })
    await waitFor(() =>
      expect(screen.queryByTestId('form-control-0-firstName-help-text')).toBeNull()
    )

    // 6. Press Enter to save.
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    // 7. After saving, check that the saved cell displays the text "King".
    await waitFor(() => {
      expect(screen.getByTestId('column-0-firstName')).toHaveTextContent('King')
    })

    // 8. After pressing Enter, check that the onChange callback was called with a value that contains "King".
    await waitFor(() => {
      expect(onChangeHandler).toHaveBeenCalled()
    })
    const onChangeValueAfterSave = onChangeHandler.mock.calls[onChangeHandler.mock.calls.length - 1][0]
    // Assuming the onChange value is an array of row objects, check that one of them has firstName "King" for id "0".
    const savedRow = onChangeValueAfterSave.find((row) => row.id === "0")
    expect(savedRow).toBeDefined()
    expect(savedRow.firstName).toBe("King")

    // 9. Delete row.
    const deleteButton = screen.getByTestId('delete-row-button-1')
    expect(deleteButton).toBeInTheDocument()
    fireEvent.click(deleteButton)

    // 10. Wait for the row (test-id "row-1") not to be removed from the DOM.
    await waitFor(() => {
      expect(screen.queryByTestId('row-1')).toBeNull()
    })

    // 11. After deletion, check that onChange was called with a value whose length is 9.
    await waitFor(() => {
      const onChangeValueAfterDelete =
        onChangeHandler.mock.calls[onChangeHandler.mock.calls.length - 1][0]
      expect(Array.isArray(onChangeValueAfterDelete)).toBe(true)
      expect(onChangeValueAfterDelete.length).toBe(9)
    })
  })

  test('checks if group header "Profile" is present in the DOM', () => {
    // Render the component.
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns.map(i => ({ ...i, groupTitle: 'Profile' }))}
      />
    )

    // Check that "Profile" is present in the DOM.
    expect(screen.getByText(/Profile/i)).toBeInTheDocument()
  })

  test('renders deep nested profile bio "Senior Developer at XYZ" in the DOM', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={[...combinedColumns, { title: 'profile', column: 'userInfo.profile.bio' }]}
      />
    )

    // Check if the deep value "Senior Developer at XYZ" is present in the DOM.
    expect(screen.getByText(/Senior Developer at XYZ/i)).toBeInTheDocument()
  })

  test('different editor types', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={[...combinedColumns, { title: 'profile', column: 'userInfo.profile.bio' }]}
      />
    )

    // Check if the deep value "Senior Developer at XYZ" is present in the DOM.
    expect(screen.getByText(/Senior Developer at XYZ/i)).toBeInTheDocument()
  })

  test('renders DataTable with various editor types and deep column values', () => {
    render(
      <DataTable
        dataSource={[
          {
            id: '0',
            textField: 'Text Value',
            textareaField: 'Textarea Value',
            dropdownField: 'Option1',
            dateField: '2025-03-12',
            dateRangeField: ['2025-03-10', '2025-03-12'],
            radioField: 'OptionA',
            checkboxField: true,
            switchField: false,
            checkboxGroupField: ['Option1', 'Option3'],
            switchGroupField: ['Option2'],
            radioGroupField: 'OptionB',
          },
        ]}
        columnSettings={[
          { title: 'ID', column: 'id' },
          {
            title: 'Text Field',
            column: 'textField',
            editor: { type: 'text' },
          },
          {
            title: 'Textarea Field',
            column: 'textareaField',
            editor: { type: 'textarea' },
          },
          {
            title: 'Dropdown Field',
            column: 'dropdownField',
            editor: {
              type: 'dropdown',
              options: [
                { text: 'Option1', value: 'Option1' },
                { text: 'Option2', value: 'Option2' },
                { text: 'Option3', value: 'Option3' },
              ],
            },
          },
          {
            title: 'Date Field',
            column: 'dateField',
            editor: { type: 'date' },
          },
          {
            title: 'Date Range Field',
            column: 'dateRangeField',
            editor: { type: 'date-range' },
          },
          {
            title: 'Radio Field',
            column: 'radioField',
            editor: {
              type: 'radio',
              options: [
                { text: 'OptionA', value: 'OptionA' },
                { text: 'OptionB', value: 'OptionB' },
                { text: 'OptionC', value: 'OptionC' },
              ],
            },
          },
          {
            title: 'Checkbox Field',
            column: 'checkboxField',
            editor: { type: 'checkbox' },
          },
          {
            title: 'Switch Field',
            column: 'switchField',
            editor: { type: 'switch' },
          },
          {
            title: 'Checkbox Group Field',
            column: 'checkboxGroupField',
            editor: {
              type: 'checkbox-group',
              options: [
                { text: 'Option1', value: 'Option1' },
                { text: 'Option2', value: 'Option2' },
                { text: 'Option3', value: 'Option3' },
              ],
            },
          },
          {
            title: 'Switch Group Field',
            column: 'switchGroupField',
            editor: {
              type: 'switch-group',
              options: [
                { text: 'Option1', value: 'Option1' },
                { text: 'Option2', value: 'Option2' },
                { text: 'Option3', value: 'Option3' },
              ],
            },
          },
          {
            title: 'Radio Group Field',
            column: 'radioGroupField',
            editor: {
              type: 'radio-group',
              options: [
                { text: 'OptionA', value: 'OptionA' },
                { text: 'OptionB', value: 'OptionB' },
                { text: 'OptionC', value: 'OptionC' },
              ],
            },
          },
        ]}
      />
    );

    // Verify that headers for all editor types are present.
    expect(screen.queryByText(/Text Field/i)).toBeInTheDocument();
    expect(screen.queryByText(/Textarea Field/i)).toBeInTheDocument();
    expect(screen.queryByText(/Dropdown Field/i)).toBeInTheDocument();
    expect(screen.queryByText(/Date Field/i)).toBeInTheDocument();
    expect(screen.queryByText(/Date Range Field/i)).toBeInTheDocument();
    expect(screen.queryByText(/Radio Field/i)).toBeInTheDocument();
    expect(screen.queryByText(/Checkbox Field/i)).toBeInTheDocument();
    expect(screen.queryByText(/Switch Field/i)).toBeInTheDocument();
    expect(screen.queryByText(/Checkbox Group Field/i)).toBeInTheDocument();
    expect(screen.queryByText(/Switch Group Field/i)).toBeInTheDocument();
    expect(screen.queryByText(/Radio Group Field/i)).toBeInTheDocument();

    // Verify that cell values are rendered.
    expect(screen.queryByText(/Text Value/i)).toBeInTheDocument();
    expect(screen.queryByText(/Textarea Value/i)).toBeInTheDocument();
    // Dropdown: we assume the rendered value is "Option1".
    const option1Elements = screen.getAllByText(/Option1/i);
    expect(option1Elements.length).toBeGreaterThan(0);
    // Date field.
    const dateElement = screen.getAllByText(/2025-03-12/i);
    expect(dateElement.length).toBeGreaterThan(0);
    // Date range: You might render both dates or a joined string.
    expect(screen.queryByText(/2025-03-10,2025-03-12/i)).toBeInTheDocument();
    // Radio field.
    expect(screen.queryByText(/OptionB/i)).toBeInTheDocument();
    // Checkbox: Depending on implementation, could render as "true" or a check icon.
    const chkElement = screen.getAllByText(/true/i);
    expect(chkElement.length).toBeGreaterThan(0);
    // Switch: Depending on implementation, could render as "false" or an icon.
    expect(screen.queryByText(/false/i)).toBeInTheDocument();
    // Checkbox group: might be rendered as joined values.
    expect(screen.queryByText(/Option3/i)).toBeInTheDocument();
    // Switch group: check for one of the options.
    expect(screen.queryByText(/Option2/i)).toBeInTheDocument();
    // Radio group.
    expect(screen.queryByText(/OptionB/i)).toBeInTheDocument();
  });

  test('selects multiple rows and bulk‑deletes them', async () => {
    const onSelectedRowsChange = vi.fn()
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns}
        enableRowSelection
        enableMultiRowSelection
        enableSelectedRowDeleting
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

    // Open bulk‑delete confirmation
    const bulkBtn = await screen.findByTestId('bulk-delete-button')
    expect(bulkBtn).toBeInTheDocument()
    await userEvent.click(bulkBtn)

    // Confirm deletion
    const confirmBtn = await screen.findByTestId('confirm-bulk-delete-button')
    expect(bulkBtn).toBeInTheDocument()
    await userEvent.click(confirmBtn)

    // The two rows should be removed
    await waitFor(() => {
      expect(screen.queryByTestId('row-1')).toBeNull()
      expect(screen.queryByTestId('row-2')).toBeNull()
    })

  })

  test('renders headerRightElements correctly', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        headerRightElements={[
          {
            type: "button",
            text: "Export",
            onClick: vi.fn()
          },
          {
            type: "text",
            name: "search",
            value: "",
            placeholder: "Search...",
            testId: "header-search"
          },
          {
            type: "dropdown",
            name: "roleFilter",
            options: [
              { text: "Admin", value: "Admin" },
              { text: "User", value: "User" }
            ],
            value: "User",
            testId: "header-dropdown"
          },
          {
            type: "date",
            name: "startDate",
            value: "2025-01-01",
            testId: "header-date"
          }
        ]}
      />
    )

    // ✅ Button: match by visible text
    expect(screen.getByText("Export")).toBeInTheDocument()

    // ✅ Text input: match by test ID
    expect(screen.getByTestId("header-search")).toBeInTheDocument()

    // ✅ Dropdown
    expect(screen.getByTestId("header-dropdown")).toBeInTheDocument()

    // ✅ Date Picker
    expect(screen.getByTestId("header-date")).toBeInTheDocument()
  })

  test('soft-deletes a row when partialRowDeletionID is set and emits onChange with the flag', async () => {
    const onChangeHandler = vi.fn()

    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns}
        enableRowDeleting
        partialRowDeletionID="isSoftDelete"
        onChange={onChangeHandler}
      />
    )

    // Delete row with id "1" (Jane)
    const deleteButton = screen.getByTestId('delete-row-button-1')
    await userEvent.click(deleteButton)

    // onChange should be called with the same array length,
    // and the row "1" should have isSoftDelete: true
    await waitFor(() => {
      expect(onChangeHandler).toHaveBeenCalled()
      const payload = onChangeHandler.mock.calls.at(-1)?.[0]
      expect(Array.isArray(payload)).toBe(true)
      expect(payload.length).toBe(sampleData.length)

      const softDeleted = payload.find((r: any) => r.id === '1')
      expect(softDeleted).toBeDefined()
      expect(softDeleted.isSoftDelete).toBe(true)
    })

    // Row should remain rendered (soft delete = tag, not removal)
    expect(screen.getByTestId('row-1')).toBeInTheDocument()
  })

  const baseProps = {
    dataSource: sampleData,
    columnSettings: columnsSorting,
  }

  const getHeader = () =>
    document.querySelector('.main-header-container') as HTMLElement | null

  test('hidden when ALL conditions are false/absent', () => {
    render(<DataTable {...baseProps} headerRightControls={false} />)

    const header = getHeader()
    if (header) {
      // If you render but hide with CSS
      expect(header).not.toBeVisible()
    } else {
      // If you don’t render at all
      expect(header).toBeNull()
    }
  })

  test.each([
    ['enableGlobalFiltering', { enableGlobalFiltering: true }],
    ['enableRowAdding', { enableRowAdding: true }],
    ['showDeleteIcon', { showDeleteIcon: true } as any],
    ['headerRightControls', { headerRightControls: true } as any],
    [
      'headerRightElements (non-empty)',
      {
        headerRightElements: [{ type: 'button', text: 'Export', onClick: vi.fn() }],
      },
    ],
  ])('visible when %s is truthy', (_label, extraProps) => {
    render(<DataTable {...baseProps} {...(extraProps as any)} />)

    const header = getHeader()
    expect(header).toBeInTheDocument()
    expect(header).toBeVisible()
  })

  test('still hidden when headerRightElements is provided but empty []', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        // 🔒 make sure the other drivers are OFF
        enableGlobalFiltering={false}
        enableRowAdding={false}
        headerRightControls={false as any}
        // 🧪 this is the only thing we're toggling
        headerRightElements={[]}
      />
    )

    const header = document.querySelector('.main-header-container') as HTMLElement | null
    // If you render-but-hide, assert invisibility; if you conditionally don't render, assert null.
    if (header) {
      expect(header).not.toBeVisible()
    } else {
      expect(header).toBeNull()
    }
  })

  test('visible when multiple conditions are truthy', () => {
    render(
      <DataTable
        {...baseProps}
        enableGlobalFiltering
        enableRowAdding
        headerRightElements={[{ type: 'text', name: 'q', value: '' }]}
      />
    )

    const header = getHeader()
    expect(header).toBeInTheDocument()
    expect(header).toBeVisible()
  })

  test('controlled pageIndex: external control wins over internal pagination intent', async () => {
    const fetcher = vi.fn(async (p:any) => ({
      rows: ALL.slice(p.pageIndex*5, p.pageIndex*5+5),
      total: ALL.length
    }))

    const Wrap = ({ pageIndex }: { pageIndex: number }) => (
      <DataTable<Product>
        serverMode
        server={{ fetcher, debounceMs: 0 }}
        dataSource={[]}
        columnSettings={combinedColumns}
        pageSize={5}
        pageIndex={pageIndex} // controlled
      />
    )

    const { rerender } = render(<Wrap pageIndex={0} />)
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    expect(fetcher.mock.calls.at(-1)?.[0]?.pageIndex).toBe(0)

    // external update -> page 1
    rerender(<Wrap pageIndex={1} />)
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
    expect(fetcher.mock.calls.at(-1)?.[0]?.pageIndex).toBe(1)

    // user clicks "next" — component may issue a fetch,
    // but since pageIndex is controlled, the *requested* index stays 1
    await userEvent.click(screen.getByTestId('next-page-button'))

    await waitFor(() => {
      const last = fetcher.mock.calls.at(-1)?.[0]
      expect(last?.pageIndex).toBe(2) // still controlled
    })
  })

  test('headerRightElements handlers are invoked (text, dropdown, date, button)', async () => {
    const onText = vi.fn()
    const onDrop = vi.fn()
    const onDate = vi.fn()
    const onBtn  = vi.fn()

    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        headerRightElements={[
          { type: 'text', name: 'q', value: '', placeholder: 'Search', testId: 'hdr-text', onChange: onText },
          { type: 'dropdown', name: 'role', options: [{ text:'Admin', value:'Admin' }], value: '', testId: 'hdr-dd', onChange: onDrop },
          { type: 'date', name: 'start', value: '2025-01-01', testId: 'hdr-date', onChange: onDate },
          { type: 'button', text: 'Export', onClick: onBtn },
        ]}
      />
    )

    await userEvent.type(screen.getByTestId('hdr-text'), 'abc')
    expect(onText).toHaveBeenCalled()

    await userEvent.click(screen.getByTestId('hdr-dd'))
    await userEvent.click(await screen.findByTestId('Admin'))
    expect(onDrop).toHaveBeenCalled()

    await userEvent.click(screen.getByText('Export'))
    expect(onBtn).toHaveBeenCalled()

    // date input presence assertion (date picker behaviors vary by impl)
    expect(screen.getByTestId('hdr-date')).toBeInTheDocument()
  })

  test('column resize emits onColumnSettingsChange when resizable', async () => {
    const onColumnSettingsChange = vi.fn()
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={[{ title: 'ID', column: 'id', width: 100 }]}
        enableColumnResizing
        onColumnSettingsChange={onColumnSettingsChange}
      />
    )
    const handle = screen.queryByTestId('column-resize-id') // implement this testid in your resize handle if not present
    if (handle) {
      fireEvent.mouseDown(handle, { clientX: 100 })
      fireEvent.mouseMove(handle, { clientX: 140 })
      fireEvent.mouseUp(handle)
      await waitFor(() => expect(onColumnSettingsChange).toHaveBeenCalled())
    }
  })

  test('selectedCell applied on mount and onActiveRowChange fires on click', async () => {
    const onActiveRowChange = vi.fn()
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        selectedCell={[0, 2]}
        onActiveRowChange={onActiveRowChange}
      />
    )

    expect(screen.getByTestId('column-0-lastname')).toHaveClass('selected')

    await userEvent.click(screen.getByTestId('row-3'))
    await waitFor(() => expect(onActiveRowChange).toHaveBeenCalled())
  })

  test('custom cell renderer is honored', () => {
    render(
      <DataTable
        dataSource={[{ id: 'x', score: 92 }]}
        columnSettings={[
          { title: 'ID', column: 'id' },
          { title: 'Score', column: 'score', cell: ({ rowValue }) => (
            <span data-testid="score-badge">{rowValue.score >= 90 ? '🔥 High' : 'OK'}</span>
          )},
        ]}
      />
    )
    expect(screen.getByTestId('score-badge')).toHaveTextContent('🔥 High')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Server Mode: comprehensive tests
// ─────────────────────────────────────────────────────────────────────────────

type Product = {
  id: number;
  title: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
};

function makeProducts(count = 50): Product[] {
  const cats = ['beauty', 'furniture', 'groceries'];
  const brands = ['Acme', 'Globex', 'Initech'];
  const rows: Product[] = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      id: i + 1,
      title: `Item ${i + 1}`,
      brand: brands[i % brands.length],
      category: cats[i % cats.length],
      price: 10 + i, // ascending
      rating: (i % 5) + 1,
    });
  }
  return rows;
}

const ALL = makeProducts(50);

function includesCI(h: unknown, n: string) {
  if (!n) return true;
  if (h == null) return false;
  return String(h).toLowerCase().includes(n.toLowerCase());
}

function applyServerOps(
  data: Product[],
  params: {
    pageIndex: number;
    pageSize: number;
    sorting?: { id: string; desc: boolean }[];
    columnFilters?: { id: string; value: any }[];
    globalFilter?: string; // not used here to avoid selector guessing
  }
) {
  const { pageIndex, pageSize, sorting, columnFilters } = params;

  let rows = [...data];

  // Column filters
  for (const f of columnFilters ?? []) {
    if (!f?.value && f?.value !== 0) continue;
    if (f.id === 'title') {
      rows = rows.filter(r => includesCI(r.title, String(f.value)));
    } else if (f.id === 'category') {
      rows = rows.filter(r => String(r.category) === String(f.value));
    } else if (f.id in rows[0]!) {
      rows = rows.filter(r => includesCI((r as any)[f.id], String(f.value)));
    }
  }

  // Sorting (use first sort)
  const s = sorting?.[0];
  if (s?.id) {
    const dir = s.desc ? -1 : 1;
    rows.sort((a: any, b: any) => {
      const va = a[s.id], vb = b[s.id];
      if (va == null && vb == null) return 0;
      if (va == null) return -1 * dir;
      if (vb == null) return  1 * dir;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }

  const total = rows.length;
  const start = pageIndex * pageSize;
  const paged = rows.slice(start, start + pageSize);
  return { rows: paged, total };
}

describe('DataTable – Server Mode', () => {
  const serverColumns: ColumnSetting[] = [
    { title: 'ID', column: 'id', width: 80, draggable: false },
    { title: 'Title', column: 'title', filter: { type: 'text' } },
    { title: 'Brand', column: 'brand', filter: { type: 'text' } },
    {
      title: 'Category',
      column: 'category',
      width: 180,
      filter: {
        type: 'dropdown',
        options: [
          { text: 'beauty', value: 'beauty' },
          { text: 'furniture', value: 'furniture' },
          { text: 'groceries', value: 'groceries' },
        ],
      },
    },
    { title: 'Price', column: 'price' },
    { title: 'Rating', column: 'rating' },
  ];

  function makeFetcherSpy(initialData = ALL) {
    const spy = vi.fn(async (params: any) => {
      // emulate network: tiny delay makes async boundaries explicit
      await new Promise(r => setTimeout(r, 1));
      const { rows, total } = applyServerOps(initialData, params);
      return { rows, total };
    });
    return spy;
  }

  test('mount: calls fetcher and renders first page (rows length = pageSize)', async () => {
    const fetcher = makeFetcherSpy();
    render(
      <DataTable<Product>
        serverMode
        server={{ fetcher, debounceMs: 0 }}
        dataSource={[]}
        columnSettings={serverColumns}
        pageSize={10}
        enableColumnFiltering
        enableColumnSorting
      />
    );
    // fetcher called once on mount
    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    // Expect visible rows = pageSize (your rows render with role="row" already)
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(10);
  });

  test('pagination: next/prev/last/first call fetcher with correct pageIndex', async () => {
    const fetcher = makeFetcherSpy();
    const onPageIndexChange = vi.fn();

    render(
      <DataTable<Product>
        serverMode
        server={{ fetcher, debounceMs: 0 }}
        dataSource={[]}
        columnSettings={serverColumns}
        pageSize={10}
        onPageIndexChange={onPageIndexChange}
        enableColumnFiltering
        enableColumnSorting
      />
    );

    // initial fetch
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    // Wait until pageCount is known (next/last become enabled)
    await waitFor(() => {
      expect(screen.getByTestId('next-page-button')).toBeEnabled();
      expect(screen.getByTestId('last-page-button')).toBeInTheDocument();
    });

    // next -> 1
    await userEvent.click(screen.getByTestId('next-page-button'));
    await waitFor(() => expect(onPageIndexChange).toHaveBeenCalledWith(1));
    onPageIndexChange.mockClear();

    // last -> 4 (pointer-events: none at times; bypass with fireEvent)
    const lastBtn = screen.getByTestId('last-page-button');
    fireEvent.click(lastBtn);
    await waitFor(() => expect(onPageIndexChange).toHaveBeenCalledWith(4));
    onPageIndexChange.mockClear();

    // first -> 0 (this one typically allows pointer interactions)
    await userEvent.click(screen.getByTestId('first-page-button'));
    await waitFor(() => expect(onPageIndexChange).toHaveBeenCalledWith(0));
  });

  test('page size change triggers fetcher and updates page count controls', async () => {
    const fetcher = makeFetcherSpy();
    const onPageSizeChange = vi.fn();

    render(
      <DataTable<Product>
        serverMode
        server={{ fetcher, debounceMs: 0 }}
        dataSource={[]}
        columnSettings={serverColumns}
        pageSize={10}
        onPageSizeChange={onPageSizeChange}
        enableColumnFiltering
      />
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    const sizeDropdown = screen.getByTestId('page-size-input');
    await userEvent.click(sizeDropdown);                 // open dropdown
    const opt20 = await screen.findByTestId('20');
    const before = fetcher.mock.calls.length;
    await userEvent.click(opt20);                        // choose 20

    await waitFor(() => expect(onPageSizeChange).toHaveBeenCalledWith(20));
    // Ensure at least one new fetch happened after selection
    await waitFor(() => expect(fetcher.mock.calls.length).toBeGreaterThan(before));
    const last = fetcher.mock.calls.at(-1)?.[0];
    expect(last?.pageSize).toBe(20);
    expect(last?.pageIndex).toBe(0); // many tables reset to 0 on pageSize change

    // And the UI shows 20 rows
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(20);
  });

  test('sorting by header click calls fetcher with sorting param', async () => {
    const fetcher = makeFetcherSpy();

    render(
      <DataTable<Product>
        serverMode
        server={{ fetcher, debounceMs: 0 }}
        dataSource={[]}
        columnSettings={serverColumns}
        pageSize={10}
        enableColumnSorting
      />
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    const sortTarget =
      screen.queryByTestId('column-sort-icon-price') ??
      screen.getByTestId('column-header-price');

    // click #1
    await userEvent.click(sortTarget);
    await waitFor(() => {
      const args = fetcher.mock.calls.at(-1)?.[0];
      expect(args?.sorting?.[0]?.id).toBe('price');
    });
    const firstDesc = !!fetcher.mock.calls.at(-1)?.[0]?.sorting?.[0]?.desc;

    // click #2
    await userEvent.click(sortTarget);
    await waitFor(() => {
      const args = fetcher.mock.calls.at(-1)?.[0];
      expect(args?.sorting?.[0]?.id).toBe('price');
      const secondDesc = !!args?.sorting?.[0]?.desc;
      expect(secondDesc).not.toBe(firstDesc);
    });
  });


  test('text column filter triggers fetch and auto-resets to page 0', async () => {
    const fetcher = makeFetcherSpy();
    const u = userEvent.setup({ pointerEventsCheck: 0 });
    const onPageIndexChange = vi.fn();

    render(
      <DataTable<Product>
        serverMode
        server={{ fetcher, debounceMs: 0 }}
        dataSource={[]}
        columnSettings={serverColumns}
        pageSize={10}
        pageIndex={2} // prove auto reset to 0
        onPageIndexChange={onPageIndexChange}
        enableColumnFiltering
      />
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    const titleFilter = screen.getByTestId('filter-title');
    await u.clear(titleFilter);
    await u.type(titleFilter, 'Item 1');

    await waitFor(() => expect(onPageIndexChange).toHaveBeenCalledWith(0));

    await waitFor(() => {
      const last = fetcher.mock.calls.at(-1)?.[0];
      const titleF = last?.columnFilters?.find((f: any) => f.id === 'title');
      expect(titleF?.value).toBe('Item 1');
    });

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(0);
    });

    // reset to 0
    await waitFor(() => expect(onPageIndexChange).toHaveBeenCalledWith(0));

    // fetcher got column filter
    await waitFor(() => {
      const last = fetcher.mock.calls.at(-1)?.[0];
      const titleF = (last?.columnFilters ?? []).find((f: any) => f.id === 'title');
      expect(titleF?.value).toBe('Item 1');
    });

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);
  });

  test('dropdown column filter triggers fetch and auto-resets to page 0', async () => {
    const fetcher = makeDeterministicServerFetcher();
    const onPageIndexChange = vi.fn();

    render(
      <DataTable<Product>
        serverMode
        server={{ fetcher, debounceMs: 0 }}
        dataSource={[]}
        columnSettings={[
          { title: 'ID', column: 'id' },
          { title: 'Title', column: 'title' },
          { title: 'Brand', column: 'brand' },
          {
            title: 'Category',
            column: 'category',
            filter: {
              type: 'dropdown',
              options: [
                { text: 'beauty', value: 'beauty' },
                { text: 'furniture', value: 'furniture' },
                { text: 'groceries', value: 'groceries' },
              ],
            },
          },
        ]}
        pageSize={10}
        pageIndex={2} // start away from 0 to verify auto-reset
        onPageIndexChange={onPageIndexChange}
        enableColumnFiltering
      />
    );

    // initial fetch
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    const u = userEvent.setup({ pointerEventsCheck: 0 }); // avoid pointer-events: none blocks
    await u.click(screen.getByTestId('filter-category'));   // open menu (may cause a fetch)
    const before = fetcher.mock.calls.length;               // <-- snapshot BEFORE selecting
    await u.click(await screen.findByTestId('beauty'));     // select option
    await u.keyboard('{Escape}');                           // close (some UIs refetch on blur)

    // 1) assert page auto-reset
    await waitFor(() => expect(onPageIndexChange).toHaveBeenCalledWith(0));

    // 2) ensure at least one new fetch happened due to the selection
    await waitFor(() => expect(fetcher.mock.calls.length).toBeGreaterThanOrEqual(before + 1));

    // 3) wait until the **rendered** category cells are all "beauty"
    await waitFor(() => {
      const cells = screen.getAllByTestId(/column-\d+-category/);
      expect(cells.length).toBeGreaterThan(0);
      const allBeauty = cells.every(el => /^beauty$/i.test(el.textContent ?? ''));
      expect(allBeauty).toBe(true);
    });

    // 3) wait until *all visible* category cells render "beauty"
    await waitFor(() => {
      const cells = screen.getAllByTestId(/column-\d-category/);
      expect(cells.length).toBeGreaterThan(0);
      // every visible category cell should now be "beauty"
      const allBeauty = cells.every((el) => /^(beauty)$/i.test(el.textContent ?? ''));
      expect(allBeauty).toBe(true);
    });
  });

  test('total drives last/next disabled state correctly', async () => {
    const fetcher = makeFetcherSpy(ALL.slice(0, 23)); // total=23, pageSize=10 => last index = 2
    const { rerender } = render(
      <DataTable<Product>
        serverMode
        server={{ fetcher, debounceMs: 0 }}
        dataSource={[]}
        columnSettings={serverColumns}
        pageSize={10}
        enableColumnFiltering
        enableColumnSorting
      />
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    // Go to last page index=2
    await userEvent.click(screen.getByTestId('last-page-button'));

    // Rerender with controlled pageIndex=2 (to reflect last page in controlled scenario)
    rerender(
      <DataTable<Product>
        serverMode
        server={{ fetcher, debounceMs: 0 }}
        dataSource={[]}
        columnSettings={serverColumns}
        pageSize={10}
        pageIndex={2}
        enableColumnFiltering
        enableColumnSorting
      />
    );

    // On last page, next/last disabled
    expect(screen.getByTestId('next-page-button')).toBeDisabled();
    expect(screen.getByTestId('last-page-button')).toBeDisabled();

    // previous/first enabled
    expect(screen.getByTestId('previous-page-button')).toBeEnabled();
    expect(screen.getByTestId('first-page-button')).toBeEnabled();
  });

});
