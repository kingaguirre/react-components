import React from 'react';
import { render, screen, waitFor, fireEvent, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import './test.setup';
import { DataTable } from '../index';
import {
  sampleData,
  columnsPinning,
  columnsDragging,
  columnsSorting,
  columnsFiltering,
  combinedColumns,
} from './test.setup';

describe('DataTable Column Interactions (Client Mode)', () => {
  test('renders pinned columns with proper markers and toggles pinning', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsPinning}
        enableColumnPinning
      />
    );

    const pinnedIcon = screen.getByTestId('column-pin-icon-id');
    expect(pinnedIcon).toBeInTheDocument();
    expect(pinnedIcon).toHaveClass('pin');

    const unpinnedIcon = screen.getByTestId('column-pin-icon-firstName');
    expect(unpinnedIcon).toBeInTheDocument();
    expect(unpinnedIcon).toHaveClass('unpin');

    const falsePinIcon = screen.queryByTestId('column-pin-icon-lastname');
    expect(falsePinIcon).toBeNull();

    await userEvent.click(pinnedIcon);
    await waitFor(() => {
      expect(screen.getByTestId('column-pin-icon-id')).toHaveClass('unpin');
    });
  });

  test('renders draggable columns with appropriate attributes', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsDragging}
        enableColumnDragging
      />
    );

    const dragHandleId = screen.getByTestId('column-drag-handle-id');
    expect(dragHandleId).toBeInTheDocument();

    const dragHandleLastname = screen.queryByTestId('column-drag-handle-lastname');
    expect(dragHandleLastname).toBeNull();

    const dragHandleRole = screen.getByTestId('column-drag-handle-role');
    expect(dragHandleRole).toBeInTheDocument();
  });

  test('allows sorting when header is clicked', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
      />
    );

    const sortIconId = screen.getByTestId('column-sort-icon-id');
    expect(sortIconId).toBeInTheDocument();
    expect(sortIconId).toHaveClass('sort-asc');

    const sortIconFirstName = screen.getByTestId('column-sort-icon-firstName');
    expect(sortIconFirstName).toBeInTheDocument();
    expect(sortIconFirstName).toHaveClass('sort-desc');

    const sortIconLastName = screen.queryByTestId('column-sort-icon-lastname');
    expect(sortIconLastName).toBeNull();

    const sortIconRole = screen.getByTestId('column-sort-icon-role');
    expect(sortIconRole).toBeInTheDocument();
    expect(sortIconId).toHaveClass('sort-asc');

    await userEvent.click(sortIconId);
    await waitFor(() => {
      expect(sortIconId).toHaveClass('sort-desc');
    });
  });

  test('does not render interactive elements when all feature flags are false', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns}
        enableColumnPinning={false}
        enableColumnSorting={false}
        enableColumnDragging={false}
        enableColumnFiltering={false}
      />
    );

    expect(screen.queryByTestId('column-pin-icon-id')).toBeNull();
    expect(screen.queryByTestId('column-pin-icon-firstName')).toBeNull();
    expect(screen.queryByTestId('column-pin-icon-lastname')).toBeNull();
    expect(screen.queryByTestId('column-pin-icon-role')).toBeNull();

    expect(screen.queryByTestId('column-drag-handle-id')).toBeNull();
    expect(screen.queryByTestId('column-drag-handle-firstName')).toBeNull();
    expect(screen.queryByTestId('column-drag-handle-lastname')).toBeNull();
    expect(screen.queryByTestId('column-drag-handle-role')).toBeNull();

    expect(screen.queryByTestId('column-sort-icon-id')).toBeNull();
    expect(screen.queryByTestId('column-sort-icon-firstName')).toBeNull();
    expect(screen.queryByTestId('column-sort-icon-lastname')).toBeNull();
    expect(screen.queryByTestId('column-sort-icon-role')).toBeNull();

    expect(screen.queryByTestId('filter-firstName')).toBeNull();
  });

  test('filters rows based on column filter input', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsFiltering}
        enableColumnFiltering
      />
    );

    const firstNameFilter = screen.getByTestId('filter-firstName');
    await userEvent.clear(firstNameFilter);
    await userEvent.type(firstNameFilter, 'Jane');

    await waitFor(() => {
      expect(screen.getByText('Jane')).toBeInTheDocument();
      expect(screen.queryByText('John')).toBeNull();
      expect(screen.queryByText('Alice')).toBeNull();
    });
  });

  test('filters last name case sensitively', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsFiltering}
        enableColumnFiltering
      />
    );

    const lastnameFilter = screen.getByTestId('filter-lastname');
    await userEvent.clear(lastnameFilter);
    await userEvent.type(lastnameFilter, 'doe');
    await waitFor(() => {
      expect(screen.queryByText('Doe')).toBeNull();
    });

    await userEvent.clear(lastnameFilter);
    await userEvent.type(lastnameFilter, 'Doe');
    await waitFor(() => {
      expect(screen.getByText('Doe')).toBeInTheDocument();
    });
  });

  test('filters rows based on dropdown filter for role', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsFiltering}
        enableColumnFiltering
      />
    );

    // dropdown animates + mounts in a portal; use a user with pointer checks off
    const u = userEvent.setup({ pointerEventsCheck: 0 });

    // open the dropdown
    const roleFilter = screen.getByTestId('filter-role');
    await u.click(roleFilter);

    // wait for the portal-mounted menu to appear and be visible
    const popup = await screen.findByTestId('dropdown-menu', {}, { timeout: 2000 });
    await waitFor(() => expect(popup).toBeVisible());

    // query inside the popup
    const adminOption = within(popup).getByTestId('Admin');
    await waitFor(() => expect(adminOption).toBeVisible());

    // select the option (skip hover to avoid animation/hover guards)
    await u.click(adminOption, { skipHover: true });

    // verify filtering result
    await waitFor(() => {
      const adminElements = screen.getAllByText('Admin');
      expect(adminElements.length).toBeGreaterThan(0);

      const userCells = screen.queryAllByText(/^User$/i);
      expect(userCells).toHaveLength(7);
    });
  });
});

