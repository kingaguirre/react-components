/** Build the compact payload the server expects. */
export function buildFormContextForAI(params: {
  currentModule?: string;
  currentScreen?: string;
  description?: string;
  values?: any;
  data?: Record<string, any>;
  fieldSettings?: any[]; // optional
  columnSettings?: any[]; // optional
}) {
  const {
    currentModule,
    currentScreen,
    description,
    values,
    data,
    fieldSettings,
    columnSettings,
  } = params;

  const serialize = (items: any[] | undefined): any[] | undefined => {
    if (!Array.isArray(items) || items.length === 0) return undefined;
    return items.map((it) => {
      if (!it || typeof it !== "object") return it;

      // Nested groups
      if (
        Array.isArray(it.fields) ||
        Array.isArray(it.tabs) ||
        Array.isArray(it.accordion) ||
        it.dataTable
      ) {
        return {
          ...it,
          fields: Array.isArray(it.fields) ? serialize(it.fields) : undefined,
          tabs: Array.isArray(it.tabs)
            ? it.tabs.map((t: any) => ({
                ...t,
                fields: serialize(t.fields || []),
              }))
            : undefined,
          accordion: Array.isArray(it.accordion)
            ? it.accordion.map((a: any) => ({
                ...a,
                fields: serialize(a.fields || []),
              }))
            : undefined,
          dataTable: it.dataTable || undefined,
        };
      }

      // Leaf field
      const { validation, ...rest } = it;
      let validationSig: string | undefined;
      if (typeof validation === "function") {
        try {
          validationSig = String(validation);
        } catch {}
      } else if (typeof validation === "string") {
        validationSig = validation;
      }

      return {
        ...rest,
        type: rest.type === "select" ? "dropdown" : rest.type,
        validationSig,
      };
    });
  };

  // --- tiny hash + shape signature for server scoping ---
  const tinyHash = (s: string) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  };

  const deriveShapeSig = (opts: {
    module?: string;
    screen?: string;
    fs?: any[] | undefined;
    cols?: any[] | undefined;
  }) => {
    const { module, screen, fs, cols } = opts;
    const fieldNames = Array.isArray(fs)
      ? fs.map((f: any) => f?.name ?? "").join("|")
      : "";
    const colKeys = Array.isArray(cols)
      ? cols
          .map(
            (c: any) =>
              c?.column ??
              c?.field ??
              c?.accessorKey ??
              c?.accessor ??
              c?.dataIndex ??
              c?.key ??
              c?.id ??
              c?.name ??
              "",
          )
          .join("|")
      : "";
    return tinyHash(
      [module || "", screen || "", fieldNames, colKeys].join("~"),
    );
  };

  const out: any = {
    currentModule,
    currentScreen,
    description,
    // support both shapes; server will read either
    values: values ?? data ?? {},
    data: data ?? values ?? {},
  };

  const fs = serialize(fieldSettings);
  if (fs && fs.length) out.fieldSettings = fs;

  if (Array.isArray(columnSettings) && columnSettings.length > 0) {
    out.columnSettings = columnSettings;
  }

  // attach shape signature for server-side scoping
  out.shapeSig = deriveShapeSig({
    module: currentModule,
    screen: currentScreen,
    fs,
    cols: columnSettings,
  });

  return out;
}
