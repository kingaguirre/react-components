import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "./index";
import { StoryWrapper, Title } from "../../components/StoryWrapper";
import { DataTable as DataTable_ } from './DataTable_/index';
import { ColumnSetting } from './interface';
import { makeData } from "./makeData";
import { COLUMN_SETTINGS_PLAIN } from './data';
import { Badge } from "../../atoms/Badge";

const meta: Meta<typeof DataTable> = {
  title: "POC/DataTable",
  component: DataTable,
  argTypes: {
    // You can add controls for props if needed
  },
} satisfies Meta<typeof DataTable>;

export default meta;

const loremAddresses = [
  "Lorem ipsum dolor sit amet",
  "Consectetur adipiscing elit",
  "Sed do eiusmod tempor incididunt",
  "Ut labore et dolore magna aliqua",
  "Ut enim ad minim veniam",
  "Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat",
];

// Generate 200 rows of sample data with all columns defined
const sampleData = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Name ${i + 1}`,
  age: Math.floor(Math.random() * 60) + 20,
  active: i % 2 === 0,
  joined: new Date(2018, 0, 1 + i).toISOString().split("T")[0],
  tags: "A, B",
  email: `user${i + 1}@example.com`,
  out: i % 2 === 0,
  in: i % 2 === 0,
  phone: `555-010${(i % 10).toString().padStart(2, "0")}`,
  country: ["USA", "UK", "Canada", "Australia"][i % 4],
  city: ["New York", "London", "Toronto", "Sydney"][i % 4],
  birthdate: new Date(
    1980 + Math.floor(Math.random() * 20),
    Math.floor(Math.random() * 12),
    Math.floor(Math.random() * 28) + 1
  )
    .toISOString()
    .split("T")[0],
  vacationDates: [
    new Date(2023, 5, Math.floor(Math.random() * 8) + 1)
      .toISOString()
      .split("T")[0],
    new Date(2023, 5, 28).toISOString().split("T")[0],
  ],
  department: ["HR", "Engineering", "Sales"][i % 3],
  salary: Math.floor(Math.random() * 80000) + 40000,
  workingHours: [
    String(Math.floor(Math.random() * 10) + 30),
    String(Math.floor(Math.random() * 10) + 40),
  ],
  // For radio-group, using fixed options: "Option1" or "Option2"
  gender: i % 2 === 0 ? "Option1" : "Option2",
  // For switch, value is boolean.
  status: i % 2 === 0,
  // For checkbox-group, we'll provide an array of options
  preferences: i % 3 === 0 ? ["Option1", "Option2"] : ["Option2"],
  // For switch-group, same as checkbox-group
  switchGroup: i % 2 === 0 ? ["Option1"] : ["Option2"],
  address: loremAddresses[i % loremAddresses.length],

  // Additional deep nested object and array for testing purposes
  profile: {
    bio: `This is a short bio for Name ${i + 1}.`,
    social: {
      twitter: `@user${i + 1}`,
      linkedin: `https://linkedin.com/in/user${i + 1}`,
    },
    skills: ["JavaScript", "React", "TypeScript", "Node.js"].slice(0, (i % 4) + 1),
  },
  events: {
    eventId: `${i + 1}`,
    eventName: `Event ${i + 1}`,
    eventDate: new Date(
      2023,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    )
      .toISOString()
      .split("T")[0],
    details: {
      location: ["Conference Room A", "Conference Room B", "Auditorium"][i % 3],
      participants: Math.floor(Math.random() * 100),
    }
  },
  metadata: {
    createdBy: "system",
    lastUpdated: new Date().toISOString(),
    flags: {
      isVerified: i % 5 === 0,
      isReviewed: i % 7 === 0,
    },
    history: [
      { action: "created", timestamp: new Date(2023, 0, 1 + i).toISOString() },
      { action: "updated", timestamp: new Date(2023, 1, 1 + i).toISOString() },
    ],
  },
}));

