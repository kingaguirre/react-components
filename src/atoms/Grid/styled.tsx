// styled.tsx
import styled, { css } from "styled-components";

const pct = (span?: number) =>
  typeof span === "number" && span > 0
    ? `${((span / 12) * 100).toFixed(6)}%`
    : undefined;

/**
 * Each item width accounts for internal gutters so that:
 * sum(item widths) + sum(gaps between items) = 100%
 * when spans in a row add up to 12.
 *
 * width = col * span + gap * (span - 1)
 * where col = (100% - 11*gap) / 12
 */
const widthRule = (span?: number) => {
  if (!(typeof span === "number" && span > 0)) return "";
  const s = span; // stable reference in template string
  return css`
    width: calc(var(--col) * ${s} + var(--gap) * ${s - 1});
    flex-basis: calc(var(--col) * ${s} + var(--gap) * ${s - 1});
    max-width: calc(var(--col) * ${s} + var(--gap) * ${s - 1});
  `;
};

export const GridWrapper = styled.div`
  box-sizing: border-box;
  && {
    display: block;
  }
`;

export const StyledGrid = styled.div<{ spacing: number }>`
  /* ↑↑ Double ampersand = higher specificity (beats Tailwind .grid) */
  && {
    display: flex;
    flex-wrap: wrap;

    /* modern spacing */
    --gap: ${(p) => p.spacing}px;
    /* 12 columns, 11 gutters across the full row */
    --col: calc((100% - (11 * var(--gap))) / 12);
    gap: var(--gap);

    /* Defuse any stray grid props if someone slaps class="grid" on it */
    grid-template-columns: initial;
    grid-auto-rows: initial;
  }

  box-sizing: border-box;
  /* Removed negative margins and child padding — gap handles it now */
`;

export const StyledGridItem = styled.div<{
  $xs?: number;
  $sm?: number;
  $md?: number;
  $lg?: number;
  $xl?: number;
  $offset?: number;
  $order?: number;
}>`
  flex: 0 0 auto;
  box-sizing: border-box;
  min-width: 0;

  /* Keep offset semantics the same as before (pure column width) */
  ${({ $offset }) =>
    typeof $offset === "number" &&
    $offset > 0 &&
    css`
      margin-left: ${pct($offset)};
    `}

  /* Flex order still supported */
  ${({ $order }) =>
    typeof $order === "number" &&
    css`
      order: ${$order};
    `}

  /* XS (base) */
  ${({ $xs }) => widthRule($xs)}

  @media (min-width: 576px) {
    ${({ $sm }) => widthRule($sm)}
  }
  @media (min-width: 768px) {
    ${({ $md }) => widthRule($md)}
  }
  @media (min-width: 992px) {
    ${({ $lg }) => widthRule($lg)}
  }
  @media (min-width: 1200px) {
    ${({ $xl }) => widthRule($xl)}
  }
`;
