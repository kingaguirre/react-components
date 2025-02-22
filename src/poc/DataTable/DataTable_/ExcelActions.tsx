import React from 'react';
import { exportToExcel, importFromExcel } from './ExcelUtils';
import { ColumnSetting } from './index'; // adjust the import if needed

export interface ExcelActionsProps<T extends object> {
  data: T[];
  columnSettings: ColumnSetting[];
  selectedRows: T[];
  onDataUpdate: (newData: T[]) => void;
}

export function ExcelActions<T extends object>({
  data,
  columnSettings,
  selectedRows,
  onDataUpdate,
}: ExcelActionsProps<T>) {
  const handleExcelExport = () => {
    // If there are selected rows, export them; otherwise export all data.
    const exportData = selectedRows.length > 0 ? selectedRows : data;
    exportToExcel(exportData, columnSettings);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const importedData = await importFromExcel<T>(file, columnSettings);
      // Mark every imported row with __isNewImported for a temporary highlight.
      const processedRows = importedData.map((row: any) => ({
        ...row,
        __isNewImported: true,
      }));
      // Prepend the new rows.
      const newData = [...(processedRows as T[]), ...data];
      onDataUpdate(newData);

      // After 3 seconds, remove the highlight flag.
      setTimeout(() => {
        const updatedData = newData.map((row) => {
          if ((row as any).__isNewImported) {
            const { __isNewImported, ...rest } = row as any;
            return rest;
          }
          return row;
        });
        onDataUpdate(updatedData);
      }, 3000);
    }
  };

  return (
    <div>
      <button onClick={handleExcelExport}>Export Excel</button>
      <input type="file" accept=".xlsx, .xls" onChange={handleExcelImport} />
    </div>
  );
}
