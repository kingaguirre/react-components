// server.js
// Run: npm i express cors && node server.js
// Env knobs: DELAY_MS=400 DELAY_JITTER=200 PORT=4000
import 'dotenv/config';
import express from "express";
import cors from "cors";
import { ProxyAgent, fetch as undiciFetch } from "undici";
import { createAIStreamHandler, aiDownloadRoute } from "./src/common/server/ai/streamFactory.js";
import { workdeskPlugin } from "./src/organisms/ChatWidget/aiUtils/workdeskPlugin.js";

const PORT = Number(process.env.PORT ?? 4000);
const BASE_DELAY = Number.isFinite(Number(process.env.DELAY_MS)) ? Number(process.env.DELAY_MS) : 100;
const JITTER = Number.isFinite(Number(process.env.DELAY_JITTER)) ? Number(process.env.DELAY_JITTER) : 50;

const app = express();
// 🔺 MUST COME FIRST: body parsers
app.use(express.json({ limit: "50mb" }));          // bump as needed
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(express.json());

// ---------- delay middleware ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
app.use(async (req, _res, next) => {
  if (req.path === "/health") return next();
  const qd = Number(req.query.__delay);
  const override = Number.isFinite(qd) ? Math.max(0, qd) : null;
  const rnd = Math.floor(Math.random() * (JITTER * 2 + 1)) - JITTER;
  const delay = override ?? Math.max(0, BASE_DELAY + rnd);
  if (delay > 0) await sleep(delay);
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// ---------- data generation (4,934 rows) ----------
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20250921);

const BANKS = [
  "Standard Chartered Bank (Singapore) Ltd",
  "SCB Malaysia Berhad",
  "SCB Hong Kong Ltd",
];
const STAGES = [
  "SPLCP - Split Completed",
  "SPLIN - Split Initiated",
  "APRV - Approved",
  "EXEMK - Exception Handling Maker",
  "PRINP - Processing In-Progress",
  "TXPMK - Transaction Pending Maker",
  "PPRMK - Pre Processing Maker",
];
const SUBMISSION = ["EML", "TNG", "OTC"];
const PRODUCTS = ["EIF", "IIF", "SUF"];
const CUSTOMERS = [
  "100006898 - TXOPT TESTING LONG NAME COMPANY LTD",
  "100009999 - SAMPLE INDUSTRIES PTE LTD",
  "100001111 - DEMO GROUP HOLDINGS",
];
const CNTP = ["PHARMA MED", "100502577 - TEST", "NG-Adaptor-IIF6"];

const TOKENS = ["ZEKE", "BOLT", "ECHO", "RISK"];
const tokenForIndex = (i) => TOKENS[i % TOKENS.length];

const ROWS = [];
const N = 4934;

// ---- spread receivedAt across 2018 → current year (long tail) ----
const NOW = new Date();
const CURRENT_YEAR = NOW.getUTCFullYear();

// Weighted year buckets (tweak as you like; must sum ~1.0)
const YEAR_WEIGHTS = [
  { y: 2018, w: 0.05 },
  { y: 2019, w: 0.07 },
  { y: 2020, w: 0.08 },
  { y: 2021, w: 0.10 },
  { y: 2022, w: 0.15 },
  { y: 2023, w: 0.15 },
  { y: 2024, w: 0.20 },
  { y: CURRENT_YEAR, w: 0.20 }, // e.g., 2025
];

// normalize weights
const totalW = YEAR_WEIGHTS.reduce((s, x) => s + x.w, 0);
YEAR_WEIGHTS.forEach((x) => (x.w /= totalW));
const CUM = YEAR_WEIGHTS.reduce((a, x, i) => {
  a.push((a[i - 1] ?? 0) + x.w);
  return a;
}, []);

function pickWeightedYear() {
  const r = rand();
  for (let i = 0; i < CUM.length; i++) {
    if (r <= CUM[i]) return YEAR_WEIGHTS[i].y;
  }
  return YEAR_WEIGHTS[CUM.length - 1].y;
}

function lastDayOfMonthUTC(y, m /* 0..11 */) {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}

function randomInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function pickReceivedAtMs() {
  const y = pickWeightedYear();
  const m = randomInt(0, 11); // 0..11
  const lastDay = lastDayOfMonthUTC(y, m);
  const d = randomInt(1, lastDay);
  const hh = randomInt(0, 23);
  const mm = randomInt(0, 59);
  const ss = randomInt(0, 59);
  return Date.UTC(y, m, d, hh, mm, ss);
}

for (let i = 0; i < N; i++) {
  const receivedAtMs = pickReceivedAtMs();

  // Registration before received time (0–6h), release after (0–24h)
  const regMs = receivedAtMs - Math.floor(rand() * 6 * 60) * 60_000;
  const relMs = receivedAtMs + Math.floor(rand() * 24 * 60) * 60_000;

  ROWS.push({
    id: i + 1,

    // Common keys used by Ack
    arn: String(2_500_000 + i),
    bookingLocation: BANKS[i % BANKS.length],
    workflowStage: STAGES[i % STAGES.length],
    submissionMode: SUBMISSION[i % SUBMISSION.length],
    receivedAt: new Date(receivedAtMs).toISOString(),
    __receivedAtMs: receivedAtMs,
    createdAt: new Date(receivedAtMs).toISOString(),
    __createdAtMs: receivedAtMs,
    updatedAt: new Date(receivedAtMs).toISOString(),
    generatedBy: "System",

    // Extra keys used by Txn
    trn: `SPBTR25RFC${String(3129 + i).padStart(6, "0")}`,
    customer: CUSTOMERS[i % CUSTOMERS.length],
    counterparty: CNTP[i % CNTP.length],
    product: PRODUCTS[i % PRODUCTS.length],
    step: "NEW001",
    subStep: "DRFF",
    lockedBy: String(1201231 + (i % 9999)),
    stage: STAGES[(i + 3) % STAGES.length],
    lli: tokenForIndex(i + 0),
    aml: tokenForIndex(i + 1),
    snc: tokenForIndex(i + 2),
    clbk: tokenForIndex(i + 3),
    cocoa: tokenForIndex(i + 4),
    tdOpsApproval: "NULL",
    customerRef: i % 11 === 0 ? "NG-Adaptor-IIF6" : "NG-STPAdaptor-EIF",
    regDate: new Date(regMs).toISOString().slice(0, 10),
    relDate: new Date(relMs).toISOString().slice(0, 10),
    segment: "ME",
    subSegment: "03",
    splitId: String(251 + (i % 9)),

    // Mutable nested sections (SOT lives here)
    __generalOverrides: undefined,
    sustainable: undefined,
    exceptions: undefined,
    documents: undefined,
  });
}

// ---------- helpers ----------
function cmp(a, b, order) {
  const dir = order === "desc" ? -1 : 1;
  if (a == null && b == null) return 0;
  if (a == null) return -1 * dir;
  if (b == null) return 1 * dir;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return (na - nb) * dir;
  return String(a).localeCompare(String(b)) * dir;
}

function matchesGlobal(row, q) {
  if (!q) return true;
  const s = String(q).toLowerCase();
  return Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(s));
}

