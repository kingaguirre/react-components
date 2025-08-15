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
  /** ── Data‑Table demo ────────────────────────────────────────────── */
  // {
  //   name: 'demoTable.mode',
  //   label: 'Table Mode',
  //   placeholder: 'Select Table Mode',
  //   type: 'dropdown',
  //   options: [
  //     { value: 'enabled',       text: 'Editable Table (click rows to load)' },
  //     { value: 'disabled',      text: 'Read‑Only Table (rows greyed‑out)' },
  //     { value: 'fieldsHidden',  text: 'Hide Fields Below Table (Additional Details)' },
  //     { value: 'fieldsDisabled',text: 'Disable Only Fields Below Table' },
  //     { value: 'hidden',        text: 'Hide Table & All Fields Below' },
  //   ],
  //   validation: (z) => z.enum(['enabled','disabled','fieldsHidden','fieldsDisabled','hidden']),
  //   col: { xs: 12, sm: 6 },
  // },
  // {
  //   dataTable: {
  //     header: 'Recent Maker‑Checker Actions',
  //     description: 'Click a row to load its Maker & Checker comments below.',
  //     config: {
  //       dataSource: 'demoTable.rows',
  //       columnSettings: [
  //         { title: 'Maker',   column: 'maker' },
  //         { title: 'Checker', column: 'checker' },
  //         { title: 'Status',  column: 'status' },
  //       ],
  //     },
  //     disabled: (v) => v.demoTable.mode === 'disabled',
  //     hidden:   (v) => v.demoTable.mode === 'hidden',
  //     fields: [
  //       {
  //         label: 'Maker Comments',
  //         name: 'bcaTerms.makerComments',
  //         placeholder: 'Enter Maker Comments',
  //         type: 'textarea',
  //         validation: (z) => z.string().min(1),
  //         disabled:(v) => v.demoTable.mode === 'fieldsDisabled',
  //       },
  //       {
  //         label: 'Checker Comments',
  //         name: 'bcaTerms.checkerComments',
  //         placeholder: 'Enter Checker Comments',
  //         type: 'textarea',
  //         validation: (z) => z.string().min(1),
  //         disabled:(v) => v.demoTable.mode === 'fieldsDisabled',
  //       },
  //       {
  //         label: 'Approval Status',
  //         name: 'bcaTerms.status',
  //         placeholder: 'Enter Approval Status',
  //         type: 'text',
  //         validation: (z) => z.string().optional(),
  //         disabled:(v) => v.demoTable.mode === 'fieldsDisabled',
  //       },
  //       {
  //         header: 'Additional Details',
  //         isSubHeader: true,
  //         hidden:   (v) => v.demoTable.mode === 'hidden' || v.demoTable.mode === 'fieldsHidden',
  //         fields: [
  //           {
  //             label: 'Review Comments',
  //             name: 'bcaTerms.reviewComments',
  //             placeholder: 'Enter review comments',
  //             type: 'textarea',
  //             validation: (z) => z.string().optional(),
  //             disabled: (v) => v.demoTable.mode === 'fieldsDisabled',
  //           },
  //           {
  //             label: 'Follow‑up Notes',
  //             name: 'bcaTerms.followUpNotes',
  //             placeholder: 'Enter follow‑up notes',
  //             type: 'textarea',
  //             validation: (z) => z.string().optional(),
  //             disabled: (v) => v.demoTable.mode === 'fieldsDisabled',
  //           },
  //           {
  //             label: 'Escalation Status',
  //             name: 'bcaTerms.escalationStatus',
  //             placeholder: 'Enter escalation status',
  //             type: 'text',
  //             validation: (z) => z.string().optional(),
  //             disabled: (v) => v.demoTable.mode === 'fieldsDisabled',
  //           },
  //           {
  //             label: 'Handling Instructions',
  //             name: 'bcaTerms.handlingInstructions',
  //             placeholder: 'Enter handling instructions',
  //             type: 'textarea',
  //             validation: (z) => z.string().optional(),
  //             disabled: (v) => v.demoTable.mode === 'fieldsDisabled',
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // },
  // // Initial demo fields before personal section
  // {
  //   name: 'transaction.id',
  //   label: 'Transaction ID',
  //   placeholder: 'Enter Transaction ID',
  //   type: 'text',
  //   validation: z => z.string().uuid(),
  //   col: { xs: 12, sm: 6 },
  //   disabled: true
  // },
  // {
  //   name: 'transaction.date',
  //   label: 'Transaction Date',
  //   placeholder: 'Select Transaction Date',
  //   type: 'date',
  //   validation: dateValidation,
  //   col: { xs: 12, sm: 6 }
  // },
  // {
  //   name: 'transaction.amount',
  //   label: 'Transaction Amount',
  //   placeholder: 'Enter Transaction Amount',
  //   type: 'number',
  //   validation: z => z.number().min(0),
  //   col: { xs: 12, sm: 6 }
  // },

  // // Main header grouping personal information
  // {
  //   header: 'Personal Information',
  //   description: 'Collect basic details like name, age, join date, and a short biography.',
  //   fields: [
  //     {
  //       name: 'user.firstName',
  //       label: 'First Name',
  //       placeholder: 'Enter First Name',
  //       type: 'text',
  //       validation: z => z.string().required('First name is mandatory'),
  //       col: { md: 6 }
  //     },
  //     {
  //       name: 'user.lastName',
  //       label: 'Last Name',
  //       placeholder: 'Enter Last Name',
  //       type: 'text',
  //       validation: z => z.string().min(1),
  //       col: { md: 6 }
  //     },
  //     {
  //       name: 'user.age',
  //       label: 'Age',
  //       placeholder: 'Enter Age',
  //       type: 'number',
  //       disabled: true,
  //       col: { sm: 6 }
  //     },
  //     {
  //       name: 'user.joinDate',
  //       label: 'Join Date',
  //       placeholder: 'Select Join Date',
  //       type: 'date',
  //       validation: dateValidation,
  //       col: { sm: 6 }
  //     },
  //     {
  //       name: 'user.bio',
  //       label: 'Biography',
  //       placeholder: 'Enter Biography',
  //       type: 'textarea',
  //       validation: z => z.string().max(200),
  //       col: { xs: 12 }
  //     },
  //     {
  //       name: 'user.preferences.color',
  //       label: 'Favorite Color',
  //       placeholder: 'Select Favorite Color',
  //       type: 'dropdown',
  //       options: [
  //         { value: 'red', text: 'Red' },
  //         { value: 'blue', text: 'Blue' }
  //       ],
  //       validation: z => z.enum(['red', 'blue']),
  //       col: { xs: 12, sm: 6 }
  //     }
  //   ]
  // },

  // // Product Info section
  // {
  //   header: 'Product Info',
  //   fields: [
  //     {
  //       name: 'productInfo.familyPurpose',
  //       label: 'Family Purpose',
  //       placeholder: 'Enter Family Purpose',
  //       type: 'textarea',
  //       validation: z => z.string().min(1),
  //       col: { md: 6 }
  //     },
  //     {
  //       name: 'productInfo.supplyChainProgram',
  //       label: 'Supply Chain Program',
  //       placeholder: 'Select Supply Chain Program',
  //       type: 'dropdown',
  //       options: [
  //         { value: 'SC01', text: 'SC01' },
  //         { value: 'SC02', text: 'SC02' },
  //         { value: 'SC03', text: 'SC03' }
  //       ],
  //       validation: z => z.enum(['SC01', 'SC02', 'SC03']),
  //       col: { md: 6 }
  //     },
  //     {
  //       header: 'Finance Details',
  //       isSubHeader: true,
  //       fields: [
  //         {
  //           name: 'financeDetails.financePct',
  //           label: 'Finance Percentage',
  //           placeholder: 'Enter Finance Percentage',
  //           type: 'number',
  //           validation: z => z.number().min(0).max(100),
  //           col: { md: 3 }
  //         },
  //         {
  //           name: 'financeDetails.interestRate',
  //           label: 'Interest Rate (%)',
  //           placeholder: 'Enter Interest Rate',
  //           type: 'number',
  //           validation: z => z.number().min(0).max(50),
  //           col: { md: 3 }
  //         },
  //         {
  //           name: 'financeDetails.loanStart',
  //           label: 'Loan Start Date',
  //           placeholder: 'Select Loan Start Date',
  //           type: 'date',
  //           validation: dateValidation,
  //           col: { md: 3 }
  //         },
  //         {
  //           name: 'financeDetails.loanEnd',
  //           label: 'Loan End Date',
  //           placeholder: 'Select Loan End Date',
  //           type: 'date',
  //           validation: dateValidation,
  //           col: { md: 3 }
  //         }
  //       ]
  //     }
  //   ]
  // },

  // // Additional standalone product fields
  // {
  //   name: 'productInfo.facilityDate',
  //   label: 'Facility Date',
  //   placeholder: 'Select Facility Date',
  //   type: 'date',
  //   validation: dateValidation,
  //   col: { md: 4 }
  // },
  // {
  //   name: 'productInfo.facilityCode',
  //   label: 'Facility Code',
  //   placeholder: 'Enter Facility Code',
  //   type: 'text',
  //   validation: z => z.string().regex(/^[A-Z0-9]{4,}$/),
  //   col: { md: 4 }
  // },
  // // New fields after Facility Code
  // {
  //   name: 'productInfo.facilityManager',
  //   label: 'Facility Manager',
  //   placeholder: 'Enter Facility Manager',
  //   type: 'text',
  //   validation: z => z.string().required().min(3),
  //   col: { md: 4 }
  // },
  // {
  //   name: 'productInfo.facilityCapacity',
  //   label: 'Facility Capacity',
  //   placeholder: 'Enter Facility Capacity',
  //   type: 'number',
  //   validation: z => z.number().min(0),
  //   col: { md: 4 }
  // },
  // {
  //   name: 'productInfo.facilityStatus',
  //   label: 'Facility Status',
  //   placeholder: 'Select Facility Status',
  //   type: 'dropdown',
  //   options: [
  //     { value: 'Active', text: 'Active' },
  //     { value: 'Inactive', text: 'Inactive' }
  //   ],
  //   validation: z => z.enum(['Active', 'Inactive']),
  //   col: { md: 4 }
  // },

  // // Accordion section for extended product details
  // {
  //   header: 'Optional Services',
  //   isSubHeader: true,
  //   description: 'Configure on‑site or remote support options for this facility.',
  //   accordion: [
  //     {
  //       title: 'Onsite Support',
  //       fields: [
  //         {
  //           name: 'services.onsite.engineer',
  //           label: 'Engineer Name',
  //           placeholder: 'e.g. Jane Doe',
  //           type: 'text',
  //           validation: z => z.string().min(2),
  //           col: { md: 6 }
  //         },
  //         {
  //           name: 'services.onsite.phone',
  //           label: 'Engineer Phone',
  //           placeholder: 'e.g. +628123456781',
  //           type: 'text',
  //           validation: z => z.string().regex(/^\+?[0-9\-]{7,15}$/, 'Invalid phone number'),
  //           col: { md: 6 }
  //         },
  //         {
  //           name: 'services.onsite.responseTime',
  //           label: 'Response Time (hrs)',
  //           placeholder: 'e.g. 2',
  //           type: 'number',
  //           validation: z => z.number().min(1),
  //           col: { md: 6 }
  //         }
  //       ]
  //     },
  //     {
  //       title: 'Remote Support',
  //       fields: [
  //         {
  //           name: 'services.remote.url',
  //           label: 'Support URL',
  //           placeholder: 'e.g. https://support.acme.com',
  //           type: 'text',
  //           validation: z => z.string().url(),
  //           col: { md: 6 }
  //         },
  //         {
  //           name: 'services.remote.contactHours',
  //           label: 'Support Hours',
  //           placeholder: 'e.g. 24/7 or 9am–5pm',
  //           type: 'text',
  //           validation: z => z.string().min(3),
  //           col: { md: 6 }
  //         }
  //       ]
  //     }
  //   ],
  //   allowMultiple: true
  // },
  // {
  //   header: 'Compliance & Safety',
  //   description: 'Ensure this facility meets all safety and regulatory standards.',
  //   accordion: [
  //     {
  //       title: 'Regulatory Records',
  //       // inside this accordion panel we use FieldGroup-style headers
  //       fields: [
  //         {
  //           header: 'Certification Details',
  //           isSubHeader: false,
  //           fields: [
  //             {
  //               name: 'compliance.certAuthority',
  //               label: 'Certifying Authority',
  //               placeholder: 'e.g. ISO Safety Board',
  //               type: 'text',
  //               validation: z => z.string().min(1),
  //               col: { md: 6 }
  //             },
  //             {
  //               name: 'compliance.certDate',
  //               label: 'Certification Date',
  //               placeholder: 'Select date',
  //               type: 'date',
  //               validation: dateValidation,
  //               col: { md: 6 }
  //             }
  //           ]
  //         },
  //         {
  //           header: 'Inspection Summary',
  //           isSubHeader: true,
  //           fields: [
  //             {
  //               name: 'compliance.lastInspection',
  //               label: 'Last Inspection Date',
  //               placeholder: 'Select date',
  //               type: 'date',
  //               validation: dateValidation,
  //               col: { md: 6 }
  //             },
  //             {
  //               name: 'compliance.inspectorName',
  //               label: 'Inspector Name',
  //               placeholder: 'e.g. Jane Auditor',
  //               type: 'text',
  //               validation: z => z.string().min(2),
  //               col: { md: 6 }
  //             }
  //           ]
  //         }
  //       ]
  //     }
  //   ],
  //   allowMultiple: false
  // },

  // {
  //   header: 'BCA Terms',
  //   tabs: [
  //     {
  //       title: 'Main',
  //       fields: [
  //         {
  //           header: 'Product Info',
  //           isSubHeader: true,
  //           fields: [
  //             {
  //               label: 'Family Purpose',
  //               name: 'bcaTerms.productInfo.familyPurpose',
  //               placeholder: 'Enter Family Purpose',
  //               type: 'textarea',
  //               validation: (z) => z.string().min(1),
  //               col: { xs: 12, sm: 12, md: 6, lg: 6 },
  //             },
  //             {
  //               label: 'Supply Chain Program',
  //               name: 'bcaTerms.productInfo.supplyChainProgram',
  //               placeholder: 'Select Supply Chain Program',
  //               type: 'dropdown',
  //               options: [
  //                 { value: 'SC01', text: 'SC01' },
  //                 { value: 'SC02', text: 'SC02' },
  //                 { value: 'SC03', text: 'SC03' },
  //               ],
  //               validation: (z) => z.enum(['SC01', 'SC02', 'SC03']),
  //               col: { xs: 12, sm: 12, md: 6, lg: 6 },
  //             },
  //             {
  //               label: 'Facility Date',
  //               name: 'bcaTerms.productInfo.facilityDate',
  //               placeholder: 'Select Facility Date',
  //               type: 'date',
  //               validation: dateValidation,
  //               col: { xs: 12, sm: 6, md: 4, lg: 4 },
  //             },
  //             {
  //               label: 'Facility Code',
  //               name: 'bcaTerms.productInfo.facilityCode',
  //               placeholder: 'Enter Facility Code',
  //               type: 'text',
  //               validation: (z) => z.string().regex(/^[A-Z0-9]{4,}$/),
  //               col: { xs: 12, sm: 6, md: 4, lg: 4 },
  //             },
  //           ],
  //         },
  //         {
  //           header: 'Finance Details',
  //           isSubHeader: true,
  //           fields: [
  //             {
  //               label: 'Finance Percentage',
  //               name: 'bcaTerms.financeDetails.financePct',
  //               placeholder: 'Enter Finance Percentage',
  //               type: 'number',
  //               validation: (z) => z.number().min(0).max(100),
  //               col: { xs: 12, sm: 6, md: 3, lg: 3 },
  //             },
  //             {
  //               label: 'Interest Rate (%)',
  //               name: 'bcaTerms.financeDetails.interestRate',
  //               placeholder: 'Enter Interest Rate',
  //               type: 'number',
  //               validation: (z) => z.number().min(0).max(50),
  //               col: { xs: 12, sm: 6, md: 3, lg: 3 },
  //             },
  //             {
  //               label: 'Loan Start Date',
  //               name: 'bcaTerms.financeDetails.loanStart',
  //               placeholder: 'Select Loan Start Date',
  //               type: 'date',
  //               validation: dateValidation,
  //               col: { xs: 12, sm: 6, md: 3, lg: 3 },
  //             },
  //             {
  //               label: 'Loan End Date',
  //               name: 'bcaTerms.financeDetails.loanEnd',
  //               placeholder: 'Select Loan End Date',
  //               type: 'date',
  //               validation: dateValidation,
  //               col: { xs: 12, sm: 6, md: 3, lg: 3 },
  //             },
  //             {
  //               label: 'Collateral Value',
  //               name: 'bcaTerms.financeDetails.collateralValue',
  //               placeholder: 'Enter Collateral Value',
  //               type: 'number',
  //               validation: (z) => z.number().min(0),
  //               col: { xs: 12, sm: 6, md: 4, lg: 4 },
  //             },
  //             {
  //               label: 'Currency',
  //               name: 'bcaTerms.financeDetails.currency',
  //               placeholder: 'Enter Currency (e.g. USD)',
  //               type: 'text',
  //               validation: (z) => z.string().length(3),
  //               col: { xs: 12, sm: 6, md: 4, lg: 4 },
  //             },
  //           ],
  //         },
  //         // Additional single fields in Main
  //         {
  //           label: 'Customer Name',
  //           name: 'bcaTerms.customerName',
  //           placeholder: 'Enter Customer Name',
  //           type: 'text',
  //           validation: (z) => z.string().min(2),
  //           col: { xs: 12, sm: 6, md: 4, lg: 4 },
  //         },
  //         {
  //           label: 'Customer Email',
  //           name: 'bcaTerms.customerEmail',
  //           placeholder: 'Enter Customer Email',
  //           type: 'email',
  //           validation: (z) => z.string().email(),
  //           col: { xs: 12, sm: 6, md: 4, lg: 4 },
  //         },
  //         {
  //           label: 'Customer Phone',
  //           name: 'bcaTerms.customerPhone',
  //           placeholder: 'Enter Customer Phone',
  //           type: 'text',
  //           validation: (z) => z.string().regex(/^\+?[0-9\-]{7,15}$/, 'Invalid Phone number'),
  //           col: { xs: 12, sm: 6, md: 4, lg: 4 },
  //         },
  //         {
  //           label: 'Quantity',
  //           name: 'bcaTerms.quantity',
  //           placeholder: 'Enter Quantity',
  //           type: 'number',
  //           validation: (z) => z.number().int().min(1),
  //           col: { xs: 12, sm: 6, md: 3, lg: 3 },
  //         },
  //         {
  //           label: 'Is Active',
  //           name: 'bcaTerms.isActive',
  //           placeholder: '', // N/A for checkbox
  //           type: 'checkbox',
  //           validation: (z) => z.boolean(),
  //           col: { xs: 12, sm: 6, md: 3, lg: 3 },
  //         },
  //         {
  //           label: 'Priority',
  //           name: 'bcaTerms.priority',
  //           placeholder: 'Select Priority',
  //           type: 'radio-group',
  //           options: [
  //             { value: 'low', text: 'Low' },
  //             { value: 'medium', text: 'Medium' },
  //             { value: 'high', text: 'High' },
  //           ],
  //           validation: (z) => z.enum(['low', 'medium', 'high']),
  //           col: { xs: 12, sm: 6, md: 4, lg: 4 },
  //         },
  //         {
  //           label: 'Features',
  //           name: 'bcaTerms.features',
  //           placeholder: 'Select Features',
  //           type: 'checkbox-group',
  //           options: [
  //             { value: 'featureA', text: 'Feature A' },
  //             { value: 'featureB', text: 'Feature B' },
  //             { value: 'featureC', text: 'Feature C' },
  //           ],
  //           validation: (z) =>
  //             z.preprocess(
  //               // 1) If it comes in as a comma-string, split it; otherwise assume it's already string[] 
  //               (val) =>
  //                 typeof val === 'string'
  //                   ? val.split(',').filter(Boolean) // drop any empty tokens just in case
  //                   : Array.isArray(val)
  //                     ? val
  //                     : [],
  //               // 2) Now validate it’s a non-empty array of non-empty strings
  //               z
  //                 .array(
  //                   z
  //                     .string()
  //                     .min(1, { message: 'Feature keys cannot be empty.' })
  //                 )
  //                 .min(1, { message: 'Select at least one feature.' })
  //             ),
  //           col: { xs: 12, sm: 12, md: 6, lg: 6 },
  //         },
  //         {
  //           label: 'Mode',
  //           name: 'bcaTerms.mode',
  //           placeholder: 'Select Mode',
  //           type: 'radio-button-group',
  //           options: [
  //             { value: 'manual', text: 'Manual' },
  //             { value: 'automatic', text: 'Automatic' },
  //           ],
  //           validation: (z) => z.enum(['manual', 'automatic']),
  //           col: { xs: 12, sm: 6, md: 3, lg: 3 },
  //         },
  //         {
  //           label: 'Notifications',
  //           name: 'bcaTerms.notifications',
  //           placeholder: 'Select Notifications',
  //           type: 'switch-group',
  //           options: [
  //             { value: 'email', text: 'Email' },
  //             { value: 'sms', text: 'SMS' },
  //             { value: 'push', text: 'Push' },
  //           ],
  //           validation: (z) =>
  //             z.preprocess(
  //               // 1) If it comes in as a comma-string, split it; otherwise assume it's already string[] 
  //               (val) =>
  //                 typeof val === 'string'
  //                   ? val.split(',').filter(Boolean) // drop any empty tokens just in case
  //                   : Array.isArray(val)
  //                     ? val
  //                     : [],
  //               // 2) Now validate it’s a non-empty array of non-empty strings
  //               z
  //                 .array(
  //                   z
  //                     .string()
  //                     .min(1, { message: 'Feature keys cannot be empty.' })
  //                 )
  //                 .min(1, { message: 'Select at least one feature.' })
  //             ),
  //           col: { xs: 12, sm: 6, md: 3, lg: 3 },
  //         },
  //         {
  //           label: 'Enable Feature X',
  //           name: 'bcaTerms.enableX',
  //           placeholder: '', // N/A for switch
  //           type: 'switch',
  //           validation: (z) => z.boolean(),
  //           col: { xs: 12, sm: 6, md: 3, lg: 3 },
  //         },
  //       ],
  //     },
  //     {
  //       title: 'Digital Data',
  //       fields: [
  //         {
  //           label: 'API Endpoint',
  //           name: 'bcaTerms.apiEndpoint',
  //           placeholder: 'Enter API Endpoint',
  //           type: 'text',
  //           validation: (z) => z.string().url(),
  //           col: { xs: 12, sm: 12, md: 6, lg: 6 },
  //         },
  //         {
  //           label: 'Payload Sample',
  //           name: 'bcaTerms.payloadSample',
  //           placeholder: 'Enter Payload Sample',
  //           type: 'textarea',
  //           validation: (z) => z.string().min(1),
  //           col: { xs: 12, sm: 12, md: 6, lg: 6 },
  //         },
  //         {
  //           label: 'Use Sandbox',
  //           name: 'bcaTerms.useSandbox',
  //           placeholder: '', // N/A for checkbox
  //           type: 'checkbox',
  //           validation: (z) => z.boolean(),
  //           col: { xs: 12, sm: 6, md: 3, lg: 3 },
  //         },
  //         {
  //           label: 'Max Retries',
  //           name: 'bcaTerms.maxRetries',
  //           placeholder: 'Enter Max Retries',
  //           type: 'number',
  //           validation: (z) => z.number().min(0).max(10),
  //           col: { xs: 12, sm: 6, md: 3, lg: 3 },
  //         },
  //         {
  //           label: 'Timeout (ms)',
  //           name: 'bcaTerms.timeout',
  //           placeholder: 'Enter Timeout (ms)',
  //           type: 'number',
  //           validation: (z) => z.number().min(100).max(60000),
  //           col: { xs: 12, sm: 6, md: 3, lg: 3 },
  //         },
  //         {
  //           label: 'Logging Level',
  //           name: 'bcaTerms.loggingLevel',
  //           placeholder: 'Select Logging Level',
  //           type: 'radio-group',
  //           validation: (z) => z.enum(['debug', 'info', 'warn', 'error']),
  //           col: { xs: 12, sm: 6, md: 3, lg: 3 },
  //         },
  //       ],
  //     },
  //     {
  //       title: 'Additional Terms',
  //       fields: [
  //         {
  //           label: 'Extra Notes',
  //           name: 'bcaTerms.extraNotes',
  //           placeholder: 'Enter Extra Notes',
  //           type: 'textarea',
  //           validation: (z) => z.string().max(500),
  //           col: { xs: 12, sm: 12, md: 12, lg: 12 },
  //         },
  //         {
  //           label: 'Effective Date',
  //           name: 'bcaTerms.effectiveDate',
  //           placeholder: 'Select Effective Date',
  //           type: 'date',
  //           // ensure valid date string format
  //           validation: (z) => z.string().refine((s) => !isNaN(Date.parse(s))),
  //           col: { xs: 12, sm: 6, md: 4, lg: 4 },
  //         },
  //         {
  //           label: 'Expiration Date',
  //           name: 'bcaTerms.expirationDate',
  //           placeholder: 'Select Expiration Date',
  //           type: 'date',
  //           validation: (z) => z.string().refine((s) => !isNaN(Date.parse(s))),
  //           col: { xs: 12, sm: 6, md: 4, lg: 4 },
  //         },
  //         {
  //           label: 'Custom Flag',
  //           name: 'bcaTerms.customFlag',
  //           placeholder: '', // N/A for switch
  //           type: 'switch',
  //           validation: (z) => z.boolean(),
  //           col: { xs: 12, sm: 6, md: 4, lg: 4 },
  //         },
  //         {
  //           label: 'Additional Percentage',
  //           name: 'bcaTerms.additionalPct',
  //           placeholder: 'Enter Additional Percentage',
  //           type: 'number',
  //           validation: (z) => z.number().min(0).max(100),
  //           col: { xs: 12, sm: 6, md: 3, lg: 3 },
  //         },
  //       ],
  //     },
  //     {
  //       title: 'Maker Checker Remarks',
  //       fields: [
  //         {
  //           label: 'Maker Comments',
  //           name: 'bcaTerms.makerComments',
  //           placeholder: 'Enter Maker Comments',
  //           type: 'textarea',
  //           validation: (z) => z.string().min(1),
  //           col: { xs: 12, sm: 12, md: 12, lg: 12 },
  //         },
  //         {
  //           label: 'Checker Comments',
  //           name: 'bcaTerms.checkerComments',
  //           placeholder: 'Enter Checker Comments',
  //           type: 'textarea',
  //           validation: (z) => z.string().min(1),
  //           col: { xs: 12, sm: 12, md: 12, lg: 12 },
  //         },
  //       ],
  //     },
  //     {
  //       title: 'Demo Table',
  //       fields: [
  //         {
  //           dataTable: {
  //             header: 'Inner Demo Table',
  //             description: 'This table lives inside the new Demo Table tab.',
  //             config: {
  //               dataSource: 'innerRows',
  //               columnSettings: [
  //                 { title: 'Column A', column: 'a' },
  //                 { title: 'Column B', column: 'b' },
  //                 { title: 'Inner Field 1', column: 'demoInner.field1' },
  //                 { title: 'Inner Field 2', column: 'demoInner.field2' },
  //               ],
  //             },
  //             fields: [
  //               {
  //                 label: 'Inner Field 1',
  //                 name: 'demoInner.field1',
  //                 placeholder: 'Value for Inner Field 1',
  //                 type: 'text',
  //                 validation: (z: any) => z.string().optional(),
  //               },
  //               {
  //                 label: 'Inner Field 2',
  //                 name: 'demoInner.field2',
  //                 placeholder: 'Value for Inner Field 2',
  //                 type: 'number',
  //                 validation: (z: any) => z.number().optional(),
  //               },
  //             ],
  //           },
  //         },
  //       ],
  //     },
  //   ],
  // },

  // // Conditional validation demo
  // {
  //   header: 'Conditional Validation',
  //   description: `This section demonstrates how changing the “Validation Mode” dynamically
  //     enables, disables, hides, and validates other inputs. Try Standard, Custom or
  //     Advanced to see the form react in real time.`,
  //   fields: [
  //     {
  //       name: 'conditional.validationOption',
  //       label: 'Validation Mode',
  //       placeholder: 'Select Validation Mode',
  //       type: 'dropdown',
  //       options: [
  //         { value: 'standard', text: 'Standard' },
  //         { value: 'custom',   text: 'Custom (requires an enabled input)' },
  //         { value: 'advanced', text: 'Advanced Mode — unlock expert features' },
  //       ],
  //       validation: z => z.enum(['standard', 'custom', 'advanced']),
  //       col: { xs: 12, sm: 6 },
  //     },

  //     // 2) Existing conditional textbox (unchanged)
  //     {
  //       name: 'conditional.conditionalInput',
  //       label: 'Conditional Input',
  //       placeholder: 'Enter Conditional Input',
  //       type: 'text',
  //       disabled: (values) => values?.conditional?.validationOption !== 'custom',
  //       validation: (z, values) =>
  //         values?.conditional?.validationOption === 'custom'
  //           ? z
  //               .string()
  //               .required('Required when Custom mode is active.')
  //               .max(5, 'Max 5 characters in Custom mode.')
  //           : z.string().optional(),
  //       col: { xs: 12, sm: 6 },
  //     },

  //     // 3) Now only visible in Advanced mode
  //     {
  //       name: 'conditional.standardTip',
  //       label: 'Standard Mode Tip',
  //       placeholder: 'This tip appears only in Advanced mode',
  //       type: 'text',
  //       hidden: (values) =>
  //         values?.conditional?.validationOption !== 'advanced',
  //       validation: z => z.string().optional(),
  //       col: { xs: 12, sm: 6 },
  //     },
  //   ],
  // },

  // // Sub-header group only in Advanced mode
  // {
  //   header: 'Extra Information',
  //   isSubHeader: true,
  //   hidden: (values) =>
  //     values?.conditional?.validationOption !== 'advanced',
  //   fields: [
  //     {
  //       name: 'conditional.extraDetail',
  //       label: 'Why choose Advanced mode?',
  //       type: 'textarea',
  //       placeholder: 'Explain your reasoning here…',
  //       validation: z => z.string().optional(),
  //       col: { xs: 12 },
  //     },
  //     {
  //       hidden: values => values?.conditional?.validationOption !== 'advanced',
  //       accordion: [
  //         {
  //           title: 'Advanced Mode Controls',
  //           fields: [
  //             {
  //               header: 'Expert Controls',
  //               isSubHeader: true,
  //               fields: [
  //                 {
  //                   name: 'conditional.customSectionNote',
  //                   label: 'Custom Section Note',
  //                   placeholder: 'Enter a note for Custom mode…',
  //                   type: 'textarea',
  //                   validation: z => z.string().min(10, 'At least 10 characters'),
  //                   col: { xs: 12 }
  //                 },
  //                 {
  //                   name: 'conditional.expertFlag',
  //                   label: 'Enable Expert Flag',
  //                   type: 'switch',
  //                   validation: z => z.boolean(),
  //                   col: { sm: 6 }
  //                 },
  //                 {
  //                   name: 'conditional.expertNotes',
  //                   label: 'Expert Notes',
  //                   placeholder: 'Detailed feedback for advanced mode…',
  //                   type: 'textarea',
  //                   validation: z => z.string().min(15, 'At least 15 characters'),
  //                   col: { xs: 12 }
  //                 }
  //               ]
  //             }
  //           ]
  //         }
  //       ],
  //       allowMultiple: false
  //     },
  //   ],
  // },

  // // Tabbed details: Standard & Custom tabs only in Advanced mode
  // {
  //   header: 'Mode Details',
  //   description: `Demo of conditional show/hide of fields, tabs, and headers based on
  //     the selected Validation Mode.`,
  //   tabs: [
  //     {
  //       title: 'Standard Details',
  //       hidden: (values) =>
  //         values?.conditional?.validationOption !== 'advanced',
  //       fields: [
  //         {
  //           name: 'conditional.standardDetail1',
  //           label: 'Standard Detail 1',
  //           placeholder: 'Enter standard detail…',
  //           type: 'text',
  //           validation: z => z.string().optional(),
  //           col: { xs: 12, sm: 6 },
  //         },
  //       ],
  //     },
  //     {
  //       title: 'Custom Details',
  //       hidden: (values) =>
  //         values?.conditional?.validationOption !== 'advanced',
  //       fields: [
  //         {
  //           name: 'conditional.customDetail1',
  //           label: 'Custom Detail 1',
  //           placeholder: 'Enter custom detail…',
  //           type: 'text',
  //           validation: z => z.string().optional(),
  //           col: { xs: 12, sm: 6 },
  //         },
  //       ],
  //     },
  //     {
  //       title: 'Advanced Details',
  //       // always visible, but only really meaningful in advanced mode
  //       fields: [
  //         {
  //           name: 'conditional.advancedDetail',
  //           label: 'Expert Notes',
  //           placeholder: 'At least 10 chars for Advanced mode…',
  //           type: 'textarea',
  //           validation: z =>
  //             z
  //               .string()
  //               .min(10, 'At least 10 characters for Advanced mode.'),
  //           col: { xs: 12, sm: 6 },
  //         },
  //       ],
  //     },
  //   ],
  // },

  // // Custom input component demo
  // {
  //   header: 'Custom Input Component',
  //   description:
  //     'Two custom inputs: a switch that toggles “ID editing” on/off, and a Transaction ID field that ' +
  //     'upper‑cases its value and only becomes editable when the switch is on.',
  //   fields: [
  //     // 1) toggle to enable/disable ID editing
  //     {
  //       name: 'custom.enableIdEdit',
  //       label: 'Enable ID Editing',
  //        validation: z => z.boolean(),

  //       render: ({ common, fieldState }) => (
  //         <div style={{ marginBottom: '1rem' }}>
  //           <label style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>
  //             {common.label}
  //           </label>
  //           <input
  //             type="checkbox"
  //             name={common.name}
  //             checked={common.value}
  //             onChange={e => common.onChange(e.target.checked)}
  //             onBlur={common.onBlur}
  //             disabled={common.disabled}
  //           />
  //           {fieldState.error && (
  //             <div style={{ color: 'var(--danger)', marginTop: 4, fontSize: '13px' }}>
  //               {fieldState.error.message}
  //             </div>
  //           )}
  //         </div>
  //       ),
  //     },

  //     // 2) the upper‑casing Transaction ID
  //     {
  //       name: 'custom.id',
  //       label: 'Custom ID',
  //       placeholder: 'e.g. ABCD-1234‑EFGH',
  //       validation: z => z.string().uuid({ message: 'Must be a valid UUID' }),
  //       // now driven by our switch
  //       disabled: values => !values?.custom?.enableIdEdit,

  //       render: ({ common, fieldState }) => {
  //         const upper = (common.value ?? '').toUpperCase();
  //         return (
  //           <div style={{ marginBottom: '1rem' }}>
  //             <label
  //               htmlFor={common.name}
  //               style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}
  //             >
  //               {common.label}
  //             </label>
  //             <input
  //               name={common.name}
  //               id={common.name}
  //               value={upper}
  //               onChange={e => common.onChange(e.target.value)}
  //               onBlur={common.onBlur}
  //               placeholder={common.placeholder}
  //               disabled={common.disabled}
  //               style={{
  //                 width: '100%',
  //                 padding: '8px 12px',
  //                 fontSize: '14px',
  //                 borderRadius: '4px',
  //                 border: '1px solid #ccc',
  //                 background: common.disabled ? '#f5f5f5' : 'white'
  //               }}
  //             />
  //             {fieldState.error && (
  //               <div style={{ color: 'red', marginTop: 4, fontSize: '13px' }}>
  //                 {fieldState.error.message}
  //               </div>
  //             )}
  //           </div>
  //         );
  //       },
  //     },
  //   ],
  // },
  // Nested Table & Sections Demo (enhanced)
  {
    header: 'Nested Table & Sections Demo',
    description: 'Shows a parent table with nested child tables, multiple accordion panels and tabs per row.',
    dataTable: {
      header: 'Parent Table',
      description: 'Each row has its own child tables, accordion panels, and tab panels.',
      config: {
        dataSource: 'nestedTable.rows',
        columnSettings: [
          { title: 'ID', column: 'id' },
          { title: 'Name', column: 'name' },
          { title: 'Status', column: 'status' },
          { title: 'Email', column: 'email' },
          { title: 'Role', column: 'role' },
        ],
      },
      fields: [
        {
          label: 'Name',
          name: 'name',
          type: 'text',
          placeholder: 'Enter Name',
        },
        {
          label: 'Email',
          name: 'email',
          type: 'text',
          placeholder: 'Enter Email',
          validation: (z) => z.string().email(),
        },
        {
          label: 'Role',
          name: 'role',
          type: 'dropdown',
          placeholder: 'Select Role',
          options: [
            { value: 'admin', text: 'Admin' },
            { value: 'user', text: 'User' },
            { value: 'guest', text: 'Guest' },
          ],
          validation: (z) => z.enum(['admin', 'user', 'guest']),
        },
        // {
        //   dataTable: {
        //     header: 'Child Table',
        //     description: 'Details for this parent row.',
        //     config: {
        //       dataSource: 'childRows',
        //       columnSettings: [
        //         { title: 'Key', column: 'key' },
        //         { title: 'Value', column: 'value' },
        //         { title: 'Timestamp', column: 'timestamp' },
        //       ],
        //     },
        //     fields: [
        //       {
        //         label: 'Key',
        //         name: 'key',
        //         type: 'text',
        //         placeholder: 'Enter Key',
        //         validation: (z) => z.string().optional(),
        //       },
        //       {
        //         label: 'Value',
        //         name: 'value',
        //         type: 'text',
        //         placeholder: 'Enter Value',
        //         validation: (z) => z.string().optional(),
        //       },
        //       {
        //         label: 'Timestamp',
        //         name: 'timestamp',
        //         type: 'date',
        //         placeholder: 'Select Timestamp',
        //         validation: dateValidation,
        //       },
        //     ],
        //   },
        // },
        {
          accordion: [
            // {
            //   title: 'More Info',
            //   fields: [
            //     {
            //       name: 'moreInfo.notes',
            //       label: 'Notes',
            //       type: 'textarea',
            //       placeholder: 'Enter Notes',
            //       validation: (z) => z.string().optional(),
            //     },
            //     {
            //       name: 'moreInfo.flag',
            //       label: 'Flagged',
            //       type: 'switch',
            //       placeholder: '',
            //       validation: (z) => z.boolean(),
            //     },
            //   ],
            // },
            {
              title: 'Statistics',
              fields: [
                {
                  name: 'stats.calls',
                  label: 'Call Count',
                  type: 'number',
                  placeholder: 'Enter Call Count',
                  validation: (z) => z.number().min(0),
                },
                {
                  name: 'stats.duration',
                  label: 'Total Duration (min)',
                  type: 'number',
                  placeholder: 'Enter Duration',
                  validation: (z) => z.number().min(0),
                },
                {
                  name: 'stats.lastCalled',
                  label: 'Last Called',
                  type: 'date',
                  placeholder: 'Select Date',
                  validation: dateValidation,
                },
              ],
            },
          ],
          allowMultiple: true,
        },
        // {
        //   tabs: [
        //     {
        //       title: 'Summary',
        //       fields: [
        //         {
        //           name: 'tabs.summary',
        //           label: 'Summary',
        //           type: 'textarea',
        //           placeholder: 'Enter Summary',
        //           validation: (z) => z.string().optional(),
        //         },
        //       ],
        //     },
        //     {
        //       title: 'Details',
        //       fields: [
        //         {
        //           name: 'tabs.detail',
        //           label: 'Detail',
        //           type: 'text',
        //           placeholder: 'Enter Detail',
        //           validation: (z) => z.string().optional(),
        //         },
        //         {
        //           name: 'tabs.extraDetail',
        //           label: 'Extra Detail',
        //           type: 'textarea',
        //           placeholder: 'Enter Extra Detail',
        //           validation: (z) => z.string().optional(),
        //         },
        //       ],
        //     },
        //   ],
        // },
      ],
    },
  },
];

