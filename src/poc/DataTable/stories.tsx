import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "./index";
import { StoryWrapper, Title } from "@components/StoryWrapper";
// import { DataTable as DataTable_ } from './DataTable_/index';
import { ColumnSetting } from './interface';
import { makeData } from "./makeData";
import { COLUMN_SETTINGS_PLAIN } from './data';
import Badge from "@atoms/Badge";

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
const sampleData = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `Name ${i + 1}`,
  age: Math.floor(Math.random() * 60) + 20,
  active: i % 2 === 0,
  joined: new Date(2018, 0, 1 + i).toISOString().split("T")[0],
  tags: "A, B",
  email: `user${i + 1}@example.com`,
  out:  i % 2 === 0,
  in:  i % 2 === 0,
  phone: `555-010${(i % 10).toString().padStart(2, "0")}`,
  country: ["USA", "UK", "Canada", "Australia"][i % 4],
  city: ["New York", "London", "Toronto", "Sydney"][i % 4],
  // New fields to match your columnSettings:
  birthdate: new Date(
    1980 + Math.floor(Math.random() * 20),
    Math.floor(Math.random() * 12),
    Math.floor(Math.random() * 28) + 1
  ).toISOString().split("T")[0],
  vacationDates: [
    new Date(2023, 5, Math.floor(Math.random() * 8) + 1)
      .toISOString()
      .split("T")[0],
    new Date(2023, 5, 28)
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
  address: loremAddresses[i % loremAddresses.length],
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
      validation: (v) => v.string()
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
      validation: (v) => v.schema({
        type: "string",
        pattern: "^(?!.*\s{2,})[A-Za-z]+(?: [A-Za-z]+)*$"
      }, "Name can only contain letters and single spaces")
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
      validation: (v) => {
        /** Validate if valie is an array and has 2 string on it */
        const tupleSchema = v.tuple([
          v.string().nonempty("First string cannot be empty"),
          v.string().nonempty("Second string cannot be empty")
        ])

        /** Check if value is comma separated string */
        const commaSeparatedStringSchema = v
          .string()
          .nonempty("String cannot be empty")
          .refine((val) => {
            const parts = val.split(",").map((s) => s.trim());
            return parts.length === 2 && parts[0] !== "" && parts[1] !== "";
          }, "Must be two non-empty strings separated by a comma");

        /** Merge to custom validation we have  */
        return v.union([commaSeparatedStringSchema, tupleSchema])
      }
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
    editor: {type: "number"},
    filter: {type: "number-range"}
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
      validation: (v) => v.boolean().refine((val) => val === true, {
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
  { title: "Status", column: "status", sort: "asc", pin: false, editor: {type: "switch"}, filter: { type: 'dropdown' }},
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
    /** Customize cell render */
    cell: ({ rowValue }) => {
      const { preferences } = rowValue;
      const isArray = Array.isArray(preferences)
      const prefArray = isArray ? preferences : preferences.split(',')
      return (
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 4}}>
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
    editor: {type: "textarea"},
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

// export const DataTableTest = {
//   tags: ["!autodocs"],
//   render: () => (
//     <StoryWrapper title="DataTable Test">
//       <Title>DataTable Test Feature Demo</Title>
//       <DataTable_
//         dataSource={sampleData}
//         columnSettings={columnSettings}
//         onChange={e => console.log(e)}
//       />
//     </StoryWrapper>
//   ),
// };
