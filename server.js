// server.js  (ESM)
// Run: npm i express cors && node server.js
// Env knobs:
//   DELAY_MS=400           // base delay in ms (default 400)
//   DELAY_JITTER=200       // +/- jitter in ms (default 200)
//   PORT=4000              // server port
//
// You can also override per request with ?__delay=800

import express from "express";
import cors from "cors";

const PORT = Number(process.env.PORT ?? 4000);
const BASE_DELAY = Number.isFinite(Number(process.env.DELAY_MS))
  ? Number(process.env.DELAY_MS)
  : 400;
const JITTER = Number.isFinite(Number(process.env.DELAY_JITTER))
  ? Number(process.env.DELAY_JITTER)
  : 200;

const app = express();
app.use(cors());

// ------------------ delay middleware ------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

app.use(async (req, _res, next) => {
  // keep /health snappy
  if (req.path === "/health") return next();

  // allow per-request override via ?__delay=NNN
  const qd = Number(req.query.__delay);
  const override = Number.isFinite(qd) ? Math.max(0, qd) : null;

  // base +/- jitter (uniform)
  const rnd = Math.floor(Math.random() * (JITTER * 2 + 1)) - JITTER; // [-JITTER, +JITTER]
  const delay = override ?? Math.max(0, BASE_DELAY + rnd);

  if (delay > 0) await sleep(delay);
  next();
});

// ------------------ data generation (1,000 rows) ------------------

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(1337);

const BRANDS = [
  "Acme","Nova","Atlas","Zenith","Lumina",
  "Nimbus","Vertex","Solace","Polaris","Aether",
];
const CATEGORIES = [
  "beauty","furniture","groceries","electronics",
  "home","sports","outdoors","toys",
];

const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const price = () => Math.floor(5 + rand() * 995);          // 5..999
const rating = () => Math.round((1 + rand() * 4) * 10) / 10; // 1.0..5.0

const PRODUCTS = Array.from({ length: 1000 }, (_, i) => {
  const id = i + 1;
  const brand = pick(BRANDS);
  const category = pick(CATEGORIES);
  const title = `Product ${id} — ${brand} ${category}`;
  return { id, title, brand, category, price: price(), rating: rating() };
});

// ------------------ helpers ------------------

function applySelect(rows, selectCsv) {
  if (!selectCsv) return rows;
  const allow = new Set(
    String(selectCsv)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  return rows.map((r) => {
    const o = {};
    for (const k of Object.keys(r)) if (allow.has(k)) o[k] = r[k];
    return o;
  });
}

function cmp(a, b, order) {
  const dir = order === "desc" ? -1 : 1;
  if (a == null && b == null) return 0;
  if (a == null) return -1 * dir;
  if (b == null) return 1 * dir;
  if (typeof a === "number" && typeof b === "number") return (a - b) * dir;
  return String(a).localeCompare(String(b)) * dir;
}

function matchesQuery(p, q) {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    String(p.title).toLowerCase().includes(s) ||
    String(p.brand).toLowerCase().includes(s) ||
    String(p.category).toLowerCase().includes(s)
  );
}

// ------------------ routes ------------------

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// GET /products?limit=0&select=...
app.get("/products", (req, res) => {
  const { limit, skip, select } = req.query;
  let rows = PRODUCTS.slice();

  const lim = Number(limit ?? 30);
  const off = Number(skip ?? 0);
  if (lim > 0) rows = rows.slice(off, off + lim);
  if (select) rows = applySelect(rows, select);

  res.json({ products: rows, total: PRODUCTS.length });
});

// GET /products/search?q=&limit=&skip=&sortBy=&order=&select=
app.get("/products/search", (req, res) => {
  const {
    q = "",
    limit = 30,
    skip = 0,
    sortBy,
    order = "asc",
    select,
  } = req.query;

  let filtered = PRODUCTS.filter((p) => matchesQuery(p, q));
  if (sortBy) filtered = filtered.slice().sort((a, b) => cmp(a[sortBy], b[sortBy], order));

  const off = Number(skip);
  const lim = Number(limit);
  const page = lim > 0 ? filtered.slice(off, off + lim) : filtered.slice();

  const out = select ? applySelect(page, select) : page;
  res.json({ products: out, total: filtered.length });
});

app.listen(PORT, () => {
  console.log(
    `Local API listening on http://localhost:${PORT} (delay ~${BASE_DELAY}ms ± ${JITTER}ms; override with ?__delay=NNN)`
  );
});
