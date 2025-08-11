import React, { useState } from "react";
import { FormControl } from "../../../atoms/FormControl";
import { Dropdown } from "../../../molecules/Dropdown";

const FloatingSettingsPanel = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: "12px",
        right: "12px",
        backgroundColor: "#fff",
        padding: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        zIndex: 1000,
        maxHeight: "calc(100vh - 24px)",
        overflowY: "auto",
        boxSizing: "border-box",
        width: 250,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h4 style={{ margin: 0 }}>Settings</h4>
      </div>
      <div style={{ marginTop: "16px" }}>{children}</div>
    </div>
  );
};

type DataTablePlaygroundProps = {
  children: React.ReactElement; // expects a single React element (DataTable)
};

export const DataTablePlayground: React.FC<DataTablePlaygroundProps> = ({
  children,
}) => {
  // Panel closed by default
  const [showSettings, setShowSettings] = useState(false);
  const [enableColumnFiltering, setEnableColumnFiltering] = useState(true);
  const [enableColumnPinning, setEnableColumnPinning] = useState(true);
  const [enableColumnDragging, setEnableColumnDragging] = useState(true);
  const [enableColumnSorting, setEnableColumnSorting] = useState(true);
  const [enableColumnResizing, setEnableColumnResizing] = useState(true);
  const [enableCellEditing, setEnableCellEditing] = useState(true);
  const [enableRowAdding, setEnableRowAdding] = useState(true);
  const [enableRowDeleting, setEnableRowDeleting] = useState(true);
  const [enableSelectedRowDeleting, setEnableSelectedRowDeleting] =
    useState(true);
  const [enableRowSelection, setEnableRowSelection] = useState(true);
  const [enableGlobalFiltering, setEnableGlobalFiltering] = useState(true);
  const [title, setTitle] = useState("DataTable Demo Title");
  const [cellTextAlignment, setCellTextAlignment] = useState<
    "left" | "center" | "right"
  >("center");
  const [height, setHeight] = useState("300px");
  const [maxHeight, setMaxHeight] = useState(undefined);
  const [pageSize, setPageSize] = useState<any>("10");
  const [pageIndex, setPageIndex] = useState(0);
  const [enableMultiRowSelection, setEnableMultiRowSelection] = useState(true);
  const [activeRow, setActiveRow] = useState("3");
  const [selectedRows, setSelectedRows] = useState<string[]>(["1"]);
  const [disabledRows, setDisabledRows] = useState<string[]>(["15"]);
  const [partialRowDeletionID, setPartialRowDeletionID] =
    useState("partialDelete");
  const [disabled, setDisabled] = useState(false);
  const [headerRightControls, setHeaderRightControls] = useState(true);

  // Clone the child element to inject playground state as props
  const clonedChild = React.cloneElement(children, {
    enableColumnFiltering,
    enableColumnPinning,
    enableColumnDragging,
    enableColumnSorting,
    enableColumnResizing,
    enableCellEditing,
    enableRowAdding,
    enableRowDeleting,
    enableSelectedRowDeleting,
    enableRowSelection,
    enableGlobalFiltering,
    title,
    cellTextAlignment,
    height,
    maxHeight,
    pageSize,
    pageIndex,
    enableMultiRowSelection,
    activeRow,
    selectedRows,
    disabledRows,
    partialRowDeletionID,
    disabled,
    headerRightControls,
    // Example event handlers these could also be overridden by the child if needed
    onRowClick: (row: any) => console.log("Row clicked:", row),
    onRowDoubleClick: (row: any) => console.log("Row double-clicked:", row),
    onColumnSettingsChange: (newSettings: any) =>
      console.log("Column settings changed:", newSettings),
    onPageSizeChange: (newSize: number) =>
      console.log("Page size changed:", newSize),
    onPageIndexChange: (newIndex: number) =>
      console.log("Page index changed:", newIndex),
    onSelectedRowsChange: (rows: any[]) =>
      console.log("Selected rows changed:", rows),
  });

  return (
    <div>
      {/* Fixed settings icon at the top-right */}
      <button
        style={{
          position: "fixed",
          top: "16px",
          right: "16px",
          zIndex: 1100,
          background: "none",
          border: "none",
          fontSize: "24px",
          cursor: "pointer",
        }}
        onClick={() => setShowSettings((prev) => !prev)}
      >
        {showSettings ? "✖" : "⚙"}
      </button>

      {showSettings && (
        <FloatingSettingsPanel>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <FormControl
              size="sm"
              label="Title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <FormControl
              size="sm"
              text="Disable DataTable"
              type="checkbox"
              checked={disabled}
              onChange={(e) => setDisabled(e.target.checked)}
            />
            <FormControl
              size="sm"
              text="Enable Header Right Control Icons"
              type="checkbox"
              checked={headerRightControls}
              onChange={(e) => setHeaderRightControls(e.target.checked)}
            />
            <FormControl
              size="sm"
              text="Enable Global Filtering"
              type="checkbox"
              checked={enableGlobalFiltering}
              onChange={(e) => setEnableGlobalFiltering(e.target.checked)}
            />
            <FormControl
              size="sm"
              text="Enable Column Filtering"
              type="checkbox"
              checked={enableColumnFiltering}
              onChange={(e) => setEnableColumnFiltering(e.target.checked)}
            />
            <FormControl
              size="sm"
              text="Enable Column Pinning"
              type="checkbox"
              checked={enableColumnPinning}
              onChange={(e) => setEnableColumnPinning(e.target.checked)}
            />
            <FormControl
              size="sm"
              text="Enable Column Dragging"
              type="checkbox"
              checked={enableColumnDragging}
              onChange={(e) => setEnableColumnDragging(e.target.checked)}
            />
            <FormControl
              size="sm"
              text="Enable Column Sorting"
              type="checkbox"
              checked={enableColumnSorting}
              onChange={(e) => setEnableColumnSorting(e.target.checked)}
            />
            <FormControl
              size="sm"
              text="Enable Column Resizing"
              type="checkbox"
              checked={enableColumnResizing}
              onChange={(e) => setEnableColumnResizing(e.target.checked)}
            />
            <FormControl
              size="sm"
              text="Enable Cell Editing"
              type="checkbox"
              checked={enableCellEditing}
              onChange={(e) => setEnableCellEditing(e.target.checked)}
            />
            <FormControl
              size="sm"
              text="Enable Row Adding"
              type="checkbox"
              checked={enableRowAdding}
              onChange={(e) => setEnableRowAdding(e.target.checked)}
            />
            <FormControl
              size="sm"
              text="Enable Row Deleting"
              type="checkbox"
              checked={enableRowDeleting}
              onChange={(e) => setEnableRowDeleting(e.target.checked)}
            />
            <FormControl
              size="sm"
              text="Enable Selected Row Deleting"
              type="checkbox"
              checked={enableSelectedRowDeleting}
              onChange={(e) => setEnableSelectedRowDeleting(e.target.checked)}
            />
            <FormControl
              size="sm"
              text="Enable Row Selection"
              type="checkbox"
              checked={enableRowSelection}
              onChange={(e) => setEnableRowSelection(e.target.checked)}
            />
            <FormControl
              size="sm"
              text="Enable Multi Row Selection"
              type="checkbox"
              checked={enableMultiRowSelection}
              onChange={(e) => setEnableMultiRowSelection(e.target.checked)}
            />
            <Dropdown
              size="sm"
              label="Cell Text Alignment"
              options={[
                { value: "left", text: "Left" },
                { value: "center", text: "Center" },
                { value: "right", text: "Right" },
              ]}
              value={cellTextAlignment}
              onChange={(value: any) => setCellTextAlignment(value)}
            />
            <FormControl
              size="sm"
              label="Height"
              type="text"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
            <FormControl
              size="sm"
              label="Max Height"
              type="text"
              value={maxHeight}
              onChange={(e) => setMaxHeight(e.target.value)}
            />
            <Dropdown
              size="sm"
              label="Page Size"
              options={[
                { value: "5", text: "5" },
                { value: "10", text: "10" },
                { value: "20", text: "20" },
                { value: "50", text: "50" },
              ]}
              value={pageSize}
              onChange={(value) => setPageSize(value)}
            />
            <FormControl
              size="sm"
              label="Page Index"
              type="number"
              value={pageIndex}
              onChange={(e) => setPageIndex(Number(e.target.value))}
            />
            <FormControl
              size="sm"
              label="Active Row (ID)"
              type="number"
              value={activeRow}
              onChange={(e) => setActiveRow(e.target.value)}
            />
            <FormControl
              size="sm"
              label="Selected Rows (comma separated)"
              type="text"
              value={selectedRows.join(",")}
              onChange={(e) =>
                setSelectedRows(e.target.value.split(",").map((s) => s.trim()))
              }
            />
            <FormControl
              size="sm"
              label="Disabled Rows (comma separated)"
              type="text"
              value={disabledRows.join(",")}
              onChange={(e) =>
                setDisabledRows(e.target.value.split(",").map((s) => s.trim()))
              }
            />
            <FormControl
              size="sm"
              label="Partial Row Deletion ID"
              type="text"
              value={partialRowDeletionID}
              onChange={(e) => setPartialRowDeletionID(e.target.value)}
            />
          </div>
        </FloatingSettingsPanel>
      )}

      {clonedChild}

      <div style={{ padding: "12px 0", fontSize: 14, fontStyle: "italic" }}>
        <p>
          For further insights and debugging, please review the console log
          where detailed event outputs from the DataTable interactions are
          recorded.
        </p>
      </div>
    </div>
  );
};
