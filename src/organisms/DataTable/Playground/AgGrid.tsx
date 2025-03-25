'use client';
import React, { useState, useEffect } from "react";
import type { ColDef } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

// Register all community modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Dummy secureRandom function and sample addresses
const secureRandom = () => Math.random();
const loremAddresses = [
  "123 Main St, City, Country",
  "456 Elm St, City, Country",
  "789 Maple Ave, City, Country",
];

// Generate 1000 rows of sample data
const dataSource = (length = 1000) => {
  return Array.from({ length }, (_, i) => ({
    id: i + 1,
    name: `Name ${i + 1}`,
    age: Math.floor(secureRandom() * 60) + 20,
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
      1980 + Math.floor(secureRandom() * 20),
      Math.floor(secureRandom() * 12),
      Math.floor(secureRandom() * 28) + 1
    ).toISOString().split("T")[0],
    vacationDates: [
      new Date(2023, 5, Math.floor(secureRandom() * 8) + 1)
        .toISOString()
        .split("T")[0],
      new Date(2023, 5, 28).toISOString().split("T")[0],
    ],
    department: ["HR", "Engineering", "Sales"][i % 3],
    salary: Math.floor(secureRandom() * 80000) + 40000,
    workingHours: [
      String(Math.floor(secureRandom() * 10) + 30),
      String(Math.floor(secureRandom() * 10) + 40),
    ],
    gender: i % 2 === 0 ? "Option1" : "Option2",
    status: i % 2 === 0,
    preferences: i % 3 === 0 ? ["Option1", "Option2"] : ["Option2"],
    switchGroup: i % 2 === 0 ? ["Option1"] : ["Option2"],
    address: loremAddresses[i % loremAddresses.length],
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
        Math.floor(secureRandom() * 12),
        Math.floor(secureRandom() * 28) + 1
      ).toISOString().split("T")[0],
      details: {
        location: ["Conference Room A", "Conference Room B", "Auditorium"][i % 3],
        participants: Math.floor(secureRandom() * 100),
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
};

// Your COLUMN_SETTINGS definition
const COLUMN_SETTINGS = [
  {
    title: "ID",
    column: "id",
    hidden: true,
    width: 60,
    filter: false,
  },
  {
    title: "Name",
    column: "name",
    sort: "asc",
    align: "left",
  },
  {
    title: "Birthdate",
    column: "birthdate",
    sort: "desc",
    width: 160,
    filter: { type: "date-range" },
  },
  {
    title: "Vacation Dates",
    column: "vacationDates",
    width: 200,
    filter: { type: "date" },
  },
  {
    title: "Department",
    column: "department",
    filter: { type: "dropdown" },
  },
  {
    title: "Salary",
    column: "salary",
    align: "right",
    filter: { type: "number-range" },
  },
  {
    title: "Working Hours",
    column: "workingHours",
  },
  {
    title: "Available",
    column: "active",
    width: 100,
    filter: { type: "dropdown" },
  },
  {
    title: "Is Out",
    column: "out",
    filter: { type: "dropdown" },
  },
  {
    title: "Gender",
    column: "gender",
    filter: { type: "dropdown" },
  },
  {
    title: "Status",
    column: "status",
    filter: { type: "dropdown" },
  },
  {
    title: "Preferences",
    column: "preferences",
    filter: { type: "dropdown" },
    cell: (params: any) => {
      const preferences = params.value;
      const prefArray = Array.isArray(preferences)
        ? preferences
        : String(preferences).split(",").filter(Boolean);
      return prefArray.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {prefArray.map((item: string) => (
            <span key={item} style={{ background: "#eee", padding: "2px 4px", borderRadius: 4 }}>
              {item}
            </span>
          ))}
        </div>
      ) : null;
    },
  },
  {
    title: "Switch Group",
    column: "switchGroup",
    filter: { type: "dropdown" },
  },
  {
    title: "Adress",
    column: "address",
    width: 300,
    align: "right",
  },
  {
    title: "Profile Bio",
    column: "profile.bio",
    align: "left",
    filter: { type: "text" },
    width: 200,
  },
  {
    title: "First Event Date",
    column: "events.eventDate",
    filter: { type: "date" },
    width: 160,
  },
  {
    title: "Verified",
    column: "metadata.flags.isVerified",
    filter: { type: "dropdown" },
    width: 100,
  },
  {
    title: "Action",
    column: "id_",
    cell: (params: any) => (
      <button>{params.data.name} {params.rowIndex}</button>
    ),
  },
];

// Helper to map our custom filter types to AG Grid filters
const mapFilterToAgGridFilter = (filter: any) => {
  if (!filter) return false;
  switch (filter.type) {
    case "dropdown":
      return "agSetColumnFilter";
    case "date-range":
    case "date":
      return "agDateColumnFilter";
    case "number-range":
      return "agNumberColumnFilter";
    case "text":
      return "agTextColumnFilter";
    default:
      return true;
  }
};

// Transform COLUMN_SETTINGS into AG Grid ColDef array
const transformColumnSettingsToAgGridDefs = (settings: any[]): ColDef[] => {
  return settings.map((setting) => ({
    headerName: setting.title,
    field: setting.column,
    width: setting.width ?? 150,
    minWidth: 150,
    hide: !!setting.hidden,
    sortable: !!setting.sort,
    sort: setting.sort || undefined,
    filter: setting.filter ? mapFilterToAgGridFilter(setting.filter) : false,
    cellRenderer: setting.cell ? setting.cell : undefined,
    cellStyle: setting.align ? { textAlign: setting.align } : undefined,
  }));
};

export const GridExample = () => {
  const [rowData, setRowData] = useState<any[]>([]);
  const [colDefs, setColDefs] = useState<ColDef[]>([]);

  useEffect(() => {
    setRowData(dataSource(1000));
    setColDefs(transformColumnSettingsToAgGridDefs(COLUMN_SETTINGS));
  }, []);

  const defaultColDef: ColDef = {
    flex: 1,
    resizable: true,
    filter: true,
  };

  return (
    <div className="ag-theme-alpine" style={{ width: "100%", height: "200px" }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        rowSelection={{
          mode: 'multiRow'
        }}
      />
    </div>
  );
};
