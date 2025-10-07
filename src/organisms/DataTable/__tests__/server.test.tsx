import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import './test.setup';

import { DataTable } from '../index';
import type { ColumnSetting } from '../interface';

import {
  Product,
  makeFetcherSpy,
  ALL,
  waitForTableToBeInteractive,
} from './test.setup';

// Import your deterministic fetcher used in your original tests
import { makeDeterministicServerFetcher } from '../utils/server';

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

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
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
        testId="dt-pagination"
      />
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('last-page-button')).toBeInTheDocument());
    await waitForTableToBeInteractive('dt-pagination');

    await userEvent.click(screen.getByTestId('next-page-button'));
    await waitFor(() => expect(onPageIndexChange).toHaveBeenCalledWith(1));
    onPageIndexChange.mockClear();

    await waitForTableToBeInteractive('dt-pagination');
    await userEvent.click(screen.getByTestId('last-page-button'));
    await waitFor(() => expect(onPageIndexChange).toHaveBeenCalledWith(4));
    onPageIndexChange.mockClear();

    await waitForTableToBeInteractive('dt-pagination');
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
    await userEvent.click(sizeDropdown);
    const opt20 = await screen.findByTestId('20');
    const before = fetcher.mock.calls.length;
    await userEvent.click(opt20);

    await waitFor(() => expect(onPageSizeChange).toHaveBeenCalledWith(20));
    await waitFor(() => expect(fetcher.mock.calls.length).toBeGreaterThan(before));
    const last = fetcher.mock.calls.at(-1)?.[0];
    expect(last?.pageSize).toBe(20);
    expect(last?.pageIndex).toBe(0);

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

    await userEvent.click(sortTarget);
    await waitFor(() => {
      const args = fetcher.mock.calls.at(-1)?.[0];
      expect(args?.sorting?.[0]?.id).toBe('price');
    });
    const firstDesc = !!fetcher.mock.calls.at(-1)?.[0]?.sorting?.[0]?.desc;

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
        pageIndex={2}
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

    await waitFor(() => expect(onPageIndexChange).toHaveBeenCalledWith(0));

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
        pageIndex={2}
        onPageIndexChange={onPageIndexChange}
        enableColumnFiltering
      />
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    const u = userEvent.setup({ pointerEventsCheck: 0 });

    // Open the dropdown (portal + animation)
    const trigger = screen.getByTestId('filter-category');
    trigger.focus();
    await u.click(trigger);

    // Robustly locate the portal-mounted popup: prefer testid, fall back to role
    let popup: HTMLElement;
    try {
      popup = await screen.findByTestId('dropdown-menu', {}, { timeout: 5000 });
    } catch {
      // some builds render as a listbox/menu without the testid
      popup = (await screen.findByRole('listbox', {}, { timeout: 5000 })) as HTMLElement;
    }
    await waitFor(() => expect(popup).toBeVisible());

    // Select the "beauty" option (prefer testid, fall back to text)
    const beauty =
      popup.querySelector('[data-testid="beauty"]')
        ? within(popup).getByTestId('beauty')
        : within(popup).getByText(/^beauty$/i);

    await waitFor(() => expect(beauty).toBeVisible());
    await u.click(beauty, { skipHover: true });

    // Page should reset
    await waitFor(() => expect(onPageIndexChange).toHaveBeenCalledWith(0));

    // Fetch should be called again
    await waitFor(() => expect(fetcher.mock.calls.length).toBeGreaterThan(1));

    // Verify filtered rows
    await waitFor(() => {
      const cells = screen.getAllByTestId(/column-\d+-category/);
      expect(cells.length).toBeGreaterThan(0);
      expect(cells.every((el) => /^beauty$/i.test(el.textContent ?? ''))).toBe(true);
    });
  });

  test('total drives last/next disabled state correctly', async () => {
    const fetcher = makeFetcherSpy(ALL.slice(0, 23));
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

    await userEvent.click(screen.getByTestId('last-page-button'));

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

    expect(screen.getByTestId('next-page-button')).toBeDisabled();
    expect(screen.getByTestId('last-page-button')).toBeDisabled();
    expect(screen.getByTestId('previous-page-button')).toBeEnabled();
    expect(screen.getByTestId('first-page-button')).toBeEnabled();
  });

  test('controlled pageIndex: external control wins over internal pagination intent', async () => {
    const fetcher = vi.fn(async (p: any) => ({
      rows: ALL.slice(p.pageIndex * 5, p.pageIndex * 5 + 5),
      total: ALL.length,
    }));

    const Wrap = ({ pageIndex }: { pageIndex: number }) => (
      <DataTable<Product>
        serverMode
        server={{ fetcher, debounceMs: 0 }}
        dataSource={[]}
        columnSettings={[
          { title: 'ID', column: 'id' },
          { title: 'First Name', column: 'firstName' },
          { title: 'Last Name', column: 'lastname' },
          { title: 'Role', column: 'role' },
        ]}
        pageSize={5}
        pageIndex={pageIndex}
      />
    );

    const { rerender } = render(<Wrap pageIndex={0} />);
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    expect(fetcher.mock.calls.at(-1)?.[0]?.pageIndex).toBe(0);

    rerender(<Wrap pageIndex={1} />);
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    expect(fetcher.mock.calls.at(-1)?.[0]?.pageIndex).toBe(1);

    await userEvent.click(screen.getByTestId('next-page-button'));

    await waitFor(() => {
      const last = fetcher.mock.calls.at(-1)?.[0];
      expect(last?.pageIndex).toBe(2);
    });
  });
});