function applyColumnFilters(rows, filtersJson) {
  if (!filtersJson) return rows;
  let filters = [];
  try { filters = JSON.parse(String(filtersJson)); } catch {}
  if (!Array.isArray(filters)) return rows;
  let out = rows;
  for (const f of filters) {
    const id = String(f.id ?? "");
    const raw = f.value;
    const mode = f.filterBy || "includesString";
    if (raw == null || raw === "") continue;
    out = out.filter((r) => {
      const cell = String(r[id] ?? "");
      if (mode === "includesStringSensitive") return cell.includes(String(raw));
      return cell.toLowerCase().includes(String(raw).toLowerCase());
    });
  }
  return out;
}

function deriveStatus(row) {
  return /Initiated/i.test(row.workflowStage) ? "PENDING" : "REGISTERED";
}

// ---------- Txn helpers for Header & General ----------
const BOOK_CODE_BY_NAME = {
  "Standard Chartered Bank (Singapore) Ltd": "SG01",
  "SCB Malaysia Berhad": "MY01",
  "SCB Hong Kong Ltd": "HK01",
};
const BOOK_NAME_BY_CODE = Object.fromEntries(Object.entries(BOOK_CODE_BY_NAME).map(([name, code]) => [code, name]));

const PRODUCT_LONG_NAME = {
  EIF: "Export Invoice Financing",
  IIF: "Import Invoice Financing",
  SUF: "Supply Chain / Shipping Under Finance",
};

const SUBMISSION_LABEL = {
  TNG: "TNG - Trade Nextgen",
  EML: "EML - Email",
  OTC: "OTC - Over the Counter",
};
const SUBMISSION_CODE_BY_LABEL = Object.fromEntries(
  Object.entries(SUBMISSION_LABEL).map(([code, label]) => [label, code])
);

function findByTrn(trn) {
  return ROWS.find((r) => String(r.trn) === String(trn));
}
function findById(id) {
  const num = Number(id);
  if (!Number.isFinite(num)) return undefined;
  return ROWS.find((r) => r.id === num);
}

function digitsFromCustomer(customer) {
  const m = String(customer).match(/\d+/);
  return m ? m[0] : "000000000";
}

function buildHeader(row) {
  return {
    trn: row.trn,
    product: row.product,
    step: row.step,
    subStep: row.subStep,
    client: row.customer,
    bookingLocation: BOOK_CODE_BY_NAME[row.bookingLocation] || "SG01", // code
    bookingLocationName: row.bookingLocation, // full
  };
}

function buildGeneral(row, indexSeed = 0) {
  const custDigits = digitsFromCustomer(row.customer);
  const btcId = `SG01${custDigits}${row.product}0101`;
  const valueDate = row.relDate; // reuse release date for demo

  const ov = row.__generalOverrides || {};
  const base = {
    ackNumber: Number(row.arn),
    submissionMode: SUBMISSION_LABEL[row.submissionMode] || row.submissionMode, // label
    btcId,
    limitGroupId: "1 - GTF-Default",
    financeType: `${row.product} - ${PRODUCT_LONG_NAME[row.product] || "—"}`,
    productGroup: "RF - Receivable finance",
    valueDateOption: "PD - PROCESSING DATE",
    valueDate,
    summaryListing: "SML01 - Allowed",
    submissionBranch: BOOK_CODE_BY_NAME[row.bookingLocation] || "SG01",
    clientReference: row.customerRef,
    isIslamicTransaction: row.product === "IIF" ? (indexSeed % 5 === 0) : false,
    reviewFlag: indexSeed % 7 === 0,
    almApprovalReceived: indexSeed % 9 === 0,
    emailIndemnityHeld: indexSeed % 6 === 0 ? "Required" : "Not Required",
    clientRemarks: "",
    signatureVerified: indexSeed % 8 === 0,
    counterparty: row.counterparty,
  };

  return { ...base, ...ov };
}

