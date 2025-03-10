import React from 'react'
import { ColumnSetting } from '../interface'
import { Badge } from '../../../atoms/Badge'

const loremAddresses = [
  'Lorem ipsum dolor sit amet',
  'Consectetur adipiscing elit',
  'Sed do eiusmod tempor incididunt',
  'Ut labore et dolore magna aliqua',
  'Ut enim ad minim veniam',
  'Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat',
]

// Helper function for cryptographically secure random number generation.
const secureRandom = () => {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / (0xFFFFFFFF + 1);
};

// Generate 100 rows of sample data with all columns defined
export const dataSource = (length = 1000) => {
  return Array.from({ length }, (_, i) => ({
    id: i + 1,
    name: `Name ${i + 1}`,
    age: Math.floor(secureRandom() * 60) + 20,
    active: i % 2 === 0,
    joined: new Date(2018, 0, 1 + i).toISOString().split('T')[0],
    tags: 'A, B',
    email: `user${i + 1}@example.com`,
    out: i % 2 === 0,
    in: i % 2 === 0,
    phone: `555-010${(i % 10).toString().padStart(2, '0')}`,
    country: ['USA', 'UK', 'Canada', 'Australia'][i % 4],
    city: ['New York', 'London', 'Toronto', 'Sydney'][i % 4],
    birthdate: new Date(
      1980 + Math.floor(secureRandom() * 20),
      Math.floor(secureRandom() * 12),
      Math.floor(secureRandom() * 28) + 1
    )
      .toISOString()
      .split('T')[0],
    vacationDates: [
      new Date(2023, 5, Math.floor(secureRandom() * 8) + 1)
        .toISOString()
        .split('T')[0],
      new Date(2023, 5, 28).toISOString().split('T')[0],
    ],
    department: ['HR', 'Engineering', 'Sales'][i % 3],
    salary: Math.floor(secureRandom() * 80000) + 40000,
    workingHours: [
      String(Math.floor(secureRandom() * 10) + 30),
      String(Math.floor(secureRandom() * 10) + 40),
    ],
    gender: i % 2 === 0 ? 'Option1' : 'Option2',
    status: i % 2 === 0,
    preferences: i % 3 === 0 ? ['Option1', 'Option2'] : ['Option2'],
    switchGroup: i % 2 === 0 ? ['Option1'] : ['Option2'],
    address: loremAddresses[i % loremAddresses.length],
    profile: {
      bio: `This is a short bio for Name ${i + 1}.`,
      social: {
        twitter: `@user${i + 1}`,
        linkedin: `https://linkedin.com/in/user${i + 1}`,
      },
      skills: ['JavaScript', 'React', 'TypeScript', 'Node.js'].slice(0, (i % 4) + 1),
    },
    events: {
      eventId: `${i + 1}`,
      eventName: `Event ${i + 1}`,
      eventDate: new Date(
        2023,
        Math.floor(secureRandom() * 12),
        Math.floor(secureRandom() * 28) + 1
      )
        .toISOString()
        .split('T')[0],
      details: {
        location: ['Conference Room A', 'Conference Room B', 'Auditorium'][i % 3],
        participants: Math.floor(secureRandom() * 100),
      }
    },
    metadata: {
      createdBy: 'system',
      lastUpdated: new Date().toISOString(),
      flags: {
        isVerified: i % 5 === 0,
        isReviewed: i % 7 === 0,
      },
      history: [
        { action: 'created', timestamp: new Date(2023, 0, 1 + i).toISOString() },
        { action: 'updated', timestamp: new Date(2023, 1, 1 + i).toISOString() },
      ],
    },
  }))
};

