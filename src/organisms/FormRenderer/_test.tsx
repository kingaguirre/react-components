import React from 'react';
import { render, screen, within, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import ReactDOM from 'react-dom';
import { FormRenderer } from './index';
import type { SettingsItem, DataTableSection, FieldSetting, FormRendererRef } from './interface';

beforeAll(() => {
  vi.spyOn(ReactDOM, 'createPortal').mockImplementation((node) => node as any);
});

afterAll(() => {
  (ReactDOM.createPortal as any).mockRestore?.();
});

// ─────────────────────────────────────────────────────────────────────────────
// Light-weight mocks for heavy UI components
// ─────────────────────────────────────────────────────────────────────────────
vi.mock('../../organisms/DataTable', () => {
  const DataTable = (props: any) => {
    const { testId = 'mock-datatable', activeRow, disabled } = props;
    const rows = Array.isArray(props.dataSource) ? props.dataSource : []; // <-- guard
    return (
      <div data-testid={testId} data-disabled={disabled ? 'true' : 'false'}>
        <ul>
          {rows.map((row: any, i: number) => (
            <li
              key={i}
              data-testid={`dt-row-${i}`}
              className={String(activeRow) === String(i) ? 'active' : ''}
            >
              <pre>{JSON.stringify(row)}</pre>
              <button
                type="button"
                data-testid={`dt-select-${i}`}
                onClick={() => props.onActiveRowChange?.(row, String(i))}
              >
                Select {i}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  return { DataTable };
});

vi.mock('./components/Skeleton', () => {
  const Skeleton = () => <div data-testid="form-skeleton" />;
  return { __esModule: true, default: Skeleton };
});

// put this near the top of your FormRenderer tests
vi.mock('./components/VirtualizedItem', () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../molecules/DatePicker', () => {
  const DatePicker = (props: any) => {
    const tid = props['data-testid'] ?? 'mock-date';
    return (
      <div>
        <input
          type="text"
          placeholder={props.placeholder ?? 'Select Date'}
          data-testid={tid}
          name={props.name}
          value={props.value ?? ''}
          onChange={(e) => props.onChange?.(e)}
          disabled={props.disabled}
        />
        {/* clear icon */}
        <button
          type="button"
          data-testid={`${tid}-clear-icon`}
          onClick={() =>
            props.onChange?.({ target: { name: props.name, value: '' } })
          }
          disabled={props.disabled}
          aria-label="clear date"
          style={{ display: 'inline-flex' }}
        />
      </div>
    );
  };
  return { DatePicker };
});

vi.mock('../../molecules/Dropdown', () => {
  const Dropdown = (props: any) => {
    const tid = props['data-testid'] ?? 'mock-select';
    return (
      <div>
        <select
          data-testid={tid}
          name={props.name}
          value={props.value ?? ''}
          onChange={(e) => props.onChange?.(e)}
          disabled={props.disabled}
        >
          <option value="">--</option>
          {(props.options ?? []).map((o: any) => (
            <option key={String(o.value)} value={o.value}>
              {o.text ?? o.value}
            </option>
          ))}
        </select>
        {/* clear icon */}
        <button
          type="button"
          data-testid={`${tid}-clear-icon`}
          onClick={() =>
            props.onChange?.({ target: { name: props.name, value: '' } })
          }
          disabled={props.disabled}
          aria-label="clear dropdown"
          style={{ display: 'inline-flex' }}
        />
      </div>
    );
  };
  return { Dropdown };
});

vi.mock('../../atoms/FormControl', () => {
  const FormControl = (props: any) => {
    if (props.type === 'checkbox' || props.type === 'switch' || props.type === 'radio') {
      return (
        <input
          type="checkbox"
          data-testid={props['data-testid'] ?? 'mock-input'}
          name={props.name}
          checked={!!props.checked}
          onChange={(e) => props.onChange?.(e)}
          disabled={props.disabled}
        />
      );
    }

    const tid = props['data-testid'] ?? 'mock-input';

    if (props.type === 'textarea') {
      return (
        <div>
          <textarea
            data-testid={tid}
            name={props.name}
            value={props.value ?? ''}
            onChange={(e) => props.onChange?.(e)}
            disabled={props.disabled}
            placeholder={props.placeholder}
          />
          <button
            type="button"
            data-testid={`${tid}-clear-icon`}
            onClick={() =>
              props.onChange?.({ target: { name: props.name, value: '' } })
            }
            disabled={props.disabled}
            aria-label="clear textarea"
            style={{ display: 'inline-flex' }}
          />
        </div>
      );
    }

    return (
      <div>
        <input
          type={props.type ?? 'text'}
          data-testid={tid}
          name={props.name}
          value={props.value ?? ''}
          onChange={(e) => props.onChange?.(e)}
          disabled={props.disabled}
          placeholder={props.placeholder}
        />
        {/* clear icon */}
        <button
          type="button"
          data-testid={`${tid}-clear-icon`}
          onClick={() =>
            props.onChange?.({ target: { name: props.name, value: '' } })
          }
          disabled={props.disabled}
          aria-label="clear input"
          style={{ display: 'inline-flex' }}
        />
      </div>
    );
  };
  return { FormControl };
});

// ── Tabs mock (controlled-aware) ─────────────────────────────────────────────
vi.mock('../../organisms/Tabs', () => {
  const React = require('react');

  const Tabs = (props: any) => {
    const firstEnabled = props.tabs?.findIndex((t: any) => !t.disabled) ?? 0;
    const [sel, setSel] = React.useState(
      props.activeTab ?? firstEnabled
    );

    // respond to controlled updates
    React.useEffect(() => {
      if (typeof props.activeTab === 'number') {
        setSel(props.activeTab);
      }
    }, [props.activeTab]);

    return (
      <div data-testid="mock-tabs">
        <div role="tablist">
          {props.tabs?.map((t: any, i: number) => (
            <button
              key={i}
              role="tab"
              aria-selected={sel === i ? 'true' : 'false'}
              aria-controls={`panel-${i}`}
              tabIndex={sel === i ? 0 : -1}
              disabled={!!t.disabled}
              onClick={() => setSel(i)}
              data-testid={`tab-${i}`}
            >
              {t.title}
              {t.badgeValue != null ? ` ${t.badgeValue}` : ''}
            </button>
          ))}
        </div>
        <div id={`panel-${sel}`} role="tabpanel" data-testid="tabpanel">
          {props.tabs?.[sel]?.content}
        </div>
      </div>
    );
  };

  return { Tabs };
});

// ── Accordion mock (controlled-aware for activeKeys/forcedOpenKeys) ──────────
vi.mock('../../molecules/Accordion', () => {
  const getKey = (it: any, i: number) => String(it?.id ?? i);

  const Accordion = (props: any) => {
    const activeSet = new Set(props.activeKeys ?? []);
    const forcedSet = new Set(props.forcedOpenKeys ?? []);

    return (
      <div data-testid="mock-accordion">
        {(props.items ?? []).map((it: any, i: number) => {
          const key = getKey(it, i);
          const open =
            forcedSet.has(key) || activeSet.has(key) || !!it.open;

          return (
            <details
              key={key}
              open={open}
              data-testid={`accordion-${key}`}
              aria-disabled={it.disabled ? 'true' : 'false'}
            >
              <summary>{it.title}</summary>
              <div>{it.children}</div>
            </details>
          );
        })}
      </div>
    );
  };

  return { Accordion };
});

// ─────────────────────────────────────────────────────────────────────────────
// Misc DOM stubs used by FormRenderer's submit/focus helpers
// ─────────────────────────────────────────────────────────────────────────────
beforeEach(() => {
  // avoid scrollIntoView crashes
  (HTMLElement.prototype as any).scrollIntoView = vi.fn();
  // IntersectionObserver stub
  (global as any).IntersectionObserver = class {
    constructor() {}
    observe() {}
    disconnect() {}
    unobserve() {}
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for these tests
// ─────────────────────────────────────────────────────────────────────────────
const mkRows = (n = 3) => Array.from({ length: n }, (_, i) => ({ maker: `M${i+1}` }));

const baseDT: DataTableSection = {
  header: 'Demo Table',
  config: {
    dataSource: 'demoTable.rows',
    columnSettings: [{ title: 'Maker', column: 'maker' }],
  },
  // one simple draft/row field so the form renders inputs/buttons
  fields: [{ name: 'maker', label: 'Maker', type: 'text' } as FieldSetting],
};

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────
const baseFields: SettingsItem[] = [
  { name: 'name', label: 'Name', type: 'text', placeholder: 'Enter name' },
  { name: 'age', label: 'Age', type: 'number' as const },
  { name: 'dob', label: 'DOB', type: 'date' as const },
  {
    name: 'role',
    label: 'Role',
    type: 'dropdown' as const,
    options: [
      { value: 'Admin', text: 'Admin' },
      { value: 'User', text: 'User' },
    ],
  },
  // hidden & disabled dynamics
  { name: 'secret', label: 'Secret', type: 'text', hidden: () => true },
  { name: 'locked', label: 'Locked', type: 'text', disabled: () => true },
  // simple validation example (used in submit invalid test)
  {
    name: 'email',
    label: 'Email',
    type: 'text',
    validation: (v: typeof z) => v.string().email('Invalid email'),
  },
];

// Example column settings used by your DataTable
const mainColumns: any[] = [
  { title: 'Name', column: 'name' },
  { title: 'Qty', column: 'qty' },
];

const childColumns: any[] = [
  { title: 'Line', column: 'line' },
];

// Fields rendered *alongside* the main table (draft + row editor)
const tableFields: SettingsItem[] = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'qty',  label: 'Qty',  type: 'number' },
];

// Nested child DataTable (correct place for header)
const nestedChildDT: DataTableSection = {
  header: 'Lines Section',
  config: {
    dataSource: 'lines',
    columnSettings: childColumns,
  },
  fields: [
    { name: 'line', label: 'Line', type: 'text' },
  ],
};

// Parent (main) DataTable (unchanged, but fields now mix field settings + nested DT)
export const mainDT: DataTableSection = {
  header: 'Items',
  config: {
    dataSource: 'items',
    columnSettings: mainColumns,
  },
  fields: [
    ...tableFields,
    { dataTable: nestedChildDT },
  ],
};

// Tabs/Accordion wrappers
const tabsGroup: SettingsItem = {
  header: 'Tabbed',
  tabs: [
    { title: 'General', fields: [{ name: 'tabA', label: 'Tab A', type: 'text' }] },
    { title: 'Advanced', fields: [{ name: 'tabB', label: 'Tab B', type: 'text' }], hidden: () => false },
  ],
};

const accordionGroup: SettingsItem = {
  header: 'Accordion',
  accordion: [
    { title: 'Section 1', fields: [{ name: 'acc1', label: 'Acc1', type: 'text' }], open: true },
    { title: 'Section 2', fields: [{ name: 'acc2', label: 'Acc2', type: 'text' }] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('FormRenderer', () => {
  test('renders basic fields; hidden/disabled respected; onChange fires', async () => {
    const onChange = vi.fn();
    const u = userEvent.setup({ pointerEventsCheck: 0 });

    render(
      <FormRenderer
        fieldSettings={baseFields}
        dataSource={{ name: '', age: '', dob: '', role: '', secret: 'x', locked: 'y', email: '' }}
        onSubmit={vi.fn()}
        onChange={onChange}
      />
    );

    // visible fields
    expect(await screen.findByTestId('text-name')).toBeInTheDocument();
    expect(screen.getByTestId('number-age')).toBeInTheDocument();
    expect(screen.getByTestId('date-dob')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-role')).toBeInTheDocument();

    // hidden & disabled
    expect(screen.queryByTestId('text-secret')).toBeNull();
    expect(screen.getByTestId('text-locked')).toBeDisabled();

    // simulate changes trigger onChange (top-level)
    await u.type(screen.getByTestId('text-name'), 'Alpha');
    await u.type(screen.getByTestId('number-age'), '3');

    // select "Admin" on the mocked <select>
    await u.selectOptions(screen.getByTestId('dropdown-role'), 'Admin');
    expect((screen.getByTestId('dropdown-role') as HTMLSelectElement).value).toBe('Admin');

    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });

  test('renders Tabs & Accordion groups', async () => {
    render(
      <FormRenderer
        fieldSettings={[tabsGroup, accordionGroup]}
        dataSource={{ tabA: '', tabB: '', acc1: '', acc2: '' }}
        onSubmit={vi.fn()}
      />
    );

    // Tabs: find by roles + real tab titles
    const tablist = screen.getByRole('tablist');
    const generalTab  = within(tablist).getByRole('tab', { name: /general/i });
    const advancedTab = within(tablist).getByRole('tab', { name: /advanced/i });

    // General is selected initially; its field should be present
    expect(generalTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('text-tabA')).toBeInTheDocument();

    // Switch to Advanced; its field should be present
    await userEvent.click(advancedTab);
    await waitFor(() => expect(advancedTab).toHaveAttribute('aria-selected', 'true'));
    expect(screen.getByTestId('text-tabB')).toBeInTheDocument();

    // Accordion: section titles visible
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();

    // Section 1 is open by default and shows its input
    expect(screen.getByTestId('text-acc1')).toBeInTheDocument();

    // Open Section 2 to see its field
    await userEvent.click(screen.getByText('Section 2'));
    expect(screen.getByTestId('text-acc2')).toBeInTheDocument();
  });

  test('DataTable draft → Add creates a new row (and initializes nested child arrays)', async () => {
    const onChange = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={[{ dataTable: mainDT } as any]}
        dataSource={{ items: [{ name: 'A', qty: 1, lines: [{ line: 'L1' }] }] }}
        onSubmit={vi.fn()}
        onChange={onChange}
      />
    );

    const draftName = await screen.findByTestId('text-items-name');
    const draftQty  = await screen.findByTestId('number-items-qty');

    const addBtn = screen.getByTestId('btn-add-items');
    expect(addBtn).toBeDisabled();

    await userEvent.type(draftName, 'NewItem');
    await userEvent.type(draftQty, '5');

    await waitFor(() => expect(addBtn).toBeEnabled());
    await userEvent.click(addBtn);

    // ✅ Assert against the mocked DataTable DOM
    await waitFor(() => {
      const row0 = screen.getByTestId('dt-row-0');
      expect(row0).toHaveTextContent('"name":"NewItem"');
      expect(row0).toHaveTextContent('"qty":5');
    });

    // Also verify updated form values + child array init
    const values = ref.current!.getValues();
    expect(values.items[0]).toMatchObject({ name: 'NewItem', qty: 5 });
    expect(Array.isArray(values.items[0].lines)).toBe(true);
    expect(values.items[0].lines).toHaveLength(0);

    expect(onChange).toHaveBeenCalled();

    // Draft cleared
    expect((await screen.findByTestId('text-items-name') as HTMLInputElement).value).toBe('');
    expect((await screen.findByTestId('number-items-qty') as HTMLInputElement).value).toBe('');
  });

  test('onActiveRowChange seeds inputs; Update writes back and deselects; Delete removes row; Cancel clears drafts', async () => {
    const onChange = vi.fn();

    render(
      <FormRenderer
        fieldSettings={[{ dataTable: mainDT } as any]}
        dataSource={{ items: [{ name: 'Seed', qty: 2, lines: [] }] }}
        onSubmit={vi.fn()}
        onChange={onChange}
      />
    );

    // Update is disabled until a row is activated
    const upd = screen.getByTestId('btn-update-items');
    expect(upd).toBeDisabled();

    // Activate row 0 via the mock's selector button
    await userEvent.click(screen.getByTestId('dt-select-0'));
    await waitFor(() => expect(upd).toBeEnabled());

    // Seeded inputs exist with namespaced index
    const seededName = screen.getByTestId('text-items-0-name') as HTMLInputElement;
    const seededQty  = screen.getByTestId('number-items-0-qty') as HTMLInputElement;

    await waitFor(() => {
      expect(seededName.value).toBe('Seed');
      expect(seededQty.value).toBe('2');
    });

    // Change and Update
    await userEvent.clear(seededName);
    await userEvent.type(seededName, 'Edited');

    // For number inputs, directly set the value to avoid append issues
    fireEvent.change(seededQty, { target: { value: '7' } });

    await userEvent.click(upd);

    // Assert via parsed JSON from the mock row
    await waitFor(() => {
      const row0 = screen.getByTestId('dt-row-0');
      const json = JSON.parse(within(row0).getByText(/\{.*\}/).textContent || '{}');
      expect(json).toMatchObject({ name: 'Edited', qty: 7 });
    });

    // Update auto-deselects: button becomes disabled again
    await waitFor(() => expect(screen.getByTestId('btn-update-items')).toBeDisabled());

    // Re-select and delete
    await userEvent.click(screen.getByTestId('dt-select-0'));
    await waitFor(() => expect(screen.getByTestId('btn-delete-items')).toBeEnabled());
    await userEvent.click(screen.getByTestId('btn-delete-items'));

    // Row removed from mocked table
    await waitFor(() => expect(screen.queryByTestId('dt-row-0')).toBeNull());

    // Draft + Cancel clears draft fields
    await userEvent.type(screen.getByTestId('text-items-name'), 'DraftOnly');
    await userEvent.click(screen.getByTestId('btn-cancel-items'));
    expect((screen.getByTestId('text-items-name') as HTMLInputElement).value).toBe('');
  });

  test('submit: valid path returns full values with table rows', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={[...baseFields, { dataTable: mainDT } as any]}
        dataSource={{ name: 'N', age: 3, dob: '2025-01-01', role: 'User', email: 'a@b.com', items: [] }}
        onSubmit={onSubmit}
      />
    );

    // Add one item
    await userEvent.type(screen.getByTestId('text-items-name'), 'Row1');
    await userEvent.type(screen.getByTestId('number-items-qty'), '9');
    await userEvent.click(screen.getByTestId('btn-add-items'));

    // Call imperative submit
    await act(async () => {
      await ref.current!.submit();
    });

    expect(onSubmit).toHaveBeenCalled();
    const payload = onSubmit.mock.calls.at(-1)?.[0];
    expect(payload.valid).toBe(true);
    expect(payload.values).toMatchObject({
      name: 'N',
      age: 3,
      role: 'User',
      email: 'a@b.com',
      items: [{ name: 'Row1', qty: 9, lines: [] }],
    });
  });

  test('submit: invalid base field reports invalidFields and focuses first error', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={baseFields}
        dataSource={{ name: 'X', age: 1, dob: '', role: '', email: 'not-an-email' }}
        onSubmit={onSubmit}
      />
    );

    await act(async () => {
      await ref.current!.submit();
    });

    expect(onSubmit).toHaveBeenCalled();
    const res = onSubmit.mock.calls.at(-1)?.[0];
    expect(res.valid).toBe(false);
    // email has validation z.string().email('Invalid email')
    expect(res.invalidFields?.some((f: any) => f.field === 'email' && /invalid/i.test(f.error))).toBe(true);
  });

  test('submit: when a DataTable row is active, its fields are validated and errors reported', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    // Add simple validation on DT fields (required & positive)
    const validatedDT: DataTableSection = {
      ...mainDT,
      fields: [
        {
          name: 'name',
          label: 'Item Name',
          type: 'text',
          validation: (v: typeof z) => v.string().min(1, 'Name required'),
        } as FieldSetting,
        {
          name: 'qty',
          label: 'Qty',
          type: 'number',
          validation: (v: typeof z) => v.number().positive('Qty must be > 0'),
        } as FieldSetting,
      ],
    };

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={[{ dataTable: validatedDT } as any]}
        dataSource={{ items: [{ name: '', qty: 0 }] }}
        onSubmit={onSubmit}
      />
    );

    // --- Activate row 0 (try several plausible targets) ---
    const candidates = [
      'dt-select-0',
      'activate-row-0',
      'row-0',
      'column-0-name',
      'column-0-id',
    ];
    let activated = false;
    for (const id of candidates) {
      const el = screen.queryByTestId(id);
      if (!el) continue;
      await userEvent.click(el);
      // activation renders seeded inputs under items.0.*
      try {
        await screen.findByTestId('text-items-0-name', {}, { timeout: 300 });
        activated = true;
        break;
      } catch {
        /* try the next selector */
      }
    }
    if (!activated) {
      // final fallback: click any first-row cell if available
      const anyCell = screen.queryByTestId(/column-0-.+/);
      if (anyCell) {
        await userEvent.click(anyCell);
        await screen.findByTestId('text-items-0-name', {}, { timeout: 300 });
        activated = true;
      }
    }
    expect(activated).toBe(true);

    // Call imperative submit
    await act(async () => {
      await ref.current!.submit();
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const res = onSubmit.mock.calls.at(-1)?.[0];
    expect(res.valid).toBe(false);

    const errs = res.invalidFields ?? [];
    expect(errs.some((e: any) => e.field === 'items.0.name' && /required/i.test(e.error))).toBe(true);
    expect(errs.some((e: any) => e.field === 'items.0.qty' && />\s*0/i.test(e.error))).toBe(true);
  });

  test('disabled: all inputs are disabled and table actions are effectively blocked', async () => {
    render(
      <FormRenderer
        fieldSettings={[...baseFields, { dataTable: mainDT } as any]}
        dataSource={{
          name: 'Joe',
          age: 30,
          dob: '2025-01-01',
          role: 'User',
          email: 'j@x.com',
          items: [], // ensure array
        }}
        onSubmit={vi.fn()}
        disabled
      />
    );

    // Top-level fields disabled
    expect(await screen.findByTestId('text-name')).toBeDisabled();
    expect(screen.getByTestId('number-age')).toBeDisabled();
    expect(screen.getByTestId('date-dob')).toBeDisabled();
    expect(screen.getByTestId('dropdown-role')).toBeDisabled();
    expect(screen.getByTestId('text-email')).toBeDisabled();

    // Draft inputs (for table) also disabled
    expect(screen.getByTestId('text-items-name')).toBeDisabled();
    expect(screen.getByTestId('number-items-qty')).toBeDisabled();

    // Both DataTables (main + nested) are disabled
    const allTables = screen.getAllByTestId('mock-datatable');
    expect(allTables.length).toBeGreaterThan(0);
    for (const dt of allTables) {
      expect(dt).toHaveAttribute('data-disabled', 'true');
    }

    // Because inputs are disabled, Add stays disabled
    expect(screen.getByTestId('btn-add-items')).toBeDisabled();
  });

  test('loading: renders skeleton; toggling off shows form fields', async () => {
    const { rerender } = render(
      <FormRenderer
        fieldSettings={baseFields}
        dataSource={{ name: '', age: '', dob: '', role: '', email: '' }}
        onSubmit={vi.fn()}
        loading
      />
    );

    // Skeleton shown; inputs not rendered
    expect(screen.getByTestId('form-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('text-name')).toBeNull();

    // Turn loading off → fields render
    rerender(
      <FormRenderer
        fieldSettings={baseFields}
        dataSource={{ name: '', age: '', dob: '', role: '', email: '' }}
        onSubmit={vi.fn()}
        loading={false}
      />
    );

    expect(await screen.findByTestId('text-name')).toBeInTheDocument();
    expect(screen.queryByTestId('form-skeleton')).toBeNull();
  });

  test('custom fields: toggle enables Custom ID, uppercases value, and validates UUID', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    // Standalone Custom Input group (copied/minified from your demo)
    const customSection: SettingsItem = {
      header: 'Custom Input Component',
      fields: [
        {
          name: 'custom.enableIdEdit',
          label: 'Enable ID Editing',
          // boolean validation so RHF has a schema
          validation: (z) => z.boolean(),
          render: ({ common, fieldState }) => (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>
                {common.label}
              </label>
              <input
                type="checkbox"
                name={common.name}
                checked={!!common.value}
                onChange={(e) => common.onChange((e.target as HTMLInputElement).checked)}
                onBlur={common.onBlur}
                disabled={common.disabled}
                data-testid="toggle-enable-id-edit"
              />
              {fieldState.error && (
                <div style={{ color: 'var(--danger)', marginTop: 4, fontSize: 13 }}>
                  {fieldState.error.message}
                </div>
              )}
            </div>
          ),
        },
        {
          name: 'custom.id',
          label: 'Custom ID',
          placeholder: 'e.g. ABCD-1234-EFGH',
          // UUID validation (same semantics as your demo)
          validation: (z) => z.string().uuid({ message: 'Must be a valid UUID' }),
          // disabled depends on the toggle above
          disabled: (values) => !values?.custom?.enableIdEdit,
          render: ({ common, fieldState }) => {
            const upper = (common.value ?? '').toString().toUpperCase();
            return (
              <div style={{ marginBottom: '1rem' }}>
                <label
                  htmlFor={common.name}
                  style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}
                >
                  {common.label}
                </label>
                <input
                  id={common.name}
                  name={common.name}
                  value={upper}
                  onChange={(e) => common.onChange((e.target as HTMLInputElement).value)}
                  onBlur={common.onBlur}
                  placeholder={common.placeholder}
                  disabled={common.disabled}
                />
                {fieldState.error && (
                  <div style={{ color: 'red', marginTop: 4, fontSize: 13 }}>
                    {fieldState.error.message}
                  </div>
                )}
              </div>
            );
          },
        },
      ],
    };

    // Standalone initial data
    const data = {
      custom: {
        enableIdEdit: false, // starts disabled
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', // any UUID (will render uppercased)
      },
    };

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={[customSection]}
        dataSource={data}
        onSubmit={onSubmit}
      />
    );

    // The Custom ID input is associated with its label via htmlFor
    const idInput = screen.getByRole('textbox', { name: /custom id/i }) as HTMLInputElement;
    expect(idInput).toBeDisabled();

    // Toggle on editing
    const toggle = screen.getByTestId('toggle-enable-id-edit');
    await userEvent.click(toggle);

    await waitFor(() => expect(idInput).toBeEnabled());

    // Type lowercase -> rendered uppercase
    await userEvent.clear(idInput);
    await userEvent.type(idInput, 'not-a-uuid');
    expect(idInput.value).toBe('NOT-A-UUID');

    // Submit -> invalid UUID
    await act(async () => {
      await ref.current!.submit();
    });
    let res = onSubmit.mock.calls.at(-1)?.[0];
    expect(res.valid).toBe(false);
    expect(res.invalidFields.some(
      (e: any) => e.field === 'custom.id' && /valid uuid/i.test(e.error)
    )).toBe(true);

    // Fix to valid UUID -> submit ok
    await userEvent.clear(idInput);
    await userEvent.type(idInput, '3fa85f64-5717-4562-b3fc-2c963f66afa6');
    await act(async () => {
      await ref.current!.submit();
    });
    res = onSubmit.mock.calls.at(-1)?.[0];
    expect(res.valid).toBe(true);
  });

  test('DataTable disabled: via values function AND via static boolean', async () => {
    // (A) Function-based disabled when mode === 'disabled'
    const dtFunc: DataTableSection = {
      ...baseDT,
      disabled: (v: any) => v?.demoTable?.mode === 'disabled',
    };

    const dsA = { demoTable: { mode: 'disabled', rows: mkRows() } };
    const { unmount } = render(
      <FormRenderer fieldSettings={[{ dataTable: dtFunc } as any]} dataSource={dsA} onSubmit={vi.fn()} />
    );

    // Our DataTable mock exposes data-disabled attr
    expect(await screen.findAllByTestId('mock-datatable')).toHaveLength(1);
    expect(screen.getByTestId('mock-datatable')).toHaveAttribute('data-disabled', 'true');

    // Action buttons disabled (note: testIDs include the dot from dataSource key)
    expect(screen.getByTestId('btn-add-demoTable.rows')).toBeDisabled();
    expect(screen.getByTestId('btn-update-demoTable.rows')).toBeDisabled();
    expect(screen.getByTestId('btn-delete-demoTable.rows')).toBeDisabled();

    unmount();

    // (B) Static disabled: disabled: true should also disable regardless of values
    const dtStatic: DataTableSection = { ...baseDT, disabled: true };
    const dsB = { demoTable: { mode: 'enabled', rows: mkRows() } };

    render(
      <FormRenderer fieldSettings={[{ dataTable: dtStatic } as any]} dataSource={dsB} onSubmit={vi.fn()} />
    );

    expect(await screen.findByTestId('mock-datatable')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByTestId('btn-add-demoTable.rows')).toBeDisabled();
    expect(screen.getByTestId('btn-update-demoTable.rows')).toBeDisabled();
    expect(screen.getByTestId('btn-delete-demoTable.rows')).toBeDisabled();
  });

  test('DataTable hidden: via values function AND via static boolean', async () => {
    // (A) Function-based hidden when mode === 'hidden'
    const dtHiddenFunc: DataTableSection = {
      ...baseDT,
      hidden: (v: any) => v?.demoTable?.mode === 'hidden',
    };
    const dsA = { demoTable: { mode: 'hidden', rows: mkRows() } };

    const { unmount } = render(
      <FormRenderer fieldSettings={[{ dataTable: dtHiddenFunc } as any]} dataSource={dsA} onSubmit={vi.fn()} />
    );

    // Should NOT render the table nor its buttons
    expect(screen.queryByTestId('mock-datatable')).toBeNull();
    expect(screen.queryByTestId('btn-add-demoTable.rows')).toBeNull();
    expect(screen.queryByTestId('btn-update-demoTable.rows')).toBeNull();
    expect(screen.queryByTestId('btn-delete-demoTable.rows')).toBeNull();

    unmount();

    // (B) Static hidden
    const dtHiddenStatic: DataTableSection = { ...baseDT, hidden: true };
    const dsB = { demoTable: { mode: 'enabled', rows: mkRows() } };

    render(
      <FormRenderer fieldSettings={[{ dataTable: dtHiddenStatic } as any]} dataSource={dsB} onSubmit={vi.fn()} />
    );

    expect(screen.queryByTestId('mock-datatable')).toBeNull();
    expect(screen.queryByTestId('btn-add-demoTable.rows')).toBeNull();
    expect(screen.queryByTestId('btn-update-demoTable.rows')).toBeNull();
    expect(screen.queryByTestId('btn-delete-demoTable.rows')).toBeNull();
  });

  test('conditional validation: schema changes with values (custom vs others)', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    const conditionalFields: FieldSetting[] = [
      {
        name: 'conditional.validationOption',
        label: 'Validation Mode',
        type: 'dropdown',
        options: [
          { value: 'standard', text: 'Standard' },
          { value: 'custom', text: 'Custom (requires an enabled input)' },
          { value: 'advanced', text: 'Advanced' },
        ],
        validation: (z) => z.enum(['standard','custom','advanced']),
      } as any,
      {
        name: 'conditional.conditionalInput',
        label: 'Conditional Input',
        type: 'text',
        disabled: (values: any) => values?.conditional?.validationOption !== 'custom',
        validation: (z, values: any) =>
          values?.conditional?.validationOption === 'custom'
            ? z.string().min(1, 'Required when Custom mode is active.').max(5, 'Max 5 characters in Custom mode.')
            : z.string().optional(),
      } as any,
    ];

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={conditionalFields}
        dataSource={{ conditional: { validationOption: 'standard', conditionalInput: '' } }}
        onSubmit={onSubmit}
      />
    );

    // Submit in standard → valid even with empty input
    await act(async () => { await ref.current!.submit(); });
    let res = onSubmit.mock.calls.at(-1)?.[0];
    expect(res.valid).toBe(true);

    // 🔧 NOTE: use sanitized test ids (dots -> hyphens)
    const modeSelect = screen.getByTestId('dropdown-conditional-validationOption');
    await userEvent.selectOptions(modeSelect, 'custom');

    // Now enabled & required
    const input = screen.getByTestId('text-conditional-conditionalInput') as HTMLInputElement;
    expect(input).toBeEnabled();

    // Submit empty → invalid (required)
    await act(async () => { await ref.current!.submit(); });
    res = onSubmit.mock.calls.at(-1)?.[0];
    expect(res.valid).toBe(false);
    expect(res.invalidFields.some(
      (e: any) => e.field === 'conditional.conditionalInput' && /required/i.test(e.error)
    )).toBe(true);

    // Over 5 chars → invalid (max 5)
    await userEvent.type(input, '123456');
    await act(async () => { await ref.current!.submit(); });
    res = onSubmit.mock.calls.at(-1)?.[0];
    expect(res.valid).toBe(false);
    expect(res.invalidFields.some(
      (e: any) => e.field === 'conditional.conditionalInput' && /max 5/i.test(e.error)
    )).toBe(true);

    // Exactly 5 chars → valid
    await userEvent.clear(input);
    await userEvent.type(input, '12345');
    await act(async () => { await ref.current!.submit(); });
    res = onSubmit.mock.calls.at(-1)?.[0];
    expect(res.valid).toBe(true);
  });

  test('clear icons reset values for text, number, date, and dropdown', async () => {
    const ref = React.createRef<FormRendererRef<any>>();

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={baseFields}
        dataSource={{
          name: 'Bob',
          age: 42,
          dob: '2025-01-01',
          role: 'Admin',
          email: 'bob@example.com',
        }}
        onSubmit={vi.fn()}
      />
    );

    // sanity: all fields prefilled
    expect((await screen.findByTestId('text-name') as HTMLInputElement).value).toBe('Bob');
    expect((screen.getByTestId('number-age') as HTMLInputElement).value).toBe('42');
    expect((screen.getByTestId('date-dob') as HTMLInputElement).value).toBe('2025-01-01');
    expect((screen.getByTestId('dropdown-role') as HTMLSelectElement).value).toBe('Admin');
    expect((screen.getByTestId('text-email') as HTMLInputElement).value).toBe('bob@example.com');

    // click each clear icon
    await userEvent.click(screen.getByTestId('text-name-clear-icon'));
    await userEvent.click(screen.getByTestId('number-age-clear-icon'));
    await userEvent.click(screen.getByTestId('date-dob-clear-icon'));
    await userEvent.click(screen.getByTestId('dropdown-role-clear-icon'));
    await userEvent.click(screen.getByTestId('text-email-clear-icon'));

    // DOM inputs are cleared
    expect((screen.getByTestId('text-name') as HTMLInputElement).value).toBe('');
    expect((screen.getByTestId('number-age') as HTMLInputElement).value).toBe('');
    expect((screen.getByTestId('date-dob') as HTMLInputElement).value).toBe('');
    expect((screen.getByTestId('dropdown-role') as HTMLSelectElement).value).toBe('');
    expect((screen.getByTestId('text-email') as HTMLInputElement).value).toBe('');

    // Form state reflects clears (number could coerce to ''/undefined depending on your internals)
    const v = ref.current!.getValues();
    expect(v.name ?? '').toBe('');
    expect(v.age == null || v.age === '' || Number.isNaN(v.age)).toBe(true);
    expect(v.dob ?? '').toBe('');
    expect(v.role ?? '').toBe('');
    expect(v.email ?? '').toBe('');
  });

  test('submit updated flag: first submit false if unchanged; second unchanged false; change then true', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={[
          { name: 'name',  label: 'Name', type: 'text' },
          { name: 'email', label: 'Email', type: 'text', validation: (z) => z.string().email('Invalid email') },
        ]}
        dataSource={{ name: 'Alice', email: 'not-email' }}
        onSubmit={onSubmit}
      />
    );

    // ensure initial effects (baseline hash seed) have run
    await screen.findByTestId('text-name');

    // 1) first submit with no changes -> updated: false
    await act(async () => { await ref.current!.submit(); });
    expect(onSubmit).toHaveBeenCalled();
    let res = onSubmit.mock.calls.at(-1)?.[0];
    expect(res.valid).toBe(false);
    expect(res.updated).toBe(false);

    // 2) second submit still unchanged -> updated: false
    await act(async () => { await ref.current!.submit(); });
    res = onSubmit.mock.calls.at(-1)?.[0];
    expect(res.valid).toBe(false);
    expect(res.updated).toBe(false);

    // 3) fix email -> valid submit -> updated: true
    await userEvent.clear(screen.getByTestId('text-email'));
    await userEvent.type(screen.getByTestId('text-email'), 'alice@example.com');

    await act(async () => { await ref.current!.submit(); });
    res = onSubmit.mock.calls.at(-1)?.[0];
    expect(res.valid).toBe(true);
    expect(res.updated).toBe(true);
  });

  test('error summary dock: appears only after submit, collapsed by default, chevron opens, chevron collapses again', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={[
          { name: 'email', label: 'Email', type: 'text', validation: (z) => z.string().email('Invalid email') },
          { name: 'role',  label: 'Role',  type: 'dropdown', options: [{ value: 'Admin', text: 'Admin' }] },
        ]}
        dataSource={{ email: 'bad', role: '' }}
        onSubmit={onSubmit}
      />
    );

    // not mounted before submit
    expect(document.querySelector('.error-summary-panel')).toBeNull();

    // submit invalid → dock mounts (collapsed)
    await act(async () => { await ref.current!.submit(); });

    const dock = document.querySelector('.error-summary-panel') as HTMLElement;
    expect(dock).toBeInTheDocument();

    // grab the mocked DataTable inside the dock
    const dt = within(dock).getByTestId('mock-datatable');
    // Content wrapper is the nearest ancestor with aria-hidden
    const contentWrap = dt.closest('[aria-hidden]') as HTMLElement;
    expect(contentWrap).toHaveAttribute('aria-hidden', 'true'); // collapsed by default

    // open via chevron (last right icon in panel header)
    const headerIcons = within(dock).getAllByTestId('icon');
    expect(headerIcons.length).toBeGreaterThan(0);
    const chevron = headerIcons[headerIcons.length - 1];
    await userEvent.click(chevron);

    // expanded now
    await waitFor(() => {
      expect(contentWrap).toHaveAttribute('aria-hidden', 'false');
    });

    // rows exist (mock renders <li> items)
    const rows = within(dt).getAllByRole('listitem');
    expect(rows.length).toBeGreaterThan(0);

    // collapse again via chevron
    await userEvent.click(chevron);
    await waitFor(() => {
      expect(contentWrap).toHaveAttribute('aria-hidden', 'true');
    });
  });

  test('error summary: enableErrorBox=false prevents mounting even on invalid submit', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={[
          { name: 'email', label: 'Email', type: 'text', validation: (z) => z.string().email('Invalid email') },
        ]}
        dataSource={{ email: 'nope' }}
        onSubmit={onSubmit}
        enableErrorBox={false}
      />
    );

    await act(async () => { await ref.current!.submit(); });
    expect(onSubmit).toHaveBeenCalled();
    // dock never appears
    expect(document.querySelector('.error-summary-panel')).toBeNull();
  });

  test('error summary: custom title via errorBoxConfig', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={[
          { name: 'email', label: 'Email', type: 'text', validation: (z) => z.string().email('Invalid email') },
        ]}
        dataSource={{ email: 'x' }}
        onSubmit={onSubmit}
        errorBoxConfig={{ title: 'Form Issues', width: 640, bottomOffset: 12 }}
      />
    );

    await act(async () => { await ref.current!.submit(); });
    // panel mounts with the custom title
    const dock = document.querySelector('.error-summary-panel') as HTMLElement;
    expect(dock).toBeInTheDocument();
    expect(within(dock).getByText('Form Issues')).toBeInTheDocument();
  });

  test('submit() resolves with same payload as onSubmit (valid + updated flag)', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={[{ name: 'name', label: 'Name', type: 'text' }]}
        dataSource={{ name: 'A' }}
        onSubmit={onSubmit}
      />
    );

    await screen.findByTestId('text-name'); // ensure baseline hash seeded

    const r1 = await ref.current!.submit();
    expect(onSubmit).toHaveBeenCalled();
    const c1 = onSubmit.mock.calls.at(-1)![0];
    expect(r1).toEqual(c1);
    expect(r1.valid).toBe(true);

    // First submit with no edits should NOT be marked updated
    expect(r1.updated).toBe(false);

    // second submit without changes → updated=false
    const r2 = await ref.current!.submit();
    const c2 = onSubmit.mock.calls.at(-1)![0];
    expect(r2).toEqual(c2);
    expect(r2.updated).toBe(false);
  });

  test('submit() resolves with invalidFields when invalid', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={[{ name: 'email', label: 'Email', type: 'text', validation: (z) => z.string().email('Invalid email') }]}
        dataSource={{ email: 'nope' }}
        onSubmit={onSubmit}
      />
    );

    const r = await ref.current!.submit();
    expect(onSubmit).toHaveBeenCalled();
    expect(r.valid).toBe(false);
    expect(r.invalidFields.some(f => f.field === 'email' && /invalid/i.test(f.error))).toBe(true);
  });

  test('auto-focuses first invalid base field and attempts to scroll', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    // stub scroll helpers
    (HTMLElement.prototype as any).scrollIntoView = vi.fn();
    (HTMLElement.prototype as any).scrollTo = vi.fn();

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={[
          { name: 'name',  label: 'Name',  type: 'text' },
          // invalid email on submit
          { name: 'email', label: 'Email', type: 'text', validation: (z) => z.string().email('Invalid email') },
        ]}
        dataSource={{ name: 'Alice', email: 'nope' }}
        onSubmit={onSubmit}
      />
    );

    await act(async () => { await ref.current!.submit(); });

    expect(onSubmit).toHaveBeenCalled();
    const emailInput = screen.getByTestId('text-email');
    // wait until focus settles (focus is scheduled via rAF)
    await waitFor(() => {
      expect(document.activeElement).toBe(emailInput);
    });
  });

  test('auto-opens Accordion section containing invalid field and focuses it', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    const accordionWithInvalidSecond: SettingsItem = {
      header: 'Accordion',
      accordion: [
        { title: 'Section 1', fields: [{ name: 'acc1', label: 'Acc1', type: 'text' }], open: true },
        {
          title: 'Section 2',
          fields: [{
            name: 'acc2',
            label: 'Acc2',
            type: 'text',
            validation: (z) => z.string().min(1, 'Required in Section 2'),
          }],
        },
      ],
    };

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={[accordionWithInvalidSecond]}
        dataSource={{ acc1: 'ok', acc2: '' }} // acc2 invalid
        onSubmit={onSubmit}
      />
    );

    // Accordion shell present
    const acc = await screen.findByTestId('mock-accordion');

    // Resolve the <details> nodes via their visible titles
    const sec1Details = within(acc).getByText('Section 1').closest('details') as HTMLElement;
    const sec2Details = within(acc).getByText('Section 2').closest('details') as HTMLElement;

    // We only need to assert that Section 2 starts closed.
    expect(sec2Details).not.toHaveAttribute('open');

    // Submit -> renderer should auto-open Section 2 (contains invalid field)
    await act(async () => { await ref.current!.submit(); });

    // Section 2 becomes open
    await waitFor(() => {
      const s2 = within(screen.getByTestId('mock-accordion'))
        .getByText('Section 2')
        .closest('details') as HTMLElement;
      expect(s2).toHaveAttribute('open');
    });

    // Focus should land on the invalid field
    const acc2Input = await screen.findByTestId('text-acc2');
    await waitFor(() => expect(document.activeElement).toBe(acc2Input));
  });


  test('auto-switches Tabs to reveal invalid field and focuses it', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    const tabs: SettingsItem = {
      header: 'Tabbed',
      tabs: [
        { title: 'General',  fields: [{ name: 'general.ok', label: 'OK', type: 'text' }] },
        { title: 'Advanced', fields: [{
          name: 'advanced.req',
          label: 'Required in Advanced',
          type: 'text',
          validation: (z) => z.string().min(1, 'Required'),
        }]},
      ],
    };

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={[tabs]}
        dataSource={{ general: { ok: 'x' }, advanced: { req: '' } }} // invalid lives on Advanced
        onSubmit={onSubmit}
      />
    );

    // General visible initially
    const tablist = screen.getByRole('tablist');
    const generalTab = within(tablist).getByRole('tab', { name: /general/i });
    const advancedTab = within(tablist).getByRole('tab', { name: /advanced/i });
    expect(generalTab).toHaveAttribute('aria-selected', 'true');
    expect(advancedTab).toHaveAttribute('aria-selected', 'false');

    await act(async () => { await ref.current!.submit(); });

    // Form should switch Tabs to "Advanced"
    await waitFor(() => {
      expect(advancedTab).toHaveAttribute('aria-selected', 'true');
    });

    const advInput = screen.getByTestId('text-advanced-req');
    await waitFor(() => {
      expect(document.activeElement).toBe(advInput);
    });
  });

  test('reset(): reverts values to dataSource and re-seeds updated baseline', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    render(
      <FormRenderer
        ref={ref}
        fieldSettings={[{ name: 'name', label: 'Name', type: 'text' }]}
        dataSource={{ name: 'Seed' }}
        onSubmit={onSubmit}
      />
    );

    // ensure initial effects ran
    const nameInput = await screen.findByTestId('text-name') as HTMLInputElement;
    expect(nameInput.value).toBe('Seed');

    // change before submit -> updated true
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Edited');
    const r1 = await act(async () => await ref.current!.submit());
    const c1 = onSubmit.mock.calls.at(-1)![0];
    expect(r1).toEqual(c1);
    expect(c1.updated).toBe(true);

    // call reset -> value returns to dataSource
    await act(async () => { ref.current!.reset(); });
    await waitFor(() =>
      expect((screen.getByTestId('text-name') as HTMLInputElement).value).toBe('Seed')
    );

    // submit after reset without changes -> updated false
    const r2 = await act(async () => await ref.current!.submit());
    const c2 = onSubmit.mock.calls.at(-1)![0];
    expect(r2).toEqual(c2);
    expect(c2.updated).toBe(false);

    // change again -> updated true
    await userEvent.clear(screen.getByTestId('text-name'));
    await userEvent.type(screen.getByTestId('text-name'), 'Again');
    const r3 = await act(async () => await ref.current!.submit());
    const c3 = onSubmit.mock.calls.at(-1)![0];
    expect(r3).toEqual(c3);
    expect(c3.updated).toBe(true);
  });

  test('prop change: dataSource updates fields/tables and reseeds updated baseline', async () => {
    const onSubmit = vi.fn();
    const ref = React.createRef<FormRendererRef<any>>();

    const fields: SettingsItem[] = [
      { name: 'name', label: 'Name', type: 'text' },
      { dataTable: {
          header: 'Items',
          config: { dataSource: 'items', columnSettings: [{ title: 'Name', column: 'name' }] },
          fields: [{ name: 'name', label: 'Item Name', type: 'text' }, { name: 'qty', label: 'Qty', type: 'number' }],
        } as DataTableSection },
    ] as any;

    const { rerender } = render(
      <FormRenderer
        ref={ref}
        fieldSettings={fields}
        dataSource={{ name: 'A', items: [] }}
        onSubmit={onSubmit}
      />
    );

    // initial mount shows A, no rows
    const nameInput = await screen.findByTestId('text-name') as HTMLInputElement;
    expect(nameInput.value).toBe('A');
    expect(screen.queryByTestId('dt-row-0')).toBeNull();

    // RERENDER with a new dataSource (simulate props change)
    rerender(
      <FormRenderer
        ref={ref}
        fieldSettings={fields}
        dataSource={{ name: 'B', items: [{ name: 'X', qty: 1, lines: [] }] }}
        onSubmit={onSubmit}
      />
    );

    // Inputs reflect new props
    await waitFor(() => expect((screen.getByTestId('text-name') as HTMLInputElement).value).toBe('B'));

    // Mocked DataTable shows one row with new data
    const row0 = await screen.findByTestId('dt-row-0');
    expect(row0).toHaveTextContent('"name":"X"');
    expect(row0).toHaveTextContent('"qty":1');

    // First submit after dataSource change, with NO edits → updated should be FALSE (baseline reseeded)
    const r1 = await ref.current!.submit();
    const c1 = onSubmit.mock.calls.at(-1)![0];
    expect(r1).toEqual(c1);
    expect(r1.valid).toBe(true);
    expect(r1.updated).toBe(false);

    // Make an edit → submit → updated TRUE
    await userEvent.clear(screen.getByTestId('text-name'));
    await userEvent.type(screen.getByTestId('text-name'), 'C');
    const r2 = await ref.current!.submit();
    const c2 = onSubmit.mock.calls.at(-1)![0];
    expect(r2).toEqual(c2);
    expect(r2.valid).toBe(true);
    expect(r2.updated).toBe(true);
  });

  test('error summary dock: shows on Add draft validation failure (collapsed by default)', async () => {
    const onSubmit = vi.fn();

    const validatedAddDT: DataTableSection = {
      header: 'Items',
      config: { dataSource: 'items', columnSettings: [{ title: 'Name', column: 'name' }] },
      fields: [
        {
          name: 'name',
          label: 'Item Name',
          type: 'text',
          // must be >= 3 chars; typing 'aa' enables Add but fails validation
          validation: (v: typeof z) => v.string().min(3, 'Name too short'),
        } as FieldSetting,
      ],
    };

    render(
      <FormRenderer
        fieldSettings={[{ dataTable: validatedAddDT } as any]}
        dataSource={{ items: [] }}
        onSubmit={onSubmit}
      />
    );

    const draftName = await screen.findByTestId('text-items-name');
    // Put a value so Add enables, but keep it invalid for min(3)
    await userEvent.type(draftName, 'aa');

    const addBtn = screen.getByTestId('btn-add-items');
    await waitFor(() => expect(addBtn).toBeEnabled());
    await userEvent.click(addBtn);

    // ErrorSummary should mount (collapsed)
    await waitFor(() => {
      const dock = document.querySelector('.error-summary-panel') as HTMLElement;
      expect(dock).toBeInTheDocument();
      const dt = within(dock).getByTestId('mock-datatable');
      const contentWrap = dt.closest('[aria-hidden]') as HTMLElement;
      expect(contentWrap).toHaveAttribute('aria-hidden', 'true'); // collapsed by default
    });
  });

  test('error summary dock: shows on Update row validation failure (collapsed by default)', async () => {
    const onSubmit = vi.fn();

    const validatedUpdateDT: DataTableSection = {
      header: 'Items',
      config: { dataSource: 'items', columnSettings: [{ title: 'Name', column: 'name' }, { title: 'Qty', column: 'qty' }] },
      fields: [
        {
          name: 'name',
          label: 'Item Name',
          type: 'text',
          validation: (v: typeof z) => v.string().min(1, 'Name required'),
        } as FieldSetting,
        {
          name: 'qty',
          label: 'Qty',
          type: 'number',
          validation: (v: typeof z) => v.number().positive('Qty must be > 0'),
        } as FieldSetting,
      ],
    };

    render(
      <FormRenderer
        fieldSettings={[{ dataTable: validatedUpdateDT } as any]}
        dataSource={{ items: [{ name: '', qty: 0 }] }} // invalid row
        onSubmit={onSubmit}
      />
    );

    // Activate row 0
    await userEvent.click(await screen.findByTestId('dt-select-0'));
    const updateBtn = await screen.findByTestId('btn-update-items');
    await waitFor(() => expect(updateBtn).toBeEnabled());

    // Click Update -> validation fails -> ErrorSummary appears
    await userEvent.click(updateBtn);

    await waitFor(() => {
      const dock = document.querySelector('.error-summary-panel') as HTMLElement;
      expect(dock).toBeInTheDocument();
      const dt = within(dock).getByTestId('mock-datatable');
      const contentWrap = dt.closest('[aria-hidden]') as HTMLElement;
      expect(contentWrap).toHaveAttribute('aria-hidden', 'true'); // collapsed
    });
  });

  test('missing field name: FieldErrorBoundary shows inline error without breaking other fields', async () => {
    // React logs error boundaries to console.error; silence for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <FormRenderer
        fieldSettings={[
          { name: 'ok', label: 'OK', type: 'text' },
          // 🔴 missing name on purpose; keep a col to ensure layout path executes
          { label: 'Broken', type: 'text', col: { xs: 12, sm: 6, md: 4, lg: 3 } } as any,
        ]}
        dataSource={{ ok: '' }}
        onSubmit={vi.fn()}
      />
    );

    // Healthy field still renders
    expect(await screen.findByTestId('text-ok')).toBeInTheDocument();

    // ErrorBoundary fallback renders the thrown message from ThrowMissingFieldName
    // Be lenient on text in case your boundary decorates the message.
    const errNode = await screen.findByText(/missing.*name/i);
    expect(errNode).toBeInTheDocument();

    // Sanity: both live in the same section wrapper so layout doesn't collapse
    const wrappers = document.querySelectorAll('.fields-wrapper');
    expect(wrappers.length).toBeGreaterThan(0);
    const wrapper = wrappers[0] as HTMLElement;
    expect(within(wrapper).getByTestId('text-ok')).toBeInTheDocument();
    expect(within(wrapper).getByText(/missing.*name/i)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test('handles missing dataTable.fields inside Tabs without crashing; DT renders and actions are disabled', async () => {
    const cfg: SettingsItem = {
      tabs: [
        {
          title: 'General',
          fields: [
            {
              dataTable: {
                header: 'Lines',
                config: {
                  dataSource: 'lines',
                  columnSettings: [
                    { title: 'Line', column: 'line' },
                    { title: 'Note', column: 'note' },
                  ],
                },
                // fields intentionally omitted
              } as DataTableSection,
            } as any,
          ],
        },
      ],
    };

    render(
      <FormRenderer
        fieldSettings={[cfg]}
        dataSource={{ lines: [] }}
        onSubmit={vi.fn()}
      />
    );

    // DataTable mock should mount
    const dt = await screen.findByTestId('mock-datatable');
    expect(dt).toBeInTheDocument();

    // No draft inputs because there are no DT leaf fields
    expect(screen.queryByTestId('text-lines-line')).toBeNull();
    expect(screen.queryByTestId('text-lines-note')).toBeNull();

    // Action buttons exist and are disabled (no draft/active row)
    expect(screen.queryByTestId('btn-add-lines')).toBeNull();
    expect(screen.queryByTestId('btn-update-lines')).toBeNull();
    expect(screen.queryByTestId('btn-delete-lines')).toBeNull();
    expect(screen.queryByTestId('btn-cancel-lines')).toBeNull();
  });

});
