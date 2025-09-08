// src/organisms/Modal/stories.tsx
/* eslint-disable react-refresh/only-export-components */
import type { Meta, StoryObj } from '@storybook/react'
import { Modal } from './index'
import type { ModalProps } from './interface'
import { StoryWrapper, Title } from '../../components/StoryWrapper'
import React, { useState } from 'react'
import { Button } from '../../atoms/Button'
import { FormControl } from '../../atoms/FormControl'
import { Icon } from '../../atoms/Icon'
import { LocalServerNotice, API_BASE } from "../../components/LocalServerNotice"

// NEW: DataTable inside modal
import { DataTable } from '../DataTable'
import type { ColumnSetting } from '../DataTable/interface'

const descriptionText =
  'The Modal component is used to display content in an overlay dialog. It supports various configurations including different sizes, header colors, footer button alignment, close behaviors, and async content.'

const meta: Meta<typeof Modal> = {
  title: 'Organisms/Modal',
  component: Modal,
  parameters: {
    docs: {
      description: {
        component: descriptionText,
      },
    },
  },
  argTypes: {
    modalWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'auto']
    },
    color: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger', 'info', 'default']
    },
    closeable: { control: 'boolean' },
    showCloseIcon: { control: 'boolean' }
  }
}

export default meta

// ✅ Default Modal Component
const DefaultModal = (args: ModalProps) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button color='primary' onClick={() => setOpen(true)}>
        Open Modal
      </Button>
      <Modal {...args} show={open} onClose={() => setOpen(false)} />
    </>
  )
}

export const Default: StoryObj<typeof meta> = {
  args: {
    show: false,
    closeable: true,
    showCloseIcon: true,
    modalWidth: 'md',
    zIndex: 1000,
    color: 'primary',
    title: 'Basic Modal',
    children: <p>This is a simple modal example.</p>
  },
  tags: ['!dev'],
  render: (args) => <DefaultModal {...args} />
}

/* -----------------------------------------------------------------------------
   Columns + fetchers for the in-modal DataTable
----------------------------------------------------------------------------- */

const MODAL_COLUMNS: ColumnSetting[] = [
  { title: 'ID', column: 'id', width: 80, draggable: false, filter: false },
  { title: 'Title', column: 'title', width: 280 },
  { title: 'Brand', column: 'brand', width: 160 },
  { title: 'Category', column: 'category', width: 160 },
  { title: 'Price', column: 'price', width: 120, align: 'right' },
  { title: 'Rating', column: 'rating', width: 120, align: 'right' },
];

// server-mode fetcher (async/await) — includes artificial delay
const fetchProductsForModalAwait = async (params: any) => {
  const { pageIndex, pageSize, sorting = [], globalFilter = '' } = params;
  const s = sorting?.[0];

  const qs = new URLSearchParams({
    q: globalFilter ?? '',
    limit: String(pageSize),
    skip: String(pageIndex * pageSize),
    __delay: '700', // ← simulate latency
  });
  if (s?.id) {
    qs.set('sortBy', s.id);
    qs.set('order', s.desc ? 'desc' : 'asc');
  }

  const res = await fetch(`${API_BASE}/products/search?${qs.toString()}`);
  if (!res.ok) throw new Error('Fetch failed');
  const json = await res.json();
  return { rows: json.products ?? [], total: json.total ?? 0 };
};

