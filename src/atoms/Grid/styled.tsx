import styled, { css } from "styled-components";

const pct = (span?: number) =>
  typeof span === "number" && span > 0 ? `${((span / 12) * 100).toFixed(6)}%` : undefined;

const widthRule = (span?: number) => {
  const p = pct(span);
  if (!p) return "";
  return css`
    width: ${p};
    flex-basis: ${p};
    max-width: ${p};
  `;
};

export const StyledGrid = styled.div<{ spacing: number }>`
  /* ↑↑ Double ampersand = higher specificity (beats Tailwind .grid) */
  && {
    display: flex;
    flex-wrap: wrap;

    /* Defuse any stray grid props if someone slaps class="grid" on it */
    grid-template-columns: initial;
    grid-auto-rows: initial;
  }

  margin: -${(p) => p.spacing / 2}px;
  box-sizing: border-box;

  & > * {
    padding: ${(p) => p.spacing / 2}px;
  }
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

  ${({ $offset }) =>
    typeof $offset === "number" && $offset > 0 &&
    css`
      margin-left: ${pct($offset)};
    `}

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
