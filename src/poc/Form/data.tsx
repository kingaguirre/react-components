// src/poc/Form/data.tsx
import { SettingsItem } from './interface';

// Zod validation that accepts date or a string that is a valid date
const dateValidation = (z) => z.union([
  // 1) native Date
  z.date(),

  // 2) date‐string
  z
    .string()
    .refine(
      (s) => !isNaN(Date.parse(s)),
      { message: 'Invalid date format.' }
    )
    .transform((s) => new Date(s)),
])

// ---------------------------------------------
// Demo fieldSettings & dataSource (updated)
// ---------------------------------------------
export const demoSettings: SettingsItem[] = [
  // Initial demo fields before personal section
  {
    name: 'transaction.id',
    label: 'Transaction ID',
    placeholder: 'Enter Transaction ID',
    type: 'text',
    validation: z => z.string().uuid(),
    col: { xs: 12, sm: 6 },
    disabled: true
  },
  {
    name: 'transaction.date',
    label: 'Transaction Date',
    placeholder: 'Select Transaction Date',
    type: 'date',
    validation: dateValidation,
    col: { xs: 12, sm: 6 }
  },
  {
    name: 'transaction.amount',
    label: 'Transaction Amount',
    placeholder: 'Enter Transaction Amount',
    type: 'number',
    validation: z => z.number().min(0),
    col: { xs: 12, sm: 6 }
  },

  // Main header grouping personal information
  {
    header: 'Personal Information',
    description: 'Collect basic details like name, age, join date, and a short biography.',
    fields: [
      {
        name: 'user.firstName',
        label: 'First Name',
        placeholder: 'Enter First Name',
        type: 'text',
        validation: z => z.string().required('First name is mandatory'),
        col: { md: 6 }
      },
      {
        name: 'user.lastName',
        label: 'Last Name',
        placeholder: 'Enter Last Name',
        type: 'text',
        validation: z => z.string().min(1),
        col: { md: 6 }
      },
      {
        name: 'user.age',
        label: 'Age',
        placeholder: 'Enter Age',
        type: 'number',
        disabled: true,
        col: { sm: 6 }
      },
      {
        name: 'user.joinDate',
        label: 'Join Date',
        placeholder: 'Select Join Date',
        type: 'date',
        validation: dateValidation,
        col: { sm: 6 }
      },
      {
        name: 'user.bio',
        label: 'Biography',
        placeholder: 'Enter Biography',
        type: 'textarea',
        validation: z => z.string().max(200),
        col: { xs: 12 }
      },
      {
        name: 'user.preferences.color',
        label: 'Favorite Color',
        placeholder: 'Select Favorite Color',
        type: 'dropdown',
        options: [
          { value: 'red', text: 'Red' },
          { value: 'blue', text: 'Blue' }
        ],
        validation: z => z.enum(['red', 'blue']),
        col: { xs: 12, sm: 6 }
      }
    ]
  },

  // Product Info section
  {
    header: 'Product Info',
    fields: [
      {
        name: 'productInfo.familyPurpose',
        label: 'Family Purpose',
        placeholder: 'Enter Family Purpose',
        type: 'textarea',
        validation: z => z.string().min(1),
        col: { md: 6 }
      },
      {
        name: 'productInfo.supplyChainProgram',
        label: 'Supply Chain Program',
        placeholder: 'Select Supply Chain Program',
        type: 'dropdown',
        options: [
          { value: 'SC01', text: 'SC01' },
          { value: 'SC02', text: 'SC02' },
          { value: 'SC03', text: 'SC03' }
        ],
        validation: z => z.enum(['SC01', 'SC02', 'SC03']),
        col: { md: 6 }
      },
      {
        header: 'Finance Details',
        isSubHeader: true,
        fields: [
          {
            name: 'financeDetails.financePct',
            label: 'Finance Percentage',
            placeholder: 'Enter Finance Percentage',
            type: 'number',
            validation: z => z.number().min(0).max(100),
            col: { md: 3 }
          },
          {
            name: 'financeDetails.interestRate',
            label: 'Interest Rate (%)',
            placeholder: 'Enter Interest Rate',
            type: 'number',
            validation: z => z.number().min(0).max(50),
            col: { md: 3 }
          },
          {
            name: 'financeDetails.loanStart',
            label: 'Loan Start Date',
            placeholder: 'Select Loan Start Date',
            type: 'date',
            validation: dateValidation,
            col: { md: 3 }
          },
          {
            name: 'financeDetails.loanEnd',
            label: 'Loan End Date',
            placeholder: 'Select Loan End Date',
            type: 'date',
            validation: dateValidation,
            col: { md: 3 }
          }
        ]
      }
    ]
  },

  // Additional standalone product fields
  {
    name: 'productInfo.facilityDate',
    label: 'Facility Date',
    placeholder: 'Select Facility Date',
    type: 'date',
    validation: dateValidation,
    col: { md: 4 }
  },
  {
    name: 'productInfo.facilityCode',
    label: 'Facility Code',
    placeholder: 'Enter Facility Code',
    type: 'text',
    validation: z => z.string().regex(/^[A-Z0-9]{4,}$/),
    col: { md: 4 }
  },
  // New fields after Facility Code
  {
    name: 'productInfo.facilityManager',
    label: 'Facility Manager',
    placeholder: 'Enter Facility Manager',
    type: 'text',
    validation: z => z.string().required().min(3),
    col: { md: 4 }
  },
  {
    name: 'productInfo.facilityCapacity',
    label: 'Facility Capacity',
    placeholder: 'Enter Facility Capacity',
    type: 'number',
    validation: z => z.number().min(0),
    col: { md: 4 }
  },
  {
    name: 'productInfo.facilityStatus',
    label: 'Facility Status',
    placeholder: 'Select Facility Status',
    type: 'dropdown',
    options: [
      { value: 'Active', text: 'Active' },
      { value: 'Inactive', text: 'Inactive' }
    ],
    validation: z => z.enum(['Active', 'Inactive']),
    col: { md: 4 }
  },
  {
    header: 'BCA Terms',
    tabs: [
      {
        title: 'Main',
        fields: [
          {
            header: 'Product Info',
            isSubHeader: true,
            fields: [
              {
                label: 'Family Purpose',
                id: 'bcaTerms.productInfo.familyPurpose',
                placeholder: 'Enter Family Purpose',
                type: 'textarea',
                validation: (z) => z.string().min(1),
                col: { xs: 12, sm: 12, md: 6, lg: 6 },
              },
              {
                label: 'Supply Chain Program',
                id: 'bcaTerms.productInfo.supplyChainProgram',
                placeholder: 'Select Supply Chain Program',
                type: 'dropdown',
                options: [
                  { value: 'SC01', text: 'SC01' },
                  { value: 'SC02', text: 'SC02' },
                  { value: 'SC03', text: 'SC03' },
                ],
                validation: (z) => z.enum(['SC01', 'SC02', 'SC03']),
                col: { xs: 12, sm: 12, md: 6, lg: 6 },
              },
              {
                label: 'Facility Date',
                id: 'bcaTerms.productInfo.facilityDate',
                placeholder: 'Select Facility Date',
                type: 'date',
                validation: dateValidation,
                col: { xs: 12, sm: 6, md: 4, lg: 4 },
              },
              {
                label: 'Facility Code',
                id: 'bcaTerms.productInfo.facilityCode',
                placeholder: 'Enter Facility Code',
                type: 'text',
                validation: (z) => z.string().regex(/^[A-Z0-9]{4,}$/),
                col: { xs: 12, sm: 6, md: 4, lg: 4 },
              },
            ],
          },
          {
            header: 'Finance Details',
            isSubHeader: true,
            fields: [
              {
                label: 'Finance Percentage',
                id: 'bcaTerms.financeDetails.financePct',
                placeholder: 'Enter Finance Percentage',
                type: 'number',
                validation: (z) => z.number().min(0).max(100),
                col: { xs: 12, sm: 6, md: 3, lg: 3 },
              },
              {
                label: 'Interest Rate (%)',
                id: 'bcaTerms.financeDetails.interestRate',
                placeholder: 'Enter Interest Rate',
                type: 'number',
                validation: (z) => z.number().min(0).max(50),
                col: { xs: 12, sm: 6, md: 3, lg: 3 },
              },
              {
                label: 'Loan Start Date',
                id: 'bcaTerms.financeDetails.loanStart',
                placeholder: 'Select Loan Start Date',
                type: 'date',
                validation: dateValidation,
                col: { xs: 12, sm: 6, md: 3, lg: 3 },
              },
              {
                label: 'Loan End Date',
                id: 'bcaTerms.financeDetails.loanEnd',
                placeholder: 'Select Loan End Date',
                type: 'date',
                validation: dateValidation,
                col: { xs: 12, sm: 6, md: 3, lg: 3 },
              },
              {
                label: 'Collateral Value',
                id: 'bcaTerms.financeDetails.collateralValue',
                placeholder: 'Enter Collateral Value',
                type: 'number',
                validation: (z) => z.number().min(0),
                col: { xs: 12, sm: 6, md: 4, lg: 4 },
              },
              {
                label: 'Currency',
                id: 'bcaTerms.financeDetails.currency',
                placeholder: 'Enter Currency (e.g. USD)',
                type: 'text',
                validation: (z) => z.string().length(3),
                col: { xs: 12, sm: 6, md: 4, lg: 4 },
              },
            ],
          },
          // Additional single fields in Main
          {
            label: 'Customer Name',
            id: 'bcaTerms.customerName',
            placeholder: 'Enter Customer Name',
            type: 'text',
            validation: (z) => z.string().min(2),
            col: { xs: 12, sm: 6, md: 4, lg: 4 },
          },
          {
            label: 'Customer Email',
            id: 'bcaTerms.customerEmail',
            placeholder: 'Enter Customer Email',
            type: 'email',
            validation: (z) => z.string().email(),
            col: { xs: 12, sm: 6, md: 4, lg: 4 },
          },
          {
            label: 'Customer Phone',
            id: 'bcaTerms.customerPhone',
            placeholder: 'Enter Customer Phone',
            type: 'text',
            validation: (z) => z.string().regex(/^\+?[0-9\-]{7,15}$/, 'Invalid Phone number'),
            col: { xs: 12, sm: 6, md: 4, lg: 4 },
          },
          {
            label: 'Quantity',
            id: 'bcaTerms.quantity',
            placeholder: 'Enter Quantity',
            type: 'number',
            validation: (z) => z.number().int().min(1),
            col: { xs: 12, sm: 6, md: 3, lg: 3 },
          },
          {
            label: 'Is Active',
            id: 'bcaTerms.isActive',
            placeholder: '', // N/A for checkbox
            type: 'checkbox',
            validation: (z) => z.boolean(),
            col: { xs: 12, sm: 6, md: 3, lg: 3 },
          },
          {
            label: 'Priority',
            id: 'bcaTerms.priority',
            placeholder: 'Select Priority',
            type: 'radio-group',
            options: [
              { value: 'low', text: 'Low' },
              { value: 'medium', text: 'Medium' },
              { value: 'high', text: 'High' },
            ],
            validation: (z) => z.enum(['low', 'medium', 'high']),
            col: { xs: 12, sm: 6, md: 4, lg: 4 },
          },
          {
            label: 'Features',
            id: 'bcaTerms.features',
            placeholder: 'Select Features',
            type: 'checkbox-group',
            options: [
              { value: 'featureA', text: 'Feature A' },
              { value: 'featureB', text: 'Feature B' },
              { value: 'featureC', text: 'Feature C' },
            ],
            validation: (z) =>
              z.preprocess(
                // 1) If it comes in as a comma-string, split it; otherwise assume it's already string[] 
                (val) =>
                  typeof val === 'string'
                    ? val.split(',').filter(Boolean) // drop any empty tokens just in case
                    : Array.isArray(val)
                      ? val
                      : [],
                // 2) Now validate it’s a non-empty array of non-empty strings
                z
                  .array(
                    z
                      .string()
                      .min(1, { message: 'Feature keys cannot be empty.' })
                  )
                  .min(1, { message: 'Select at least one feature.' })
              ),
            col: { xs: 12, sm: 12, md: 6, lg: 6 },
          },
          {
            label: 'Mode',
            id: 'bcaTerms.mode',
            placeholder: 'Select Mode',
            type: 'radio-button-group',
            options: [
              { value: 'manual', text: 'Manual' },
              { value: 'automatic', text: 'Automatic' },
            ],
            validation: (z) => z.enum(['manual', 'automatic']),
            col: { xs: 12, sm: 6, md: 3, lg: 3 },
          },
          {
            label: 'Notifications',
            id: 'bcaTerms.notifications',
            placeholder: 'Select Notifications',
            type: 'switch-group',
            options: [
              { value: 'email', text: 'Email' },
              { value: 'sms', text: 'SMS' },
              { value: 'push', text: 'Push' },
            ],
            validation: (z) =>
              z.preprocess(
                // 1) If it comes in as a comma-string, split it; otherwise assume it's already string[] 
                (val) =>
                  typeof val === 'string'
                    ? val.split(',').filter(Boolean) // drop any empty tokens just in case
                    : Array.isArray(val)
                      ? val
                      : [],
                // 2) Now validate it’s a non-empty array of non-empty strings
                z
                  .array(
                    z
                      .string()
                      .min(1, { message: 'Feature keys cannot be empty.' })
                  )
                  .min(1, { message: 'Select at least one feature.' })
              ),
            col: { xs: 12, sm: 6, md: 3, lg: 3 },
          },
          {
            label: 'Enable Feature X',
            id: 'bcaTerms.enableX',
            placeholder: '', // N/A for switch
            type: 'switch',
            validation: (z) => z.boolean(),
            col: { xs: 12, sm: 6, md: 3, lg: 3 },
          },
        ],
      },
      {
        title: 'Digital Data',
        fields: [
          {
            label: 'API Endpoint',
            id: 'bcaTerms.apiEndpoint',
            placeholder: 'Enter API Endpoint',
            type: 'text',
            validation: (z) => z.string().url(),
            col: { xs: 12, sm: 12, md: 6, lg: 6 },
          },
          {
            label: 'Payload Sample',
            id: 'bcaTerms.payloadSample',
            placeholder: 'Enter Payload Sample',
            type: 'textarea',
            validation: (z) => z.string().min(1),
            col: { xs: 12, sm: 12, md: 6, lg: 6 },
          },
          {
            label: 'Use Sandbox',
            id: 'bcaTerms.useSandbox',
            placeholder: '', // N/A for checkbox
            type: 'checkbox',
            validation: (z) => z.boolean(),
            col: { xs: 12, sm: 6, md: 3, lg: 3 },
          },
          {
            label: 'Max Retries',
            id: 'bcaTerms.maxRetries',
            placeholder: 'Enter Max Retries',
            type: 'number',
            validation: (z) => z.number().min(0).max(10),
            col: { xs: 12, sm: 6, md: 3, lg: 3 },
          },
          {
            label: 'Timeout (ms)',
            id: 'bcaTerms.timeout',
            placeholder: 'Enter Timeout (ms)',
            type: 'number',
            validation: (z) => z.number().min(100).max(60000),
            col: { xs: 12, sm: 6, md: 3, lg: 3 },
          },
          {
            label: 'Logging Level',
            id: 'bcaTerms.loggingLevel',
            placeholder: 'Select Logging Level',
            type: 'radio-group',
            validation: (z) => z.enum(['debug', 'info', 'warn', 'error']),
            col: { xs: 12, sm: 6, md: 3, lg: 3 },
          },
        ],
      },
      {
        title: 'Additional Terms',
        fields: [
          {
            label: 'Extra Notes',
            id: 'bcaTerms.extraNotes',
            placeholder: 'Enter Extra Notes',
            type: 'textarea',
            validation: (z) => z.string().max(500),
            col: { xs: 12, sm: 12, md: 12, lg: 12 },
          },
          {
            label: 'Effective Date',
            id: 'bcaTerms.effectiveDate',
            placeholder: 'Select Effective Date',
            type: 'date',
            // ensure valid date string format
            validation: (z) => z.string().refine((s) => !isNaN(Date.parse(s))),
            col: { xs: 12, sm: 6, md: 4, lg: 4 },
          },
          {
            label: 'Expiration Date',
            id: 'bcaTerms.expirationDate',
            placeholder: 'Select Expiration Date',
            type: 'date',
            validation: (z) => z.string().refine((s) => !isNaN(Date.parse(s))),
            col: { xs: 12, sm: 6, md: 4, lg: 4 },
          },
          {
            label: 'Custom Flag',
            id: 'bcaTerms.customFlag',
            placeholder: '', // N/A for switch
            type: 'switch',
            validation: (z) => z.boolean(),
            col: { xs: 12, sm: 6, md: 4, lg: 4 },
          },
          {
            label: 'Additional Percentage',
            id: 'bcaTerms.additionalPct',
            placeholder: 'Enter Additional Percentage',
            type: 'number',
            validation: (z) => z.number().min(0).max(100),
            col: { xs: 12, sm: 6, md: 3, lg: 3 },
          },
        ],
      },
      {
        title: 'Maker Checker Remarks',
        fields: [
          {
            label: 'Maker Comments',
            id: 'bcaTerms.makerComments',
            placeholder: 'Enter Maker Comments',
            type: 'textarea',
            validation: (z) => z.string().min(1),
            col: { xs: 12, sm: 12, md: 12, lg: 12 },
          },
          {
            label: 'Checker Comments',
            id: 'bcaTerms.checkerComments',
            placeholder: 'Enter Checker Comments',
            type: 'textarea',
            validation: (z) => z.string().min(1),
            col: { xs: 12, sm: 12, md: 12, lg: 12 },
          },
        ],
      },
    ],
  },

  // Conditional validation demo
  {
    header: 'Conditional Validation',
    description: `This section demonstrates how changing the “Validation Mode” dynamically
      enables, disables, hides, and validates other inputs. Try Standard, Custom or
      Advanced to see the form react in real time.`,
    fields: [
      {
        name: 'conditional.validationOption',
        label: 'Validation Mode',
        placeholder: 'Select Validation Mode',
        type: 'dropdown',
        options: [
          { value: 'standard', text: 'Standard' },
          { value: 'custom',   text: 'Custom (requires an enabled input)' },
          { value: 'advanced', text: 'Advanced Mode — unlock expert features' },
        ],
        validation: z => z.enum(['standard', 'custom', 'advanced']),
        col: { xs: 12, sm: 6 },
      },

      // 2) Existing conditional textbox (unchanged)
      {
        name: 'conditional.conditionalInput',
        label: 'Conditional Input',
        placeholder: 'Enter Conditional Input',
        type: 'text',
        disabled: (values) => values?.conditional?.validationOption !== 'custom',
        validation: (z, values) =>
          values?.conditional?.validationOption === 'custom'
            ? z
                .string()
                .required('Required when Custom mode is active.')
                .max(5, 'Max 5 characters in Custom mode.')
            : z.string().optional(),
        col: { xs: 12, sm: 6 },
      },

      // 3) Now only visible in Advanced mode
      {
        name: 'conditional.standardTip',
        label: 'Standard Mode Tip',
        placeholder: 'This tip appears only in Advanced mode',
        type: 'text',
        hidden: (values) =>
          values?.conditional?.validationOption !== 'advanced',
        validation: z => z.string().optional(),
        col: { xs: 12, sm: 6 },
      },
    ],
  },

  // Sub-header group only in Advanced mode
  {
    header: 'Extra Information',
    isSubHeader: true,
    hidden: (values) =>
      values?.conditional?.validationOption !== 'advanced',
    fields: [
      {
        name: 'conditional.extraDetail',
        label: 'Why choose Advanced mode?',
        type: 'textarea',
        placeholder: 'Explain your reasoning here…',
        validation: z => z.string().optional(),
        col: { xs: 12 },
      },
    ],
  },

  // Tabbed details: Standard & Custom tabs only in Advanced mode
  {
    header: 'Mode Details',
    description: `Demo of conditional show/hide of fields, tabs, and headers based on
      the selected Validation Mode.`,
    tabs: [
      {
        title: 'Standard Details',
        hidden: (values) =>
          values?.conditional?.validationOption !== 'advanced',
        fields: [
          {
            name: 'conditional.standardDetail1',
            label: 'Standard Detail 1',
            placeholder: 'Enter standard detail…',
            type: 'text',
            validation: z => z.string().optional(),
            col: { xs: 12, sm: 6 },
          },
        ],
      },
      {
        title: 'Custom Details',
        hidden: (values) =>
          values?.conditional?.validationOption !== 'advanced',
        fields: [
          {
            name: 'conditional.customDetail1',
            label: 'Custom Detail 1',
            placeholder: 'Enter custom detail…',
            type: 'text',
            validation: z => z.string().optional(),
            col: { xs: 12, sm: 6 },
          },
        ],
      },
      {
        title: 'Advanced Details',
        // always visible, but only really meaningful in advanced mode
        fields: [
          {
            name: 'conditional.advancedDetail',
            label: 'Expert Notes',
            placeholder: 'At least 10 chars for Advanced mode…',
            type: 'textarea',
            validation: z =>
              z
                .string()
                .min(10, 'At least 10 characters for Advanced mode.'),
            col: { xs: 12, sm: 6 },
          },
        ],
      },
    ],
  },
];

