import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import './test.setup';

import { DataTable } from '../index';

import {
  DL_COLS,
  PROD_ROWS,
  openDownloadMenu
} from './test.setup';

// Also used in one export-all test
import { makeDeterministicServerFetcher } from '../utils/server';

describe('DataTable – Upload & Download', () => {
  test('Download menu: built-ins visible, config section hidden (showConfigSection=false)', async () => {
    render(
      <DataTable
        dataSource={PROD_ROWS}
        columnSettings={DL_COLS}
        enableRowSelection
        enableDownload
        downloadControls={{
          fileName: 'products',
          format: 'xlsx',
          showConfigSection: false,
          showBuiltinAll: true,
          showBuiltinSelected: true,
        }}
      />
    );

    await openDownloadMenu();

    expect(screen.queryByText(/file name/i)).toBeNull();
    expect(screen.queryByText(/format/i)).toBeNull();

    expect(screen.getByRole('menuitem', { name: /download all/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /download selected/i })).toBeInTheDocument();
  });

  test('Download menu: "Download selected" hidden when enableRowSelection = false', async () => {
    render(
      <DataTable
        dataSource={PROD_ROWS}
        columnSettings={DL_COLS}
        enableRowSelection={false}
        enableDownload
        downloadControls={{
          showConfigSection: false,
          showBuiltinAll: true,
          showBuiltinSelected: true,
        }}
      />
    );

    await openDownloadMenu();
    expect(screen.getByRole('menuitem', { name: /download all/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /download selected/i })).toBeNull();
  });

  test('includeHiddenColumns: header includes hidden "Rating" by default', async () => {
    render(
      <DataTable
        dataSource={PROD_ROWS}
        columnSettings={DL_COLS}
        enableDownload
        downloadControls={{
          fileName: 'with_hidden',
          format: 'xlsx',
        }}
      />
    );

    await openDownloadMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: /download all/i }));

    await waitFor(() => expect(globalThis.__lastAOA).not.toBeNull());
    expect(globalThis.__lastAOA![0]).toEqual(['ID', 'Title', 'Brand', 'Category', 'Price', 'Rating']);
  });

  test('includeHiddenColumns: when forced false, header omits hidden "Rating"', async () => {
    render(
      <DataTable
        dataSource={PROD_ROWS}
        columnSettings={DL_COLS}
        enableDownload
        downloadControls={{
          fileName: 'no_hidden',
          format: 'xlsx',
          includeHiddenColumns: false,
        }}
      />
    );

    await openDownloadMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: /download all/i }));

    await waitFor(() => expect(globalThis.__lastAOA).not.toBeNull());
    expect(globalThis.__lastAOA![0]).toEqual(['ID', 'Title', 'Brand', 'Category', 'Price']);
  });

  test('custom extra menu receives rows payload (objects) with selected + all', async () => {
    const payloadSpy = vi.fn();
    render(
      <DataTable
        dataSource={PROD_ROWS}
        columnSettings={DL_COLS}
        enableRowSelection
        enableMultiRowSelection
        selectedRows={['1', '3']}
        enableDownload
        downloadControls={{
          fileName: 'rows_payload',
          format: 'xlsx',
          showBuiltinAll: false,
          showBuiltinSelected: false,
          showConfigSection: true,
          extraMenuItems: [{ key: 'capture', label: 'Capture payload', icon: 'data_object', onClick: payloadSpy }],
        }}
      />
    );

    await openDownloadMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: /capture payload/i }));

    await waitFor(() => expect(payloadSpy).toHaveBeenCalled());
    const args = payloadSpy.mock.calls.at(-1)?.[0];

    expect(Array.isArray(args?.selected?.rows)).toBe(true);
    expect(Array.isArray(args?.all?.rows)).toBe(true);
    expect(args?.selected?.count).toBe(1);
    expect(args?.all?.count).toBe(PROD_ROWS.length);
    expect('rating' in args.all.rows[0]).toBe(true);
  });

  test('Download (custom server): clicking custom item fetches all and builds XLSX (no separator)', async () => {
    (globalThis as any).__lastAOA = null;

    const fetcher = makeDeterministicServerFetcher({ total: 23, pageSize: 10 });
    render(
      <DataTable
        serverMode
        server={{ fetcher, debounceMs: 0 }}
        dataSource={[]}
        pageSize={10}
        columnSettings={[
          { title: 'ID', column: 'id' },
          { title: 'Title', column: 'title' },
          { title: 'Category', column: 'category' },
          { title: 'Price', column: 'price' },
        ]}
        enableDownload
        downloadControls={{
          extraMenuItems: [{ label: 'Export all (XLSX)', onClick: () => {} }],
        }}
      />
    );

    const u = userEvent.setup({ pointerEventsCheck: 0 });

    await u.click(screen.getByTestId('download-icon'));
    await u.click(await screen.findByTestId('download-item-all'));

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ pageIndex: 0 }));
    });

    const aoa = (globalThis as any).__lastAOA as any[][];
    expect(aoa).toBeTruthy();
    expect(aoa.length).toBeGreaterThan(1);

    const header = aoa[0];
    const priceIdx = header.indexOf('Price');
    expect(priceIdx).toBeGreaterThanOrEqual(0);

    const row1 = aoa[1];
    const rowN = aoa[aoa.length - 1];

    expect(typeof row1[priceIdx]).toBe('number');
    expect(typeof rowN[priceIdx]).toBe('number');
    expect(String(row1[priceIdx])).not.toMatch(/,/);
    expect(String(rowN[priceIdx])).not.toMatch(/,/);
  });

  test('Download controls: showConfigSection=true renders filename + format controls', async () => {
    render(
      <DataTable
        dataSource={PROD_ROWS}
        columnSettings={DL_COLS}
        enableDownload
        downloadControls={{
          fileName: 'custom',
          format: 'xlsx',
          showConfigSection: true,
          showBuiltinAll: false,
          showBuiltinSelected: false,
          extraMenuItems: [{ key: 'noop', label: 'Noop', onClick: () => {} }],
        }}
      />
    );

    await openDownloadMenu();
    expect(screen.getByText(/file name/i)).toBeInTheDocument();
    expect(screen.getByText(/format/i)).toBeInTheDocument();
  });

  test('Download controls: toggles hide built-ins', async () => {
    render(
      <DataTable
        dataSource={PROD_ROWS}
        columnSettings={DL_COLS}
        enableRowSelection
        enableDownload
        downloadControls={{
          showConfigSection: false,
          showBuiltinAll: false,
          showBuiltinSelected: false,
          extraMenuItems: [{ key: 'x', label: 'Only custom', onClick: () => {} }],
        }}
      />
    );

    await openDownloadMenu();
    expect(screen.queryByRole('menuitem', { name: /download all/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /download selected/i })).toBeNull();
    expect(screen.getByRole('menuitem', { name: /only custom/i })).toBeInTheDocument();
  });
});
