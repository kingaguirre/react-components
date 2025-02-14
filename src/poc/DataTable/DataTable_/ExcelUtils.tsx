import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ColumnSetting } from './index';

/**
 * Export data to an Excel file using ExcelJS.
 * - Maps columns based on the provided ColumnSetting.
 * - Uses file-saver to trigger a download.
 */
export async function exportToExcel<T>(data: T[], columnSettings: ColumnSetting[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  // Define worksheet columns using the provided settings.
  worksheet.columns = columnSettings.map(col => ({
    header: col.title,
    key: col.accessor,
    // Adjust width scaling as needed. ExcelJS expects width in character count.
    width: col.width ? Math.floor(col.width / 10) : 15,
  }));

  // Add each row of data.
  data.forEach(row => {
    const rowData: Record<string, any> = {};
    columnSettings.forEach(col => {
      rowData[col.accessor] = row[col.accessor];
    });
    worksheet.addRow(rowData);
  });

  // Generate the Excel file as a binary buffer.
  const buffer = await workbook.xlsx.writeBuffer();

  // Create a Blob from the buffer and trigger a download.
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  saveAs(blob, 'data.xlsx');
}

/**
 * Import data from an Excel file using ExcelJS.
 * - Expects the first row of the worksheet to be a header row.
 * - Maps headers to column accessors based on the provided ColumnSetting.
 */
export async function importFromExcel<T>(file: File, columnSettings: ColumnSetting[]): Promise<T[]> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];

  // Retrieve headers from the first row.
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell) => {
    headers.push(cell.text);
  });

  const result: any[] = [];

  // Iterate through each row (skipping header row) and map cell values.
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // skip header row
    const rowData: Record<string, any> = {};

    headers.forEach((header, index) => {
      // Find matching column setting based on header (title)
      const colSetting = columnSettings.find(c => c.title === header);
      if (colSetting) {
        const cell = row.getCell(index + 1);
        rowData[colSetting.accessor] = cell.value;
      }
    });

    result.push(rowData);
  });

  return result;
}
