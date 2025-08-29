import React, { useRef, useState } from "react";
import styled from "styled-components";
import ImportWorker from "../../../workers/xlsxImportWorker?worker";
import { RightIconButton } from "../RightIconButton";
import { theme } from "src/styles";
import { Modal } from "src/organisms/Modal";
import { Alert } from "src/molecules/Alert";
import { Button } from "src/atoms/Button";

export type UploadControls = {
  title?: string;
  onOpen?: () => void;
  onUpload?: (file: File) => void;
  onUploading?: (busy: boolean) => void;
  onImport?: (rows: Array<Record<string, any>>) => void;
  onComplete?: (meta: { importedCount: number }) => void;
  onError?: (err: any) => void;
};

export interface UploadIconButtonProps {
  controls?: UploadControls;
  disabled?: boolean;
  getVisibleNonBuiltInColumns: () => Array<{ id: string; headerText: string }>;
}

/* animated swap */
const SwapRoot = styled.div<{ $disabled?: boolean }>`
  position: relative;
  width: 38px;
  height: 38px;
  background: ${({ $disabled }) =>
    !!$disabled ? theme.colors.default.pale : theme.colors.lightA};
  border-radius: 2px;
`;
const Slot = styled.div<{ $visible: boolean }>`
  position: absolute; inset: 0;
  display: inline-flex; align-items: center; justify-content: center;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transform: scale(${(p) => (p.$visible ? "1" : "0")});
  transition: all .24s ease;
  pointer-events: ${(p) => (p.$visible ? "auto" : "none")};
  @media (prefers-reduced-motion: reduce) { transition: none; }
`;
const SpinnerIconShell = styled.div`
  display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px;
`;
const Spinner = styled.span`
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid ${theme.colors.default.light};
  border-top-color: ${theme.colors.primary.base};
  border-left-color: ${theme.colors.primary.base};
  display: inline-block;
  animation: dt-spin 0.7s linear infinite;
  @keyframes dt-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

/* modal content bits (radius = 2px everywhere) */
const ReviewWrap = styled.div`
  display: grid;
  gap: 12px;
`;

/* NEW: single-line grid */
const Grid = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
`;
const GridItem = styled.div`
  min-width: 0;
`;

const StatCard = styled.div<{ $warn?: boolean }>`
  background: ${(p) =>
    p.$warn
      ? ((theme as any).colors?.warning?.pale || "#FFF7E6")
      : theme.colors.lightA};
  border: 1px solid
    ${(p) =>
      p.$warn
        ? ((theme as any).colors?.warning?.base || "#F59E0B")
        : theme.colors.default.pale};
  border-radius: 2px;
  padding: 10px;
  display: grid;
  gap: 2px;
  small { color: ${theme.colors.default.dark}; }
  strong { font-size: 16px; }
`;

const TagList = styled.div`
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;
`;
const Tag = styled.span`
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid ${theme.colors.default.pale};
  background: ${theme.colors.lightB};
  padding: 4px 8px; border-radius: 2px; font-size: 12px;
`;
const Actions = styled.div`
  display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px;
`;

