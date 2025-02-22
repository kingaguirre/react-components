import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "./index";
import { StoryWrapper, Title } from "@components/StoryWrapper";
import { DataTable as DataTable_, ColumnSetting } from './DataTable_/index';
import { makeData } from "./makeData";
import { COLUMN_SETTINGS_PLAIN } from './data';

const meta: Meta<typeof DataTable> = {
  title: "POC/DataTable",
  component: DataTable,
  argTypes: {
    // You can add controls for props if needed
  },
} satisfies Meta<typeof DataTable>;

export default meta;

// Generate 200 rows of sample data with all columns defined
const sampleData = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  name: `Name ${i + 1}`,
  age: Math.floor(Math.random() * 60) + 20,
  active: i % 2 === 0,
  joined: new Date(2018, 0, 1 + i).toISOString().split("T")[0],
  tags: "A, B",
  email: `user${i + 1}@example.com`,
  out:  i % 2 === 0,
  phone: `555-010${(i % 10).toString().padStart(2, "0")}`,
  country: ["USA", "UK", "Canada", "Australia"][i % 4],
  city: ["New York", "London", "Toronto", "Sydney"][i % 4],
  // New fields to match your columnSettings:
  birthdate: new Date(
    1980 + Math.floor(Math.random() * 20),
    Math.floor(Math.random() * 12),
    Math.floor(Math.random() * 28) + 1
  )
    .toISOString()
    .split("T")[0],
  vacationDates: [
    new Date(2023, 5, Math.floor(Math.random() * 28) + 1)
      .toISOString()
      .split("T")[0],
    new Date(2023, 5, Math.floor(Math.random() * 28) + 1)
      .toISOString()
      .split("T")[0],
  ],
  department: ["HR", "Engineering", "Sales"][i % 3],
  salary: Math.floor(Math.random() * 80000) + 40000,
  workingHours: [
    String(Math.floor(Math.random() * 10) + 30),
    String(Math.floor(Math.random() * 10) + 40),
  ],
  // For radio-group, our EditableCell example uses fixed options, so here we use "Option1" or "Option2"
  gender: i % 2 === 0 ? "Option1" : "Option2",
  // For switch, value is boolean.
  status: i % 2 === 0,
  // For checkbox-group, we'll provide an array of options
  preferences: i % 3 === 0 ? ["Option1", "Option2"] : ["Option2"],
  // For switch-group, same as checkbox-group
  switchGroup: i % 2 === 0 ? ["Option1"] : ["Option2"],
}));

// Extra column settings covering every editor type
const columnSettings: ColumnSetting[] = [
  { title: "ID", accessor: "id", sortable: true, editor: "text", width: 80 },
  { title: "Name", accessor: "name", sortable: true, editor: "text" },
  { title: "Birthdate", accessor: "birthdate", sortable: true, editor: "date" },
  { title: "Vacation Dates", accessor: "vacationDates", sortable: false, editor: "date-range" },
  { title: "Department", accessor: "department", sortable: true, editor: "select" },
  { title: "Salary", accessor: "salary", sortable: true, editor: "number" },
  { title: "Working Hours", accessor: "workingHours", sortable: false, editor: "number-range" },
  { title: "Available", accessor: "active", sortable: false, editor: "checkbox", width: 80 },
  { title: "Is Out", accessor: "out", sortable: true, editor: "radio" },
  { title: "Gender", accessor: "gender", sortable: true, editor: "radio-group" },
  { title: "Status", accessor: "status", sortable: true, editor: "switch" },
  { title: "Preferences", accessor: "preferences", sortable: false, editor: "checkbox-group" },
  { title: "Switch Group", accessor: "switchGroup", sortable: false, editor: "switch-group" },
];


const DATA_SOURCE = makeData(50000);

/** ✅ Default Story */
export const Default: StoryObj<typeof DataTable> = {
  args: {
    dataSource: DATA_SOURCE,
    columnSettings: COLUMN_SETTINGS_PLAIN,
  },
  tags: ["!dev", "!autodocs"],
};

/** ✅ Demo Story */
export const Demo = {
  tags: ["!autodocs"],
  render: () => (
    <StoryWrapper title="DataTable Demo">
      <Title>DataTable Feature Demo</Title>
      <DataTable dataSource={DATA_SOURCE} columnSettings={COLUMN_SETTINGS_PLAIN} />
    </StoryWrapper>
  ),
};

export const DataTableTest = {
  tags: ["!autodocs"],
  render: () => (
    <StoryWrapper title="DataTable Test">
      <Title>DataTable Test Feature Demo</Title>
      <DataTable_
        dataSource={sampleData}
        columnSettings={columnSettings}
        onChange={e => console.log(e)}
      />
    </StoryWrapper>
  ),
};
