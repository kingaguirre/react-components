import React, { useMemo, useRef, useState, useCallback } from "react";
import type { Meta } from "@storybook/react";
import { z } from "zod";

import { FormRenderer } from "../index";
import type {
  SettingsItem,
  DataTableSection,
  FormRendererRef,
} from "../interface";

import { StoryWrapper, Title } from "../../../components/StoryWrapper";
import { Guide } from "../../../components/Guide";

/* -----------------------------------------------------------------------------
   Story-only UI helpers
----------------------------------------------------------------------------- */
const Card: React.FC<{ children: React.ReactNode; mt?: number }> = ({
  children,
  mt = 12,
}) => (
  <div
    style={{
      marginTop: mt,
      background: "#f3f4f6",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: 12,
    }}
  >
    {children}
  </div>
);

/** Full-width thin bar (2px radius) used for radio & submit-ref buttons */
const FullWidthBar: React.FC<{
  children: React.ReactNode;
  mt?: number;
  pad?: number;
  justify?: "flex-start" | "center" | "flex-end" | "space-between";
}> = ({ children, mt = 12, pad = 10, justify = "flex-end" }) => (
  <div
    style={{
      marginTop: mt,
      width: "100%",
      maxWidth: "100%",        // <-- ensure no overflow
      boxSizing: "border-box", // <-- respect parent padding
      overflowX: "hidden",     // <-- belt & suspenders
      background: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: 2,
      padding: pad,
      display: "flex",
      alignItems: "center",
      justifyContent: justify,
      gap: 10,
    }}
  >
    {children}
  </div>
);

const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <span style={{ fontSize: 14 }}>{label}</span>
    <span
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      style={{
        width: 44,
        height: 24,
        borderRadius: 24,
        background: checked ? "#22c55e" : "#cbd5e1",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,.12)",
        position: "relative",
        cursor: "pointer",
        transition: "background .2s",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          transition: "left .2s",
          boxShadow: "0 1px 2px rgba(0,0,0,.18)",
        }}
      />
    </span>
  </div>
);

/** Compact radio chip */
const RadioChip: React.FC<{
  label: string;
  value: string;
  checked: boolean;
  onChange: (v: string) => void;
}> = ({ label, value, checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(value)}
    style={{
      border: `1px solid ${checked ? "#2563eb" : "#d1d5db"}`,
      background: checked ? "#eff6ff" : "#ffffff",
      color: "#111827",
      padding: "6px 10px",
      borderRadius: 999,
      fontSize: 12,
      cursor: "pointer",
    }}
  >
    {label}
  </button>
);

/* -----------------------------------------------------------------------------
   Meta
----------------------------------------------------------------------------- */
const meta: Meta<typeof FormRenderer> = {
  title: "organisms/FormRenderer/API",
  component: FormRenderer,
  tags: ["!autodocs"],
};
export default meta;