// Extra column settings covering every editor type
export const COLUMN_SETTINGS: ColumnSetting[] = [
  {
    title: 'ID',
    column: 'id',
    pin: false,
    hidden: true,
    // editor: {
    //   type: 'number',
    //   validation: (v) =>
    //     v.number({ required_error: 'ID is required' })
    //       .min(0, 'Number cannot be less than zero')
    //       .max(99999, 'ID too long'),
    // },
    width: 60,
    filter: false
  },
  {
    groupTitle: 'Profile',
    title: 'Name',
    column: 'name',
    sort: 'asc',
    // pin: 'pin',
    align: 'left',
    order: 0,
    disabled: (rowData) => rowData?.id === 2,
    // hidden: true,
    editor: {
      disabled: (rowData) => rowData?.id === 1,
      // Conditional validation based in rowData
      validation: (v, rowData) => {
        return rowData?.id === 1 ? v.string().required().unique().max(10) :
          v.string()
            .required()
            .unique()
            .regex(
              new RegExp('^(?!.*\\s{2,})[A-Za-z]+(?: [A-Za-z]+)*$'),
              'Name can only contain letters and single spaces'
            )
            .max(10)
      }
    }
  },
  {
    groupTitle: 'Profile',
    title: 'Birthdate',
    column: 'birthdate',
    sort: 'desc',
    width: 160,
    order: 1,
    disabled: true,
    editor: {
      disabled: true,
      type: 'date',
      validation: (v) => v.string().nonempty('Birthdate required'),
    },
    filter: { type: 'date-range' }
  },
  {
    groupTitle: 'Others',
    title: 'Vacation Dates',
    column: 'vacationDates',
    sort: false,
    pin: false,
    draggable: false,
    width: 200,
    order: 5,
    disabled: true,
    filter: {
      type: 'date',
      filterBy: 'includesString'
    },
    editor: {
      type: 'date-range',
      validation: (v) =>
        v.string()
          .nonempty('String cannot be empty')
          .refine((val) => {
            const parts = val.split(',').map(s => s.trim())
            return parts.length === 2 && parts[0] !== ' && parts[1] !== '
          }, 'Must be two non-empty strings separated by a comma')
    }
  },
  {
    groupTitle: 'Others',
    title: 'Department',
    column: 'department',
    pin: false,
    order: 4,
    editor: {
      type: 'dropdown',
      options: [
        { text: 'HR', value: 'HR' },
        { text: 'Engineering', value: 'Engineering' },
        { text: 'Sales', value: 'Sales' }
      ]
    },
    filter: { type: 'dropdown' },
  },
  {
    title: 'Salary',
    column: 'salary',
    pin: false,
    align: 'right',
    editor: { type: 'number' },
    filter: { type: 'number-range' }
  },
  {
    title: 'Working Hours',
    column: 'workingHours',
    pin: false,
  },
  {
    title: 'Available',
    column: 'active',
    pin: false,
    width: 100,
    filter: { type: 'dropdown' },
    editor: {
      type: 'checkbox',
      validation: (v) =>
        v.boolean().refine((val) => val === true, {
          message: 'You must be available',
        }),
    }
  },
  {
    title: 'Is Out',
    column: 'out',
    pin: false,
    editor: { type: 'radio' },
    filter: { type: 'dropdown' }
  },
  {
    title: 'Gender',
    column: 'gender',
    pin: false,
    editor: {
      type: 'radio-group',
      options: [
        { text: 'Option 1', value: 'Option1' },
        { text: 'Option 2', value: 'Option2' },
        { text: 'Option 3', value: 'Option3' }
      ]
    },
    filter: { type: 'dropdown' }
  },
  {
    title: 'Status',
    column: 'status',
    pin: false,
    editor: { type: 'switch' },
    filter: { type: 'dropdown' }
  },
  {
    title: 'Preferences',
    column: 'preferences',
    pin: false,
    editor: {
      type: 'checkbox-group',
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
      const { preferences } = rowValue
      const isArray = Array.isArray(preferences)
      const prefArray = (isArray ? preferences : preferences.split(',')).filter(Boolean)
      return prefArray.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {prefArray.map((i: string) => <Badge key={i}>{i}</Badge>)}
        </div>
      ) : null
    },
  },
  {
    title: 'Switch Group',
    column: 'switchGroup',
    pin: false,
    editor: {
      type: 'switch-group',
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
    title: 'Adress',
    column: 'address',
    width: 300,
    align: 'right',
    pin: false,
    editor: { type: 'textarea' },
  },
  // Simplified deep value columns
  {
    title: 'Profile Bio',
    column: 'profile.bio',
    align: 'left',
    editor: {
      type: 'textarea',
      validation: (v) => v.string().nonempty('Profile bio required'),
    },
    filter: { type: 'text' },
    width: 200,
  },
  {
    title: 'First Event Date',
    column: 'events.eventDate',
    editor: {
      type: 'date',
      validation: (v) => v.string().nonempty('Event date required'),
    },
    filter: { type: 'date' },
    width: 160,
  },
  {
    title: 'Verified',
    column: 'metadata.flags.isVerified',
    editor: {
      type: 'switch',
      validation: (v) =>
        v.boolean().refine((val) => val === true, {
          message: 'Please verify',
        }),
    },
    filter: { type: 'dropdown' },
    width: 100,
  },
  {
    title: 'Action',
    column: 'id_',
    sort: false,
    pin: false,
    editor: false,
    filter: false,
    cell: ({ rowValue, index }) => {
      return <button>{rowValue.name} {index}</button>
    },
  },
]