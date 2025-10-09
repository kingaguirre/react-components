/* Screen-aware UI adapter (no JSON in user output by default)
 * - Reads a UI form/table context (via getFormContext() or context.form)
 * - Answers "where am I / which module", fields list, validation, columns list, and preview rows
 * - Defers dataset analytics (compare/ranges/topN/oldest/latest) to the Data Reader adapter
 * - Hides internal JSON unless user explicitly asks to see it (e.g., "as json", "raw", "dump")
 */

type Msg = { role: "system"; content: string };
type AugmentArgs = { text?: string; messages?: any[]; context?: any };
type UIAdapter = { augment: (args: AugmentArgs) => Promise<Msg[] | []> };

type MakeUiScreenAdapterOpts = {
  getFormContext?: () => Promise<any> | any;
};

export function makeUiScreenAdapter(
  opts: MakeUiScreenAdapterOpts = {},
): UIAdapter {
  const getFormContext = opts.getFormContext;

  /* ----------------------------- small utils ----------------------------- */
  const isObj = (v: any) => v && typeof v === "object" && !Array.isArray(v);
  const lastSeg = (p: any) =>
    String(p || "")
      .split(".")
      .filter(Boolean)
      .slice(-1)[0] || String(p || "");

  const pathTokens = (path: any) => {
    const out: any[] = [];
    const re = /([^[.\]]+)|\[(\d+)\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(String(path))) !== null) out.push(m[1] ?? Number(m[2]));
    return out;
  };
  const getDeep = (obj: any, path: any) => {
    try {
      return pathTokens(path).reduce(
        (acc, k) => (acc == null ? undefined : acc[k]),
        obj,
      );
    } catch {
      return undefined;
    }
  };
  const isEmpty = (v: any) =>
    v === null ||
    v === undefined ||
    (typeof v === "string" && v.trim() === "") ||
    (Array.isArray(v) && v.length === 0);

  const firstString = (...vals: any[]) =>
    vals.find((v) => typeof v === "string" && v.trim())?.trim();

  /* ------------------------- zod signature “parser” ------------------------- */
  function parseZodHints(sig: any) {
    const s = typeof sig === "string" ? sig : "";
    const H: any = {
      type: null,
      required: null,
      min: null,
      max: null,
      length: null,
      email: false,
      uuid: false,
      url: false,
      regex: null,
    };
    if (!s) return H;
    const has = (re: RegExp) => re.test(s);
    const num = (re: RegExp) => {
      const m = s.match(re);
      return m ? Number(m[1]) : null;
    };

    if (has(/\.string\(\)/)) H.type = "string";
    else if (has(/\.number\(\)/)) H.type = "number";
    else if (has(/\.boolean\(\)/)) H.type = "boolean";
    else if (has(/\.date\(\)/)) H.type = "date";
    else if (has(/\.array\(\)/)) H.type = "array";
    else if (has(/\.object\(\)/)) H.type = "object";

    H.email = has(/\.email\(\)/);
    H.uuid = has(/\.uuid\(\)/);
    H.url = has(/\.url\(\)/);

    H.min = num(/\.min\(\s*(\d+)\s*\)/);
    H.max = num(/\.max\(\s*(\d+)\s*\)/);
    H.length = num(/\.length\(\s*(\d+)\s*\)/);

    const rx = s.match(/\.regex\(\s*\/([^/]+)\/([gimuy]*)\s*\)/);
    if (rx) {
      try {
        H.regex = new RegExp(rx[1], rx[2] || "");
      } catch {}
    }

    if (has(/\.required\(\)/)) H.required = true;
    if (has(/\.optional\(\)/) && H.required == null) H.required = false;
    if (has(/\.nonempty\(\)/)) H.required = true;
    if (
      H.required == null &&
      (H.min > 0 || H.length > 0 || H.email || H.uuid || H.url)
    )
      H.required = true;
    return H;
  }

  /* ----------------------- Form settings flatteners ----------------------- */
  function typeFromFieldType(ft: any) {
    const t = String(ft || "").toLowerCase();
    if (t === "number") return "number";
    if (t === "date") return "date";
    if (t === "switch" || t === "checkbox") return "boolean";
    if (t.includes("group")) return "array";
    if (t === "select" || t === "dropdown" || t === "radio") return "string";
    return "string";
  }
  function optionValue(o: any) {
    if (!isObj(o)) return o;
    if ("value" in o) return (o as any).value;
    if ("text" in o) return (o as any).text;
    if ("label" in o) return (o as any).label;
    return o;
  }

  function flattenSettings(
    items: any[],
    acc: any[] = [],
    scopeHeader: string | null = null,
  ): any[] {
    if (!Array.isArray(items)) return acc;
    for (const it of items) {
      if (!isObj(it)) continue;
      if ("dataTable" in it) continue; // skip embedded table sections

      const hasFields =
        isObj(it) && "fields" in it && Array.isArray((it as any).fields);
      const hasTabs =
        isObj(it) && "tabs" in it && Array.isArray((it as any).tabs);
      const hasAccordion =
        isObj(it) && "accordion" in it && Array.isArray((it as any).accordion);
      const header =
        typeof (it as any).header === "string" ? (it as any).header : null;

      if (hasFields || hasTabs || hasAccordion) {
        const withinScope = !(scopeHeader && header && header !== scopeHeader);

        if (hasFields && withinScope)
          flattenSettings(
            (it as any).fields,
            acc,
            scopeHeader || header || null,
          );
        if (hasTabs && withinScope) {
          for (const tab of (it as any).tabs) {
            if (isObj(tab) && Array.isArray((tab as any).fields))
              flattenSettings(
                (tab as any).fields,
                acc,
                scopeHeader || header || null,
              );
          }
        }
        if (hasAccordion && withinScope) {
          for (const sec of (it as any).accordion) {
            if (isObj(sec) && Array.isArray((sec as any).fields))
              flattenSettings(
                (sec as any).fields,
                acc,
                scopeHeader || header || null,
              );
          }
        }
        continue;
      }

      if (typeof (it as any).name === "string" && (it as any).name.trim()) {
        const validationSig =
          typeof (it as any).validationSig === "string"
            ? (it as any).validationSig
            : undefined;
        acc.push({
          name: (it as any).name,
          label: (it as any).label || lastSeg((it as any).name),
          type: typeFromFieldType((it as any).type),
          options: Array.isArray((it as any).options)
            ? (it as any).options.map(optionValue)
            : undefined,
          validationSig,
        });
      }
    }
    return acc;
  }

  /* ------------------------ Table (column) helpers ------------------------ */
  function normalizeColumns(cols: any[]) {
    if (!Array.isArray(cols)) return [];
    const nameKeys = [
      "column",
      "field",
      "accessorKey",
      "accessor",
      "dataIndex",
      "key",
      "id",
      "name",
    ];
    const titleKeys = ["title", "header", "label", "text"];

    const pick = (obj: any, keys: string[]) => {
      for (const k of keys) {
        let v = obj?.[k];
        if (Array.isArray(v)) v = v.join(".");
        if (typeof v === "string" && v.trim()) return v.trim();
      }
      return null;
    };

    const out: any[] = [];
    for (const c of cols) {
      if (!isObj(c)) continue;
      const col = pick(c, nameKeys);
      const title = pick(c, titleKeys) || (col ? lastSeg(col) : null);
      if (col) out.push({ column: col, title: title || lastSeg(col) });
    }
    return out;
  }

  function coerceToNumber(x: any) {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }

  function tableCounts(values: any, normColumns: any[]) {
    const rows =
      (Array.isArray(values?.rows) && values.rows) ||
      (Array.isArray(values?.data) && values.data) ||
      (Array.isArray(values?.items) && values.items) ||
      (Array.isArray(values?.records) && values.records) ||
      (Array.isArray(values?.list) && values.list) ||
      (Array.isArray(values) ? values : []);

    const totalRaw = values?.total;
    const moreTotals = [
      values?.pagination?.total,
      values?.page?.total,
      values?.meta?.total,
    ];

    let rowCount: number | null = null;
    if (typeof totalRaw === "number") {
      rowCount = coerceToNumber(totalRaw);
    } else if (typeof totalRaw === "string") {
      const candidates = [
        values?.[totalRaw],
        values?.meta?.[totalRaw],
        values?.stats?.[totalRaw],
        values?.pagination?.[totalRaw],
        values?.page?.[totalRaw],
      ];
      for (const c of candidates) {
        const num = coerceToNumber(c);
        if (num != null) {
          rowCount = num;
          break;
        }
      }
    }
    if (rowCount == null) {
      for (const t of moreTotals) {
        const num = coerceToNumber(t);
        if (num != null) {
          rowCount = num;
          break;
        }
      }
    }
    if (rowCount == null) rowCount = rows.length;

    const colCount = normColumns.length;
    return { rows, rowCount, colCount };
  }

  function makeColumnsTable(normColumns: any[]) {
    return {
      columns: ["Column", "Title"],
      rows: normColumns.map((c) => [c.column, c.title]),
    };
  }

  function makePreviewTable(
    rows: any[],
    normColumns: any[],
    limitRows = 10,
    limitCols = 6,
  ) {
    const useCols = normColumns.slice(0, limitCols);
    const header = useCols.map((c) => c.title || c.column);
    const data = (rows || []).slice(0, limitRows).map((r) => {
      return useCols.map((c) => {
        const v = r?.[c.column];
        if (v == null) return "";
        if (typeof v === "string") return v;
        if (Array.isArray(v) || isObj(v)) return JSON.stringify(v);
        return String(v);
      });
    });
    return { columns: header, rows: data };
  }

  /* --------------------- Normalization & evaluation --------------------- */
  function parseZodField(fs: any) {
    const hints = parseZodHints(fs.validationSig);
    const enumVals = Array.isArray(fs.options) ? fs.options : undefined;

    return {
      name: String(fs.name),
      label: fs.label || lastSeg(fs.name),
      type: fs.type || hints.type || null,
      required: hints.required === true,
      min: hints.min,
      max: hints.max,
      length: hints.length,
      email: !!hints.email,
      uuid: !!hints.uuid,
      url: !!hints.url,
      pattern: hints.regex || null,
      enum: enumVals,
    };
  }
  function ruleSummary(spec: any) {
    const bits: string[] = [];
    if (spec.required) bits.push("required");
    if (spec.type) bits.push(`type=${spec.type}`);
    if (spec.email) bits.push("email");
    if (spec.uuid) bits.push("uuid");
    if (spec.url) bits.push("url");
    if (spec.length != null) bits.push(`length=${spec.length}`);
    if (spec.min != null) bits.push(`min=${spec.min}`);
    if (spec.max != null) bits.push(`max=${spec.max}`);
    if (spec.pattern)
      bits.push(`regex=/${spec.pattern.source}/${spec.pattern.flags || ""}`);
    if (Array.isArray(spec.enum) && spec.enum.length)
      bits.push(`enum=[${spec.enum.join(", ")}]`);
    return bits.join(", ") || "—";
  }

  function validateValue(v: any, spec: any) {
    const issues: any[] = [];
    if (spec.required && isEmpty(v)) {
      issues.push({ kind: "missing", detail: "Required value is empty" });
      return issues;
    }
    if (isEmpty(v)) return issues;

    if (spec.type) {
      const t = Array.isArray(v)
        ? "array"
        : v instanceof Date
          ? "date"
          : typeof v;
      if (spec.type === "date") {
        const ok =
          (v instanceof Date && !isNaN(v.getTime())) ||
          (typeof v === "string" && !isNaN(Date.parse(v)));
        if (!ok) issues.push({ kind: "type", detail: "Expected a date" });
      } else if (t !== spec.type) {
        issues.push({
          kind: "type",
          detail: `Expected ${spec.type}, got ${t}`,
        });
      }
    }
    if (typeof v === "string") {
      if (spec.length != null && v.length !== spec.length)
        issues.push({
          kind: "length",
          detail: `Length must be ${spec.length}`,
        });
      else {
        if (spec.min != null && v.length < spec.min)
          issues.push({ kind: "min", detail: `Min length is ${spec.min}` });
        if (spec.max != null && v.length > spec.max)
          issues.push({ kind: "max", detail: `Max length is ${spec.max}` });
      }
      if (spec.pattern && !spec.pattern.test(v))
        issues.push({
          kind: "pattern",
          detail: `Does not match ${String(spec.pattern)}`,
        });
      if (spec.email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(v))
          issues.push({ kind: "email", detail: "Invalid email" });
      }
      if (spec.uuid) {
        const re =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!re.test(v)) issues.push({ kind: "uuid", detail: "Invalid UUID" });
      }
      if (spec.url) {
        try {
          new URL(v);
        } catch {
          issues.push({ kind: "url", detail: "Invalid URL" });
        }
      }
    }
    if (Array.isArray(spec.enum) && spec.enum.length) {
      const ok = spec.enum.some((ev: any) => (ev?.value ?? ev) === v);
      if (!ok)
        issues.push({
          kind: "enum",
          detail: `Allowed: ${spec.enum.map((x: any) => x?.value ?? x).join(", ")}`,
        });
    }
    return issues;
  }

  function evaluateFormOrTable(form: any, ctx: any) {
    const moduleName =
      firstString(
        form?.currentModule,
        form?.module,
        form?.current_module,
        form?.moduleName,
        form?.meta?.currentModule,
        ctx?.currentModule,
        ctx?.module,
        ctx?.meta?.currentModule,
        ctx?.form?.currentModule,
        ctx?.form?.module,
      ) || "Unknown Module";

    const description =
      firstString(
        form?.description,
        form?.meta?.description,
        ctx?.description,
        ctx?.form?.description,
      ) || "";

    const screen = String(form?.currentScreen || "Unknown");

    const hasFieldSettings =
      Array.isArray(form?.fieldSettings) && form.fieldSettings.length > 0;
    const hasColumnSettings =
      Array.isArray(form?.columnSettings) && form.columnSettings.length > 0;

    if (hasFieldSettings) {
      const values = isObj(form?.data)
        ? form.data
        : isObj(form?.values)
          ? form.values
          : {};

      let flat = flattenSettings(form.fieldSettings || [], [], screen);
      const scopeMatched = flat.length > 0;
      if (!flat.length)
        flat = flattenSettings(form.fieldSettings || [], [], null);

      const specs = flat.map(parseZodField);

      const problems: any[] = [];
      for (const s of specs) {
        const v = getDeep(values, s.name);
        const errs = validateValue(v, s);
        if (errs.length) {
          problems.push({
            path: s.name,
            label: s.label,
            valuePreview:
              typeof v === "string"
                ? v.length > 60
                  ? v.slice(0, 57) + "…"
                  : v
                : v,
            issues: errs,
          });
        }
      }

      const empties = specs
        .filter((s: any) => isEmpty(getDeep(values, s.name)))
        .map((s: any) => [s.label || lastSeg(s.name), s.name]);
      const emptiesTable = { columns: ["Field", "Path"], rows: empties };

      const counts = {
        missing: problems.filter((p) =>
          p.issues.some((i: any) => i.kind === "missing"),
        ).length,
        invalid: problems.filter((p) =>
          p.issues.some((i: any) => i.kind !== "missing"),
        ).length,
        total: problems.length,
        requiredFields: specs.filter((s: any) => s.required).length,
        emptyValues: empties.length,
      };

      const fieldsTable = {
        columns: ["Field", "Path", "Type", "Required"],
        rows: specs.map((s: any) => [
          s.label,
          s.name,
          s.type || "unknown",
          s.required ? "Yes" : "No",
        ]),
      };
      const fieldsWithRulesTable = {
        columns: ["Field", "Path", "Type", "Required", "Rules"],
        rows: specs.map((s: any) => [
          s.label,
          s.name,
          s.type || "unknown",
          s.required ? "Yes" : "No",
          ruleSummary(s),
        ]),
      };
      const dataTable = {
        columns: ["Field", "Path", "Value"],
        rows: specs.map((s: any) => {
          const v = getDeep(values, s.name);
          const show = (vv: any) =>
            vv == null
              ? ""
              : typeof vv === "string"
                ? vv
                : Array.isArray(vv)
                  ? JSON.stringify(vv)
                  : typeof vv === "object"
                    ? JSON.stringify(vv)
                    : String(vv);
          return [s.label, s.name, show(v)];
        }),
      };
      const issuesTable = {
        columns: ["Field", "Problem", "Detail", "Value"],
        rows: problems.flatMap((p) =>
          p.issues.map((i: any) => [
            p.label || lastSeg(p.path),
            i.kind.toUpperCase(),
            i.detail,
            String(p.valuePreview ?? ""),
          ]),
        ),
      };
      const requiredList = specs
        .filter((s: any) => s.required)
        .map((s: any) => [s.label || lastSeg(s.name), s.name]);

      return {
        mode: "form",
        module: moduleName,
        screen,
        description,
        scopeMatched,
        counts,
        fieldsCount: specs.length,
        requiredList,
        fieldsTable,
        fieldsWithRulesTable,
        dataTable,
        issuesTable,
        emptiesTable,
      };
    }

    if (hasColumnSettings) {
      const columnsNorm = normalizeColumns(form.columnSettings);
      const { rows, rowCount, colCount } = tableCounts(
        form?.values,
        columnsNorm,
      );
      const columnsTable = makeColumnsTable(columnsNorm);
      const previewTable = makePreviewTable(rows, columnsNorm, 10, 6);

      return {
        mode: "table",
        module: moduleName,
        screen,
        description,
        columns: columnsNorm,
        colCount,
        rowCount,
        columnsTable,
        previewTable,
      };
    }

    return {
      mode: "unknown",
      module: moduleName,
      screen,
      description,
    };
  }

  /* -------------------------- intent detectors -------------------------- */
  const wantsScreen = (q = "") =>
    /\b(where am i|what screen|current screen|which screen)\b/i.test(q);
  const wantsModule = (q = "") =>
    /\b(current\s+module|which\s+module|what\s+module)\b/i.test(q);
  const wantsCompare = (q = "") =>
    /\b(compare|diff(?:erence)?|what'?s new|what changed|changes?)\b/i.test(q);
  const wantsAnalyze = (q = "") =>
    !wantsCompare(q) &&
    /\b(analy[sz]e|validate|validation|what'?s missing|missing fields?|invalid|errors?)\b/i.test(
      q,
    );

  const wantsRequired = (q = "") =>
    /\b(required fields?|which fields are required|list required)\b/i.test(q);

  // dataset analytics intents → let Data Reader handle these.
  const wantsOldest = (q = "") =>
    /\b(oldest|earliest|first)\b/.test(q) &&
    /\b(transactions?|txns?|rows?|records?)\b/i.test(q);

  const wantsLatest = (q = "") =>
    /\b(latest|newest|most\s+recent|last)\b/i.test(q) &&
    /\b(transactions?|txns?|rows?|records?)\b/i.test(q);

  const wantsColumns = (q = "") =>
    /\b(list|show|view|what)\b.*\b(columns?)\b/i.test(q) ||
    /\b(what\s+columns?)\b/i.test(q);

  const wantsPreview = (q = "") =>
    /\b(show|view|see|print|sample|preview|show data|show table)\b/i.test(q) &&
    /\b(rows?|data|table)\b/i.test(q);

  const wantsFieldsList = (q = "") =>
    /\b(show|see|list|view)\b.*\bfields?\b/i.test(q) ||
    /\b(what\s+fields?\s+(?:do\s+we\s+)?have)\b/i.test(q) ||
    /\b(general\s+details\s+fields?)\b/i.test(q) ||
    /\b(what\s+are\s+the\s+(?:general\s+details\s+)?fields?)\b/i.test(q);

  const wantsFieldsWithValidation = (q = "") =>
    /\b(fields?).*(validation|rules|constraints)\b/i.test(q) ||
    /\b(validation|rules|constraints)\b.*\b(fields?)\b/i.test(q) ||
    /\b(fields?\s+with\s+validation)\b/i.test(q);

  const wantsFormData = (q = "") =>
    /\b(show|see|view|print|dump|display)\b.*\b(data|values?|form|general details)\b/i.test(
      q,
    ) || /\b(general\s+details\s+data|current\s+values?)\b/i.test(q);

  // NEW: raw-json detector (if user asks to see JSON explicitly)
  const wantsRawJson = (q = "") =>
    /\b(as\s+json|raw\s+json|raw\s+data|json\s+please|dump|debug\s+json)\b/i.test(
      q,
    );

  /* ------------- helpers to keep JSON hidden from user output ------------- */
  function sysHideJsonAndRenderTable(
    title: string,
    headers: string[],
    token: string,
    dataObj: any,
  ): Msg[] {
    return [
      {
        role: "system",
        content:
          `**${title}**\n` +
          `Render a compact table with headers: ${headers.join(" | ")} using ${token}.\n` +
          `Output only the heading and the table; do NOT include any JSON, code fences, or backticks in your reply.`,
      },
      {
        role: "system",
        content: `${token}:\n${JSON.stringify(dataObj)}`, // internal payload; not to be shown
      },
    ];
  }

  function sysShowJsonVerbatim(
    title: string,
    dataObj: any,
  ): Msg[] {
    return [
      {
        role: "system",
        content:
          `**${title} (raw JSON)**\n` +
          `Return ONLY the following JSON, formatted in a single \`\`\`json\`\`\` block:\n` +
          `\`\`\`json\n${JSON.stringify(dataObj, null, 2)}\n\`\`\``,
      },
    ];
  }

  /* ------------------------------ adapter ------------------------------ */
  return {
    augment: async ({ text, context }: AugmentArgs) => {
      const q = String(text || "")
        .trim()
        .toLowerCase();

      // Defer these to the Data Reader adapter
      if (wantsCompare(q) || wantsLatest(q) || wantsOldest(q)) return [];

      // Acquire form/table context
      let rawForm = context?.form;
      if (!rawForm && typeof getFormContext === "function") {
        try {
          rawForm = await getFormContext();
        } catch {}
      }

      const isObjForm =
        isObj(rawForm) &&
        ((Array.isArray(rawForm?.fieldSettings) &&
          rawForm.fieldSettings.length > 0) ||
          (Array.isArray(rawForm?.columnSettings) &&
            rawForm.columnSettings.length > 0));

      // ---------- NO-FORM FALLBACK ----------
      if (!isObjForm) {
        if (wantsScreen(q) || wantsModule(q)) {
          const mod = firstString(
            context?.currentModule,
            context?.form?.currentModule,
          );
          const scr = firstString(
            context?.currentScreen,
            context?.form?.currentScreen,
          );

          if (!mod || !scr) {
            const msg = `I don't have your current screen context yet.
To set it, open a module via the side menu or press **Alt + .** to launch the module/screen switcher.

What I can do next:
- Help with generic analytics (e.g., "status mix this month")
- Export or summarize historical data
- Validate form/table once you connect this chat to your UI context`;
            return [
              {
                role: "system",
                content: `Return exactly the following Markdown (verbatim):\n\n${msg}`,
              },
            ];
          }

          const msg = `You are currently in **${mod}** module and currently viewing **${scr}**.

What I can do next:
- List columns or preview rows (once table context is connected)
- Validate fields (once form context is connected)
- Summarize or export data`;
          return [
            {
              role: "system",
              content: `Return exactly the following Markdown (verbatim):\n\n${msg}`,
            },
          ];
        }

        // No screen context → let Data Reader handle dataset questions
        return [];
      }

      // ---------- FORM/TABLE INTENTS ----------
      const evalRes: any = evaluateFormOrTable(rawForm, context);
      const title = `${evalRes.module} / ${evalRes.screen}`;

      // where am i / which module — description + stats + fallback tip
      if (wantsScreen(q) || wantsModule(q)) {
        const bulletsForm =
          `- Validate this\n` +
          `- Which fields are required?\n` +
          `- Show empty fields\n` +
          `- Show form data`;

        const bulletsTable =
          `- List columns\n` +
          `- Preview first 10 rows\n` +
          `- Summarize columns`;

        const descPart = evalRes.description
          ? ` ${evalRes.description.trim()}`
          : "";

        let statsPart = "";
        if (evalRes.mode === "table") {
          statsPart = ` This view contains a table with **${evalRes.colCount} columns** and **${evalRes.rowCount} rows**.`;
        } else if (evalRes.mode === "form") {
          statsPart = ` This screen has **${evalRes.fieldsCount} fields** (${evalRes.counts.requiredFields} required).`;
        }

        const isUnknown =
          evalRes.module === "Unknown Module" || evalRes.screen === "Unknown";
        const tip = isUnknown
          ? `\n\nTip: Press **Alt + .** to open the module/screen switcher.`
          : "";

        const finalText =
          `You are currently in **${evalRes.module}** module and currently viewing **${evalRes.screen}**.` +
          `${descPart}${statsPart}\n\n` +
          `What I can do next:\n${evalRes.mode === "table" ? bulletsTable : bulletsForm}` +
          tip;

        return [
          {
            role: "system",
            content: `Return exactly the following Markdown as the full answer (verbatim):\n\n${finalText}`,
          },
        ];
      }

      /* ---------- FORM MODE paths ---------- */
      if (evalRes.mode === "form") {
        if (wantsFieldsWithValidation(q)) {
          if (wantsRawJson(q)) {
            return sysShowJsonVerbatim(
              `Fields & Validation — ${title}`,
              evalRes.fieldsWithRulesTable,
            );
          }
          const note = evalRes.scopeMatched
            ? ""
            : ` (Note: No section titled "${evalRes.screen}" found; showing all fields.)`;
          return sysHideJsonAndRenderTable(
            `Fields & Validation — ${title}${note}`,
            evalRes.fieldsWithRulesTable.columns,
            "FIELDS_RULES_JSON",
            evalRes.fieldsWithRulesTable,
          );
        }

        if (wantsFieldsList(q)) {
          if (wantsRawJson(q)) {
            return sysShowJsonVerbatim(
              `Fields — ${title}`,
              evalRes.fieldsTable,
            );
          }
          const note = evalRes.scopeMatched
            ? ""
            : ` (Note: No section titled "${evalRes.screen}" found; showing all fields.)`;
          return sysHideJsonAndRenderTable(
            `Fields — ${title}${note}`,
            evalRes.fieldsTable.columns,
            "FIELDS_JSON",
            evalRes.fieldsTable,
          );
        }

        if (wantsFormData(q)) {
          if (wantsRawJson(q)) {
            return sysShowJsonVerbatim(
              `${title} — Current Values`,
              evalRes.dataTable,
            );
          }
          const note = evalRes.scopeMatched
            ? ""
            : ` (Note: No section titled "${evalRes.screen}" found; showing all fields.)`;
          return sysHideJsonAndRenderTable(
            `${title} — Current Values${note}`,
            evalRes.dataTable.columns,
            "DATA_JSON",
            evalRes.dataTable,
          );
        }

        if (wantsRequired(q)) {
          if (!evalRes.requiredList.length) {
            return [
              {
                role: "system",
                content: `No required fields are defined for ${title}.`,
              },
            ];
          }
          if (wantsRawJson(q)) {
            return sysShowJsonVerbatim(
              `Required Fields — ${title}`,
              evalRes.requiredList,
            );
          }
          return sysHideJsonAndRenderTable(
            `Required Fields — ${title}`,
            ["Field", "Path"],
            "REQUIRED_JSON",
            evalRes.requiredList,
          );
        }

        if (wantsAnalyze(q)) {
          if (wantsRawJson(q)) {
            return sysShowJsonVerbatim(
              `Validation Issues — ${title}`,
              evalRes.issuesTable,
            );
          }
          const firstLine = `**${title}** — Missing: ${evalRes.counts.missing}, Invalid: ${evalRes.counts.invalid}`;
          if (evalRes.issuesTable.rows.length) {
            // heading first line + table
            return [
              {
                role: "system",
                content: `${firstLine}\nRender a compact table with headers: ${evalRes.issuesTable.columns.join(" | ")} using FORM_ISSUES_JSON.\nOutput only the heading and the table; do NOT include any JSON, code fences, or backticks.`,
              },
              {
                role: "system",
                content: `FORM_ISSUES_JSON:\n${JSON.stringify(evalRes.issuesTable)}`,
              },
            ];
          }
          return [
            {
              role: "system",
              content: `${firstLine}\nAll checks passed. Ready to submit.`,
            },
          ];
        }

        // No form-specific intent → let Data Reader handle dataset Qs
        return [];
      }

      /* ---------- TABLE MODE paths ---------- */
      if (evalRes.mode === "table") {
        if (wantsColumns(q)) {
          if (wantsRawJson(q)) {
            return sysShowJsonVerbatim(
              `Columns — ${title}`,
              evalRes.columnsTable,
            );
          }
          return sysHideJsonAndRenderTable(
            `Columns — ${title}`,
            evalRes.columnsTable.columns,
            "COLUMNS_JSON",
            evalRes.columnsTable,
          );
        }

        if (wantsPreview(q)) {
          if (wantsRawJson(q)) {
            return sysShowJsonVerbatim(
              `Preview Rows (up to 10) — ${title}`,
              evalRes.previewTable,
            );
          }
          return sysHideJsonAndRenderTable(
            `Preview Rows (up to 10) — ${title}`,
            evalRes.previewTable.columns,
            "PREVIEW_JSON",
            evalRes.previewTable,
          );
        }

        // No table-specific intent → let Data Reader handle analytics questions
        return [];
      }

      // Unknown mode → let Data Reader handle
      return [];
    },
  };
}