// ---------- Exceptions helpers ----------
const EXC_DEPTS = ["Operations", "Compliance", "Credit Control", "Trade Services", "Front Office"];
const EXC_CODES = ["E001", "E014", "E027", "E042", "E055", "E063", "E078"];

function buildExceptions(row) {
  const r = mulberry32(100000 + row.id * 13);
  const count = Math.floor(r() * 4);
  const out = [];
  for (let i = 0; i < count; i++) {
    const code = EXC_CODES[Math.floor(r() * EXC_CODES.length)];
    const dept = EXC_DEPTS[Math.floor(r() * EXC_DEPTS.length)];
    out.push({
      id: `${row.id}-${i + 1}`,
      code,
      description: `Auto-generated exception ${code} for TRN ${row.trn}`,
      department: dept,
    });
  }
  return out;
}

function paginateAndFilter(list, { q = "", limit = 20, skip = 0, sortBy, order = "asc", filters }) {
  let rows = list.slice();
  rows = rows.filter((r) => matchesGlobal(r, q));
  rows = applyColumnFilters(rows, filters);
  if (sortBy) rows = rows.slice().sort((a, b) => cmp(a[String(sortBy)], b[String(sortBy)], order));
  const total = rows.length;
  const off = Number(skip);
  const lim = Number(limit);
  const page = lim > 0 ? rows.slice(off, off + lim) : rows.slice();
  return { rows: page, total };
}

// ---------- Sustainable Finance helpers ----------
const SUSTAINABLE_CLASS = ["GREEN", "SL", "TRANSITION", "OTHERS"];

function buildSustainable(row) {
  const r = mulberry32(300000 + row.id * 17);
  const flag = r() > 0.6 ? false : r() > 0.3 ? true : null; // null ~ not set
  const cls = SUSTAINABLE_CLASS[Math.floor(r() * SUSTAINABLE_CLASS.length)];
  const empowered = r() > 0.7 ? true : r() > 0.4 ? false : null;
  const dateISO = new Date(row.__receivedAtMs).toISOString().slice(0, 10);
  return {
    sustainableFlag: flag,
    classification: flag ? cls : "",
    empoweredStatus: empowered,
    empoweredDate: empowered ? dateISO : "",
    remarks: "",
    othersSpecify: "",
  };
}

// ---------- Documents helpers ----------
function buildDocuments(row) {
  const cur = (row.bookingLocation.includes("Hong Kong") && "HKD")
    || (row.bookingLocation.includes("Malaysia") && "MYR")
    || "SGD";

  const docNumber = `EIF_${row.id}_${String(row.customer).match(/\d+/)?.[0]?.slice(0,3) ?? "100"}xxxxxxxx`;
  const issue = new Date(row.__receivedAtMs).toISOString().slice(0,10);
  const due = new Date(row.__receivedAtMs + 7*24*3600_000).toISOString().slice(0,10);
  const maxMat = due;
  const amt = 1978.05 + (row.id % 7);
  const elig = Math.round((amt * 0.9) * 100) / 100;

  return {
    // Batch details
    batchType: "INV - INVOICE",
    batchAmountCurrency: cur,
    batchAmount: Number(amt.toFixed(2)),
    batchCount: 1,
    nonFactored: false,
    maxEligibleCurrency: cur,
    maxEligibleAmount: elig,
    batchAdjustmentCurrency: cur,
    batchAdjustmentAmount: 0,
    originalInvoiceSubmissionDate: issue,
    statementDate: issue,
    manualLLITrigger: false,

    // Main
    documentNumber: docNumber,
    documentAmountCurrency: cur,
    documentAmount: Number(amt.toFixed(2)),
    adjustmentAmountCurrency: cur,
    adjustmentAmount: 0,
    counterpartyName: row.counterparty,
    documentIssueDate: issue,
    documentTenor: "30",
    paymentTerms: "NET30",
    documentDueDate: due,
    incoterms: "FOB",
    eligibleAmountCurrency: cur,
    eligibleAmount: elig,
    maxMaturityDate: maxMat,
    documentApprovalStatus: "APPR",
    overrideDocStatus: "",
    overrideReason: "",

    // Tables
    docDetailRows: [
      {
        number: docNumber,
        currency: cur,
        amount: Number(amt.toFixed(2)),
        issueDate: issue,
        dueDate: due,
        eligibleAmt: elig,
        maxMaturityDate: maxMat,
        status: "ELGB",
      },
    ],
    goodsRows: [],
    partyRows: [],
    installmentRows: [],
  };
}

