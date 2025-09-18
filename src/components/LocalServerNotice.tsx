import * as React from "react";
import styled from "styled-components";

/** Single source of truth for your local API */
export const API_BASE = "http://localhost:4000";

export interface LocalServerNoticeProps {
  /** Short heading (defaults to “Local API not detected”) */
  title?: React.ReactNode;
  /** Brief guidance/instruction; you can include <code>…</code> */
  description?: React.ReactNode;
  /** Tighter paddings/font-size */
  compact?: boolean;
  /** Show a one-liner about latency env vars (?__delay, DELAY_MS, DELAY_JITTER) */
  showLatencyTip?: boolean;
  /** Override the API base if you’re not on :4000 */
  apiBaseOverride?: string;
  className?: string;
}

/** Health probe: true | false | null (probing) */
function useServerAlive(apiBase: string) {
  const [alive, setAlive] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1200);

    (async () => {
      try {
        const res = await fetch(`${apiBase}/health`, { signal: ctrl.signal });
        setAlive(res.ok);
      } catch {
        setAlive(false);
      } finally {
        clearTimeout(t);
      }
    })();

    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [apiBase]);

  return alive;
}

/* ============================== styles ============================== */

const BORDER = "#F9C2C2";
const BG = "linear-gradient(180deg,#FFF5F5 0%, #FFEFEF 100%)";
const RED = "#b91c1c"; // main text
const CODE_BG = "#FFF7D6"; // code chip background (amber)
const CODE_BORDER = "#F2D27A"; // code chip border
const CODE_TEXT = "#4A3B00"; // code chip text

const Box = styled.div<{ $compact?: boolean }>`
  border: 1px solid ${BORDER};
  background: ${BG};
  color: ${RED};
  padding: ${({ $compact }) => ($compact ? "8px" : "10px")};
  border-radius: 4px;
  margin: ${({ $compact }) => ($compact ? "8px 0" : "10px 0")};
  font-size: ${({ $compact }) => ($compact ? "12.5px" : "13px")};
  line-height: 1.45;

  a {
    color: ${RED};
    text-decoration: underline;
  }
  strong {
    color: ${RED};
    font-weight: 700;
  }

  code {
    background: ${CODE_BG};
    color: ${CODE_TEXT};
    border: 1px solid ${CODE_BORDER};
    border-radius: 4px;
    padding: 0 4px;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    font-size: 0.92em;
  }
`;

const Title = styled.div`
  font-weight: 800;
  margin-bottom: 4px;
`;

/* ============================== component ============================== */

export const LocalServerNotice: React.FC<LocalServerNoticeProps> = ({
  title = "Local API not detected",
  description,
  compact,
  showLatencyTip = false,
  apiBaseOverride,
  className,
}) => {
  const base = apiBaseOverride ?? API_BASE;
  const alive = useServerAlive(base);

  // Only render when offline; render nothing when reachable
  if (alive !== false) return null;

  return (
    <Box $compact={compact} className={className}>
      <Title>{title}</Title>
      <div>
        {description ?? (
          <>
            Run <code>node server.js</code> at your project root ({base}). Keep
            it running while using these stories.
          </>
        )}
      </div>

      {showLatencyTip && (
        <div style={{ marginTop: 6 }}>
          <strong>Latency:</strong> endpoints use a small artificial delay.
          Adjust with <code>DELAY_MS</code>/<code>DELAY_JITTER</code> or per
          request
          <code>?__delay=800</code>. <code>/health</code> is instant.
        </div>
      )}
    </Box>
  );
};
