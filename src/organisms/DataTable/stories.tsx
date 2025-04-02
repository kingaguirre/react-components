import React from 'react'
import type { Meta } from '@storybook/react'
import { DataTable } from './index'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import { COLUMN_SETTINGS, dataSource } from './Playground/data'
import { DataTablePlayground } from './Playground'
// import { GridExample } from './Playground/AgGrid'

// const DATA_SOURCE = makeData(50000)
const meta: Meta<typeof DataTable> = {
  title: 'organisms/DataTable',
  component: DataTable,
  argTypes: {},
} satisfies Meta<typeof DataTable>

export default meta

const HeartbeatDisplay = React.memo(() => {
  const [heartbeat, setHeartbeat] = React.useState(0)
  React.useEffect(() => {
    const interval = setInterval(() => setHeartbeat(prev => prev + 1), 100)
    return () => clearInterval(interval)
  }, [])
  return (
    <div>
      <strong>Heartbeat:</strong> {heartbeat}
    </div>
  )
})

/** ✅ Demo Story */
export const Playground = {
  tags: ['!autodocs'],
  render: () => (
    <StoryWrapper
      title='DataTable Playground'
      subTitle='This interactive demonstration tool allows you to experiment with a variety of DataTable configurations in real time. Use the controls accessible via the gear icon at the top-right corner to adjust settings such as filtering, sorting, and more. The DataTable displayed below will update dynamically, enabling you to observe firsthand how each property influences its behavior and appearance.'
    >
      <Title>DataTable Feature Demo</Title>
      {/* <HeartbeatDisplay/> */}
      <DataTablePlayground>
        <DataTable
          dataSource={dataSource()}
          columnSettings={COLUMN_SETTINGS}
          onChange={e => console.log(e)}
          // expandedRowContent={rowData => rowData.id !== 5 ? <div style={{background: 'white'}}>{JSON.stringify(rowData)}</div> : null}
        />
      </DataTablePlayground>
      {/* <GridExample /> */}
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