// ---------- Finances helpers ----------
function buildFinanceRequest(row) {
  const baseAmt = (Number(row.id % 500) + 1000.24).toFixed(2);
  return {
    financeAmount: `SGD ${baseAmt}`,
    financeTenorOption: "SFC - SPECIFIC TENOR",
    financeTenorDays: 0,
    financeEndDate: row.relDate,

    principalAccountNumber: "SGD 123-456789-0",
    principalFxRateSource: "TT",
    principalFxContractNumber: "PX-" + row.id,
    principalFxRate: "1.0000",

    interestAccountNumber: "SGD 987-654321-0",
    interestFxRateSource: "TT",
    interestFxContractNumber: "IX-" + row.id,
    interestFxRate: "1.0000",

    collectionOption: "",
    collectionPeriodicity: "",
    baseRateType: "",
    rateResetPeriodicity: "",
    baseRate: "",
    baseRateIndex: "",
    indexTenor: "",
    allInLP: "",
    updateBaseRate: false,
    baseRateMultiplier: "",
    marginPercentage: "",
    computationMethod: "",
    applySpecialRolloverPricing: false,

    ftpUpdateBaseRate: false,
    ftpBaseRate: "",
    ftpUpdateLP: false,
    ftpContractualLP: "",
    ftpBehaviouralLP: "",
    ftpCostOfLiquidity: "",
    ftpIncentivePremiumSubsidy: "",

    disbFinanceAmount: `SGD ${baseAmt}`,
    disbAmount: "SGD 0.00",
    disbFxRateSource: "",
    disbContractNumber: "",
    disbFxRate: "",

    bdiOverrideImport: false,
    bdiAccountNumber: "",
    bdiContractNumber: "",
    bdiFxRateSource: "",
    bdiFxRate: "",
    bdiBalanceDebitAmount: ""
  };
}
function buildFinanceProcessed(row) {
  return {
    financeNumber: "",
    financeType: "",
    financeAmount: `SGD ${(Number(row.id % 500) + 1200.18).toFixed(2)}`,
    financeTenorDays: 0,
    effectiveDate: row.regDate,
    maturityDate: row.relDate,
    financeEvent: "",
    autoSettlement: false,
    principalAccountNumber: "",
    interestAccountNumber: "",
    principalFxRateSource: "",
    interestFxRateSource: "",
    principalContractNumber: "",
    interestContractNumber: "",
    principalFxRate: "",
    interestFxRate: "",

    piCollectionOption: "",
    piCollectionPeriodicity: "",
    piBaseRateType: "",
    piRateResetPeriodicity: "",
    piBaseRateIndex: "",
    piIndexTenor: "",
    piBaseRate: "",
    piAllInLP: "",
    piBaseRateMultiplier: "",
    piMarginPercentage: "",
    piComputationMethod: "",

    ftpBaseRate: "",
    ftpContractualLP: "",
    ftpBehaviouralLP: "",
    ftpCostOfLiquidity: ""
  };
}

// ---------- Single-source-of-truth "derived view" ----------
function getDerived(row) {
  // Always compute on read so everything stays in sync with ROWS
  const header = buildHeader(row);
  const general = buildGeneral(row, row.id);
  const sustainable = row.sustainable ?? buildSustainable(row);
  const documents = row.documents ?? buildDocuments(row);
  const finances = {
    request: buildFinanceRequest(row),
    processed: buildFinanceProcessed(row),
  };
  const status = deriveStatus(row);
  return { header, general, sustainable, documents, finances, status };
}
function toPublicTxn(row) {
  // handy aggregator for the UI
  const { header, general, sustainable, documents, finances, status } = getDerived(row);
  // Expose the base (lightweight) + derived sections
  const base = {
    id: row.id,
    trn: row.trn,
    arn: row.arn,
    bookingLocation: row.bookingLocation,
    submissionMode: row.submissionMode,
    workflowStage: row.workflowStage,
    receivedAt: row.receivedAt,
    __receivedAtMs: row.__receivedAtMs,
    customer: row.customer,
    counterparty: row.counterparty,
    product: row.product,
    stage: row.stage,
    customerRef: row.customerRef,
    regDate: row.regDate,
    relDate: row.relDate,
    segment: row.segment,
    subSegment: row.subSegment,
    splitId: row.splitId,
    generatedBy: row.generatedBy,
  };
  return { base, derived: { header, general, sustainable, documents, finances, status } };
}

// ---------- Seed nested sections once (exceptions/sustainable/documents) ----------
for (const r of ROWS) {
  r.exceptions = buildExceptions(r);
  r.sustainable = buildSustainable(r);
  r.documents = buildDocuments(r);
}

