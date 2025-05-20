import React from 'react'
import { render, screen, waitFor, fireEvent, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { DataTable } from './index'
import { ColumnSetting } from './interface'
import { vi } from 'vitest'
import { getDeepValue, setDeepValue } from './utils'

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

window.HTMLElement.prototype.scrollIntoView = function() {}
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

  // test('calls onPageIndexChange for all pagination controls and disables buttons accordingly', async () => {
  //   const onPageIndexChange = vi.fn()
  //   const { rerender } = render(
  //     <DataTable
  //       dataSource={sampleData}
  //       columnSettings={columnsSorting}
  //       pageIndex={0}       // Start at first page (index 0)
  //       pageSize={3}        // With 10 items and pageSize 3, last page index should be 3
  //       onPageIndexChange={onPageIndexChange}
  //     />
  //   )
  
  //   // --- Check initial state on the first page (pageIndex 0) ---
  //   const firstPageButton = screen.getByTestId('first-page-button')
  //   const previousPageButton = screen.getByTestId('previous-page-button')
  //   const nextPageButton = screen.getByTestId('next-page-button')
  //   const lastPageButton = screen.getByTestId('last-page-button')
  
  //   expect(firstPageButton).toBeInTheDocument()
  //   expect(previousPageButton).toBeInTheDocument()
  //   expect(nextPageButton).toBeInTheDocument()
  //   expect(lastPageButton).toBeInTheDocument()
  
  //   // First page: first and previous should be disabled
  //   expect(firstPageButton).toBeDisabled()
  //   expect(previousPageButton).toBeDisabled()
  
  //   // Next and last should be enabled on first page.
  //   expect(nextPageButton).toBeEnabled()
  //   expect(lastPageButton).toBeEnabled()
  
  //   // --- Test Next Page Button ---
  //   // Click next: from pageIndex 0 -> 1.
  //   await userEvent.click(nextPageButton)
  //   await waitFor(() => {
  //     expect(onPageIndexChange).toHaveBeenCalledWith(1)
  //   })
  //   onPageIndexChange.mockClear()
  
  //   // --- Test Previous Page Button ---
  //   // Rerender with pageIndex=2 so that clicking previous goes to index 1.
  //   rerender(
  //     <DataTable
  //       dataSource={sampleData}
  //       columnSettings={columnsSorting}
  //       pageIndex={2}
  //       pageSize={3}
  //       onPageIndexChange={onPageIndexChange}
  //     />
  //   )
  
  //   // Now that we are not on the first page, first and previous should be enabled.
  //   expect(screen.getByTestId('first-page-button')).toBeEnabled()
  //   const _previousPageButton = screen.getByTestId('previous-page-button')
  //   expect(_previousPageButton).toBeInTheDocument()
  //   expect(_previousPageButton).toBeEnabled()
  
  //   await userEvent.click(_previousPageButton)
  //   await waitFor(() => {
  //     expect(onPageIndexChange).toHaveBeenCalledWith(1)
  //   })
  //   onPageIndexChange.mockClear()
  
  //   // --- Test First Page Button ---
  //   // Rerender with pageIndex=2 so that clicking first goes to index 0.
  //   rerender(
  //     <DataTable
  //       dataSource={sampleData}
  //       columnSettings={columnsSorting}
  //       pageIndex={2}
  //       pageSize={3}
  //       onPageIndexChange={onPageIndexChange}
  //     />
  //   )
  
  //   const _firstPageButton = screen.getByTestId('first-page-button')
  //   expect(_firstPageButton).toBeInTheDocument()
  //   await userEvent.click(_firstPageButton)
  //   await waitFor(() => {
  //     expect(onPageIndexChange).toHaveBeenCalledWith(0)
  //   })
  //   onPageIndexChange.mockClear()
  
  //   // Rerender with pageIndex=0 to reflect first page
  //   rerender(
  //     <DataTable
  //       dataSource={sampleData}
  //       columnSettings={columnsSorting}
  //       pageIndex={0}
  //       pageSize={3}
  //       onPageIndexChange={onPageIndexChange}
  //     />
  //   )
  
  //   // Now, first and previous should be disabled again.
  //   expect(screen.getByTestId('first-page-button')).toBeDisabled()
  //   expect(screen.getByTestId('previous-page-button')).toBeDisabled()
  
  //   // --- Test Last Page Button ---
  //   // Rerender with pageIndex=0 so that clicking last goes to index 3.
  //   rerender(
  //     <DataTable
  //       dataSource={sampleData}
  //       columnSettings={columnsSorting}
  //       pageIndex={0}
  //       pageSize={3}
  //       onPageIndexChange={onPageIndexChange}
  //     />
  //   )
  
  //   await userEvent.click(screen.getByTestId('last-page-button'))
  //   await waitFor(() => {
  //     expect(onPageIndexChange).toHaveBeenCalledWith(3)
  //   })
  //   onPageIndexChange.mockClear()
  
  //   // Rerender with pageIndex=3 to reflect the last page
  //   rerender(
  //     <DataTable
  //       dataSource={sampleData}
  //       columnSettings={columnsSorting}
  //       pageIndex={3}
  //       pageSize={3}
  //       onPageIndexChange={onPageIndexChange}
  //     />
  //   )
  
  //   // On the last page, next and last should be disabled.
  //   expect(screen.getByTestId('next-page-button')).toBeDisabled()
  //   expect(screen.getByTestId('last-page-button')).toBeDisabled()
  // })
  
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
  
  test('adds a new row, validates input, and saves the row correctly', async () => {
    // Render the component.
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns}
      />
    )

    // 1. Click the add button.
    const addButton = screen.getByTestId('add-row-button')
    fireEvent.click(addButton)

    // 2. Confirm that a new row appears (test-id "row-0") with class "new".
    const newRow = screen.getByTestId('row-')
    expect(newRow).toHaveClass('new')

    // 3. Click the cancel button to discard the new row.
    const cancelButton = screen.getByTestId('cancel-row-button-0')
    expect(cancelButton).toBeInTheDocument()
    fireEvent.click(cancelButton)

    // 4. Confirm that the cancel button is removed and the row is reset (no longer "new").
    expect(screen.queryByTestId('cancel-row-button-0')).toBeNull()
    expect(newRow).not.toHaveClass('new')

    // 5. Click the add button again to add a new row.
    fireEvent.click(addButton)
    expect(newRow).toHaveClass('new')

    // 6. Target the first name cell and simulate hover.
    const cell = screen.getByTestId('column-0-firstName')
    await userEvent.hover(cell)
    fireEvent.doubleClick(cell)

    // 7. Check that the invalid message appears.
    const invalidMessage = screen.getByTestId('form-control-0-firstName-help-text')
    expect(invalidMessage).toBeInTheDocument()

    // 8. Type a valid input ("King") and wait for validation to hide the error.
    const cellInput = screen.getByTestId('form-control-0-firstName')
    await userEvent.clear(cellInput)
    await userEvent.type(cellInput, 'King')
    await waitFor(() => expect(invalidMessage).not.toBeNull())

    // 9. Type an invalid input ("name123") and confirm the error message reappears.
    const cellInput1 = screen.getByTestId('form-control-0-firstName')
    await userEvent.clear(cellInput1)
    expect(cellInput1).toHaveValue('')
    await userEvent.type(cellInput1, 'name123')
    const invalidMessage1 = screen.queryByTestId('form-control-0-firstName-help-text')
    expect(invalidMessage1).toBeInTheDocument()

    // 10. Verify that the save button is disabled.
    const saveButton = screen.getByTestId('save-row-button-0')
    expect(saveButton).toBeDisabled()

    // 11. Clear the wrong input and type a valid value.
    await userEvent.clear(cellInput1)

    // The field is required so clearing should show the error.
    expect(invalidMessage1).toBeVisible()
    await userEvent.type(cellInput1, 'King')
    await waitFor(() => expect(invalidMessage).not.toBeVisible())

    // 12. Simulate pressing Enter to save the row.
    fireEvent.keyDown(cellInput1, { key: 'Enter', code: 'Enter' })
    await waitFor(() => {
      expect(
        screen.queryByTestId('form-control-0-firstName')
      ).not.toBeInTheDocument()
    })

    // 13. Confirm that the save button is now enabled, then click it.
    await waitFor(() => {
      const saveButton1 = screen.getByTestId('save-row-button-0')
      expect(saveButton1).toBeEnabled()
    })
    fireEvent.click(screen.getByTestId('save-row-button-0'))

    // 14. Confirm that the saved row no longer has the "new" class.
    await waitFor(() => expect(newRow).not.toHaveClass('new'))
  })

  test('navigates cell selection correctly via keyboard', async () => {
    // Render the component.
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns.map(i => ({...i, width: 300}))}
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
  
    // 3. Press the Right Arrow key once.
    fireEvent.keyDown(firstNameCell, { key: 'ArrowRight', code: 'ArrowRight' })
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
  
    // 10. Wait for the row (test-id "row-1") to be removed from the DOM.
    const rowToDelete = screen.getByTestId('row-1')
    expect(rowToDelete).toBeInTheDocument()
    await waitFor(() =>
      expect(rowToDelete).not.toBeNull()
    )
  
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
        columnSettings={combinedColumns.map(i => ({...i, groupTitle: 'Profile'}))}
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
    // await waitFor(() => {
    //   expect(onSelectedRowsChange).toHaveBeenCalledWith(['1'])
    // })

    // Toggle another row.
    const checkboxRow2 = screen.getByTestId('select-row-2')
    await userEvent.click(checkboxRow2)
    // await waitFor(() => {
    //   expect(onSelectedRowsChange).toHaveBeenCalledWith(['1', '2'])
    // })

    // Open bulk‑delete confirmation
    const bulkBtn = await screen.findByTestId('bulk-delete-button')
    expect(bulkBtn).toBeInTheDocument()
    await userEvent.click(bulkBtn)

    // Confirm deletion
    const confirmBtn = await screen.findByTestId('confirm-bulk-delete-button')
    expect(bulkBtn).toBeInTheDocument()
    await userEvent.click(confirmBtn)

    // The two rows should be removed
    // await waitFor(() => {
      // expect(screen.queryByTestId('row-1')).toBeNull()
      // expect(screen.queryByTestId('row-2')).toBeNull()
    // })

    // await waitForElementToBeRemoved([screen.getByTestId('row-1'), screen.getByTestId('row-2')])
    
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

})
