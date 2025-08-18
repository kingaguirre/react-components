import React, { createRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';

// ----------------------------------------------------
// Mocks (match the import specifiers used by index.tsx)
// ----------------------------------------------------
vi.mock('../../atoms/Button', () => ({
  Button: (props: any) => {
    const { children, onClick, disabled, type = 'button', ...rest } = props;
    return (
      <button type={type} onClick={onClick} disabled={disabled} {...rest}>
        {children}
      </button>
    );
  },
}));

vi.mock('../../atoms/FormControl', () => ({
  FormControl: (props: any) => {
    const { label, helpText, value, onChange, disabled, ...rest } = props;
    const name = rest.name;
    return (
      <div>
        {label && <label htmlFor={name}>{label}</label>}
        <input
          aria-label={label || name}
          id={name}
          name={name}
          value={value ?? ''}
          onChange={(e) => onChange?.(e)}
          disabled={disabled}
          data-testid={`input-${name}`}
        />
        {helpText ? <div role="alert">{helpText}</div> : null}
      </div>
    );
  },
}));

vi.mock('../../molecules/DatePicker', () => ({
  DatePicker: (props: any) => {
    const { label, helpText, value, onChange, ...rest } = props;
    const name = rest.name;
    return (
      <div>
        {label && <label htmlFor={name}>{label}</label>}
        <input
          aria-label={label || name}
          id={name}
          name={name}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          data-testid={`date-${name}`}
        />
        {helpText ? <div role="alert">{helpText}</div> : null}
      </div>
    );
  },
}));

vi.mock('../../molecules/Dropdown', () => ({
  Dropdown: (props: any) => {
    const { label, helpText, value, onChange, options = [], multiple, ...rest } = props;
    const name = rest.name;
    return (
      <div>
        {label && <label htmlFor={name}>{label}</label>}
        <select
          id={name}
          name={name}
          aria-label={label || name}
          data-testid={`select-${name}`}
          value={Array.isArray(value) ? '' : value ?? ''}
          onChange={(e) => onChange?.(e)}
          multiple={!!multiple}
        >
          <option value="">--</option>
          {options.map((o: any) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.text ?? o.value}
            </option>
          ))}
        </select>
        {helpText ? <div role="alert">{helpText}</div> : null}
      </div>
    );
  },
}));

vi.mock('../../organisms/Tabs', () => ({
  Tabs: ({ tabs }: any) => {
    const [active, setActive] = React.useState(0);
    return (
      <div data-testid="tabs">
        <div>
          {tabs.map((t: any, i: number) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              data-testid={`tab-${i}`}
              aria-label={`tab-${t.title}`}
            >
              {t.title}
              {t.badgeValue ? <span data-testid={`tab-badge-${i}`}>{t.badgeValue}</span> : null}
            </button>
          ))}
        </div>
        <div data-testid="tab-content">{tabs[active]?.content}</div>
      </div>
    );
  },
}));

vi.mock('../../molecules/Accordion', () => ({
  Accordion: ({ items }: any) => {
    return (
      <div data-testid="accordion">
        {items.map((it: any, i: number) => (
          <details key={it.id ?? i} open={!!it.open}>
            <summary>
              {it.title}
              {Array.isArray(it.rightDetails) &&
                it.rightDetails.map((d: any, j: number) => (
                  <span key={j} data-testid={`acc-badge-${i}-${j}`}>{d.value}</span>
                ))}
            </summary>
            <div>{it.children}</div>
          </details>
        ))}
      </div>
    );
  },
}));

vi.mock('../../organisms/DataTable', () => ({
  DataTable: (props: any) => {
    const { dataSource = [], onActiveRowChange } = props;
    return (
      <div data-testid="datatable">
        <div data-testid="row-count">{dataSource.length}</div>
        <div>
          {dataSource.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => onActiveRowChange?.(null, String(i))}
              data-testid={`dt-select-${i}`}
            >
              select-{i}
            </button>
          ))}
        </div>
      </div>
    );
  },
}));

vi.mock('../styled', () => ({
  PageHeader: (p: any) => <h2 {...p} />,
  FieldsWrapper: (p: any) => <div {...p} />,
  SubHeader: (p: any) => <h3 {...p} />,
  FormWrapper: (p: any) => <form {...p} />,
  Description: (p: any) => <p {...p} />,
  SectionWrapper: (p: any) => <section {...p} />,
  ButtonContainer: (p: any) => <div {...p} />,
}));