// ---------- routes ----------
// GET /workdesk/search?q=&limit=&skip=&sortBy=&order=&filters=&status=&trnSearch=&hideAcr=&savedFilter=
app.get("/workdesk/search", (req, res) => {
  let {
    q = "",
    limit = 30,
    skip = 0,
    sortBy,
    order = "asc",
    filters,
    status,
    trnSearch = "",
    hideAcr = "",
    savedFilter = "",
  } = req.query;

  let rows = ROWS.slice();

  const sinceMs = Number(req.query.sinceMs);
  const untilMs = Number(req.query.untilMs);
  if (Number.isFinite(sinceMs) || Number.isFinite(untilMs)) {
    rows = rows.filter((r) => {
      const ms = r.__receivedAtMs;
      if (Number.isFinite(sinceMs) && ms < sinceMs) return false;
      if (Number.isFinite(untilMs) && ms > untilMs) return false;
      return true;
    });
  }

  const statusStr = typeof status === "string" ? status.trim().toUpperCase() : "";
  if (statusStr && statusStr !== "ALL") {
    rows = rows.filter((r) => deriveStatus(r) === statusStr);
  }
  if (String(trnSearch).trim()) {
    const needle = String(trnSearch).toLowerCase();
    rows = rows.filter((r) => String(r.trn).toLowerCase().includes(needle));
  }
  if (String(hideAcr) === "true") {
    rows = rows.filter((_, i) => i % 7 !== 0);
  }
  if (String(savedFilter).toUpperCase() === "MKIP") {
    rows = rows.filter((r) => /In-Progress/i.test(r.stage));
  } else if (String(savedFilter).toUpperCase() === "LOCKED_ME") {
    rows = rows.filter((_, i) => i % 5 === 0);
  }

  rows = rows.filter((r) => matchesGlobal(r, q));
  rows = applyColumnFilters(rows, filters);

  if (sortBy) {
    const id = String(sortBy);
    rows = rows.slice().sort((a, b) => {
      if (id === "receivedAt") return cmp(a.__receivedAtMs, b.__receivedAtMs, order);
      if (id === "createdAt")  return cmp(a.__createdAtMs, b.__createdAtMs, order);
      return cmp(a[id], b[id], order);
    });
  }

  const total = rows.length;
  const off = Number(skip);
  const lim = Number(limit);
  const page = lim > 0 ? rows.slice(off, off + lim) : rows.slice();

  res.json({ rows: page, total });
});


// page of full txns (list but composed)
app.get("/workdesk/full", (req, res) => {
  let {
    q = "", limit = 30, skip = 0, sortBy, order = "asc",
    filters, status, trnSearch = "", hideAcr = "", savedFilter = "",
  } = req.query;

  let rows = ROWS.slice();

  const sinceMs = Number(req.query.sinceMs);
  const untilMs = Number(req.query.untilMs);
  if (Number.isFinite(sinceMs) || Number.isFinite(untilMs)) {
    rows = rows.filter((r) => {
      const ms = r.__receivedAtMs;
      if (Number.isFinite(sinceMs) && ms < sinceMs) return false;
      if (Number.isFinite(untilMs) && ms > untilMs) return false;
      return true;
    });
  }

  const statusStr = typeof status === "string" ? status.trim().toUpperCase() : "";
  if (statusStr && statusStr !== "ALL") {
    rows = rows.filter((r) => deriveStatus(r) === statusStr);
  }
  if (String(trnSearch).trim()) {
    const needle = String(trnSearch).toLowerCase();
    rows = rows.filter((r) => String(r.trn).toLowerCase().includes(needle));
  }
  if (String(hideAcr) === "true") rows = rows.filter((_, i) => i % 7 !== 0);
  if (String(savedFilter).toUpperCase() === "MKIP") rows = rows.filter((r) => /In-Progress/i.test(r.stage));
  else if (String(savedFilter).toUpperCase() === "LOCKED_ME") rows = rows.filter((_, i) => i % 5 === 0);

  rows = rows.filter((r) => matchesGlobal(r, q));
  rows = applyColumnFilters(rows, filters);

  if (sortBy) {
    const id = String(sortBy);
    rows = rows.slice().sort((a, b) => {
      if (id === "receivedAt") return cmp(a.__receivedAtMs, b.__receivedAtMs, order);
      if (id === "createdAt")  return cmp(a.__createdAtMs, b.__createdAtMs, order);
      return cmp(a[id], b[id], order);
    });
  }

  const total = rows.length;
  const off = Number(skip);
  const lim = Number(limit);
  const page = lim > 0 ? rows.slice(off, off + lim) : rows.slice();

  res.json({ rows: page.map(toPublicTxn), total });
});