export const UploadIconButton: React.FC<UploadIconButtonProps> = ({
  controls,
  disabled,
  getVisibleNonBuiltInColumns,
}) => {
  const cfg = React.useMemo<Required<UploadControls>>(
    () => ({
      title: controls?.title ?? "Upload CSV/XLSX",
      onOpen: controls?.onOpen ?? (() => {}),
      onUpload: controls?.onUpload ?? (() => {}),
      onUploading: controls?.onUploading ?? (() => {}),
      onImport:
        controls?.onImport ??
        ((rows) => {
          console.warn("[UploadIconButton] onImport not provided; parsed rows are ignored.", rows.length);
        }),
      onComplete: controls?.onComplete ?? (() => {}),
      onError: controls?.onError ?? (() => {}),
    }),
    [controls],
  );

  const fileRef = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);
  const aliveRef = React.useRef(true);

  // guard to ignore any late worker messages after user dismissed
  const closingRef = React.useRef(false);

  // separate open flag from data to avoid content disappearing during close animation
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewData, setReviewData] = useState<null | {
    totalRows: number;
    importableRows: number;
    ignoredEmptyRows: number;
    unmatchedHeaders: string[];
    alignedAll: Record<string, any>[];
  }>(null);

  React.useEffect(() => () => { aliveRef.current = false; }, []);

  const setBusy = React.useCallback((b: boolean) => {
    if (!aliveRef.current) return;
    setWorking(b);
    cfg.onUploading?.(b);
  }, [cfg]);

  const acceptAttr =
    ".csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx,.xls";

  const openPicker = () => {
    if (working || disabled || reviewOpen) return;
    cfg.onOpen();
    fileRef.current?.click();
  };

  const alignChunk = (raw: Record<string, any>[]) => {
    const cols = getVisibleNonBuiltInColumns();
    return raw.map((r) => {
      const out: Record<string, any> = {};
      cols.forEach(({ id, headerText }) => {
        const val = Object.prototype.hasOwnProperty.call(r, headerText)
          ? r[headerText]
          : Object.prototype.hasOwnProperty.call(r, id)
          ? r[id]
          : "";
        out[id] = Array.isArray(val)
          ? val.map((x) => (x == null ? "" : String(x))).join(",")
          : val ?? "";
      });
      return out;
    });
  };

  const getUnmatchedHeaders = React.useCallback(
    (sampleKeys: string[]) => {
      const cols = getVisibleNonBuiltInColumns();
      const accepted = new Set<string>();
      cols.forEach(({ id, headerText }) => {
        accepted.add(id);
        accepted.add(headerText);
      });
      return sampleKeys.filter((k) => !accepted.has(k));
    },
    [getVisibleNonBuiltInColumns],
  );

  const handleFile = async (file: File) => {
    if (!file) return;

    // new run; allow messages again
    closingRef.current = false;

    setBusy(true);

    try {
      cfg.onUpload?.(file);

      const lower = (file.name || "").toLowerCase();
      const isCSV = lower.endsWith(".csv") || file.type.includes("text/csv");

      let payload:
        | { kind: "csv"; text: string; chunkSize: number }
        | { kind: "xlsx"; buffer: ArrayBuffer; chunkSize: number };

      if (isCSV) {
        const text = await file.text();
        payload = { kind: "csv", text, chunkSize: 500 } as const;
      } else {
        const buffer = await file.arrayBuffer();
        payload = { kind: "xlsx", buffer, chunkSize: 500 } as const;
      }

      const worker = new ImportWorker();
      let terminated = false;
      const safeTerminate = () => {
        if (!terminated) {
          worker.terminate();
          terminated = true;
        }
      };

      const alignedAll: Record<string, any>[] = [];
      let ignoredEmptyRows = 0;
      let unmatchedHeaders: string[] = [];

      worker.onmessage = (ev: MessageEvent<any>) => {
        // if user already dismissed, stop processing and kill the worker
        if (closingRef.current) { safeTerminate(); return; }

        const msg = ev.data;

        if (msg?.type === "chunk") {
          const rawChunk: Record<string, any>[] = msg.chunk || [];
          if (unmatchedHeaders.length === 0 && rawChunk.length > 0) {
            const headerUnion = Array.from(
              new Set(rawChunk.flatMap((r) => Object.keys(r || {}))),
            );
            unmatchedHeaders = getUnmatchedHeaders(headerUnion);
          }

          const aligned = alignChunk(rawChunk);
          for (const row of aligned) {
            const values = Object.values(row);
            const allEmpty = values.every((v) => v === "" || v == null);
            if (allEmpty) ignoredEmptyRows++;
          }
          alignedAll.push(...aligned);
          return;
        }

        if (msg?.type === "done") {
          safeTerminate();

          if (closingRef.current) return;

          const totalRows = alignedAll.length;
          const importableRows = Math.max(0, totalRows - ignoredEmptyRows);
          const hasIssues = unmatchedHeaders.length > 0 || ignoredEmptyRows > 0;

          if (!hasIssues) {
            if (importableRows > 0) cfg.onImport?.(alignedAll);
            setBusy(false);
            cfg.onComplete?.({ importedCount: importableRows });
            return;
          }

          // keep busy, show review (don’t drop data until closed)
          setReviewData({
            totalRows,
            importableRows,
            ignoredEmptyRows,
            unmatchedHeaders,
            alignedAll,
          });
          setReviewOpen(true);
          return;
        }

        if (msg?.type === "error") {
          safeTerminate();
          if (closingRef.current) return;
          console.error("[UploadIconButton] import error:", msg);
          setBusy(false);
          cfg.onError?.(msg.error ?? msg.message ?? msg);
          return;
        }
      };

      worker.onerror = (err) => {
        safeTerminate();
        if (closingRef.current) return;
        setBusy(false);
        cfg.onError?.(err);
      };

      if (payload.kind === "xlsx") worker.postMessage(payload, [payload.buffer]);
      else worker.postMessage(payload);
    } catch (err) {
      setBusy(false);
      cfg.onError?.(err);
    }
  };

  /** modal actions — keep content until onClosed fires */
  const handleProceedImport = () => {
    if (!reviewData) return;
    const importable = reviewData.alignedAll.filter((row) =>
      Object.values(row).some((v) => v !== "" && v != null),
    );
    if (importable.length) cfg.onImport?.(importable);

    // user chose to close — ignore any late worker messages
    closingRef.current = true;

    setReviewOpen(false); // trigger close animation first
    // setBusy(false) in onClosed to avoid visible jump
  };

  const handleCancelImport = () => {
    // user chose to close — ignore any late worker messages
    closingRef.current = true;

    setReviewOpen(false); // animate close
    // setBusy(false) in onClosed
  };

  const handleModalClosed = () => {
    // now safe to clear data & spinner without content jump
    setReviewData(null);
    setBusy(false);
    // allow future runs to post messages again
    closingRef.current = false;
  };

  const triggerDisabled = disabled || working || reviewOpen;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <input
        ref={fileRef}
        type="file"
        accept={acceptAttr}
        style={{ display: "none" }}
        data-testid="upload-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          // clear so same file can be selected again
          e.currentTarget.value = "";
        }}
      />
      <SwapRoot aria-label={cfg.title} $disabled={triggerDisabled}>
        <Slot $visible={!working}>
          <RightIconButton
            icon="file_upload"
            title={cfg.title}
            onClick={openPicker}
            disabled={triggerDisabled}
            testId="upload-icon"
          />
        </Slot>
        <Slot $visible={working}>
          <SpinnerIconShell title={cfg.title} aria-disabled="true">
            <Spinner />
          </SpinnerIconShell>
        </Slot>
      </SwapRoot>

      {/* Review Modal — keep data mounted; only toggle `show` */}
      <Modal
        show={!!reviewData && reviewOpen}
        closeable={false}
        showCloseIcon={false}
        color="warning"
        title="Import review"
        leftIcon={{ icon: "info" }}
        onClose={handleCancelImport}
        onClosed={handleModalClosed}
        modalWidth="md"
        zIndex={1100}
      >
        {reviewData && (
          <ReviewWrap>
            {/* ONE-LINE STATS */}
            <Grid>
              <GridItem>
                <StatCard>
                  <small>Total rows</small>
                  <strong>{reviewData.totalRows}</strong>
                </StatCard>
              </GridItem>
              <GridItem>
                <StatCard>
                  <small>Will import</small>
                  <strong>{reviewData.importableRows}</strong>
                </StatCard>
              </GridItem>
              <GridItem>
                <StatCard $warn={reviewData.ignoredEmptyRows > 0}>
                  <small>Ignored (empty)</small>
                  <strong>{reviewData.ignoredEmptyRows}</strong>
                </StatCard>
              </GridItem>
            </Grid>

            {reviewData.unmatchedHeaders.length > 0 && (
              <Alert color="warning" icon="warning" title="Some headers don’t match">
                <div style={{ fontSize: 12, color: theme.colors.default.dark }}>
                  The following columns exist in the file but don’t match any visible column
                  <em> (matched by ID or Header)</em>. Their values will be ignored.
                  <TagList>
                    {reviewData.unmatchedHeaders.map((h) => (
                      <Tag key={h}>{h}</Tag>
                    ))}
                  </TagList>
                </div>
              </Alert>
            )}

            {/* WARNING (no info alert) */}
            {reviewData.ignoredEmptyRows > 0 && (
              <Alert color="warning" icon="warning" title="Empty rows will be ignored">
                <div style={{ fontSize: 12, color: theme.colors.default.dark }}>
                  {reviewData.ignoredEmptyRows} row{reviewData.ignoredEmptyRows === 1 ? "" : "s"} mapped to empty values across all visible columns and will be skipped.
                </div>
              </Alert>
            )}

            <Actions>
              <Button size="sm" color="default" onClick={handleCancelImport}>
                Cancel
              </Button>
              <Button testId="upload-confirm-button" size="sm" color="warning" onClick={handleProceedImport}>
                Proceed import
              </Button>
            </Actions>
          </ReviewWrap>
        )}
      </Modal>
    </div>
  );
};
