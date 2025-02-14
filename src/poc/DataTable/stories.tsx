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

// Generate 200 rows of sample data with extra columns
const sampleData = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  name: `Name ${i + 1}`,
  age: Math.floor(Math.random() * 60) + 20,
  active: i % 2 === 0,
  joined: new Date(2018, 0, 1 + i).toISOString().split("T")[0],
  tags: "A, B",
  email: `user${i + 1}@example.com`,
  phone: `555-010${(i % 10).toString().padStart(2, "0")}`,
  country: ["USA", "UK", "Canada", "Australia"][i % 4],
  city: ["New York", "London", "Toronto", "Sydney"][i % 4],
}));

const DATA_SOURCE = makeData(50000);

// Define extra column settings to force horizontal scrolling
const columnSettings: ColumnSetting[] = [
  { title: "ID", accessor: "id", sortable: true, editor: "text", width: 80 },
  { title: "Name", accessor: "name", sortable: true, editor: "text" },
  { title: "Age", accessor: "age", sortable: true, editor: "text", width: 80 },
  { title: "Active", accessor: "active", sortable: false, editor: "checkbox", width: 80 },
  { title: "Joined Date", accessor: "joined", sortable: true, editor: "date" },
  { title: "Tags", accessor: "tags", sortable: false, editor: "tags" },
  { title: "Email", accessor: "email", sortable: true, editor: "text" },
  { title: "Phone", accessor: "phone", sortable: true, editor: "text", width: 120 },
  { title: "Country", accessor: "country", sortable: true, editor: "text" },
  { title: "City", accessor: "city", sortable: true, editor: "text" },
];

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
      />
    </StoryWrapper>
  ),
};
