import styled, { css } from "styled-components";

const getWidth = (span: number | undefined) => {
  if (!span) return;
  const width = (span / 12) * 100;
  return `${width}%`;
};

export const StyledGrid = styled.div<{ spacing: number }>`
  display: flex;
  flex-wrap: wrap;
  margin: -${(props) => props.spacing / 2}px;
  box-sizing: border-box;

  & > * {
    padding: ${(props) => props.spacing / 2}px;
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

  ${({ $offset: offset }) =>
    offset &&
    css`
      margin-left: ${(offset / 12) * 100}%;
    `}

  ${({ $order: order }) =>
    order &&
    css`
      order: ${order};
    `}

  ${({ $xs: xs }) =>
    xs &&
    css`
      width: ${getWidth(xs)};
    `}
  @media (min-width: 576px) {
    ${({ $sm: sm }) =>
      sm &&
      css`
        width: ${getWidth(sm)};
      `}
  }
  @media (min-width: 768px) {
    ${({ $md: md }) =>
      md &&
      css`
        width: ${getWidth(md)};
      `}
  }
  @media (min-width: 992px) {
    ${({ $lg: lg }) =>
      lg &&
      css`
        width: ${getWidth(lg)};
      `}
  }
  @media (min-width: 1200px) {
    ${({ $xl: xl }) =>
      xl &&
      css`
        width: ${getWidth(xl)};
      `}
  }
`;
