import styled from "styled-components";
import { theme } from "../../../../styles/theme";

/** Fixed dock at the bottom; the Panel sits inside. */
export const Dock = styled.div<{ $bottomOffset?: number; $width?: number }>`
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: ${({ $bottomOffset }) => $bottomOffset}px;
  z-index: 9999;
  pointer-events: auto;
  border: 1px solid ${theme.colors.danger.base};
  border-radius: 2px;

  /* keep the panel constrained on very large screens */
  max-width: ${({ $width }) => $width}px;
  margin: 0 auto;

  .panel-header * {
    cursor: pointer;
  }

  /* Pulse the panel header (and the badge inside) when data-pulse=true */
  &[data-pulse="true"] .error-summary-panel .panel-header {
    position: relative;
    animation: es-pulse 1.2s ease-out 1;
  }
  &[data-pulse="true"] .error-summary-panel .panel-header .badge {
    animation: es-badge-pulse 1.2s ease-out 1;
  }

  @keyframes es-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(192, 57, 43, 0.45);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(192, 57, 43, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(192, 57, 43, 0);
    }
  }
  @keyframes es-badge-pulse {
    0% {
      transform: scale(1);
      filter: brightness(1);
    }
    50% {
      transform: scale(1.08);
      filter: brightness(1.05);
    }
    100% {
      transform: scale(1);
      filter: brightness(1);
    }
  }
`;

/**
 * Slide container for the table.
 * Auto-height: header is from Panel; content expands to up to 5 rows.
 */
export const ContentWrap = styled.div<{ $open: boolean; $rowCount: number }>`
  overflow: hidden;
  transition: max-height 0.25s ease;

  /* ~40px per row (body) + ~40px header row */
  max-height: ${({ $open, $rowCount }) =>
    $open ? `${40 * ($rowCount + 1)}px` : "0px"};

  /* subtle top border to separate from isSubHeader header */
  border-top: 1px solid ${theme.colors.lightB};
  background: white;
  > div {
    padding: 12px;
  }
`;