// Extra column settings covering every editor type
const columnSettings: ColumnSetting[] = [
  { 
    title: "ID", 
    column: "id", 
    sort: "asc", 
    pin: false, 
    hidden: true,
    editor: {
      validation: (v) =>
        v.string()
          .min(1, "ID is required")
          .max(5, "ID too long")
          .regex(/^[0-9 ]*$/, "Number only"),
    }, 
    width: 60,
    filter: false
  },
  {
    title: "Name",
    column: "name",
    sort: "asc",
    pin: 'pin',
    align: 'left',
    hidden: true,
    editor: {
      validation: (v) =>
        v.string().regex(
          new RegExp("^(?!.*\\s{2,})[A-Za-z]+(?: [A-Za-z]+)*$"),
          "Name can only contain letters and single spaces"
        )
    }
  },
  { 
    title: "Birthdate", 
    column: "birthdate", 
    sort: "asc", 
    width: 160,
    editor: {
      type: "date",
      validation: (v) => v.string().nonempty("Birthdate required"),
    },
    filter: { type: 'date-range' }
  },
  { 
    title: "Vacation Dates", 
    column: "vacationDates", 
    sort: undefined, 
    pin: false, 
    width: 200,
    filter: {
      type: "date",
      filterBy: 'includesString'
    },
    editor: {
      type: "date-range",
      validation: (v) => 
        v.string()
          .nonempty("String cannot be empty")
          .refine((val) => {
            const parts = val.split(",").map(s => s.trim());
            return parts.length === 2 && parts[0] !== "" && parts[1] !== "";
          }, "Must be two non-empty strings separated by a comma")
    }
  },
  {
    title: "Department",
    column: "department",
    sort: "asc",
    pin: false,
    editor: {
      type: "dropdown",
      options: [
        { text: 'HR', value: 'HR' },
        { text: 'Engineering', value: 'Engineering' },
        { text: 'Sales', value: 'Sales' }
      ]
    },
    filter: { type: "dropdown" },
  },
  {
    title: "Salary",
    column: "salary",
    sort: "asc",
    pin: false,
    align: 'right',
    editor: { type: "number" },
    filter: { type: "number-range" }
  },
  {
    title: "Working Hours",
    column: "workingHours",
    sort: undefined,
    pin: false,
  },
  {
    title: "Available",
    column: "active",
    sort: false,
    pin: false,
    width: 100,
    filter: { type: "dropdown" },
    editor: {
      type: "checkbox",
      validation: (v) =>
        v.boolean().refine((val) => val === true, {
          message: "You must be available",
        }),
    }
  },
  {
    title: "Is Out",
    column: "out",
    sort: "asc",
    pin: false,
    editor: { type: "radio" },
    filter: { type: 'dropdown' }
  },
  {
    title: "Gender",
    column: "gender",
    sort: "asc",
    pin: false,
    editor: {
      type: "radio-group",
      options: [
        { text: 'Option 1', value: 'Option1' },
        { text: 'Option 2', value: 'Option2' },
        { text: 'Option 3', value: 'Option3' }
      ]
    },
    filter: { type: 'dropdown' }
  },
  { 
    title: "Status", 
    column: "status", 
    sort: "asc", 
    pin: false, 
    editor: { type: "switch" }, 
    filter: { type: 'dropdown' }
  },
  {
    title: "Preferences",
    column: "preferences",
    sort: false,
    pin: false,
    editor: {
      type: "checkbox-group",
      options: [
        { text: 'Option 1', value: 'Option1' },
        { text: 'Option 2', value: 'Option2' },
        { text: 'Option 3', value: 'Option3' }
      ]
    },
    filter: {
      type: 'dropdown',
      options: [
        { text: 'Option 1', value: 'Option1' },
        { text: 'Option 2', value: 'Option2' },
        { text: 'Option 3', value: 'Option3' }
      ]
    },
    cell: ({ rowValue }) => {
      const { preferences } = rowValue;
      const isArray = Array.isArray(preferences);
      const prefArray = isArray ? preferences : preferences.split(',');
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {prefArray.map((i: string) => <Badge key={i}>{i}</Badge>)}
        </div>
      );
    },
  },
  {
    title: "Switch Group",
    column: "switchGroup",
    sort: false,
    pin: false,
    editor: {
      type: "switch-group",
      options: [
        { text: 'Option 1', value: 'Option1' },
        { text: 'Option 2', value: 'Option2' },
        { text: 'Option 3', value: 'Option3' }
      ]
    },
    filter: {
      type: 'dropdown',
      options: [
        { text: 'Option 1', value: 'Option1' },
        { text: 'Option 2', value: 'Option2' },
        { text: 'Option 3', value: 'Option3' }
      ]
    }
  },
  {
    title: "Adress",
    column: "address",
    width: 300,
    align: 'right',
    sort: false,
    pin: false,
    editor: { type: "textarea" },
  },
  // Simplified deep value columns
  {
    title: "Profile Bio",
    column: "profile.bio",
    sort: "asc",
    align: 'left',
    editor: {
      type: "textarea",
      validation: (v) => v.string().nonempty("Profile bio required"),
    },
    filter: { type: "text" },
    width: 200,
  },
  {
    title: "First Event Date",
    column: "events.eventDate",
    sort: false,
    editor: {
      type: "date",
      validation: (v) => v.string().nonempty("Event date required"),
    },
    filter: { type: "date" },
    width: 160,
  },
  {
    title: "Verified",
    column: "metadata.flags.isVerified",
    sort: false,
    editor: {
      type: "switch",
      validation: (v) =>
        v.boolean().refine((val) => val === true, {
          message: "Please verify",
        }),
    },
    filter: { type: "dropdown" },
    width: 100,
  },
  { 
    title: "Action", 
    column: "id_", 
    sort: false, 
    pin: false, 
    editor: false, 
    filter: false,
    cell: ({ rowValue, index }) => {
      return <button>{rowValue.name} {index}</button>;
    },
  },
];