export const demoData = {
  transaction: {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    date: new Date('2025-06-30'),
    amount: 1500.75
  },
  user: {
    firstName: 'Alice',
    lastName: 'Johnson',
    age: 28,
    joinDate: new Date('2021-01-15'),
    bio: 'Loves coding.',
    preferences: { color: 'blue' }
  },
  productInfo: {
    familyPurpose: 'Business expansion',
    supplyChainProgram: 'SC02',
    facilityDate: new Date('2025-06-01'),
    facilityCode: 'ABCD',
    facilityManager: 'Bob Smith',
    facilityCapacity: 120,
    facilityStatus: 'Active'
  },
  financeDetails: {
    financePct: 75,
    interestRate: 5.5,
    loanStart: new Date('2025-05-15'),
    loanEnd: new Date('2025-07-15')
  },
  // BCA Terms data namespace
  bcaTerms: {
    // Main tab
    productInfo: {
      familyPurpose: 'Corporate expansion',
      supplyChainProgram: 'SC03',
      facilityDate: '2025-07-01',
      facilityCode: 'EFGH',
    },
    financeDetails: {
      financePct: 80,
      interestRate: 4.25,
      loanStart: '2025-08-01',
      loanEnd: '2026-08-01',
      collateralValue: 120000,
      currency: 'USD',
    },
    customerName: 'Bob Smith',
    customerEmail: 'bob@example.com',
    customerPhone: '+628123456789',
    agreementUrl: 'https://example.com/agreement.pdf',
    documentUpload: null,
    quantity: 42,
    isActive: true,
    priority: 'high',
    features: ['featureA', 'featureC'],
    mode: 'automatic',
    notifications: ['email', 'push'],
    enableX: false,
    colorTheme: '#00FF00',

    // Digital Data tab
    apiEndpoint: 'https://api.example.com/v1/data',
    payloadSample: '{"key":"value"}',
    useSandbox: true,
    maxRetries: 3,
    timeout: 5000,
    loggingLevel: 'info',
    backupUrl: 'https://backup.example.com',
    certUpload: null,

    // Additional Terms tab
    extraNotes: 'These are some extra terms.',
    effectiveDate: '2025-07-15',
    expirationDate: '2026-07-15',
    customFlag: false,
    additionalPct: 10,

    // Maker Checker Remarks tab
    makerComments: 'Looks good from maker side.',
    checkerComments: 'Verified and approved.',
  },
  conditional: {
    validationOption: 'standard',
    conditionalInput:    '',
    standardTip:          '',
    extraDetail:          '',
    standardDetail1:      '',
    customDetail1:        '',
    advancedDetail:       '',
  }
};