/* =============================================================================
   1) BASIC
============================================================================= */
export const Basic = {
  name: "Basic fields / hidden / disabled",
  render: () => {
    const fieldSettings: SettingsItem[] = [
      { name: "name", label: "Name", type: "text", placeholder: "Enter full name" },
      { name: "age", label: "Age", type: "number", placeholder: "e.g. 28" },
      { name: "dob", label: "DOB", type: "date", placeholder: "Select date of birth" },
      {
        name: "role",
        label: "Role",
        type: "dropdown",
        placeholder: "Select a role",
        options: [{ value: "Admin", text: "Admin" }, { value: "User", text: "User" }],
      },
      { name: "secret", label: "Secret", type: "text", hidden: true, placeholder: "hidden example" },
      { name: "locked", label: "Locked", type: "text", disabled: true, placeholder: "disabled by design" },
      { name: "email", label: "Email", type: "text", validation: (v: typeof z) => v.string().email("Invalid email"), placeholder: "name@company.com" },
    ];

    const [values, setValues] = useState({
      name: "", age: "", dob: "", role: "", secret: "", locked: "server-locked", email: "",
    });

    const handleChange = (v: any) => {
      console.log("[FormRenderer:Basic] onChange values:", v);
      setValues(v);
    };

    const code = `import { FormRenderer } from "…";
import { z } from "zod";

const fieldSettings = [
  { name: "name",  label: "Name",  type: "text",   placeholder: "Enter full name" },
  { name: "age",   label: "Age",   type: "number", placeholder: "e.g. 28" },
  { name: "dob",   label: "DOB",   type: "date",   placeholder: "Select date of birth" },
  { name: "role",  label: "Role",  type: "dropdown", placeholder: "Select a role", options: [
    { value: "Admin", text: "Admin" }, { value: "User", text: "User" }
  ]},
  { name: "secret", label: "Secret", type: "text", hidden: true, placeholder: "hidden example" },
  { name: "locked", label: "Locked", type: "text", disabled: true, placeholder: "disabled by design" },
  { name: "email",  label: "Email",  type: "text", validation: (z) => z.string().email("Invalid email"), placeholder: "name@company.com" },
];

const dataSource = {
  name: "", age: "", dob: "", role: "", secret: "", locked: "server-locked", email: ""
};

<FormRenderer fieldSettings={fieldSettings} dataSource={dataSource} onChange={(v) => {
  console.log("[FormRenderer:Basic] onChange values:", v);
}} />`;

    return (
      <StoryWrapper title="Basic" subTitle="Core inputs with static hidden/disabled and live onChange preview.">
        <Guide
          emoji="🧱"
          title="Overview"
          subtitle="Text, number, date, dropdown; static hidden/disabled; change tracking."
          sections={[
            {
              heading: "Notes",
              bullets: [
                "Hidden/disabled can be booleans or functions of values.",
                "Each control includes a descriptive placeholder.",
                "Open the browser DevTools console to observe real-time onChange snapshots.",
              ],
            },
          ]}
        />

        <Title>Form</Title>
        <FormRenderer fieldSettings={fieldSettings} dataSource={values} onSubmit={() => {}} onChange={handleChange} />

        <Guide emoji="📄" title="Code" subtitle="Full example with fieldSettings and dataSource." sections={[{ heading: "Usage", code }]} />
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   2) TABS & ACCORDION
============================================================================= */
export const TabsAndAccordion = {
  name: "Tabs & Accordion",
  render: () => {
    const fieldSettings: SettingsItem[] = [
      {
        // header: "Tabbed",
        tabs: [
          {
            title: "General",
            fields: [
              { 
                dataTable: {
                  config: {
                    dataSource: "lines",
                    columnSettings: [
                      { title: "Line", column: "line" },
                      { title: "Note", column: "note" },
                    ],
                  },
                  fields: [
                    { name: "line", label: "Line", type: "text", placeholder: "Enter line text", validation: (z) => z.string().min(1) },
                    { name: "note", label: "Note", type: "text", placeholder: "Optional note", validation: (z) => z.string().optional() },
                  ],
                }
              }
            ],
          },
          {
            title: "Advanced",
            fields: [{ name: "tabB", label: "Tab B", type: "text", placeholder: "Advanced text" }],
          },
        ],
      },
      {
        header: "Accordion",
        accordion: [
          { title: "Section 1", open: true, fields: [{ name: "acc1", label: "Acc1", type: "text", placeholder: "In section 1" }] },
          { title: "Section 2", fields: [{ name: "acc2", label: "Acc2", type: "text", placeholder: "In section 2" }] },
        ],
      },
    ];

    const [values, setValues] = useState({ tabA: "", tabB: "", acc1: "", acc2: "" });
    const handleChange = (v: any) => {
      console.log("[FormRenderer:TabsAndAccordion] onChange values:", v);
      setValues(v);
    };

    const code = `import { FormRenderer } from "…";
import { z } from "zod";

const fieldSettings = [
  { header: "Tabbed", tabs: [
    { title: "General",  fields: [{ name: "tabA", label: "Tab A", type: "text", placeholder: "General text", validation: (z) => z.string().min(1, "Required") }] },
    { title: "Advanced", fields: [{ name: "tabB", label: "Tab B", type: "text", placeholder: "Advanced text" }] },
  ]},
  { header: "Accordion", accordion: [
    { title: "Section 1", open: true,  fields: [{ name: "acc1", label: "Acc1", type: "text", placeholder: "In section 1" }] },
    { title: "Section 2",               fields: [{ name: "acc2", label: "Acc2", type: "text", placeholder: "In section 2" }] },
  ]},
];

const dataSource = { tabA: "", tabB: "", acc1: "", acc2: "" };

<FormRenderer fieldSettings={fieldSettings} dataSource={dataSource} onChange={(v) => {
  console.log("[FormRenderer:TabsAndAccordion] onChange values:", v);
}} />`;

    return (
      <StoryWrapper title="Tabs & Accordion" subTitle="Group fields into tabs or collapsibles with validation badges.">
        <Guide
          emoji="🗂️"
          title="Overview"
          subtitle="Tabbed groups and Accordion panels."
          sections={[
            {
              heading: "Tips",
              bullets: [
                "Each tab/panel renders its respective fields.",
                "Use your Tabs impl to reflect state via colors/badges.",
                "Open the DevTools console to see live onChange logs.",
              ],
            },
          ]}
        />

        <Title>Grouped Form</Title>
        <FormRenderer fieldSettings={fieldSettings} dataSource={values} onSubmit={() => {}} onChange={handleChange} />

        <Guide emoji="📄" title="Code" subtitle="Full example with fieldSettings and dataSource." sections={[{ heading: "Usage", code }]} />
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   3) DATATABLE — nested child table appears when a row is active
============================================================================= */
export const DataTableEditing = {
  name: "DataTable: draft + nested child table",
  render: () => {
    const childDT: DataTableSection = {
      header: "Lines",
      description: "Rendered when a parent row is active.",
      config: {
        dataSource: "lines",
        columnSettings: [
          { title: "Line", column: "line" },
          { title: "Note", column: "note" },
        ],
      },
      fields: [
        { name: "line", label: "Line", type: "text", placeholder: "Enter line text", validation: (z) => z.string().min(1) },
        { name: "note", label: "Note", type: "text", placeholder: "Optional note", validation: (z) => z.string().optional() },
      ],
    };

    const mainDT: DataTableSection = {
      header: "Items",
      description: "Use the draft inputs to Add. Select a row to enable Update/Delete and to show the nested Lines table.",
      config: {
        dataSource: "items",
        columnSettings: [
          { title: "Name", column: "name" },
          { title: "Qty", column: "qty" },
        ],
      },
      fields: [
        { name: "name", label: "Name", type: "text", placeholder: "Draft item name", validation: (z) => z.string().min(1) },
        { name: "qty", label: "Qty", type: "number", placeholder: "Draft quantity", validation: (z) => z.number().positive() },
        { dataTable: childDT } as any,
      ],
    };

    const [values, setValues] = useState({
      items: [{ name: "Seed", qty: 2, lines: [{ line: "L1", note: "" }] }],
    });

    const handleChange = (v: any) => {
      console.log("[FormRenderer:DataTableEditing] onChange values:", v);
      setValues(v);
    };

    const code = `import { FormRenderer } from "…";
import type { DataTableSection } from "…";

const childDT: DataTableSection = {
  header: "Lines",
  description: "Rendered when a parent row is active.",
  config: {
    dataSource: "lines",
    columnSettings: [
      { title: "Line", column: "line" },
      { title: "Note", column: "note" },
    ],
  },
  fields: [
    { name: "line", label: "Line", type: "text", placeholder: "Enter line text" },
    { name: "note", label: "Note", type: "text", placeholder: "Optional note" },
  ],
};

const mainDT: DataTableSection = {
  header: "Items",
  description: "Use the draft inputs to Add. Select a row to enable Update/Delete and to show the nested Lines table.",
  config: {
    dataSource: "items",
    columnSettings: [
      { title: "Name", column: "name" },
      { title: "Qty", column: "qty" },
    ],
  },
  fields: [
    { name: "name", label: "Name", type: "text", placeholder: "Draft item name" },
    { name: "qty",  label: "Qty",  type: "number", placeholder: "Draft quantity" },
    { dataTable: childDT },
  ],
};

const dataSource = { items: [{ name: "Seed", qty: 2, lines: [{ line: "L1", note: "" }] }] };

<FormRenderer fieldSettings={[{ dataTable: mainDT }]} dataSource={dataSource} onChange={(v) => {
  console.log("[FormRenderer:DataTableEditing] onChange values:", v);
}} />`;

    return (
      <StoryWrapper title="DataTable editing" subTitle="Draft → Add; select a row to seed the row editor, enable Update/Delete, and show nested Lines table.">
        <Guide
          emoji="🧾"
          title="Overview"
          subtitle="Click a row to reveal the nested child table and row-scoped fields."
          sections={[
            {
              heading: "Tips",
              bullets: [
                "Draft inputs prepend rows on Add.",
                "Selecting a row seeds row-editor inputs and exposes nested DataTables.",
                "Open DevTools console to track onChange with up-to-date values.",
              ],
            },
          ]}
        />

        <Title>Items</Title>
        <FormRenderer fieldSettings={[{ dataTable: mainDT } as any]} dataSource={values} onSubmit={() => {}} onChange={handleChange} />

        <Guide emoji="📄" title="Code" subtitle="Full example with DataTable sections and dataSource." sections={[{ heading: "Usage", code }]} />
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   4) CONDITIONAL disabled/hidden & validation
============================================================================= */
export const ConditionalLogic = {
  name: "Conditional disabled/hidden and validation",
  render: () => {
    const fieldSettings: SettingsItem[] = [
      {
        name: "mode",
        label: "Mode",
        type: "dropdown",
        placeholder: "Pick a mode",
        options: [
          { value: "enabled", text: "Enabled" },
          { value: "disabled", text: "Disabled" },
          { value: "hidden", text: "Hidden" },
          { value: "custom", text: "Custom Validation" },
        ],
        validation: (z) => z.enum(["enabled", "disabled", "hidden", "custom"]),
      },
      {
        name: "maybeDisabled",
        label: "Disabled when mode=disabled",
        type: "text",
        placeholder: "Will disable in 'disabled' mode",
        disabled: (v) => v.mode === "disabled",
      },
      {
        name: "maybeHidden",
        label: "Hidden when mode=hidden",
        type: "text",
        placeholder: "Hidden in 'hidden' mode",
        hidden: (v) => v.mode === "hidden",
      },
      {
        name: "conditionalInput",
        label: "Conditional Input",
        type: "text",
        placeholder: "Required & max 5 in 'custom' mode",
        disabled: (v) => v.mode !== "custom",
        validation: (z, v) =>
          v.mode === "custom"
            ? z.string().min(1, "Required in Custom mode").max(5, "Max 5 chars")
            : z.string().optional(),
      },
    ];

    const [values, setValues] = useState({ mode: "enabled", maybeDisabled: "", maybeHidden: "", conditionalInput: "" });
    const handleChange = (v: any) => {
      console.log("[FormRenderer:ConditionalLogic] onChange values:", v);
      setValues(v);
    };

    const code = `import { FormRenderer } from "…";
import { z } from "zod";

const fieldSettings = [
  { name: "mode", label: "Mode", type: "dropdown", placeholder: "Pick a mode",
    options: [
      { value: "enabled", text: "Enabled" },
      { value: "disabled", text: "Disabled" },
      { value: "hidden",   text: "Hidden" },
      { value: "custom",   text: "Custom Validation" },
    ],
    validation: (z) => z.enum(["enabled","disabled","hidden","custom"])
  },
  { name: "maybeDisabled", label: "Disabled when mode=disabled", type: "text", placeholder: "Will disable in 'disabled' mode", disabled: v => v.mode === "disabled" },
  { name: "maybeHidden",   label: "Hidden when mode=hidden",    type: "text", placeholder: "Hidden in 'hidden' mode", hidden: v => v.mode === "hidden" },
  { name: "conditionalInput", label: "Conditional Input", type: "text", placeholder: "Required & max 5 in 'custom' mode",
    disabled: v => v.mode !== "custom",
    validation: (z, v) => v.mode === "custom" ? z.string().min(1).max(5) : z.string().optional()
  },
];

const dataSource = { mode: "enabled", maybeDisabled: "", maybeHidden: "", conditionalInput: "" };

<FormRenderer fieldSettings={fieldSettings} dataSource={dataSource} onChange={(v) => {
  console.log("[FormRenderer:ConditionalLogic] onChange values:", v);
}} />`;

    return (
      <StoryWrapper title="Conditional logic" subTitle="Show/hide and enable/disable from values; schema changes with values.">
        <Guide
          emoji="🧠"
          title="Overview"
          subtitle="Function-based disabled/hidden and context-aware validation."
          sections={[
            {
              heading: "Behavior",
              bullets: [
                "Switch modes to see fields disable or hide.",
                "In Custom mode, the Conditional Input becomes required (max 5 chars).",
                "Use the DevTools console to monitor live onChange events.",
              ],
            },
          ]}
        />

        <Title>Conditional Form</Title>
        <FormRenderer fieldSettings={fieldSettings} dataSource={values} onSubmit={() => {}} onChange={handleChange} />

        <Guide emoji="📄" title="Code" subtitle="Full example with fieldSettings and dataSource." sections={[{ heading: "Usage", code }]} />
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   5) CUSTOM RENDER — radio wrapper full-width (2px radius) + result block ABOVE button
============================================================================= */
export const CustomRenderer = {
  name: "Custom renderer (compact radios + extras)",
  render: () => {
    const fieldSettings: SettingsItem[] = [
      {
        name: "ui.choice",
        label: "Mode",
        placeholder: "Pick one",
        render: ({ common }) => {
          const val = common.value ?? "";
          const set = (v: string) => common.onChange(v);
          return (
            <FullWidthBar justify="flex-start" pad={12}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <RadioChip label="Manual" value="manual" checked={val === "manual"} onChange={set} />
                <RadioChip label="Automatic" value="automatic" checked={val === "automatic"} onChange={set} />
                <RadioChip label="Hybrid" value="hybrid" checked={val === "hybrid"} onChange={set} />
              </div>
            </FullWidthBar>
          );
        },
        validation: (z) => z.enum(["manual", "automatic", "hybrid"]),
      },
      {
        name: "ui.accent",
        label: "Accent Color",
        render: ({ common }) => {
          const colors = ["#2563eb", "#16a34a", "#e11d48", "#0ea5e9"];
          return (
            <Card mt={8}>
              <div style={{ display: "flex", gap: 10 }}>
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Pick ${c}`}
                    onClick={() => common.onChange(c)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border:
                        (common.value ?? "") === c
                          ? "2px solid #111827"
                          : "1px solid #d1d5db",
                      background: c,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </Card>
          );
        },
        validation: (z) => z.string().optional(),
      },
      {
        name: "ui.note",
        label: "Note",
        type: "text",
        placeholder: "Optional short note",
        validation: (z) => z.string().optional(),
      },
    ];

    const ref = useRef<FormRendererRef<any>>(null);
    const [values, setValues] = useState<any>({ ui: { choice: "manual", accent: "#2563eb", note: "" } });
    const [submitResult, setSubmitResult] = useState<any>(null);

    const handleChange = (v: any) => {
      console.log("[FormRenderer:CustomRenderer] onChange values:", v);
    };

    const code = `import { FormRenderer } from "…";

const fieldSettings = [
  {
    name: "ui.choice",
    label: "Mode",
    render: ({ common }) => (
      <div style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 2, background: "#f9fafb", padding: 12 }}>
        {/* radio chips */}
      </div>
    ),
    validation: (z) => z.enum(["manual","automatic","hybrid"]),
  },
  { name: "ui.accent", label: "Accent Color", /* custom swatches */ },
  { name: "ui.note", label: "Note", type: "text", placeholder: "Optional short note" },
];

const dataSource = { ui: { choice: "manual", accent: "#2563eb", note: "" } };

<FormRenderer
  ref={ref}
  fieldSettings={fieldSettings}
  dataSource={dataSource}
  onSubmit={setSubmitResult}
  onChange={(v) => { console.log("[FormRenderer:CustomRenderer] onChange values:", v); }}
/>`;

    const resultCode =
      submitResult ? JSON.stringify(submitResult, null, 2) : "// submit to see result here";

    return (
      <StoryWrapper title="Custom renderer" subTitle="Compact chip radios, color swatches, and standard submit.">
        <Guide
          emoji="🎛️"
          title="Overview"
          subtitle="Override look & feel with custom render while keeping validation."
          sections={[
            {
              heading: "Why",
              bullets: [
                "Chips provide a compact alternative to radios.",
                "Add extra custom elements (color swatches, etc).",
                "Open DevTools console to observe onChange snapshots.",
              ],
            },
          ]}
        />

        <Title>Custom Controls</Title>
        <FormRenderer
          ref={ref}
          fieldSettings={fieldSettings}
          dataSource={values}
          onSubmit={(r) => setSubmitResult(r)}
          onChange={handleChange}
        />

        {/* RESULT section ABOVE the submit button */}
        <Guide
          emoji="🧪"
          title="Submit result"
          subtitle="Last onSubmit payload (pretty JSON)."
          headerRight={
            <button
              type="button"
              onClick={() => ref.current?.submit()}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Submit
            </button>
          }
          sections={[{ heading: "Payload", code: resultCode }]}
        />

        <Guide emoji="📄" title="Code" subtitle="Full example with fieldSettings and dataSource." sections={[{ heading: "Usage", code }]} />
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   6) DISABLED & LOADING — toggles stay below, logs onChange
============================================================================= */
export const DisabledAndLoading = {
  name: "Top-level disabled & loading",
  render: () => {
    const fieldSettings: SettingsItem[] = [
      { name: "first", label: "First", type: "text", placeholder: "First value" },
      { name: "second", label: "Second", type: "number", placeholder: "Numeric value" },
      {
        dataTable: {
          header: "Simple Table",
          description: "Buttons and inputs are disabled when top-level disabled=true.",
          config: {
            dataSource: "rows",
            columnSettings: [
              { title: "Name", column: "name" },
              { title: "Qty", column: "qty" },
            ],
          },
          fields: [
            { name: "name", label: "Name", type: "text", placeholder: "Draft name" },
            { name: "qty", label: "Qty", type: "number", placeholder: "Draft qty" },
          ],
        },
      } as any,
    ];

    const [values, setValues] = useState<any>({ first: "Hello", second: 1, rows: [{ name: "A", qty: 1 }] });
    const [disabled, setDisabled] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (v: any) => {
      console.log("[FormRenderer:DisabledAndLoading] onChange values:", v);
      setValues(v);
    };

    const code = `import { FormRenderer } from "…";

const fieldSettings = [
  { name: "first",  label: "First",  type: "text",   placeholder: "First value" },
  { name: "second", label: "Second", type: "number", placeholder: "Numeric value" },
  { dataTable: {
      header: "Simple Table",
      description: "Buttons and inputs are disabled when top-level disabled=true.",
      config: { dataSource: "rows", columnSettings: [
        { title: "Name", column: "name" },
        { title: "Qty",  column: "qty"  },
      ]},
      fields: [
        { name: "name", label: "Name", type: "text", placeholder: "Draft name" },
        { name: "qty",  label: "Qty",  type: "number", placeholder: "Draft qty" },
      ],
  }},
];

const dataSource = { first: "Hello", second: 1, rows: [{ name: "A", qty: 1 }] };

<FormRenderer
  fieldSettings={fieldSettings}
  dataSource={dataSource}
  disabled={disabled}
  loading={loading}
  onChange={(v) => { console.log("[FormRenderer:DisabledAndLoading] onChange values:", v); }}
/>`;

    return (
      <StoryWrapper title="Top-level disabled & loading" subTitle="Disable the entire form or show skeletons while loading.">
        <Guide
          emoji="⏳"
          title="Overview"
          subtitle="Global disabled blocks table actions; loading shows skeleton placeholders."
          sections={[
            {
              heading: "Behavior",
              bullets: [
                "DataTable actions respect the top-level `disabled` flag.",
                "Switch Loading to preview skeleton state.",
                "Use DevTools console to review onChange snapshots.",
              ],
            },
          ]}
        />

        <Title>Form</Title>
        <FormRenderer fieldSettings={fieldSettings} dataSource={values} disabled={disabled} loading={loading} onSubmit={() => {}} onChange={handleChange} />

        {/* toggles BELOW the form, right-aligned in a thin bar */}
        <FullWidthBar mt={16}>
          <Toggle label="Disabled" checked={disabled} onChange={setDisabled} />
          <Toggle label="Loading" checked={loading} onChange={setLoading} />
        </FullWidthBar>

        <Guide emoji="📄" title="Code" subtitle="Full example with fieldSettings and dataSource." sections={[{ heading: "Usage", code }]} />
      </StoryWrapper>
    );
  },
};

/* =============================================================================
   7) IMPERATIVE SUBMIT — result ABOVE button + console logs
============================================================================= */
export const ImperativeSubmit = {
  name: "Imperative submit (ref)",
  render: () => {
    const fieldSettings: SettingsItem[] = [
      { name: "firstName", label: "First Name", type: "text", placeholder: "Required", validation: (z) => z.string().min(1, "Required") },
      { name: "age", label: "Age", type: "number", placeholder: "Min 1", validation: (z) => z.number().int().min(1) },
      {
        dataTable: {
          header: "Contacts",
          description: "Add contact rows; submit will validate both base fields and active-row fields.",
          config: {
            dataSource: "contacts",
            columnSettings: [
              { title: "Name", column: "name" },
              { title: "Phone", column: "phone" },
            ],
          },
          fields: [
            { name: "name", label: "Name", type: "text", placeholder: "Contact name", validation: (z) => z.string().min(1) },
            { name: "phone", label: "Phone", type: "text", placeholder: "Min 7 chars", validation: (z) => z.string().min(7) },
          ],
        },
      } as any,
    ];

    const ref = useRef<FormRendererRef<any>>(null);
    const [values, setValues] = useState<any>({ firstName: "", age: "", contacts: [] });
    const [submitResult, setSubmitResult] = useState<any>(null);

    const handleChange = (v: any) => {
      console.log("[FormRenderer:ImperativeSubmit] onChange values:", v);
      setValues(v);
    };

    const code = `import { FormRenderer } from "…";
import { z } from "zod";

const fieldSettings = [
  { name: "firstName", label: "First Name", type: "text", placeholder: "Required", validation: (z) => z.string().min(1, "Required") },
  { name: "age",       label: "Age",        type: "number", placeholder: "Min 1", validation: (z) => z.number().int().min(1) },
  { dataTable: {
      header: "Contacts",
      description: "Add contact rows; submit will validate both base fields and active-row fields.",
      config: { dataSource: "contacts", columnSettings: [
        { title: "Name",  column: "name"  },
        { title: "Phone", column: "phone" },
      ]},
      fields: [
        { name: "name",  label: "Name",  type: "text", placeholder: "Contact name", validation: (z) => z.string().min(1) },
        { name: "phone", label: "Phone", type: "text", placeholder: "Min 7 chars", validation: (z) => z.string().min(7) },
      ],
  }},
];

const dataSource = { firstName: "", age: "", contacts: [] };

<FormRenderer
  ref={ref}
  fieldSettings={fieldSettings}
  dataSource={dataSource}
  onSubmit={(res) => setSubmitResult(res)}
  onChange={(v) => { console.log("[FormRenderer:ImperativeSubmit] onChange values:", v); }}
/>`;

    const resultCode =
      submitResult ? JSON.stringify(submitResult, null, 2) : "// submit via ref to see result here";

    return (
      <StoryWrapper title="Imperative submit" subTitle="Call submit from a ref; invalidFields and values returned to onSubmit.">
        <Guide
          emoji="🖱️"
          title="Overview"
          subtitle="Auto-focuses first invalid field; returns { valid, values, invalidFields }."
          sections={[
            {
              heading: "Flow",
              bullets: [
                "Click Submit via ref to validate current state.",
                "If invalid, the first error receives focus.",
                "Open DevTools console to see the latest onChange snapshot at each keystroke.",
              ],
            },
          ]}
        />

        <Title>Form</Title>
        <FormRenderer ref={ref} fieldSettings={fieldSettings} dataSource={values} onChange={handleChange} onSubmit={(res) => setSubmitResult(res)} />

        {/* RESULT section ABOVE the submit button */}
        <Guide
          emoji="🧪"
          title="Submit result"
          subtitle="Last onSubmit payload (pretty JSON)."
          sections={[{ heading: "Payload", code: resultCode }]}
          headerRight={(
            <button
              type="button"
              onClick={() => ref.current?.submit()}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Submit via ref
            </button>
          )}
        />

        <Guide emoji="📄" title="Code" subtitle="Full example with fieldSettings and dataSource." sections={[{ heading: "Usage", code }]} />
      </StoryWrapper>
    );
  },
};