const DATA_SOURCE = makeData(50000);

/** ✅ Demo Story */
export const Demo = {
  tags: ["!autodocs"],
  render: () => (
    <StoryWrapper title="DataTable Demo">
      <Title>DataTable Feature Demo</Title>
      <DataTable
        dataSource={sampleData}
        columnSettings={columnSettings}
        onChange={e => console.log(e)}
      />
    </StoryWrapper>
  ),
};

// import { useState } from 'react';

// const FloatingSettingsPanel = ({ children, onClose }) => {
//   return (
//     <div
//       style={{
//         position: "fixed",
//         top: "16px",
//         right: "16px",
//         backgroundColor: "#fff",
//         padding: "16px",
//         boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
//         zIndex: 1000,
//         maxHeight: "80vh",
//         overflowY: "auto",
//       }}
//     >
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <h4 style={{ margin: 0 }}>Settings</h4>
//         <button onClick={onClose} style={{ marginLeft: "8px" }}>Close</button>
//       </div>
//       <div style={{ marginTop: "16px" }}>{children}</div>
//     </div>
//   );
// };

// const DataTablePlayground = () => {
//   const [showSettings, setShowSettings] = useState(true);

//   // Toggleable prop states
//   const [enableColumnFiltering, setEnableColumnFiltering] = useState(true);
//   const [enableColumnPinning, setEnableColumnPinning] = useState(true);
//   const [enableColumnDragging, setEnableColumnDragging] = useState(true);
//   const [enableColumnSorting, setEnableColumnSorting] = useState(true);
//   const [enableColumnResizing, setEnableColumnResizing] = useState(true);
//   const [enableCellEditing, setEnableCellEditing] = useState(true);
//   const [enableRowAdding, setEnableRowAdding] = useState(true);
//   const [enableRowDeleting, setEnableRowDeleting] = useState(true);
//   const [enableSelectedRowDeleting, setEnableSelectedRowDeleting] = useState(true);
//   const [enableRowSelection, setEnableRowSelection] = useState(true);
//   const [enableGlobalFiltering, setEnableGlobalFiltering] = useState(true);
//   const [title, setTitle] = useState("DataTable Demo Title");
//   const [cellTextAlignment, setCellTextAlignment] = useState<"left" | "center" | "right">("center");
//   const [height, setHeight] = useState("500px");
//   const [maxHeight, setMaxHeight] = useState("600px");
//   const [pageSize, setPageSize] = useState(10);
//   const [pageIndex, setPageIndex] = useState(0);
//   const [multiSelect, setMultiSelect] = useState(true);
//   const [activeRow, setActiveRow] = useState("1"); // Ensure this key exists in sampleData.
//   const [selectedRows, setSelectedRows] = useState<string[]>(["1", "2"]);
//   const [partialRowDeletionID, setPartialRowDeletionID] = useState("partialDelete");

