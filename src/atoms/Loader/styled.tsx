// src/components/Loader/styled.tsx
import styled, { keyframes, css } from 'styled-components';
import { ColorType } from '../../common/interface';
import { theme, fadeInOnMount } from 'src/styles';

/** ─── LINE ──────────────────────────────────────────────────────────────── */
const slide = keyframes`
  0%   { transform: translateX(-150%); }
  100% { transform: translateX(200%); }
`;

const lineStyle = (color: ColorType = 'primary') => css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${theme.colors[color].base};
  z-index: 0;
  transition: all 0.3s ease;
`;

export const LineContainer = styled.div<{
  $color?: ColorType;
  $isInline?: boolean;
}>`
  ${fadeInOnMount}
  overflow: hidden;
  width: 100%;
  height: 4px;
  pointer-events: none;

  ${({ $isInline }) =>
    $isInline
      ? css`
          position: relative;
        `
      : css`
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1001;
        `}
`;

export const LineTrack = styled.div<{
  $color?: ColorType;
}>`
  ${({ $color = 'primary' }) => lineStyle($color)}
  opacity: 0.1;
`;

export const LineBuffer = styled.div<{
  $color?: ColorType;
  $value?: number;
}>`
  ${({ $color = 'primary' }) => lineStyle($color)}
  opacity: 0.4;
  z-index: 1;
  width: ${({ $value = 0 }) => `${$value}%`};
`;

export const Line = styled.div<{
  $color?: ColorType;
  $value?: number;
}>`
  ${({ $color = 'primary' }) => lineStyle($color)}
  z-index: 2;

  ${({ $value }) =>
    typeof $value === 'number'
      ? css`
          width: ${$value}%;
        `
      : css`
          width: 50%;
          animation: ${slide} 1s ease-in-out infinite;
        `}
`;

/** ─── CIRCLE ────────────────────────────────────────────────────────────── */
const spin = keyframes`
  0%   { transform: rotate(-90deg); }
  100% { transform: rotate(270deg); }
`;

const dash = keyframes`
  0%   { stroke-dasharray: 1px,200px; stroke-dashoffset: 0; }
  50%  { stroke-dasharray:100px,200px; stroke-dashoffset:-15px; }
  100% { stroke-dasharray:1px,200px; stroke-dashoffset:-125px; }
`;

export const CircleSvg = styled.svg<{
  $spin?: boolean;
}>`
  ${fadeInOnMount}
  display: inline-block;
  transform-origin: 50% 50%;
  background: transparent;
  fill: none;
  transform: rotate(-90deg);
  pointer-events: none;

  ${({ $spin }) =>
    $spin &&
    css`
      animation: ${spin} 2s linear infinite;
    `}
`;

export const CircleTrack = styled.circle<{
  $color?: ColorType;
  $indeterminate?: boolean
}>`
  ${({ $indeterminate, $color = 'primary' }) => $indeterminate ? css`
    stroke: ${theme.colors[$color].pale};
  ` : css`
    stroke: ${theme.colors[$color].base};
    opacity: 0.1;
  `}
  fill: none;
`;

export const CircleBuffer = styled.circle<{
  $color?: ColorType;
}>`
  stroke: ${({ $color = 'primary' }) => theme.colors[$color].base};
  opacity: 0.4;
  fill: none;
  transition: stroke-dasharray 0.3s ease;
`;

export const CircleProgress = styled.circle<{
  $color?: ColorType;
}>`
  stroke: ${({ $color = 'primary' }) => theme.colors[$color].base};
  transition: stroke-dasharray 0.35s ease;
  fill: none;

  &.indeterminate {
    animation: ${dash} 1.5s ease-in-out infinite;
  }
`;

export const Overlay = styled.div`
  ${fadeInOnMount}
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;