// server-mode fetcher (.then() style) — includes artificial delay
const fetchProductsForModalThen = (params: any) => {
  const { pageIndex, pageSize, sorting = [], globalFilter = '' } = params;
  const s = sorting?.[0];

  const qs = new URLSearchParams({
    q: globalFilter ?? '',
    limit: String(pageSize),
    skip: String(pageIndex * pageSize),
    __delay: '700', // ← simulate latency
  });
  if (s?.id) {
    qs.set('sortBy', s.id);
    qs.set('order', s.desc ? 'desc' : 'asc');
  }

  return fetch(`${API_BASE}/products/search?${qs.toString()}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((json) => ({ rows: json.products ?? [], total: json.total ?? 0 }));
};

/* =============================================================================
   Modal Examples (async + controlled + sync)
============================================================================= */
const ModalExamples = () => {
  const [openLong, setOpenLong] = useState(false)
  const [openFooter, setOpenFooter] = useState(false)
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center')
  const [size, setSize] = useState<ModalProps['modalWidth']>('md')
  const [openSize, setOpenSize] = useState(false)
  const [color, setColor] = useState<'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'>('primary')
  const [openColor, setOpenColor] = useState(false)
  const [openNoClose, setOpenNoClose] = useState(false)
  const [openNoIcon, setOpenNoIcon] = useState(false)

  // Async demo state (local server)
  const [openAsync, setOpenAsync] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [productTitle, setProductTitle] = useState("");
  const [asyncMode, setAsyncMode] = useState<'await' | 'then'>('await');

  const handleAsyncOpen = async () => {
    setAsyncMode('await');
    setOpenAsync(true);
    setLoading(true);
    setData(null);

    try {
      const qs = new URLSearchParams({
        q: "",
        limit: "1",
        skip: "0",
        select: "id,title,brand,category,price,rating",
        __delay: "700", // ← simulate latency so loader is visible
      });
      const res = await fetch(`${API_BASE}/products/search?${qs.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const first = Array.isArray(json?.products) ? json.products[0] : null;
      setData(first ?? json);
      setProductTitle(first?.title ?? "");
    } catch (err) {
      console.error("Local API error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAsyncOpenThen = () => {
    setAsyncMode('then');
    setOpenAsync(true);
    setLoading(true);
    setData(null);

    const qs = new URLSearchParams({
      q: "",
      limit: "1",
      skip: "0",
      select: "id,title,brand,category,price,rating",
      __delay: "700", // ← simulate latency so loader is visible
    });

    fetch(`${API_BASE}/products/search?${qs.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const first = Array.isArray(json?.products) ? json.products[0] : null;
        setData(first ?? json);
        setProductTitle(first?.title ?? "");
      })
      .catch((err) => {
        console.error("Local API error (.then):", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const colorOptions = ['primary', 'success', 'warning', 'danger', 'info', 'default'] as const

  // 🔒 Controlled demo state
  const [openControlled, setOpenControlled] = useState(false)

  // SYNC modal (non server-mode table) — show table immediately, update rows/columns via .then()
  const [openSync, setOpenSync] = useState(false);
  const [syncRows, setSyncRows] = useState<any[]>([]);
  const [syncError, setSyncError] = useState<string>("");
  const [syncColumns, setSyncColumns] = useState<ColumnSetting[]>(MODAL_COLUMNS);

  const openSyncModalThen = () => {
    setOpenSync(true);
    setSyncError("");

    const qs = new URLSearchParams({
      q: "",
      limit: "25",
      skip: "0",
      select: "id,title,brand,category,price,rating",
      __delay: "700", // ← simulate latency; table renders immediately with whatever is in state
    });

    fetch(`${API_BASE}/products/search?${qs.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const rows = Array.isArray(json?.products) ? json.products : [];
        setSyncRows(rows);
        // After fetch completes, update column widths to demonstrate dynamic columnSettings
        setSyncColumns(MODAL_COLUMNS.map(c => ({ ...c, width: 250 })));
      })
      .catch((e: any) => {
        setSyncError(String(e?.message ?? e));
        setSyncRows([]);
      });
  };

  return (
    <StoryWrapper title='Modal Examples' subTitle={descriptionText}>
      {/* ✅ Long Scrollable Content */}
      <Title>Long Content (Scrollable)</Title>
      <Button color='primary' onClick={() => setOpenLong(true)}>
        Open Long Content Modal
      </Button>
      <Modal show={openLong} onClose={() => setOpenLong(false)} title='Long Content Modal'>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
        <FormControl label='Full Name' type='text' placeholder='Enter your full name' />
        <FormControl label='Email Address' type='email' placeholder='Enter your email' />
        <FormControl label='Comments' type='textarea' placeholder='Write your message here' />
        <p>
          <Icon icon='info' /> Example modal with <strong>long scrollable content</strong>.
        </p>
        {[...Array(50)].map((_, i) => (
          <p key={i}>This is long content line {i + 1}. Lorem ipsum dolor sit amet...</p>
        ))}
      </Modal>

      {/* ✅ Footer Buttons Alignment */}
      <Title>Footer Buttons Alignment</Title>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Button
          color='default'
          onClick={() => {
            setAlignment('left')
            setOpenFooter(true)
          }}
        >
          Left Align
        </Button>
        <Button
          color='default'
          onClick={() => {
            setAlignment('center')
            setOpenFooter(true)
          }}
        >
          Center Align
        </Button>
        <Button
          color='default'
          onClick={() => {
            setAlignment('right')
            setOpenFooter(true)
          }}
        >
          Right Align
        </Button>
      </div>
      <Modal show={openFooter} onClose={() => setOpenFooter(false)} title='Footer Buttons'>
        <p>Buttons are aligned {alignment} in the footer.</p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: alignment }}>
          <Button color='default' onClick={() => setOpenFooter(false)}>
            Cancel
          </Button>
          <Button color='primary' onClick={() => alert('Confirmed')}>
            Confirm
          </Button>
        </div>
      </Modal>

      {/* ✅ Size Variants */}
      <Title>Size Variants</Title>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['sm', 'md', 'lg', 'auto'] as const).map(s => (
          <Button
            key={s}
            color='default'
            onClick={() => {
              setSize(s)
              setOpenSize(true)
            }}
          >
            {s.toUpperCase()}
          </Button>
        ))}
      </div>
      <Modal show={openSize} onClose={() => setOpenSize(false)} modalWidth={size} title={`Modal - ${size?.toUpperCase()} Size`}>
        <p>This modal demonstrates different sizes.</p>
      </Modal>

      {/* ✅ Color Variants */}
      <Title>Header Colors</Title>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {colorOptions.map(c => (
          <Button
            key={c}
            color={c}
            onClick={() => {
              setColor(c)
              setOpenColor(true)
            }}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </Button>
        ))}
      </div>
      <Modal show={openColor} onClose={() => setOpenColor(false)} color={color} title={`Modal - ${color.charAt(0).toUpperCase() + color.slice(1)}`}>
        <p>The header color of this modal is {color}.</p>
      </Modal>

      {/* ✅ Close Options */}
      <Title>Close Behavior</Title>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Button color='primary' onClick={() => setOpenNoClose(true)}>
          Non-Closeable Modal
        </Button>
        <Button color='primary' onClick={() => setOpenNoIcon(true)}>
          No Close Icon
        </Button>
      </div>
      <Modal show={openNoClose} closeable={false} onClose={() => setOpenNoClose(false)} title='Non-Closeable Modal'>
        <p>Clicking the overlay will not close this modal.</p>
      </Modal>
      <Modal show={openNoIcon} onClose={() => setOpenNoIcon(false)} title='No Close Icon' showCloseIcon={false}>
        <p>This modal <strong>has no close button (X)</strong>.</p>
      </Modal>

      {/* ✅ Async API Demo (Local Server) */}
      <Title>Async API Demo</Title>
      <LocalServerNotice compact title="Local API offline" description={<>Start with <code>node server.js</code> at project root.</>} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Button color='primary' onClick={handleAsyncOpen}>
          Open Async Modal
        </Button>
        <Button color='default' onClick={handleAsyncOpenThen}>
          Open Async Modal (.then)
        </Button>
      </div>

      <Modal
        show={openAsync}
        onClose={() => setOpenAsync(false)}
        title="Async API Modal"
        color="info"
        onOpening={() => console.log("Modal opening")}
        onOpened={() => console.log("Modal opened")}
        onClosing={() => console.log("Modal closing")}
        onClosed={() => {
          console.log("Modal closed")
          // Clear input + preview on close
          setProductTitle('')
          setData(null)
        }}
      >
        <LocalServerNotice compact title="Local API offline" description="Start the local server to load data." />
        <FormControl
          label="Product Title"
          type="text"
          value={productTitle}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setProductTitle(e.target.value)
          }
        />

        {loading && <p>Loading...</p>}

        {!loading && data && (
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}

        {/* --- Server-side DataTable inside the async modal --- */}
        <Title>Products (local)</Title>
          <DataTable
            key={productTitle + ':' + asyncMode} // apply defaultGlobalFilter immediately per input/mode
            serverMode
            server={{
              fetcher: asyncMode === 'then' ? fetchProductsForModalThen : fetchProductsForModalAwait,
              debounceMs: 350,
            }}
            dataSource={[]}
            enableGlobalFiltering
            enableColumnFiltering={false}
            enableColumnSorting
            enableColumnResizing
            enableColumnPinning
            columnSettings={MODAL_COLUMNS}
            maxHeight={'200px'}
          />
      </Modal>

      {/* ✅ Sync Modal (Non Server-Mode Table) */}
      <Title>Sync Modal (Non Server-Mode Table)</Title>
      <LocalServerNotice compact title="Local API offline" description="Start the local server to load data." />
      <Button color='primary' onClick={openSyncModalThen}>
        Open Sync Modal (fetch then render) — .then()
      </Button>

      <Modal
        show={openSync}
        onClose={() => setOpenSync(false)}
        title="Sync Modal"
        color="default"
      >
        {syncError && <p style={{ color: '#b91c1c' }}>Error: {syncError}</p>}
        {/* Always show the table immediately; once fetch resolves, rows + columns update */}
        <p style={{ margin: '8px 0' }}>
          This table is <strong>not</strong> in server mode. It renders immediately with whatever rows are present,
          then updates when the fetch completes. After fetching, all columns are set to <code>width: 200</code>.
        </p>
          <DataTable
            dataSource={syncRows}
            columnSettings={syncColumns}
            enableGlobalFiltering
            enableColumnFiltering
            enableColumnSorting
            enableColumnResizing
            enableColumnPinning
            maxHeight={'200px'}
          />
      </Modal>

      {/* ✅ Controlled (Parent-State) Demo */}
      <Title>Controlled Modal (Parent State)</Title>
      <p style={{ marginBottom: 8 }}>
        This modal’s <code>show</code> is driven by parent state. Closing it calls <code>onClose</code>, which flips the same state.
      </p>
      <Button color='primary' onClick={() => setOpenControlled(true)}>
        Open Controlled Modal
      </Button>
      <Modal
        show={openControlled}
        onClose={() => setOpenControlled(false)}
        title="Controlled Modal"
        color="default"
        // Keep the DOM mounted to prove no re-mount flicker while toggling visibility.
        // Remove this if you want it unmounted when hidden.
        unmountOnHide={false}
      >
        <p>
          Fully controlled via <code>const [openControlled, setOpenControlled] = useState(false)</code>.
          Overlay click, Escape, and the “X” button all call <code>onClose</code> which sets the state to <code>false</code>.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <Button color='default' onClick={() => setOpenControlled(false)}>Cancel</Button>
          <Button color='primary' onClick={() => setOpenControlled(false)}>Done</Button>
        </div>
      </Modal>
    </StoryWrapper>
  )
}

export const Examples: StoryObj<typeof Modal> = {
  tags: ['!autodocs'],
  render: () => <ModalExamples />
}