// CRUD
// GET /workdesk/:id  (returns the base row; derived views available via /txn/id/:id)
app.get("/workdesk/:id", (req, res) => {
  const id = Number(req.params.id);
  const row = ROWS.find((r) => r.id === id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

// PATCH /workdesk/:id  (updates base fields only)
app.patch("/workdesk/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = ROWS.findIndex((r) => r.id === id);
  if (idx < 0) return res.status(404).json({ error: "Not found" });

  // Strip immutable fields so they can't be overwritten
  const {
    createdAt, __createdAtMs, // immutable
    ...rest
  } = req.body || {};

  ROWS[idx] = { ...ROWS[idx], ...rest, updatedAt: new Date().toISOString() };
  res.json(ROWS[idx]);
});

// POST /workdesk  (creates base + fresh nested sections from base)
app.post("/workdesk", (req, res) => {
  const id = ROWS.length ? ROWS[ROWS.length - 1].id + 1 : 1;
  const now = Date.now();

  const row = {
    id,
    arn: String(2_500_000 + id),
    bookingLocation: BANKS[id % BANKS.length],
    workflowStage: STAGES[id % STAGES.length],
    submissionMode: SUBMISSION[id % SUBMISSION.length],
    receivedAt: new Date(now).toISOString(),
    __receivedAtMs: now,
    createdAt: new Date(now).toISOString(),
    __createdAtMs: now,
    updatedAt: new Date(now).toISOString(),
    generatedBy: "System",

    trn: req.body?.trn ?? `SPBTR25RFC${String(3129 + id).padStart(6, "0")}`,
    customer: req.body?.customer ?? CUSTOMERS[id % CUSTOMERS.length],
    counterparty: CNTP[id % CNTP.length],
    product: PRODUCTS[id % PRODUCTS.length],
    step: "NEW001",
    subStep: "DRFF",
    lockedBy: String(1201231 + (id % 9999)),
    stage: STAGES[(id + 3) % STAGES.length],
    lli: tokenForIndex(id + 0),
    aml: tokenForIndex(id + 1),
    snc: tokenForIndex(id + 2),
    clbk: tokenForIndex(id + 3),
    cocoa: tokenForIndex(id + 4),
    tdOpsApproval: "NULL",
    customerRef: id % 11 === 0 ? "NG-Adaptor-IIF6" : "NG-STPAdaptor-EIF",
    regDate: new Date(now).toISOString().slice(0,10),
    relDate: new Date(now + 3600_000).toISOString().slice(0,10),
    segment: "ME",
    subSegment: "03",
    splitId: String(251 + (id % 9)),

    __generalOverrides: undefined,
    exceptions: undefined,
    sustainable: undefined,
    documents: undefined,
  };

  row.exceptions = buildExceptions(row);
  row.sustainable = buildSustainable(row);
  row.documents = buildDocuments(row);

  ROWS.push(row);
  res.status(201).json(row);
});

// GET /workdesk  (list alias of /workdesk/search)
app.get("/workdesk", (req, res) => {
  let {
    q = "",
    limit = 30,
    skip = 0,
    sortBy,
    order = "asc",
    filters,
    status,
    trnSearch = "",
    hideAcr = "",
    savedFilter = "",
  } = req.query;

  let rows = ROWS.slice();

  const sinceMs = Number(req.query.sinceMs);
  const untilMs = Number(req.query.untilMs);
  if (Number.isFinite(sinceMs) || Number.isFinite(untilMs)) {
    rows = rows.filter((r) => {
      const ms = r.__receivedAtMs;
      if (Number.isFinite(sinceMs) && ms < sinceMs) return false;
      if (Number.isFinite(untilMs) && ms > untilMs) return false;
      return true;
    });
  }

  const statusStr = typeof status === "string" ? status.trim().toUpperCase() : "";
  if (statusStr && statusStr !== "ALL") {
    rows = rows.filter((r) => deriveStatus(r) === statusStr);
  }
  if (String(trnSearch).trim()) {
    const needle = String(trnSearch).toLowerCase();
    rows = rows.filter((r) => String(r.trn).toLowerCase().includes(needle));
  }
  if (String(hideAcr) === "true") rows = rows.filter((_, i) => i % 7 !== 0);
  if (String(savedFilter).toUpperCase() === "MKIP") rows = rows.filter((r) => /In-Progress/i.test(r.stage));
  else if (String(savedFilter).toUpperCase() === "LOCKED_ME") rows = rows.filter((_, i) => i % 5 === 0);

  rows = rows.filter((r) => matchesGlobal(r, q));
  rows = applyColumnFilters(rows, filters);

  if (sortBy) {
    const id = String(sortBy);
    rows = rows.slice().sort((a, b) => {
      if (id === "receivedAt") return cmp(a.__receivedAtMs, b.__receivedAtMs, order);
      if (id === "createdAt")  return cmp(a.__createdAtMs, b.__createdAtMs, order);
      return cmp(a[id], b[id], order);
    });
  }

  const total = rows.length;
  const off = Number(skip);
  const lim = Number(limit);
  const page = lim > 0 ? rows.slice(off, off + lim) : rows.slice();

  res.json({ rows: page, total });
});

// DELETE /workdesk/:id
app.delete("/workdesk/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = ROWS.findIndex((r) => r.id === id);
  if (idx < 0) return res.status(404).json({ error: "Not found" });
  ROWS.splice(idx, 1);
  res.json({ ok: true });
});

// PATCH /workdesk/ack/booking-location
app.patch("/workdesk/ack/booking-location", (req, res) => {
  const { arn, bookingLocation } = req.body || {};
  if (!arn) return res.status(400).json({ error: "arn required" });

  const idx = ROWS.findIndex((r) => String(r.arn) === String(arn));
  if (idx < 0) return res.status(404).json({ error: "Not found" });

  ROWS[idx] = { ...ROWS[idx], bookingLocation };
  return res.json({ ok: true, row: ROWS[idx] });
});

// ---------- General mapping helpers (single writer) ----------
function pickOverrides(body) {
  const direct = new Set([
    "ackNumber", "submissionMode", "submissionBranch",
    "clientReference", "counterparty", "valueDate"
  ]);
  const out = {};
  for (const k of Object.keys(body || {})) {
    if (!direct.has(k)) out[k] = body[k];
  }
  return out;
}

function applyGeneralPatch(row, body = {}) {
  // ackNumber -> arn (string)
  if ("ackNumber" in body) row.arn = String(body.ackNumber ?? "");

  // submissionMode (label or code) -> row.submissionMode (code)
  if ("submissionMode" in body) {
    const given = String(body.submissionMode || "");
    row.submissionMode =
      SUBMISSION_CODE_BY_LABEL[given] || (SUBMISSION.includes(given) ? given : row.submissionMode);
  }

  // submissionBranch (code like SG01) -> bookingLocation (full name)
  if ("submissionBranch" in body) {
    const code = String(body.submissionBranch || "");
    row.bookingLocation = BOOK_NAME_BY_CODE[code] || row.bookingLocation;
  }

  // valueDate -> relDate
  if ("valueDate" in body) {
    row.relDate = String(body.valueDate || row.relDate);
  }

  // direct mappings
  if ("clientReference" in body) row.customerRef = String(body.clientReference ?? "");
  if ("counterparty" in body) row.counterparty = String(body.counterparty ?? "");

  // anything else goes into overrides
  row.__generalOverrides = { ...(row.__generalOverrides || {}), ...pickOverrides(body) };

  return buildGeneral(row, row.id);
}

// ---------- Txn Details (Header & General) ----------
app.get("/txn/:trn/header", (req, res) => {
  const row = findByTrn(req.params.trn);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(getDerived(row).header);
});
app.get("/txn/:trn/general", (req, res) => {
  const row = findByTrn(req.params.trn);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(getDerived(row).general);
});
app.get("/txn/id/:id/header", (req, res) => {
  const row = findById(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(getDerived(row).header);
});
app.get("/txn/id/:id/general", (req, res) => {
  const row = findById(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(getDerived(row).general);
});

// PATCH general (by TRN or by ID) — single writer
app.patch("/txn/:trn/general", (req, res) => {
  const row = findByTrn(req.params.trn);
  if (!row) return res.status(404).json({ error: "Not found" });
  const next = applyGeneralPatch(row, req.body);
  return res.json(next);
});
app.patch("/txn/id/:id/general", (req, res) => {
  const row = findById(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  const next = applyGeneralPatch(row, req.body);
  return res.json(next);
});

// ---------- Exceptions (read only; stored on row) ----------
app.get("/txn/:trn/exceptions", (req, res) => {
  const row = findByTrn(req.params.trn);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(paginateAndFilter(row.exceptions ?? [], req.query));
});
app.get("/txn/id/:id/exceptions", (req, res) => {
  const row = findById(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(paginateAndFilter(row.exceptions ?? [], req.query));
});

// ---------- Sustainable Finance (mutable; stored on row) ----------
app.get("/txn/:trn/sustainable", (req, res) => {
  const row = findByTrn(req.params.trn);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(getDerived(row).sustainable);
});
app.patch("/txn/:trn/sustainable", (req, res) => {
  const row = findByTrn(req.params.trn);
  if (!row) return res.status(404).json({ error: "Not found" });
  row.sustainable = { ...(row.sustainable ?? buildSustainable(row)), ...(req.body || {}) };
  return res.json(row.sustainable);
});
app.get("/txn/id/:id/sustainable", (req, res) => {
  const row = findById(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(getDerived(row).sustainable);
});
app.patch("/txn/id/:id/sustainable", (req, res) => {
  const row = findById(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  row.sustainable = { ...(row.sustainable ?? buildSustainable(row)), ...(req.body || {}) };
  return res.json(row.sustainable);
});

// ---------- Documents (mutable in future; currently stored once) ----------
app.get("/txn/:trn/documents", (req, res) => {
  const row = findByTrn(req.params.trn);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(getDerived(row).documents);
});
app.get("/txn/id/:id/documents", (req, res) => {
  const row = findById(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(getDerived(row).documents);
});

// ---------- Finances (derived on read) ----------
app.get("/txn/:trn/finances/request", (req, res) => {
  const row = findByTrn(req.params.trn);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(getDerived(row).finances.request);
});
app.get("/txn/:trn/finances/processed", (req, res) => {
  const row = findByTrn(req.params.trn);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(getDerived(row).finances.processed);
});
app.get("/txn/id/:id/finances/request", (req, res) => {
  const row = findById(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(getDerived(row).finances.request);
});
app.get("/txn/id/:id/finances/processed", (req, res) => {
  const row = findById(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  return res.json(getDerived(row).finances.processed);
});

// ---------- NEW aggregate "one call gets all" ----------
// one-shot full txn
app.get("/txn/:trn", (req, res) => {
  const row = findByTrn(req.params.trn);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(toPublicTxn(row));
});
app.get("/txn/id/:id", (req, res) => {
  const row = findById(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(toPublicTxn(row));
});

// ------------------ /api/ai/stream (OpenAI proxy) ------------------
app.post("/api/ai/stream", (req, res, next) => {
  const handler = createAIStreamHandler({
    plugin: workdeskPlugin,
    openaiApiKey: req.get("x-openai-key") || req.app?.locals?.devOpenAIKey || process.env.OPENAI_API_KEY,
    baseUrl: `http://localhost:${PORT}`,
    cacheTtlMs: 15_000,
  });
  return handler(req, res, next);
});

// Serve one-time download links (used by CSV/XLSX exports)
app.get("/__ai-download/:token", aiDownloadRoute);

// (Optional) nicer error for 413s
app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).send("Payload too large. Try a smaller file or compress it.");
  }
  next(err);
});

// ------------------ DEV storage ------------------
app.get("/api/dev/openai-key", (req, res) => {
  res.json({ key: req.app.locals.devOpenAIKey || "", hasKey: !!req.app.locals.devOpenAIKey });
});
app.put("/api/dev/openai-key", (req, res) => {
  req.app.locals.devOpenAIKey = typeof req.body?.key === "string" ? req.body.key : "";
  res.json({ ok: true, hasKey: !!req.app.locals.devOpenAIKey });
});

// Legacy minimal prefs (kept for back-compat)
app.get("/api/dev/openai-prefs", (req, res) => {
  const prefs = req.app.locals.devOpenAIPrefs || {};
  res.json({ ok: true, prefs, hasPrefs: Object.keys(prefs).length > 0 });
});
app.put("/api/dev/openai-prefs", (req, res) => {
  const b = req.body || {};
  const next = {};
  if (typeof b.baseUrl === "string" && b.baseUrl.trim()) next.baseUrl = b.baseUrl.trim();
  if (typeof b.model === "string" && b.model.trim()) next.model = b.model.trim();
  if (typeof b.stream === "boolean") next.stream = !!b.stream;
  req.app.locals.devOpenAIPrefs = next;
  res.json({ ok: true, prefs: next, hasPrefs: Object.keys(next).length > 0 });
});

// ------------------ NEW: full settings save/load ------------------
app.get("/api/dev/openai-settings", (req, res) => {
  const s = req.app.locals.devOpenAISettings || null;
  res.json({ ok: true, settings: s, hasSettings: !!s });
});

app.put("/api/dev/openai-settings", (req, res) => {
  // Save the entire settings blob (key/JWT NOT included)
  const allowed = [
    "baseUrl","useRawPath","rawPath","model","stream","includeTemperature","temperature",
    "payloadMode","parser","authMode","curlTarget","preferHttp1","timeoutMs","noTimeout"
  ];
  const body = req.body || {};
  const next = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, k)) next[k] = body[k];
  }
  req.app.locals.devOpenAISettings = next;
  res.json({ ok: true, settings: next, hasSettings: Object.keys(next).length > 0 });
});

// ------------------ Helpers ------------------
function joinUrl(base, p) {
  const left = (base || "").replace(/\/+$/, "");
  const right = (p || "/").replace(/^\/+/, "");
  return `${left}/${right}`;
}

// ------------------ /api/ai/openai (RAW passthrough) ------------------
app.post("/api/ai/openai", async (req, res) => {
  // Accept both X-OpenAI-Key and Authorization: Bearer
  const headerKey = req.get("x-openai-key") || "";
  const authz = req.get("authorization") || "";
  const bearer = authz.toLowerCase().startsWith("bearer ") ? authz.slice(7) : "";
  const apiKey = bearer || headerKey || req.app?.locals?.devOpenAIKey || process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(400).send("Missing key: send Authorization: Bearer <token> or X-OpenAI-Key.");

  const prefs = req.app.locals?.devOpenAIPrefs || {};
  const body = req.body || {};
  // Prefer request body; fallback to saved full settings; then legacy prefs; then defaults
  const saved = req.app.locals.devOpenAISettings || {};

  const model = body.model ?? saved.model ?? prefs.model ?? "gpt-4o-mini";
  const baseURL = body.baseUrl ?? saved.baseUrl ?? prefs.baseUrl ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const stream = Object.prototype.hasOwnProperty.call(body, "stream")
    ? !!body.stream
    : Object.prototype.hasOwnProperty.call(saved, "stream")
      ? !!saved.stream
      : (typeof prefs.stream === "boolean" ? !!prefs.stream : true);

  const temperature =
    typeof body.temperature === "number" ? body.temperature
    : (typeof saved.temperature === "number" ? saved.temperature : undefined);

  const messages = Array.isArray(body.messages) ? body.messages : undefined;
  const input = body.input != null ? String(body.input) : undefined;

  // If client sends a path, use it; else use saved path if 'useRawPath' true; else default
  const requestPath = typeof body.path === "string" && body.path.trim() ? body.path.trim() : null;
  const savedPath = saved.useRawPath && typeof saved.rawPath === "string" && saved.rawPath.trim() ? saved.rawPath.trim() : null;
  const path = requestPath || savedPath || "/chat/completions";

  const url = joinUrl(baseURL, path);

  // Corp proxy support (optional)
  const HTTPS_PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const dispatcher = HTTPS_PROXY ? new ProxyAgent(HTTPS_PROXY) : undefined;

  // Upstream request
  const upstreamHeaders = { "Content-Type": "application/json" };
  if (stream) upstreamHeaders["Accept"] = "text/event-stream";
  if (bearer) upstreamHeaders["Authorization"] = `Bearer ${bearer}`;
  else if (headerKey) upstreamHeaders["X-OpenAI-Key"] = headerKey;

  const upstreamBody = {
    model,
    ...(messages ? { messages } : input ? { input } : {}),
    ...(stream ? { stream: true } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
  };

  let upstreamResp;
  try {
    upstreamResp = await undiciFetch(url, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(upstreamBody),
      dispatcher,
    });
  } catch (e) {
    return res.status(502).json({ error: { name: e?.name, message: e?.message, code: e?.code } });
  }

  // Stream passthrough or JSON forward
  const ct = upstreamResp.headers.get("content-type") || "";
  if (stream && ct.includes("text/event-stream")) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    if (!upstreamResp.body) return res.end();

    const reader = upstreamResp.body.getReader();
    const dec = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      res.write(dec.decode(value)); // raw SSE passthrough
    }
    return res.end();
  }

  // Non-SSE: forward status + body
  const text = await upstreamResp.text();
  res.status(upstreamResp.status);
  res.setHeader("Content-Type", ct || "application/json");
  return res.send(text);
});

app.listen(PORT, () => {
  console.log(`Local API http://localhost:${PORT}  (delay ~${BASE_DELAY}ms ± ${JITTER}ms)`);
});