vi.mock('../components/Skeleton', () => ({ default: () => <div data-testid="skeleton" /> }));
vi.mock('../components/FieldErrorBoundary', () => ({ default: (p: any) => <>{p.children}</> }));
vi.mock('../components/VirtualizedItem', () => ({ default: (p: any) => <div data-field-key={p.fieldKey}>{p.children}</div> }));

// utils: lightweight real behavior so Zod checks are meaningful
vi.mock('../utils', async () => {
  const { z } = await import('zod');

  const getDeepValue = (obj: any, path: string) => {
    if (!path) return obj;
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  };

  const setDeepValue = (obj: any, path: string, val: any) => {
    const segs = path.split('.');
    const next = { ...obj };
    let cur: any = next;
    for (let i = 0; i < segs.length - 1; i++) {
      const k = segs[i];
      cur[k] = cur[k] != null ? { ...cur[k] } : {};
      cur = cur[k];
    }
    cur[segs[segs.length - 1]] = val;
    return next;
  };

  const flattenForSchema = (items: any[]): any[] => {
    const out: any[] = [];
    const walk = (arr: any[]) => {
      for (const it of arr) {
        if (it?.dataTable) {
          walk(it.dataTable.fields || []);
        } else if (Array.isArray(it?.fields)) {
          walk(it.fields);
        } else if (Array.isArray(it?.accordion)) {
          it.accordion.forEach((sec: any) => walk(sec.fields || []));
        } else if (Array.isArray(it?.tabs)) {
          it.tabs.forEach((tab: any) => walk(tab.fields || []));
        } else if (typeof it?.name === 'string') {
          out.push(it);
        }
      }
    };
    walk(items);
    return out;
  };

  const buildSchema = (flat: any[], ctx: any) => {
    const shape: any = {};
    for (const fs of flat) {
      const p = fs.name;
      const schema = typeof fs.validation === 'function' ? fs.validation(z, ctx) : z.any();
      const segs = p.split('.');
      let cur = shape;
      for (let i = 0; i < segs.length - 1; i++) {
        const k = segs[i];
        cur[k] = cur[k] || {};
        cur = cur[k];
      }
      cur[segs[segs.length - 1]] = schema;
    }
    return z.object(shape).strict().partial();
  };

  const isZodRequired = () => false;
  const resolveDisabled = () => false;

  return {
    flattenForSchema,
    buildSchema,
    isZodRequired,
    resolveDisabled,
    getDeepValue,
    setDeepValue,
  };
});

// SUT (after mocks)
import { DynamicForm } from './index';

// ----------------------------------------
// helpers
// ----------------------------------------
const user = userEvent.setup();

function reqStr(msg = 'Required') {
  return (z: typeof z) => z.string().min(1, msg);
}

