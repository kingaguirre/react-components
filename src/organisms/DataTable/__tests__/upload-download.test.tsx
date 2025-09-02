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

  test('Download selected: row + header checkbox select all/unselect all works correctly', async () => {
    render(
      <DataTable
        dataSource={PROD_ROWS}
        columnSettings={DL_COLS}
        enableRowSelection
        enableMultiRowSelection
        enableDownload
        downloadControls={{
          fileName: 'selected_only',
          format: 'xlsx',
          showConfigSection: false,
          showBuiltinAll: true,
          showBuiltinSelected: true,
        }}
      />
    );

    const u = userEvent.setup({ pointerEventsCheck: 0 });

    // 1) Select first row only
    await u.click(screen.getByTestId('select-row-0'));
    await openDownloadMenu();
    await u.click(screen.getByRole('menuitem', { name: /download selected/i }));

    await waitFor(() => expect(globalThis.__lastAOA).not.toBeNull());
    let aoa = globalThis.__lastAOA!;
    expect(aoa.length).toBe(2); // header + 1 row
    expect(aoa[1]).toEqual([1, 'A', 'Acme', 'beauty', 10, 4.7]);

    // 2) Click header once → selects all rows
    globalThis.__lastAOA = null;
    await u.click(screen.getByTestId('select-row-header'));
    await openDownloadMenu();
    await u.click(screen.getByRole('menuitem', { name: /download selected/i }));

    await waitFor(() => expect(globalThis.__lastAOA).not.toBeNull());
    aoa = globalThis.__lastAOA!;
    expect(aoa.length).toBe(PROD_ROWS.length + 1); // header + all rows
    expect(aoa[1]).toEqual([1, 'A', 'Acme', 'beauty', 10, 4.7]);
    expect(aoa[2]).toEqual([2, 'B', 'Globex', 'furniture', 20, 4.0]);
    expect(aoa[3]).toEqual([3, 'C', 'Initech', 'groceries', 30, 3.5]);

    // 3) Click header again → unselect all
    globalThis.__lastAOA = null;
    await u.click(screen.getByTestId('select-row-header'));
    await openDownloadMenu();
    expect(screen.getByRole('menuitem', { name: /download selected/i })).toBeDisabled();
  });

  // test('Upload CSV: shows review (unmatched + empty), proceeds and imports only non-empty rows', async () => {
  //   // Worker will emit these rows regardless of file contents
  //   // - includes an unmatched header "invalid_col"
  //   // - includes an empty row (should be ignored)
  //   (globalThis as any).__mockUploadRows = [
  //     { ID: '1', Title: 'Notebook', Brand: 'PaperPro', Category: 'stationery', Price: '7.5', invalid_col: 'X' },
  //     { }, // empty row → ignored
  //     { ID: '2', Title: 'Chair',   Brand: 'SeatCo',   Category: 'furniture',  Price: '45',  invalid_col: 'Y' },
  //   ];

  //   const onImport = vi.fn();

  //   render(
  //     <DataTable
  //       dataSource={[]}
  //       columnSettings={DL_COLS}
  //       enableUpload
  //       uploadControls={{ title: 'Upload CSV/XLSX', onImport }}
  //     />
  //   );

  //   const u = userEvent.setup({ pointerEventsCheck: 0 });

  //   // Open picker and "upload" a CSV file (content isn't parsed by the mock, but triggers the code path)
  //   await u.click(screen.getByTestId('upload-icon'));
  //   const input = screen.getByTestId('upload-input') as HTMLInputElement;
  //   const file = new File(
  //     [
  //       'ID,Title,Brand,Category,Price,invalid_col\n',
  //       '1,Notebook,PaperPro,stationery,7.5,X\n',
  //       ',,,,,\n',
  //       '2,Chair,SeatCo,furniture,45,Y\n',
  //     ],
  //     'test.csv',
  //     { type: 'text/csv' }
  //   );
  //   await u.upload(input, file);

  //   // Review modal should appear (unmatched headers + empty rows)
  //   expect(await screen.findByText(/import review/i)).toBeInTheDocument();
  //   expect(screen.getByText(/Some headers don’t match/i)).toBeInTheDocument();
  //   expect(screen.getByText('invalid_col')).toBeInTheDocument(); // unmatched tag is rendered
  //   // Optional: check the "Ignored (empty)" stat reflects 1 row
  //   expect(screen.getByText(/Ignored \(empty\)/i).nextSibling).toHaveTextContent('1');

  //   // Proceed with import
  //   await u.click(screen.getByTestId('upload-confirm-button'));

  //   // onImport receives only non-empty aligned rows (visible columns only)
  //   await waitFor(() => expect(onImport).toHaveBeenCalled());
  //   const payload = onImport.mock.calls.at(-1)?.[0] as Array<Record<string, any>>;
  //   expect(Array.isArray(payload)).toBe(true);
  //   expect(payload).toHaveLength(2);
  //   // Headers are aligned to column ids: id, title, brand, category, price
  //   expect(payload[0]).toMatchObject({ id: '1', title: 'Notebook', brand: 'PaperPro', category: 'stationery', price: '7.5' });
  //   expect(payload[1]).toMatchObject({ id: '2', title: 'Chair',    brand: 'SeatCo',   category: 'furniture',  price: '45' });
  // });

  // test('Upload XLSX: no issues → imports immediately (no review modal)', async () => {
  //   // All headers match visible columns; no empty rows → skip review
  //   (globalThis as any).__mockUploadRows = [
  //     { ID: '10', Title: 'Soap', Brand: 'Clean Co', Category: 'beauty',    Price: '4.5' },
  //     { ID: '11', Title: 'Desk', Brand: 'Oakline',  Category: 'furniture', Price: '199' },
  //   ];

  //   const onImport = vi.fn();

  //   render(
  //     <DataTable
  //       dataSource={[]}
  //       columnSettings={DL_COLS}
  //       enableUpload
  //       uploadControls={{ title: 'Upload CSV/XLSX', onImport }}
  //     />
  //   );

  //   const u = userEvent.setup({ pointerEventsCheck: 0 });

  //   // Trigger XLSX path
  //   await u.click(screen.getByTestId('upload-icon'));
  //   const input = screen.getByTestId('upload-input') as HTMLInputElement;
  //   const xlsxFile = new File([new Uint8Array([0,1,2,3])], 'ok.xlsx', {
  //     type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //   });
  //   await u.upload(input, xlsxFile);

  //   // Should import directly without showing the review modal
  //   await waitFor(() => expect(onImport).toHaveBeenCalled());
  //   expect(screen.queryByText(/import review/i)).toBeNull();

  //   const rows = onImport.mock.calls.at(-1)?.[0] as Array<Record<string, any>>;
  //   expect(rows).toHaveLength(2);
  //   expect(rows[0]).toMatchObject({ id: '10', title: 'Soap', brand: 'Clean Co', category: 'beauty',    price: '4.5' });
  //   expect(rows[1]).toMatchObject({ id: '11', title: 'Desk', brand: 'Oakline',  category: 'furniture', price: '199' });
  // });

});
