import { memo, useMemo } from "react";
import styled, { keyframes } from "styled-components";

type SkeletonBodyProps = {
  rows: number;
  /** Pixel widths per visible column (from TanStack col.getSize()) */
  colSizes: number[];
  /** Match your data row height exactly */
  rowHeight?: number; // default 32
  /** Corner radius for bars */
  radius?: number; // default 6
};

export const SkeletonBody = memo(function SkeletonBody({
  rows,
  colSizes,
  rowHeight = 32,
  radius = 6,
}: SkeletonBodyProps) {
  const r = Math.max(1, rows | 0);
  const c = Math.max(1, colSizes.length | 0);

  const R = useMemo(() => Array.from({ length: r }), [r]);
  const template = useMemo(
    () => (c ? colSizes.map((w) => `${w}px`).join(" ") : "1fr"),
    [c, colSizes],
  );
  const minWidth = useMemo(
    () => (c ? colSizes.reduce((sum, n) => sum + n, 0) : 0),
    [c, colSizes],
  );

  return (
    <Wrap
      role="status"
      aria-live="polite"
      aria-label="Loading table"
      $minW={minWidth}
    >
      {R.map((_, ri) => (
        <SkelRow key={ri} $h={rowHeight} $template={template}>
          {Array.from({ length: c }).map((__, ci) => (
            <SkelCell key={ci}>
              <Bar $radius={radius} />
            </SkelCell>
          ))}
        </SkelRow>
      ))}
    </Wrap>
  );
});

// ---------- styles ----------

const shimmer = keyframes`
  0%   { transform: translateX(-60%); opacity: 0.6; }
  50%  { opacity: 1; }
  100% { transform: translateX(60%); opacity: 0.6; }
`;

const Wrap = styled.div<{ $minW: number }>`
  width: 100%;
  min-width: ${({ $minW }) => ($minW > 0 ? `${$minW}px` : "auto")};
  display: flex;
  flex-direction: column;
  background-color: #fefefe;
`;

const SkelRow = styled.div<{ $h: number; $template: string }>`
  display: grid;
  grid-template-columns: ${({ $template }) => $template};
  align-items: center;
  height: ${({ $h }) => `${$h}px`};
  border-bottom: 1px solid rgba(0, 0, 0, 0.06); /* match your row divider */
`;

const Bar = styled.div<{ $radius: number }>`
  height: 16px;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.06) 0%,
    rgba(0, 0, 0, 0.12) 50%,
    rgba(0, 0, 0, 0.06) 100%
  );
  position: relative;
  overflow: hidden;
  width: 100%;

  &:after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.35) 50%,
      transparent 100%
    );
    animation: ${shimmer} 1.1s infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &:after {
      animation: none;
    }
  }
`;

const SkelCell = styled.div`
  padding: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  border-right: 1px solid #e1e1e1;
  height: 31px;
`;
