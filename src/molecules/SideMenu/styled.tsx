import styled, { keyframes } from "styled-components";

// theme-aware helpers (fallback to CSS var if theme not present)
const primaryBase = (p: any) =>
  p.theme?.colors?.primary?.base || "var(--color-primary)";
const transition = "all .2s ease";

// ensure TitleContainer is declared BEFORE MenuItem (your requirement)
export const TitleContainer = styled.div`
  display: flex;
  height: 30px;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 0 16px;
  position: relative;
  z-index: 1;
`;

export const Wrap = styled.div<{ $width?: string }>`
  display: inline-block;
  width: 100%;
  max-width: ${({ $width }) => $width || "190px"};
  --neutral: var(--color-neutral);
  --neutral-light: var(--color-neutral-light);
  --neutral-darker: var(--color-neutral-darker);

  &[data-disabled] {
    opacity: 0.5;
    pointer-events: none;
  }
`;

export const MenuContainer = styled.div`
  animation: fadeIn 0.2s ease both;
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export const MenuItem = styled.div`
  transition: ${transition};
  font-weight: normal;
  border-bottom: 1px solid #d8d8d8;

  &:hover {
    .tx-title-text {
      color: ${primaryBase};
    }
    cursor: pointer;
  }

  &.active {
    background-color: #e8f9ff;
    color: ${primaryBase};

    ${TitleContainer} {
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.16);
      font-weight: bold;
    }

    .tx-title-text {
      color: ${primaryBase};
    }
  }

  /* rotate arrow whenever this row is expanded, controlled by data-expanded */
  &[data-expanded] .tx-arrow {
    transform: translateY(-50%) rotate(90deg);
    transition: transform 0.2s ease;
  }

  &[data-disabled] {
    opacity: 0.4;
    ${TitleContainer} {
      cursor: default;
      pointer-events: none;
    }
    .tx-title-text {
      color: var(--neutral);
    }
  }
`;

export const TitleText = styled.div<{ $color?: string }>`
  font-size: 14px;
  position: relative;
  color: ${({ $color }) => $color || "var(--neutral-darker)"};
  width: 100%;
  transition: ${transition};
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  &.has-child {
    padding-left: 18px;
  }

  .tx-title-span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: inline-block;
    max-width: 100%;
  }
`;

export const ArrowContainer = styled.div`
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 8px;
  width: 8px;
  font-size: 8px;
  transition: transform 0.2s ease;
`;

export const InfoContainer = styled.span<{ $color?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  height: 30px;
  margin: 0 -3px 0 6px;
  color: ${({ $color }) => $color || "var(--neutral)"};
  transition: ${transition};
  > * {
    margin: 0 3px;
  }
`;

// icon + badge on a single row
export const TitleInfo = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: ${transition};
`;

const expandIn = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const ChildContainer = styled.div`
  background-color: #f9fcfd;
  overflow: hidden;
  padding-left: 20px;
  padding-right: 15px;

  /* Key to smooth animation: use a CSS var for the target height */
  --target-h: 0px;
  max-height: var(--target-h);

  transition:
    max-height 0.2s ease,
    opacity 0.2s ease;
  will-change: max-height, opacity;
  box-shadow: inset 0 0 #bcbec0;
  opacity: 0;
  pointer-events: none;

  &[data-expanded] {
    opacity: 1;
    pointer-events: auto;

    > div {
      animation: ${expandIn} 0.2s ease both;
    }
  }
`;

export const ChildRow = styled.div`
  font-size: 12px;
  color: ${primaryBase};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  padding-left: 25px;
  transition: ${transition};

  &[data-disabled] {
    cursor: default;
    pointer-events: none;
    opacity: 0.4;
    color: var(--neutral);
  }

  &:not(:last-child) {
    border-bottom: 1px solid var(--neutral-light);
  }

  .tx-child-title {
    white-space: nowrap;
    overflow: hidden;
    transition: ${transition};
  }
  .tx-child-title-inner {
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .tx-badge-wrap {
    font-weight: bold;
    font-size: 12px;
    color: var(--neutral);
    text-overflow: ellipsis;
  }

  &.active {
    font-weight: bold;
  }
`;

export const NoDataContainer = styled.div`
  padding: 10px 15px;
  background-color: rgb(249, 252, 253);
  border: 1px dashed var(--neutral-light);
`;
