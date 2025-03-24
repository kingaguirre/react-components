import React from 'react'
import type { Meta } from '@storybook/react'
import { DataTable } from './index'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import { COLUMN_SETTINGS, dataSource } from './Playground/data'
import { DataTablePlayground } from './Playground'

// const DATA_SOURCE = makeData(50000)
const meta: Meta<typeof DataTable> = {
  title: 'organisms/DataTable',
  component: DataTable,
  argTypes: {},
} satisfies Meta<typeof DataTable>

export default meta

/** ✅ Demo Story */
export const Playground = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper
      title='DataTable Playground'
      subTitle='This interactive demonstration tool allows you to experiment with a variety of DataTable configurations in real time. Use the controls accessible via the gear icon at the top-right corner to adjust settings such as filtering, sorting, and more. The DataTable displayed below will update dynamically, enabling you to observe firsthand how each property influences its behavior and appearance.'
    >
      <Title>DataTable Feature Demo</Title>
      <DataTablePlayground>
        <DataTable
          dataSource={dataSource()}
          columnSettings={COLUMN_SETTINGS}
          onChange={e => console.log(e)}
          // expandedRowContent={rowData => rowData.id !== 5 ? <div style={{background: 'white'}}>{JSON.stringify(rowData)}</div> : null}
        />
      </DataTablePlayground>
    </StoryWrapper>
  ),
}

/** Test for playwright */
export const Test = {
  tags: ['!autodocs', '!dev'],
  render: () => (
    <StoryWrapper
      title='DataTable Test'
      subTitle='This page is for Playwright test simulation only.'
    >
      <Title>DataTable Test</Title>
      <DataTable
        dataSource={[
          {
            id: '0',
            textField: 'Text Value',
            textareaField: 'Textarea Value',
            dropdownField: 'Option1',
            dateField: '2025-03-12',
            dateRangeField: ['2025-03-10', '2025-03-12'],
            radioField: 'OptionA',
            checkboxField: true,
            switchField: false,
            checkboxGroupField: ['Option1', 'Option3'],
            switchGroupField: ['Option2'],
            radioGroupField: 'OptionB',
          },
        ]}
        columnSettings={[
          { title: 'ID', column: 'id' },
          {
            title: 'Text Field',
            column: 'textField',
            editor: { type: 'text' },
          },
          {
            title: 'Textarea Field',
            column: 'textareaField',
            editor: { type: 'textarea' },
          },
          {
            title: 'Dropdown Field',
            column: 'dropdownField',
            editor: {
              type: 'dropdown',
              options: [
                { text: 'Option1', value: 'Option1' },
                { text: 'Option2', value: 'Option2' },
                { text: 'Option3', value: 'Option3' },
              ],
            },
          },
          {
            title: 'Date Field',
            column: 'dateField',
            editor: { type: 'date' },
          },
          {
            title: 'Date Range Field',
            column: 'dateRangeField',
            editor: { type: 'date-range' },
          },
          {
            title: 'Radio Field',
            column: 'radioField',
            editor: {
              type: 'radio',
              options: [
                { text: 'OptionA', value: 'OptionA' },
                { text: 'OptionB', value: 'OptionB' },
                { text: 'OptionC', value: 'OptionC' },
              ],
            },
          },
          {
            title: 'Checkbox Field',
            column: 'checkboxField',
            editor: { type: 'checkbox' },
          },
          {
            title: 'Switch Field',
            column: 'switchField',
            editor: { type: 'switch' },
          },
          {
            title: 'Checkbox Group Field',
            column: 'checkboxGroupField',
            editor: {
              type: 'checkbox-group',
              options: [
                { text: 'Option1', value: 'Option1' },
                { text: 'Option2', value: 'Option2' },
                { text: 'Option3', value: 'Option3' },
              ],
            },
          },
          {
            title: 'Switch Group Field',
            column: 'switchGroupField',
            editor: {
              type: 'switch-group',
              options: [
                { text: 'Option1', value: 'Option1' },
                { text: 'Option2', value: 'Option2' },
                { text: 'Option3', value: 'Option3' },
              ],
            },
          },
          {
            title: 'Radio Group Field',
            column: 'radioGroupField',
            editor: {
              type: 'radio-group',
              options: [
                { text: 'OptionA', value: 'OptionA' },
                { text: 'OptionB', value: 'OptionB' },
                { text: 'OptionC', value: 'OptionC' },
              ],
            },
          },
        ]}
      />
      <DataTable
        dataSource={[
          { id: '0', firstName: 'John', lastname: 'Doe', role: 'Admin' },
          { id: '1', firstName: 'Jane', lastname: 'Smith', role: 'User' },
          { id: '2', firstName: 'Alice', lastname: 'Johnson', role: 'User' },
          { id: '3', firstName: 'Bob', lastname: 'Brown', role: 'User' },
          { id: '4', firstName: 'Carol', lastname: 'Williams', role: 'Admin' },
          { id: '5', firstName: 'David', lastname: 'Jones', role: 'User' },
          { id: '6', firstName: 'Eva', lastname: 'Miller', role: 'User' },
          { id: '7', firstName: 'Frank', lastname: 'Davis', role: 'Admin' },
          { id: '8', firstName: 'Grace', lastname: 'Garcia', role: 'User' },
          { id: '9', firstName: 'Henry', lastname: 'Martinez', role: 'User' },
        ]}
        columnSettings={[
          {
            title: 'ID',
            column: 'id',
            // pin: 'pin',
            // sort: 'asc',
            draggable: true
          },
          {
            title: 'First Name',
            column: 'firstName',
            pin: 'unpin',
            // sort: 'desc',
            draggable: true,
            width: 300,
            filter: { type: 'text', filterBy: 'includesString' },
            editor: {
              validation: (v) =>
                v.string().regex(
                  new RegExp('^(?!.*\\s{2,})[A-Za-z]+(?: [A-Za-z]+)*$'),
                  'Name can only contain letters and single spaces'
                ).required().unique()
            }
          },
          { title: 'Last Name', column: 'lastname', pin: false, sort: false, draggable: false },
          { title: 'Role', column: 'role' }, // No explicit interactive properties.
        ]}
        onChange={e => console.log(e)}
        expandedRowContent={rowData => rowData.id !== 5 ? <div style={{background: 'white'}}>{JSON.stringify(rowData)}</div> : null}
        enableColumnDragging={false}
      />
    </StoryWrapper>
  ),
}