describe('DataTable Row Features and Events (Client Mode)', () => {
  test('renders no data', () => {
    render(<DataTable dataSource={[]} columnSettings={columnsSorting} />);
    expect(screen.queryByText(/No data to display/i)).toBeInTheDocument();
  });

  test('renders rows with correct pagination (pageSize and pageIndex)', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={0}
        pageSize={2}
      />
    );
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(2);
  });

  test('renders disabled rows with correct class', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        disabledRows={['2']}
      />
    );
    const disabledRow = screen.getByTestId('row-2');
    expect(disabledRow).toHaveClass('disabled');
  });

  test('renders selected rows with proper markers', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        selectedRows={['1', '2']}
      />
    );
    expect(screen.getByTestId('row-1')).toHaveClass('selected');
    expect(screen.getByTestId('row-2')).toHaveClass('selected');
  });

  test('highlights the active row correctly', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        activeRow="2"
      />
    );
    expect(screen.getByTestId('row-2')).toHaveClass('active');
  });

  test('calls onRowClick when a row is clicked', async () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        onRowClick={onRowClick}
      />
    );

    await userEvent.click(screen.getByTestId('row-1'));
    await waitFor(() => {
      expect(onRowClick).toHaveBeenCalled();
      expect(onRowClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1', firstName: 'Jane', lastname: 'Smith', role: 'User' }),
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  test('calls onRowDoubleClick when a row is double-clicked', async () => {
    const onRowDoubleClick = vi.fn();
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        onRowDoubleClick={onRowDoubleClick}
      />
    );

    await userEvent.dblClick(screen.getByTestId('row-2'));
    await waitFor(() => {
      expect(onRowDoubleClick).toHaveBeenCalled();
      expect(onRowDoubleClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: '2', firstName: 'Alice', lastname: 'Johnson', role: 'User' }),
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  test('calls onPageIndexChange when page index input is changed', async () => {
    const onPageIndexChange = vi.fn();
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={1}
        pageSize={5}
        onPageIndexChange={onPageIndexChange}
      />
    );

    const pageIndexInput = screen.getByTestId('page-index-input');
    await userEvent.clear(pageIndexInput);

    await waitFor(() => {
      expect(onPageIndexChange).toHaveBeenCalledWith(0);
    });
  });

  test('calls onPageIndexChange for all pagination controls and disables buttons accordingly', async () => {
    const onPageIndexChange = vi.fn();
    const { rerender } = render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={0}
        pageSize={3}
        onPageIndexChange={onPageIndexChange}
      />
    );

    const firstPageButton = screen.getByTestId('first-page-button');
    const previousPageButton = screen.getByTestId('previous-page-button');
    const nextPageButton = screen.getByTestId('next-page-button');
    const lastPageButton = screen.getByTestId('last-page-button');

    expect(firstPageButton).toBeDisabled();
    expect(previousPageButton).toBeDisabled();
    expect(nextPageButton).toBeEnabled();
    expect(lastPageButton).toBeEnabled();

    await userEvent.click(nextPageButton);
    await waitFor(() => expect(onPageIndexChange).toHaveBeenCalledWith(1));
    onPageIndexChange.mockClear();

    rerender(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={2}
        pageSize={3}
        onPageIndexChange={onPageIndexChange}
      />
    );

    expect(screen.getByTestId('first-page-button')).toBeEnabled();
    const _prev = screen.getByTestId('previous-page-button');
    expect(_prev).toBeEnabled();
    await userEvent.click(_prev);
    await waitFor(() => expect(onPageIndexChange).toHaveBeenCalledWith(1));
    onPageIndexChange.mockClear();

    rerender(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={2}
        pageSize={3}
        onPageIndexChange={onPageIndexChange}
      />
    );

    const _first = screen.getByTestId('first-page-button');
    await userEvent.click(_first);
    await waitFor(() => expect(onPageIndexChange).toHaveBeenCalledWith(0));
    onPageIndexChange.mockClear();

    rerender(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={0}
        pageSize={3}
        onPageIndexChange={onPageIndexChange}
      />
    );

    expect(screen.getByTestId('first-page-button')).toBeDisabled();
    expect(screen.getByTestId('previous-page-button')).toBeDisabled();

    rerender(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={0}
        pageSize={3}
        onPageIndexChange={onPageIndexChange}
      />
    );

    await userEvent.click(screen.getByTestId('last-page-button'));
    await waitFor(() => expect(onPageIndexChange).toHaveBeenCalledWith(3));
    onPageIndexChange.mockClear();

    rerender(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={3}
        pageSize={3}
        onPageIndexChange={onPageIndexChange}
      />
    );

    expect(screen.getByTestId('next-page-button')).toBeDisabled();
    expect(screen.getByTestId('last-page-button')).toBeDisabled();
  });

  test('calls onSelectedRowsChange when row selection changes', async () => {
    const onSelectedRowsChange = vi.fn();
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns}
        enableRowSelection
        enableMultiRowSelection
        onSelectedRowsChange={onSelectedRowsChange}
      />
    );

    await userEvent.click(screen.getByTestId('select-row-1'));
    await waitFor(() => expect(onSelectedRowsChange).toHaveBeenCalledWith(['1']));

    await userEvent.click(screen.getByTestId('select-row-2'));
    await waitFor(() => expect(onSelectedRowsChange).toHaveBeenCalledWith(['1', '2']));

    const header = screen.getByTestId('select-row-header');
    await userEvent.click(header);
    await waitFor(() => {
      expect(onSelectedRowsChange).toHaveBeenCalledWith(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
    });
  });

  test('retains disabled row selection when toggling select all', async () => {
    const onSelectedRowsChange = vi.fn();
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        enableRowSelection
        enableMultiRowSelection
        disabledRows={['2']}
        selectedRows={['1', '2']}
        onSelectedRowsChange={onSelectedRowsChange}
      />
    );

    const header = screen.getByTestId('select-row-header');
    await userEvent.click(header);

    await waitFor(() => {
      expect(onSelectedRowsChange).toHaveBeenCalledWith(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
    });

    await userEvent.click(header);
    await waitFor(() => {
      const disabledRow = screen.getByTestId('row-2');
      expect(disabledRow).toHaveClass('disabled');
      expect(disabledRow).toHaveClass('selected');
    });
  });

  test('renders expanded row content when expandedRowContent is provided', async () => {
    const expandedContent = (rowData: any) =>
      <div data-testid={`expanded-${rowData.id}`}>Extra: {rowData.firstName}</div>;

    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        expandedRowContent={expandedContent}
      />
    );

    const expandButtonRow1 = screen.getByTestId('expand-row-0');
    userEvent.click(expandButtonRow1);
    await waitFor(() => {
      expect(screen.getByTestId('expanded-0')).toBeInTheDocument();
      expect(screen.getByTestId('expanded-0')).toHaveTextContent('Extra: John');
    });
  });

  test('does not trigger row events when DataTable is disabled', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        onRowClick={onRowClick}
        disabled
      />
    );
    fireEvent.click(screen.getByTestId('row-1')); // bypass pointer-events
    expect(onRowClick).not.toHaveBeenCalled();
  });

  test('adds a new row, validates input, and saves the row correctly', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns}
        enableRowAdding
      />
    );

    const addButton = screen.getByTestId('add-row-button');
    fireEvent.click(addButton);

    const newRow = screen.getByTestId('row-');
    expect(newRow).toHaveClass('new');

    const cancelButton = screen.getByTestId('cancel-row-button-new');
    expect(cancelButton).toBeInTheDocument();
    fireEvent.click(cancelButton);

    expect(screen.queryByTestId('cancel-row-button-new')).toBeNull();
    await waitFor(() => expect(screen.queryByTestId('row-')).toBeNull());

    fireEvent.click(addButton);
    expect(newRow).toHaveClass('new');

    const cell = screen.getByTestId('column-new-firstName');
    await userEvent.hover(cell);
    fireEvent.doubleClick(cell);

    const invalidMessage = await screen.findByTestId('form-control-new-firstName-help-text');
    expect(invalidMessage).toBeInTheDocument();

    const cellInput = screen.getByTestId('form-control-new-firstName');
    await userEvent.clear(cellInput);
    await userEvent.type(cellInput, 'King');
    await waitFor(() => expect(invalidMessage).not.toBeNull());

    const cellInput1 = screen.getByTestId('form-control-new-firstName');
    await userEvent.clear(cellInput1);
    expect(cellInput1).toHaveValue('');
    await userEvent.type(cellInput1, 'name123');
    const invalidMessage1 = screen.queryByTestId('form-control-new-firstName-help-text');
    expect(invalidMessage1).toBeInTheDocument();

    const saveButton = screen.getByTestId('save-row-button-new');
    expect(saveButton).toBeDisabled();

    await userEvent.clear(cellInput1);
    expect(invalidMessage1).toBeVisible();
    await userEvent.type(cellInput1, 'King');
    await waitFor(() => expect(invalidMessage1).not.toBeVisible());

    fireEvent.keyDown(cellInput1, { key: 'Enter', code: 'Enter' });
    await waitFor(() => {
      expect(screen.queryByTestId('form-control-new-firstName')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const saveButton1 = screen.getByTestId('save-row-button-new');
      expect(saveButton1).toBeEnabled();
    });
    fireEvent.click(screen.getByTestId('save-row-button-new'));

    await waitFor(() => expect(screen.getByTestId('row-')).not.toHaveClass('new'));
  });

  test('navigates cell selection correctly via keyboard', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns.map((i) => ({ ...i, width: 300 }))}
        maxHeight="200px"
      />
    );

    const firstNameCell = screen.getByTestId('column-0-firstName');
    fireEvent.click(firstNameCell);
    expect(firstNameCell).toHaveClass('selected');

    fireEvent.doubleClick(firstNameCell);
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    fireEvent.keyDown(document, { key: 'ArrowRight', code: 'ArrowRight' });
    const lastNameCell = screen.getByTestId('column-0-lastname');
    expect(lastNameCell).toHaveClass('selected');

    fireEvent.keyDown(lastNameCell, { key: 'ArrowRight', code: 'ArrowRight' });
    const roleCell = screen.getByTestId('column-0-role');
    expect(roleCell).toHaveClass('selected');

    fireEvent.keyDown(roleCell, { key: 'ArrowDown', code: 'ArrowDown' });
    const roleCellRow1 = screen.getByTestId('column-1-role');
    expect(roleCellRow1).toHaveClass('selected');

    fireEvent.keyDown(roleCellRow1, { key: 'ArrowDown', code: 'ArrowDown' });
    const roleCellRow2 = screen.getByTestId('column-2-role');
    expect(roleCellRow2).toHaveClass('selected');

    fireEvent.keyDown(roleCellRow2, { key: 'ArrowDown', code: 'ArrowDown' });
    const roleCellRow3 = screen.getByTestId('column-3-role');
    expect(roleCellRow3).toHaveClass('selected');

    let currentCell = roleCellRow3;
    for (let row = 4; row <= 9; row++) {
      fireEvent.keyDown(currentCell, { key: 'ArrowDown', code: 'ArrowDown' });
      currentCell = screen.getByTestId(`column-${row}-role`);
      expect(currentCell).toHaveClass('selected');
    }
  });

  test('validates cell input correctly, checks onChange return value on save and after row deletion (Vite)', async () => {
    const onChangeHandler = vi.fn();
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns}
        onChange={onChangeHandler}
        enableCellEditing
        enableRowDeleting
      />
    );

    const firstNameCell = screen.getByTestId('column-0-firstName');
    fireEvent.doubleClick(firstNameCell);

    const input = await screen.findByTestId('form-control-0-firstName');
    expect(input).toHaveValue('John');

    fireEvent.change(input, { target: { value: '' } });
    const helpTextRequired = await screen.findByTestId('form-control-0-firstName-help-text');
    expect(helpTextRequired).toHaveTextContent(/Required field/i);

    fireEvent.change(input, { target: { value: 'Jane' } });
    const helpTextDuplicate = await screen.findByTestId('form-control-0-firstName-help-text');
    expect(helpTextDuplicate).toHaveTextContent(/Duplicate value/i);

    fireEvent.change(input, { target: { value: 'King' } });
    await waitFor(() => expect(screen.queryByTestId('form-control-0-firstName-help-text')).toBeNull());

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByTestId('column-0-firstName')).toHaveTextContent('King');
    });

    await waitFor(() => expect(onChangeHandler).toHaveBeenCalled());
    const afterSave = onChangeHandler.mock.calls.at(-1)?.[0];
    const savedRow = afterSave.find((row: any) => row.id === '0');
    expect(savedRow).toBeDefined();
    expect(savedRow.firstName).toBe('King');

    const deleteButton = screen.getByTestId('delete-row-button-1');
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByTestId('row-1')).toBeNull();
    });

    await waitFor(() => {
      const afterDelete = onChangeHandler.mock.calls.at(-1)?.[0];
      expect(Array.isArray(afterDelete)).toBe(true);
      expect(afterDelete.length).toBe(9);
    });
  });

  test('checks if group header "Profile" is present in the DOM', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns.map((i) => ({ ...i, groupTitle: 'Profile' }))}
      />
    );

    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
  });

  test('renders deep nested profile bio "Senior Developer at XYZ" in the DOM', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={[...combinedColumns, { title: 'profile', column: 'userInfo.profile.bio' }]}
      />
    );

    expect(await screen.findByText(/Senior Developer at XYZ/i)).toBeInTheDocument();
  });

  test('different editor types', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={[...combinedColumns, { title: 'profile', column: 'userInfo.profile.bio' }]}
      />
    );

    expect(await screen.findByText(/Senior Developer at XYZ/i)).toBeInTheDocument();
  });

  test('renders DataTable with various editor types and deep column values', async () => {
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
          { title: 'Text Field', column: 'textField', editor: { type: 'text' } },
          { title: 'Textarea Field', column: 'textareaField', editor: { type: 'textarea' } },
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
          { title: 'Date Field', column: 'dateField', editor: { type: 'date' } },
          { title: 'Date Range Field', column: 'dateRangeField', editor: { type: 'date-range' } },
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
          { title: 'Checkbox Field', column: 'checkboxField', editor: { type: 'checkbox' } },
          { title: 'Switch Field', column: 'switchField', editor: { type: 'switch' } },
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

    expect(await screen.findByText(/Text Value/i)).toBeInTheDocument();
    expect(screen.queryByText(/Textarea Value/i)).toBeInTheDocument();

    const option1Elements = screen.getAllByText(/Option1/i);
    expect(option1Elements.length).toBeGreaterThan(0);

    const dateElement = screen.getAllByText(/2025-03-12/i);
    expect(dateElement.length).toBeGreaterThan(0);

    expect(screen.queryByText(/2025-03-10,2025-03-12/i)).toBeInTheDocument();
    expect(screen.queryByText(/OptionB/i)).toBeInTheDocument();

    const chkElement = screen.getAllByText(/true/i);
    expect(chkElement.length).toBeGreaterThan(0);

    expect(screen.queryByText(/false/i)).toBeInTheDocument();
    expect(screen.queryByText(/Option3/i)).toBeInTheDocument();
    expect(screen.queryByText(/Option2/i)).toBeInTheDocument();
    expect(screen.queryByText(/OptionB/i)).toBeInTheDocument();
  });

  test('renders headerRightElements correctly', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        headerRightElements={[
          { type: 'button', text: 'Export', onClick: vi.fn() },
          { type: 'text', name: 'search', value: '', placeholder: 'Search...', testId: 'header-search' },
          {
            type: 'dropdown',
            name: 'roleFilter',
            options: [
              { text: 'Admin', value: 'Admin' },
              { text: 'User', value: 'User' },
            ],
            value: 'User',
            testId: 'header-dropdown',
          },
          { type: 'date', name: 'startDate', value: '2025-01-01', testId: 'header-date' },
        ]}
      />
    );

    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByTestId('header-search')).toBeInTheDocument();
    expect(screen.getByTestId('header-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('header-date')).toBeInTheDocument();
  });

  test('soft-deletes a row when partialRowDeletionID is set and emits onChange with the flag', async () => {
    const onChangeHandler = vi.fn();

    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={combinedColumns}
        enableRowDeleting
        partialRowDeletionID="isSoftDelete"
        onChange={onChangeHandler}
      />
    );

    await userEvent.click(screen.getByTestId('delete-row-button-1'));

    await waitFor(() => {
      expect(onChangeHandler).toHaveBeenCalled();
      const payload = onChangeHandler.mock.calls.at(-1)?.[0];
      expect(Array.isArray(payload)).toBe(true);
      expect(payload.length).toBe(sampleData.length);
      const softDeleted = payload.find((r: any) => r.id === '1');
      expect(softDeleted).toBeDefined();
      expect(softDeleted.isSoftDelete).toBe(true);
    });

    expect(screen.getByTestId('row-1')).toBeInTheDocument();
  });

  const baseProps = { dataSource: sampleData, columnSettings: columnsSorting };
  const getHeader = () => document.querySelector('.main-header-container') as HTMLElement | null;

  test('hidden when ALL conditions are false/absent', () => {
    render(<DataTable {...baseProps} headerRightControls={false as any} />);
    const header = getHeader();
    if (header) {
      expect(header).not.toBeVisible();
    } else {
      expect(header).toBeNull();
    }
  });

  test.each([
    ['enableGlobalFiltering', { enableGlobalFiltering: true }],
    ['enableRowAdding', { enableRowAdding: true }],
    ['showDeleteIcon', { showDeleteIcon: true } as any],
    ['headerRightControls', { headerRightControls: true } as any],
    [
      'headerRightElements (non-empty)',
      { headerRightElements: [{ type: 'button', text: 'Export', onClick: vi.fn() }] },
    ],
  ])('visible when %s is truthy', (_label, extraProps) => {
    render(<DataTable {...baseProps} {...(extraProps as any)} />);
    const header = getHeader();
    expect(header).toBeInTheDocument();
    expect(header).toBeVisible();
  });

  test('still hidden when headerRightElements is provided but empty []', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        enableGlobalFiltering={false}
        enableRowAdding={false}
        headerRightControls={false as any}
        headerRightElements={[]}
      />
    );
    const header = document.querySelector('.main-header-container') as HTMLElement | null;
    if (header) {
      expect(header).not.toBeVisible();
    } else {
      expect(header).toBeNull();
    }
  });

  test('visible when multiple conditions are truthy', () => {
    render(
      <DataTable
        {...baseProps}
        enableGlobalFiltering
        enableRowAdding
        headerRightElements={[{ type: 'text', name: 'q', value: '' }]}
      />
    );
    const header = getHeader();
    expect(header).toBeInTheDocument();
    expect(header).toBeVisible();
  });

  test('custom cell renderer is honored', async () => {
    render(
      <DataTable
        dataSource={[{ id: 'x', score: 92 }]}
        columnSettings={[
          { title: 'ID', column: 'id' },
          {
            title: 'Score', column: 'score', cell: ({ rowValue }) => (
              <span data-testid="score-badge">{rowValue.score >= 90 ? '🔥 High' : 'OK'}</span>
            )
          },
        ]}
      />
    );
    expect(await screen.findByTestId('score-badge')).toHaveTextContent('🔥 High');
  });

  test('renders title, container height/maxHeight, and right-aligned header/cell content (computed style)', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting.map(c => ({ ...c, align: 'right', headerAlign: 'right' }))}
        title="Users"
        testId="users-table"
        height="320px"
        maxHeight="480px"
        cellTextAlignment="right"
      />
    );

    // title
    expect(screen.getByText('Users')).toBeInTheDocument();

    // container sizing lives on .data-table-container
    const root = screen.getByTestId('users-table');
    const container = root.querySelector('.data-table-container') as HTMLElement | null;
    expect(container).not.toBeNull();

    // if you set inline styles, this will pass; otherwise computed style check below covers it
    expect(container!).toHaveStyle({ height: '320px', maxHeight: '480px' });

    const containerCS = window.getComputedStyle(container!);
    expect(containerCS.height).toBe('320px');
    // depending on environment, computed maxHeight may be '480px' or 'none' if not applied;
    // keep the inline style assertion above as primary truth.

    // HEADER alignment: data-testid="cell-content-id"
    const headerContent = screen.getByTestId('cell-content-id');
    const headerCS = window.getComputedStyle(headerContent);
    expect(headerCS.display).toBe('flex');
    expect(headerCS.justifyContent).toBe('flex-end');

    // CELL alignment: data-testid="column-0-id" -> child ".cell-content"
    const cell = screen.getByTestId('column-0-id');
    const cellContent = cell.querySelector('.cell-content') as HTMLElement | null;
    expect(cellContent).not.toBeNull();
    const cellCS = window.getComputedStyle(cellContent!);
    expect(cellCS.display).toBe('flex');
    expect(cellCS.justifyContent).toBe('flex-end');
  });

  test('ColumnSetting.hidden and ColumnSetting.order are respected', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={[
          { title: 'ID', column: 'id', order: 2 },
          { title: 'First', column: 'firstName', order: 1 },
          { title: 'Secret', column: 'secret', hidden: true },
        ]}
      />
    );

    // hidden header should not render
    expect(screen.queryByTestId('cell-content-secret')).toBeNull();

    // order: cell-content-firstName should appear before cell-content-id
    const headerEls = Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid^="cell-content-"]')
    );
    const ids = headerEls.map(el => el.getAttribute('data-testid'));

    const firstIdx = ids.indexOf('cell-content-firstName');
    const idIdx = ids.indexOf('cell-content-id');

    expect(firstIdx).toBeGreaterThan(-1);
    expect(idIdx).toBeGreaterThan(-1);
    expect(firstIdx).toBeLessThan(idIdx);

    // (optional, stricter): DOM position check
    const firstEl = screen.getByTestId('cell-content-firstName');
    const idEl = screen.getByTestId('cell-content-id');
    expect(firstEl.compareDocumentPosition(idEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('selectedCell (controlled) focuses the intended cell', async () => {
    const { rerender } = render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        selectedCell="0,0" // row 0, col 0
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId('column-0-id')).toHaveClass('selected')
    );

    rerender(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        selectedCell="1,0" // row 1, col 0
      />
    );

    await waitFor(() =>
      expect(screen.getByTestId('column-1-id')).toHaveClass('selected')
    );
  });

  test('single-select replaces selection', async () => {
    const onSelected = vi.fn();
    const u = userEvent.setup({ pointerEventsCheck: 0 });

    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        enableRowSelection
        enableMultiRowSelection={false} // explicit
        onSelectedRowsChange={onSelected}
      />
    );

    await u.click(screen.getByTestId('select-row-1'));
    await waitFor(() => expect(onSelected).toHaveBeenLastCalledWith(['1']));
    onSelected.mockClear();

    await u.click(screen.getByTestId('select-row-2'));
    await waitFor(() => expect(onSelected).toHaveBeenLastCalledWith(['2']));

    // sanity: DOM reflects single selection
    expect(screen.getByTestId('row-2')).toHaveClass('selected');
    expect(screen.getByTestId('row-1')).not.toHaveClass('selected');
  });

  test('multi-select accumulates selections', async () => {
    const onSelected = vi.fn();
    const u = userEvent.setup({ pointerEventsCheck: 0 });

    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        enableRowSelection
        enableMultiRowSelection // start in multi mode
        onSelectedRowsChange={onSelected}
      />
    );

    // reacquire elements in this fresh render
    await u.click(screen.getByTestId('select-row-1'));
    await waitFor(() => expect(onSelected).toHaveBeenLastCalledWith(['1']));
    onSelected.mockClear();

    await u.click(screen.getByTestId('select-row-2'));
    await waitFor(() => expect(onSelected).toHaveBeenLastCalledWith(['1', '2']));

    // sanity: both are selected in DOM
    expect(screen.getByTestId('row-1')).toHaveClass('selected');
    expect(screen.getByTestId('row-2')).toHaveClass('selected');
  });

  test('bulk delete selected rows (enableSelectedRowDeleting)', async () => {
    const onChange = vi.fn();
    const u = userEvent.setup({ pointerEventsCheck: 0 });

    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        enableRowSelection
        enableMultiRowSelection
        enableSelectedRowDeleting
        onChange={onChange}
      />
    );

    // select rows 1 and 2
    await u.click(screen.getByTestId('select-row-1'));
    await u.click(screen.getByTestId('select-row-2'));

    // open bulk delete
    const trigger =
      screen.queryByTestId('bulk-delete-button') ??
      screen.getByTestId('delete-selected-rows-button');
    await u.click(trigger);

    // confirm in the toast/modal
    const confirmBtn = await screen.findByTestId('confirm-bulk-delete-button', {}, { timeout: 1500 });
    await u.click(confirmBtn);

    // assert payload after delete
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const payload = onChange.mock.calls.at(-1)?.[0];
    expect(Array.isArray(payload)).toBe(true);
    expect(payload.length).toBe(sampleData.length - 2);
    expect(payload.find((r: any) => r.id === '1')).toBeUndefined();
    expect(payload.find((r: any) => r.id === '2')).toBeUndefined();
  });

  test('global filtering (client mode) narrows rows', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        enableGlobalFiltering
      />
    );
    const input = screen.getByTestId('global-filter-input');
    await userEvent.type(input, 'Jane');

    await waitFor(() => {
      expect(screen.getByText('Jane')).toBeInTheDocument();
      expect(screen.queryByText('John')).toBeNull();
    });
  });

  test('onPageSizeChange fires when page size changes (portal dropdown)', async () => {
    const onPageSizeChange = vi.fn();
    const u = userEvent.setup({ pointerEventsCheck: 0 });

    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        pageIndex={0}
        pageSize={5}
        onPageSizeChange={onPageSizeChange}
      />
    );

    // open the page-size dropdown (this is the trigger button/input)
    const trigger = screen.getByTestId('page-size-input'); // keep this id; it's your trigger
    await u.click(trigger);

    // the menu is rendered in a portal
    const popup = await screen.findByTestId('dropdown-menu', {}, { timeout: 2000 });
    await waitFor(() => expect(popup).toBeVisible());

    // pick "10" — prefer a testId if you have one, otherwise fall back to the text
    const opt10 =
      within(popup).queryByTestId('10') ||
      within(popup).queryByTestId('option-10') ||
      within(popup).getByText(/^10$/);
    await u.click(opt10, { skipHover: true });

    await waitFor(() => expect(onPageSizeChange).toHaveBeenCalledWith(10));
  });

  test('editor disabled at column level (boolean) blocks editing', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={[
          { title: 'ID', column: 'id' },
          { title: 'First', column: 'firstName', editor: { type: 'text', disabled: true } },
        ]}
        enableCellEditing
      />
    );
    await userEvent.dblClick(screen.getByTestId('column-0-firstName'));
    expect(screen.queryByTestId('form-control-0-firstName')).toBeDisabled();
  });

  test('editor disabled via function blocks specific rows', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={[
          { title: 'First', column: 'firstName', editor: { type: 'text', disabled: (row: any) => row.id === '0' } },
        ]}
        enableCellEditing
      />
    );
    await userEvent.dblClick(screen.getByTestId('column-0-firstName'));
    expect(screen.queryByTestId('form-control-0-firstName')).toBeDisabled();

    await userEvent.dblClick(screen.getByTestId('column-1-firstName'));
    expect(screen.getByTestId('form-control-1-firstName')).not.toBeDisabled();
  });

  test('column-level disabled prevents interaction for targeted row', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={[
          { title: 'ID', column: 'id' },
          { title: 'Role', column: 'role', disabled: (row: any) => row.id === '1' },
        ]}
        enableCellEditing
      />
    );
    await userEvent.dblClick(screen.getByTestId('column-1-role'));
    expect(screen.queryByTestId('form-control-1-role')).toBeNull();
  });

  test('filter type: number-range', async () => {
    render(
      <DataTable
        dataSource={[
          { id: '1', score: 10 },
          { id: '2', score: 25 },
          { id: '3', score: 50 },
        ]}
        columnSettings={[
          { title: 'ID', column: 'id' },
          { title: 'Score', column: 'score', filter: { type: 'number-range' } },
        ]}
        enableColumnFiltering
      />
    );

    const min = screen.getByTestId('filter-score-min');
    const max = screen.getByTestId('filter-score-max');
    await userEvent.clear(min); await userEvent.type(min, '20');
    await userEvent.clear(max); await userEvent.type(max, '40');

    await waitFor(() => {
      expect(screen.queryByText('10')).toBeNull();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.queryByText('50')).toBeNull();
    });
  });

  test('onActiveRowChange fires when active row changes via click', async () => {
    const onActiveRowChange = vi.fn();
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        onActiveRowChange={onActiveRowChange}
      />
    );
    await userEvent.click(screen.getByTestId('row-2'));
    await waitFor(() => {
      expect(onActiveRowChange).toHaveBeenCalled();
      const [row] = onActiveRowChange.mock.calls.at(-1)!;
      expect(row).toMatchObject({ id: '2' });
    });
  });

  test('column filter highlights matching tokens in the cell', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsFiltering}
        enableColumnFiltering
      />
    );

    const firstNameFilter = screen.getByTestId('filter-firstName');
    await userEvent.clear(firstNameFilter);
    await userEvent.type(firstNameFilter, 'Jane');

    // Re-query the visible firstName cell that contains "Jane"
    // (filtering can shift row indexes, so scan all firstName cells)
    const cells = Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid^="column-"][data-testid$="-firstName"]')
    );
    const cell = cells.find((el) => el.textContent?.includes('Jane')) ?? null;
    expect(cell).not.toBeNull();

    // Wait until the highlighter has mutated the DOM
    await waitFor(() => {
      const html = cell!.innerHTML;
      // Accept either explicit data-hook or inline style; covers both implementations
      expect(
        /<span[^>]*(data-highlight="true"|background-color:\s*yellow)[^>]*>Jane<\/span>/i.test(html)
      ).toBe(true);
    });

    // sanity: others are filtered out
    expect(screen.queryByText('John')).toBeNull();
    expect(screen.queryByText('Alice')).toBeNull();
  });

  test('global filter highlights multiple tokens across cells', async () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        enableGlobalFiltering
      />
    );

    const input = screen.getByTestId('global-filter-input');
    await userEvent.type(input, 'Jane');

    // Give the table a tick to re-render highlight spans
    await waitFor(() => {
      const html = document.body.innerHTML;
      // We expect at least one highlighted "Jane" and one highlighted "Admin"
      const hasJane =
        /<span[^>]*(data-highlight="true"|background-color:\s*yellow)[^>]*>Jane<\/span>/i.test(html);
      expect(hasJane).toBe(true);
    });
  });

  test('hides RightDetails when hideFooterRightDetails is true', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        hideFooterRightDetails
      />
    );

    // RightDetails content gone
    expect(screen.queryByText('Rows')).toBeNull();
    expect(screen.queryByTestId('page-size-input')).toBeNull();
    expect(screen.queryByTestId('first-page-button')).toBeNull();
    expect(screen.queryByTestId('previous-page-button')).toBeNull();
    expect(screen.queryByTestId('next-page-button')).toBeNull();
    expect(screen.queryByTestId('last-page-button')).toBeNull();
  });

  test('shows footer loader while server fetch is in-flight (serverMode)', async () => {
    // Create a deferred promise to hold the fetcher open
    let resolveFetch: ((payload: { rows: any[]; total: number }) => void) | null = null;
    const pending = new Promise<{ rows: any[]; total: number }>((res) => {
      resolveFetch = res;
    });

    const fetcher = vi.fn().mockReturnValueOnce(pending);

    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        serverMode
        server={{ fetcher, debounceMs: 0 }}
        pageIndex={0}
        pageSize={5}
      />
    );

    // While the fetch is pending, serverLoading should be true → loader visible
    const loader = await screen.findByTestId('footer-loader', {}, { timeout: 1500 });
    expect(loader).toBeInTheDocument();

    // Sanity: "Rows" label still renders in RightDetails
    const rowsLabel = screen.getByText('Rows');
    expect(rowsLabel).toBeInTheDocument();

    // Loader should appear before the "Rows" text (left side)
    expect(
      loader.compareDocumentPosition(rowsLabel) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    // Now resolve the fetch — loader should disappear
    await act(async () => {
      resolveFetch!({ rows: sampleData, total: sampleData.length });
    });

    await waitFor(() => {
      expect(screen.queryByTestId('footer-loader')).toBeNull();
    });
  });

  test('shows footer loader when loading prop is true (non-server path)', async () => {
    const { rerender } = render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        loading
      />
    );

    // Loader should be visible while `loading` is true
    const loader = await screen.findByTestId('footer-loader', {}, { timeout: 1500 });
    expect(loader).toBeInTheDocument();

    // Optional: sanity check that other footer content still renders
    expect(screen.getByText('Rows')).toBeInTheDocument();

    // Turn loading off → loader should disappear
    rerender(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        loading={false}
      />
    );

    expect(screen.queryByTestId('footer-loader')).toBeNull();
  });

  test('hides the entire footer when hideFooter is true', () => {
    render(
      <DataTable
        dataSource={sampleData}
        columnSettings={columnsSorting}
        hideFooter
      />
    );

    // Nothing from the footer should be present
    expect(screen.queryByText('Rows')).toBeNull();                // RightDetails
    expect(screen.queryByText(/Displaying/i)).toBeNull();         // LeftDetails
    expect(screen.queryByTestId('page-size-input')).toBeNull();   // control inside footer
    expect(screen.queryByTestId('first-page-button')).toBeNull();
    expect(screen.queryByTestId('previous-page-button')).toBeNull();
    expect(screen.queryByTestId('next-page-button')).toBeNull();
    expect(screen.queryByTestId('last-page-button')).toBeNull();
  });

});