const makers = ['Alice', 'Charlie', 'Eve', 'Grace', 'Ivan'];
const checkers = ['Bob', 'Dana', 'Frank', 'Heidi', 'Judy'];
const statuses = ['Pending', 'Approved', 'Rejected', 'Pending Review', 'In Progress'];
const makerComments = [
  'Please review Q1 figures.',
  'Updated with new rates.',
  'Missing collateral docs.',
  'Add supporting documents.',
  'Processing changes.',
];
const checkerComments = [
  'Looks OK, pending sign‑off.',
  'Verified and approved.',
  'Incomplete, send back to maker.',
  'Awaiting response.',
  'In progress.',
];

export const demoData = {
  // transaction: {
  //   id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  //   date: new Date('2025-06-30'),
  //   amount: 1500.75
  // },
  // user: {
  //   firstName: 'Alice',
  //   lastName: 'Johnson',
  //   age: 28,
  //   joinDate: new Date('2021-01-15'),
  //   bio: 'Loves coding.',
  //   preferences: { color: 'blue' }
  // },
  // productInfo: {
  //   familyPurpose: 'Business expansion',
  //   supplyChainProgram: 'SC02',
  //   facilityDate: new Date('2025-06-01'),
  //   facilityCode: 'ABCD',
  //   facilityManager: 'Bob Smith',
  //   facilityCapacity: 120,
  //   facilityStatus: 'Active',
  // },
  // services: {
  //   onsite: {
  //     engineer: 'Jane Doe',
  //     phone: '+628123456781',
  //     responseTime: 2
  //   },
  //   remote: {
  //     url: 'https://support.acme.com',
  //     contactHours: '24/7'
  //   }
  // },
  // compliance: {
  //   certAuthority: 'ISO Safety Board',
  //   certDate: '2025-01-20',
  //   lastInspection: '2025-07-01',
  //   inspectorName: 'Jane Auditor'
  // },
  // financeDetails: {
  //   financePct: 75,
  //   interestRate: 5.5,
  //   loanStart: new Date('2025-05-15'),
  //   loanEnd: new Date('2025-07-15')
  // },
  // // BCA Terms data namespace
  // bcaTerms: {
  //   // Main tab
  //   productInfo: {
  //     familyPurpose: 'Corporate expansion',
  //     supplyChainProgram: 'SC03',
  //     facilityDate: '2025-07-01',
  //     facilityCode: 'EFGH',
  //   },
  //   financeDetails: {
  //     financePct: 80,
  //     interestRate: 4.25,
  //     loanStart: '2025-08-01',
  //     loanEnd: '2026-08-01',
  //     collateralValue: 120000,
  //     currency: 'USD',
  //   },
  //   customerName: 'Bob Smith',
  //   customerEmail: 'bob@example.com',
  //   customerPhone: '+628123456789',
  //   agreementUrl: 'https://example.com/agreement.pdf',
  //   documentUpload: null,
  //   quantity: 42,
  //   isActive: true,
  //   priority: 'high',
  //   features: ['featureA', 'featureC'],
  //   mode: 'automatic',
  //   notifications: ['email', 'push'],
  //   enableX: false,
  //   colorTheme: '#00FF00',

  //   // Digital Data tab
  //   apiEndpoint: 'https://api.example.com/v1/data',
  //   payloadSample: '{"key":"value"}',
  //   useSandbox: true,
  //   maxRetries: 3,
  //   timeout: 5000,
  //   loggingLevel: 'info',
  //   backupUrl: 'https://backup.example.com',
  //   certUpload: null,

  //   // Additional Terms tab
  //   extraNotes: 'These are some extra terms.',
  //   effectiveDate: '2025-07-15',
  //   expirationDate: '2026-07-15',
  //   customFlag: false,
  //   additionalPct: 10,

  //   // Maker Checker Remarks tab
  //   makerComments: 'Looks good from maker side.',
  //   checkerComments: 'Verified and approved.',
  // },
  // conditional: {
  //   validationOption: 'standard',
  //   conditionalInput:    '',
  //   standardTip:          '',
  //   extraDetail:          '',
  //   standardDetail1:      '',
  //   customDetail1:        '',
  //   advancedDetail:       '',
  //   // ← new values for the accordion panels
  //   customSectionNote:   '',
  //   expertFlag:          false,
  //   expertNotes:         ''
  // },
  // custom: {
  //   enableIdEdit: false,   // start with ID editing turned off
  //   id: '3fa85f64-5717-4562-b3fc-2c963f66afa6'
  // },
  // demoTable: {
  //   mode: 'enabled',
  //   rows: Array.from({ length: 100 }, (_, i) => {
  //     const idx = i % makers.length;
  //     return {
  //       maker: makers[idx],
  //       checker: checkers[idx],
  //       status: statuses[idx],
  //       bcaTerms: {
  //         makerComments: makerComments[idx],
  //         checkerComments: checkerComments[idx],
  //         status: statuses[idx],
  //         reviewComments: `Reviewed: ${makerComments[idx]}`,
  //         followUpNotes: `Follow-up: ${checkerComments[idx]}`,
  //         escalationStatus: statuses[idx] === 'Rejected' ? 'Escalated' : 'Normal',
  //         handlingInstructions: 'Proceed with review.',
  //       },
  //     };
  //   }),
  // },
  // innerRows: Array.from({ length: 3 }, (_, i) => ({
  //   a: `A${i + 1}`,
  //   b: `B${i + 1}`,
  //   demoInner: { field1: `F1-${i + 1}`, field2: i + 1 },
  // })),
  nestedTable: {
    rows: [
      {
        id: 'P1',
        name: 'Parent One',
        status: 'Active',
        email: 'parent1@example.com',
        role: 'admin',
        childRows: [
          { key: 'a', value: 'Alpha', timestamp: new Date('2025-07-10') },
          { key: 'b', value: 'Beta',  timestamp: new Date('2025-07-11') },
        ],
        moreInfo: { notes: 'First parent row', flag: false },
        stats: { calls: undefined, duration: undefined, lastCalled: new Date('2025-07-12') },
        tabs: { summary: 'Sum 1', detail: 'Det 1', extraDetail: 'Extra A' },
      },
      {
        id: 'P2',
        name: 'Parent Two',
        status: 'Inactive',
        email: 'parent2@example.com',
        role: 'user',
        childRows: [
          { key: 'x', value: 'X-ray', timestamp: new Date('2025-07-13') },
          { key: 'y', value: 'Yankee', timestamp: new Date('2025-07-14') },
        ],
        moreInfo: { notes: 'Second parent row', flag: true },
        stats: { calls: undefined, duration: 30, lastCalled: new Date('2025-07-15') },
        tabs: { summary: 'Sum 2', detail: 'Det 2', extraDetail: 'Extra B' },
      },
      {
        id: 'P3',
        name: 'Parent Three',
        status: 'Pending',
        email: 'parent3@example.com',
        role: 'guest',
        childRows: [
          { key: 'm', value: 'Mike', timestamp: new Date('2025-07-16') },
          { key: 'n', value: 'November', timestamp: new Date('2025-07-17') },
        ],
        moreInfo: { notes: 'Third parent row', flag: false },
        stats: { calls: 5, duration: 20, lastCalled: new Date('2025-07-18') },
        tabs: { summary: 'Sum 3', detail: 'Det 3', extraDetail: 'Extra C' },
      },
      {
        id: 'P4',
        name: 'Parent Four',
        status: 'Active',
        email: 'parent4@example.com',
        role: 'user',
        childRows: [
          { key: 'c', value: 'Charlie', timestamp: new Date('2025-07-19') },
          { key: 'd', value: 'Delta',   timestamp: new Date('2025-07-20') },
        ],
        moreInfo: { notes: 'Fourth parent row', flag: true },
        stats: { calls: 7, duration: 25, lastCalled: new Date('2025-07-21') },
        tabs: { summary: 'Sum 4', detail: 'Det 4', extraDetail: 'Extra D' },
      },
      {
        id: 'P5',
        name: 'Parent Five',
        status: 'Inactive',
        email: 'parent5@example.com',
        role: 'guest',
        childRows: [
          { key: 'e', value: 'Echo',    timestamp: new Date('2025-07-22') },
          { key: 'f', value: 'Foxtrot', timestamp: new Date('2025-07-23') },
        ],
        moreInfo: { notes: 'Fifth parent row', flag: false },
        stats: { calls: 3, duration: 15, lastCalled: new Date('2025-07-24') },
        tabs: { summary: 'Sum 5', detail: 'Det 5', extraDetail: 'Extra E' },
      },
    ],
  },
};