//   return (
//     <div style={{ padding: "16px" }}>
//       {/* Button to toggle the settings panel */}
//       <button
//         style={{ position: "fixed", top: "16px", left: "16px", zIndex: 1000 }}
//         onClick={() => setShowSettings(!showSettings)}
//       >
//         {showSettings ? "Hide Settings" : "Show Settings"}
//       </button>

//       {showSettings && (
//         <FloatingSettingsPanel onClose={() => setShowSettings(false)}>
//           <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
//             <label>
//               <input
//                 type="checkbox"
//                 checked={enableColumnFiltering}
//                 onChange={(e) => setEnableColumnFiltering(e.target.checked)}
//               />
//               Enable Column Filtering
//             </label>
//             <label>
//               <input
//                 type="checkbox"
//                 checked={enableColumnPinning}
//                 onChange={(e) => setEnableColumnPinning(e.target.checked)}
//               />
//               Enable Column Pinning
//             </label>
//             <label>
//               <input
//                 type="checkbox"
//                 checked={enableColumnDragging}
//                 onChange={(e) => setEnableColumnDragging(e.target.checked)}
//               />
//               Enable Column Dragging
//             </label>
//             <label>
//               <input
//                 type="checkbox"
//                 checked={enableColumnSorting}
//                 onChange={(e) => setEnableColumnSorting(e.target.checked)}
//               />
//               Enable Column Sorting
//             </label>
//             <label>
//               <input
//                 type="checkbox"
//                 checked={enableColumnResizing}
//                 onChange={(e) => setEnableColumnResizing(e.target.checked)}
//               />
//               Enable Column Resizing
//             </label>
//             <label>
//               <input
//                 type="checkbox"
//                 checked={enableCellEditing}
//                 onChange={(e) => setEnableCellEditing(e.target.checked)}
//               />
//               Enable Cell Editing
//             </label>
//             <label>
//               <input
//                 type="checkbox"
//                 checked={enableRowAdding}
//                 onChange={(e) => setEnableRowAdding(e.target.checked)}
//               />
//               Enable Row Adding
//             </label>
//             <label>
//               <input
//                 type="checkbox"
//                 checked={enableRowDeleting}
//                 onChange={(e) => setEnableRowDeleting(e.target.checked)}
//               />
//               Enable Row Deleting
//             </label>
//             <label>
//               <input
//                 type="checkbox"
//                 checked={enableSelectedRowDeleting}
//                 onChange={(e) => setEnableSelectedRowDeleting(e.target.checked)}
//               />
//               Enable Selected Row Deleting
//             </label>
//             <label>
//               <input
//                 type="checkbox"
//                 checked={enableRowSelection}
//                 onChange={(e) => setEnableRowSelection(e.target.checked)}
//               />
//               Enable Row Selection
//             </label>
//             <label>
//               <input
//                 type="checkbox"
//                 checked={enableGlobalFiltering}
//                 onChange={(e) => setEnableGlobalFiltering(e.target.checked)}
//               />
//               Enable Global Filtering
//             </label>
//             <label>
//               Title:
//               <input
//                 type="text"
//                 value={title}
//                 onChange={(e) => setTitle(e.target.value)}
//                 style={{ marginLeft: "8px" }}
//               />
//             </label>
//             <label>
//               Cell Text Alignment:
//               <select
//                 value={cellTextAlignment}
//                 onChange={(e) =>
//                   setCellTextAlignment(e.target.value as "left" | "center" | "right")
//                 }
//                 style={{ marginLeft: "8px" }}
//               >
//                 <option value="left">Left</option>
//                 <option value="center">Center</option>
//                 <option value="right">Right</option>
//               </select>
//             </label>
//             <label>
//               Height:
//               <input
//                 type="text"
//                 value={height}
//                 onChange={(e) => setHeight(e.target.value)}
//                 style={{ marginLeft: "8px" }}
//               />
//             </label>
//             <label>
//               Max Height:
//               <input
//                 type="text"
//                 value={maxHeight}
//                 onChange={(e) => setMaxHeight(e.target.value)}
//                 style={{ marginLeft: "8px" }}
//               />
//             </label>
//             <label>
//               Page Size:
//               <select
//                 value={pageSize}
//                 onChange={(e) => setPageSize(Number(e.target.value))}
//                 style={{ marginLeft: "8px" }}
//               >
//                 <option value={5}>5</option>
//                 <option value={10}>10</option>
//                 <option value={20}>20</option>
//               </select>
//             </label>
//             <label>
//               Page Index:
//               <input
//                 type="number"
//                 value={pageIndex}
//                 onChange={(e) => setPageIndex(Number(e.target.value))}
//                 style={{ marginLeft: "8px", width: "60px" }}
//               />
//             </label>
//             <label>
//               Multi Select:
//               <input
//                 type="checkbox"
//                 checked={multiSelect}
//                 onChange={(e) => setMultiSelect(e.target.checked)}
//                 style={{ marginLeft: "8px" }}
//               />
//             </label>
//             <label>
//               Active Row (ID):
//               <input
//                 type="text"
//                 value={activeRow}
//                 onChange={(e) => setActiveRow(e.target.value)}
//                 style={{ marginLeft: "8px", width: "60px" }}
//               />
//             </label>
//             <label>
//               Selected Rows (comma separated):
//               <input
//                 type="text"
//                 value={selectedRows.join(',')}
//                 onChange={(e) =>
//                   setSelectedRows(e.target.value.split(',').map((s) => s.trim()))
//                 }
//                 style={{ marginLeft: "8px" }}
//               />
//             </label>
//             <label>
//               Partial Row Deletion ID:
//               <input
//                 type="text"
//                 value={partialRowDeletionID}
//                 onChange={(e) => setPartialRowDeletionID(e.target.value)}
//                 style={{ marginLeft: "8px" }}
//               />
//             </label>
//           </div>
//         </FloatingSettingsPanel>
//       )}