function buildFieldSettings() {
  return [
    // plain field group
    {
      header: 'Base Info',
      fields: [
        { name: 'firstName', label: 'First Name', type: 'text', validation: reqStr('First name required') },
        {
          name: 'age',
          label: 'Age',
          type: 'number',
          validation: (z: typeof z) =>
            z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().min(18, 'Must be 18+').optional()),
        },
      ],
    },
    // accordion with a required field
    {
      header: 'More',
      accordion: [
        {
          title: 'Acc Section',
          fields: [{ name: 'accField', label: 'Acc Field', type: 'text', validation: reqStr('Acc required') }],
        },
      ],
    },
    // tabs with a required field
    {
      header: 'Tabbed',
      tabs: [
        {
          title: 'Tab 1',
          fields: [{ name: 'tabField', label: 'Tab Field', type: 'text', validation: reqStr('Tab required') }],
        },
        {
          title: 'Tab 2',
          fields: [{ name: 'otherField', label: 'Other', type: 'text' }],
        },
      ],
    },
    // top-level DataTable with nested child DT, and child has accordion + tabs fields
    {
      dataTable: {
        header: 'Parents',
        description: 'parent table',
        config: { dataSource: 'parents', columnSettings: [] },
        fields: [
          { name: 'pname', label: 'Parent Name', type: 'text', validation: reqStr('Parent required') },
          {
            dataTable: {
              header: 'Children',
              config: { dataSource: 'children', columnSettings: [] },
              fields: [
                { name: 'cname', label: 'Child Name', type: 'text', validation: reqStr('Child required') },
                { // accordion inside child
                  accordion: [
                    {
                      title: 'Child-Acc',
                      fields: [{ name: 'cAcc', label: 'Child Acc', type: 'text', validation: reqStr('Child Acc required') }],
                    },
                  ],
                },
                { // tabs inside child
                  tabs: [
                    {
                      title: 'Child Tab',
                      fields: [{ name: 'cTab', label: 'Child Tab', type: 'text', validation: reqStr('Child Tab required') }],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    },
  ];
}

function renderForm(opts?: { data?: any; onSubmit?: any }) {
  const fieldSettings: any = buildFieldSettings();
  const dataSource = opts?.data ?? {
    firstName: '',
    age: '',
    accField: '',
    tabField: '',
    parents: [
      { pname: 'P1', children: [{ cname: '', cAcc: '', cTab: '' }] },
      { pname: 'P2', children: [] },
    ],
  };

  const onSubmit = opts?.onSubmit ?? vi.fn();
  const ref = createRef<any>();

  render(
    <DynamicForm
      ref={ref}
      fieldSettings={fieldSettings as any}
      dataSource={dataSource}
      onSubmit={onSubmit}
      onChange={() => {}}
    />
  );

  return { ref, onSubmit };
}

// ----------------------------------------
// TESTS
// ----------------------------------------
describe('DynamicForm — full feature coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates plain fields on change and on submit', async () => {
    const { ref, onSubmit } = renderForm();

    const first = screen.getByLabelText('First Name');
    await user.clear(first);
    await user.type(first, '');
    expect(await screen.findByRole('alert')).toHaveTextContent('First name required');

    // fix -> error disappears
    await user.type(first, 'John');
    await waitFor(() => {
      expect(screen.queryByText('First name required')).toBeNull();
    });

    // age must be 18+
    const age = screen.getByLabelText('Age');
    await user.clear(age);
    await user.type(age, '17');

    ref.current.submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    const last = onSubmit.mock.calls.at(-1)[0];
    expect(last.valid).toBe(false);
    expect(last.invalidFields.some((f: any) => f.field.endsWith('age') && /18\+/.test(f.error))).toBe(true);
  });

  it('surfacing accordion badge for invalid fields after submit', async () => {
    const { ref, onSubmit } = renderForm();

    // leave accField empty -> submit
    ref.current.submit();

    const badge = await screen.findByTestId('acc-badge-0-0'); // first accordion, first detail
    expect(badge).toHaveTextContent('1');

    const last = onSubmit.mock.calls.at(-1)[0];
    expect(last.valid).toBe(false);
    expect(last.invalidFields.some((f: any) => f.field === 'accField')).toBe(true);
  });

  it('tab shows error badge; switching tabs keeps badge count', async () => {
    const { ref } = renderForm();

    ref.current.submit();

    const badge = await screen.findByTestId('tab-badge-0');
    expect(badge).toHaveTextContent('1');

    await user.click(screen.getByTestId('tab-1'));
    await user.click(screen.getByTestId('tab-0'));
    expect(screen.getByTestId('tab-badge-0')).toHaveTextContent('1');
  });

  it('validates top-level DataTable draft area on submit (no active row)', async () => {
    const { ref, onSubmit } = renderForm();

    // draft field = "parents.pname"
    const draft = screen.getByTestId('input-parents.pname');
    await user.type(draft, 'X'); // hasDraft = true
    await user.clear(draft);     // empty -> Required

    ref.current.submit();

    await waitFor(() => {
      const last = onSubmit.mock.calls.at(-1)[0];
      expect(last.valid).toBe(false);
      expect(last.invalidFields.some((f: any) => f.field === 'parents.pname')).toBe(true);
    });
  });

  it('validates nested child DataTable ACTIVE ROW on submit (including fields inside accordion + tabs)', async () => {
    const { ref, onSubmit } = renderForm();

    // parent row 0 active -> exposes child context "parents.0.children"
    await user.click(screen.getByTestId('dt-select-0'));

    // nested datatable (second instance)
    const allTables = await screen.findAllByTestId('datatable');
    expect(allTables.length).toBeGreaterThan(1);
    const nested = allTables[1];
    await user.click(within(nested).getByText(/select-0/i)); // child row 0 active

    // leave child fields empty and submit
    ref.current.submit();

    await waitFor(() => {
      const last = onSubmit.mock.calls.at(-1)[0];
      expect(last.valid).toBe(false);
      const fields = last.invalidFields.map((f: any) => f.field).sort();
      expect(fields).toContain('parents.0.children.0.cname');
      expect(fields).toContain('parents.0.children.0.cAcc');
      expect(fields).toContain('parents.0.children.0.cTab');
    });
  });

  it('validates nested child DataTable DRAFT area on submit (no child active row but user typed)', async () => {
    const { ref, onSubmit } = renderForm();

    // activate parent 0 so child table renders (no child active row)
    await user.click(screen.getByTestId('dt-select-0'));

    // draft field inside child context = "parents.0.children.cname"
    const draftChild = await screen.findByTestId('input-parents.0.children.cname');
    await user.type(draftChild, ''); // keep empty but mark as touched/typed

    ref.current.submit();

    await waitFor(() => {
      const last = onSubmit.mock.calls.at(-1)[0];
      expect(last.valid).toBe(false);
      // draft path is without row index
      expect(last.invalidFields.some((f: any) => f.field === 'parents.0.children.cname')).toBe(true);
    });
  });

  it('inline validation while typing inside nested child active row (onChange)', async () => {
    renderForm();

    await user.click(screen.getByTestId('dt-select-0'));
    const allTables = await screen.findAllByTestId('datatable');
    const nested = allTables[1];
    await user.click(within(nested).getByText(/select-0/i));

    const cname = screen.getByTestId('input-parents.0.children.0.cname');
    await user.clear(cname);
    await user.type(cname, '');
    expect(await screen.findByText('Child required')).toBeInTheDocument();

    await user.type(cname, 'A');
    await waitFor(() => {
      expect(screen.queryByText('Child required')).toBeNull();
    });
  });

  it('Add: enables with draft, prepends a row, clears draft', async () => {
    renderForm();

    const draft = screen.getByTestId('input-parents.pname');
    const addBtn = screen.getByRole('button', { name: /^Add$/ });

    expect(addBtn).toBeDisabled();

    await user.type(draft, 'New Parent');
    await waitFor(() => expect(addBtn).not.toBeDisabled());

    await user.click(addBtn);

    const count = await screen.findByTestId('row-count');
    expect(count).toHaveTextContent('3');  // was 2 -> now 3
    expect((screen.getByTestId('input-parents.pname') as HTMLInputElement).value).toBe('');
  });

  it('Update: changes active row values and clears selection', async () => {
    renderForm();

    // select parent row 0
    await user.click(screen.getByTestId('dt-select-0'));

    // edit active row field: parents.0.pname
    const activeName = screen.getByTestId('input-parents.0.pname');
    await user.clear(activeName);
    await user.type(activeName, 'P1-Edited');

    const updateBtn = screen.getByRole('button', { name: /^Update$/ });
    expect(updateBtn).not.toBeDisabled();

    await user.click(updateBtn);

    // after Update, selection is cleared -> draft field should be available and empty
    expect((screen.getByTestId('input-parents.pname') as HTMLInputElement).value).toBe('');
  });

  it('Delete: removes active row and clears selection', async () => {
    renderForm();

    // select parent row 1 (P2)
    await user.click(screen.getByTestId('dt-select-1'));

    const deleteBtn = screen.getByRole('button', { name: /^Delete$/ });
    expect(deleteBtn).not.toBeDisabled();

    await user.click(deleteBtn);

    // row count drops from 2 to 1
    const count = await screen.findByTestId('row-count');
    expect(count).toHaveTextContent('1');
  });

  it('Cancel: clears drafts and keeps selection null', async () => {
    renderForm();

    const draft = screen.getByTestId('input-parents.pname');
    await user.type(draft, 'Cancel Me');

    const cancelBtn = screen.getByRole('button', { name: /^Cancel$/ });
    expect(cancelBtn).not.toBeDisabled();

    await user.click(cancelBtn);
    expect((screen.getByTestId('input-parents.pname') as HTMLInputElement).value).toBe('');
  });
});
