import { ColumnDef } from '@tanstack/react-table';

export const COLUMN_SETTINGS_PLAIN = [
  // {
    // header: 'Name',
    // footer: props => props.column.id,
    // columns: [
      {
        accessorKey: 'firstName',
        id: 'firstName', // require in dnd, need to change to column
        cell: info => info.getValue(),
        footer: props => props.column.id,
        header: 'First Name',
        meta: {
          enableColumnFilter: false,
        }
      },
      {
        /** TODO: fix issue when using accessorFn: (row) => row sort is not working */
        accessorKey: 'lastName',
        // accessorFn: (row) => row, // required so cell will work as same as column custom renderer
        id: 'lastName',
        // cell: ({getValue}) => {
        //   const rowData = getValue();
        //   return <b>{rowData?.lastName}</b>
        // },
        header: () => <span>Last Name</span>,
        footer: props => props.column.id,
        meta: {
          enableColumnFilter: false,
        }
      },
  //   ],
  // },
  // {
  //   header: 'Info',
  //   footer: props => props.column.id,
  //   columns: [
      {
        accessorKey: 'age',
        id: 'age',
        header: () => 'Age',
        footer: props => props.column.id,
        meta: {
          filterVariant: 'number-range',
        },
      },
      {
        accessorKey: 'birthday',
        id: 'birthday',
        header: () => 'Birthday',
        // cell: info => {
        //   const d = new Date(info.getValue());
        //   return `${d.getDate()}-${d.getMonth()}-${d.getFullYear()}`
        // },
        // footer: props => props.column.id,
        filterFn: 'dateRangeFilter',
        meta: {
          enableColumnFilter: false,
          filterVariant: 'date-range',
        },
      },
      // {
      //   header: 'More Info',
      //   columns: [
          {
            accessorKey: 'visits',
            id: 'visits',
            header: () => <span>Visits</span>,
            footer: props => props.column.id,
            meta: {
              filterVariant: 'number-range',
            },
          },
          {
            accessorKey: 'activeDate',
            id: 'activeDate',
            header: () => 'Active Date',
            footer: props => props.column.id,
            // cell: info => {
            //   const d = new Date(info.getValue());
            //   return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
            // },
            // meta: {
            //   filterVariant: 'select',
            // },
            filterFn: 'dateFilter',
            meta: {
              filterVariant: 'date',
            },
          },
          {
            accessorKey: 'status',
            id: 'status',
            header: 'Status',
            footer: props => props.column.id,
            meta: {
              filterVariant: 'dropdown',
            },
          },
          {
            accessorKey: 'progress',
            id: 'progress',
            header: 'Profile Progress',
            footer: props => props.column.id,
            meta: {
              filterVariant: 'number-range',
            },
          },
      //   ],
      // },
  //   ],
  // },
] as ColumnDef<unknown, any>[]

export const COLUMN_SETTINGS = [
  {
    header: 'Name',
    footer: props => props.column.id,
    columns: [
      {
        accessorKey: 'firstName',
        id: 'firstName', // require in dnd, need to change to column
        cell: info => info.getValue(),
        footer: props => props.column.id,
        minSize: 160,
        size: 300,
      },
      {
        accessorFn: (row) => row, // required so cell will work as same as column custom renderer
        id: 'lastName',
        cell: ({getValue}) => {
          const rowData = getValue();
          return <b>{rowData?.firstName} {rowData?.lastName}</b>
        },
        header: () => <span>Last Name</span>,
        footer: props => props.column.id,
      },
    ],
  },
  {
    header: 'Info',
    footer: props => props.column.id,
    columns: [
      {
        accessorKey: 'age',
        id: 'age',
        header: () => 'Age',
        footer: props => props.column.id,
      },
      {
        header: 'More Info',
        columns: [
          {
            accessorKey: 'visits',
            id: 'visits',
            header: () => <span>Visits</span>,
            footer: props => props.column.id,
          },
          {
            accessorKey: 'status',
            id: 'status',
            header: 'Status',
            footer: props => props.column.id,
          },
          {
            accessorKey: 'progress',
            id: 'progress',
            header: 'Profile Progress',
            footer: props => props.column.id,
          },
        ],
      },
    ],
  },
] as ColumnDef<unknown, any>[]