//       {/* DataTable rendering below; marginTop provides spacing when settings panel is toggled */}
//       <div style={{ marginTop: "80px" }}>
//         <DataTable_
//           dataSource={sampleData}
//           columnSettings={columnSettings}
//           onChange={(e) => console.log("onChange", e)}
//           enableColumnFiltering={enableColumnFiltering}
//           enableColumnPinning={enableColumnPinning}
//           enableColumnDragging={enableColumnDragging}
//           enableColumnSorting={enableColumnSorting}
//           enableColumnResizing={enableColumnResizing}
//           enableCellEditing={enableCellEditing}
//           enableRowAdding={enableRowAdding}
//           enableRowDeleting={enableRowDeleting}
//           enableSelectedRowDeleting={enableSelectedRowDeleting}
//           enableRowSelection={enableRowSelection}
//           enableGlobalFiltering={enableGlobalFiltering}
//           title={title}
//           cellTextAlignment={cellTextAlignment}
//           height={height}
//           maxHeight={maxHeight}
//           pageSize={pageSize}
//           pageIndex={pageIndex}
//           enableMultiRowSelection={multiSelect}
//           activeRow={activeRow}
//           selectedRows={selectedRows}
//           partialRowDeletionID={partialRowDeletionID}
//           onRowClick={(row) => console.log("Row clicked:", row)}
//           onRowDoubleClick={(row) => console.log("Row double-clicked:", row)}
//           onColumnSettingsChange={(newSettings) =>
//             console.log("Column settings changed:", newSettings)
//           }
//           onPageSizeChange={(newSize) => console.log("Page size changed:", newSize)}
//           onPageIndexChange={(newIndex) => console.log("Page index changed:", newIndex)}
//           onSelectedRowsChange={(rows) =>
//             console.log("Selected rows changed:", rows)
//           }
//         />
//       </div>
//     </div>
//   );
// };

// export const DataTableTest = {
//   tags: ["!autodocs"],
//   render: () => (
//     <StoryWrapper title="DataTable Test">
//       <Title>DataTable Test Feature Demo</Title>
//       <DataTablePlayground />
//     </StoryWrapper>
//   ),
// };

