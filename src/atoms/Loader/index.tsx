// src/components/Loader/index.tsx
import * as React from 'react';
import { useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import type { LoaderProps } from './interface';
import {
  Line,
  LineBuffer,
  LineTrack,
  LineContainer,
  CircleSvg,
  CircleTrack,
  CircleBuffer as CircleBufferCircle,
  CircleProgress,
  Overlay,
} from './styled';

const SIZE_MAP: Record<string, number> = {
  xs: 14,
  sm: 24,
  md: 36,
  lg: 45,
  xl: 55,
};

const DEFAULT_THICKNESS = 3.6;
const THICKNESS_MAP: Record<string, number> = {
  xs: 2,
  sm: 3,
  md: 4,
  lg: 5,
  xl: 6,
};

export const Loader: React.FC<LoaderProps> = ({
  type = 'default',
  appendTo,
  value,
  valueBuffer,
  size = 'sm',
  thickness,
  color,
  className,
  label
}) => {
  const [parent, setParent] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (appendTo) {
      const target = appendTo === 'body'
        ? document.body
        : document.querySelector<HTMLElement>(appendTo);
      setParent(target);
    }
  }, [appendTo]);

  // ─── LINE ────────────────────────────────────────────────────────────────
  if (type === 'line') {
    const LineLoader = (
      <LineContainer className={className} $isInline={!appendTo || (!!appendTo && !parent)}>
        <LineTrack $color={color} />
        {typeof valueBuffer === 'number' && (
          <LineBuffer $color={color} $value={valueBuffer} />
        )}
        <Line $color={color} $value={value} />
      </LineContainer>
    );
    if (appendTo) {
      return parent
        ? ReactDOM.createPortal(LineLoader, parent)
        : null;
    }
    return LineLoader;
  }

  // ─── CIRCLE ──────────────────────────────────────────────────────────────
  const numericSize =
    typeof size === 'number' ? size : SIZE_MAP[size] ?? SIZE_MAP.sm;
  const usedThickness =
    typeof thickness === 'number'
      ? thickness
      : typeof size === 'string'
      ? THICKNESS_MAP[size] ?? DEFAULT_THICKNESS
      : DEFAULT_THICKNESS;
  const radius = (numericSize - usedThickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const detOffset =
    typeof value === 'number' ? ((100 - value) / 100) * circumference : 0;
  const bufOffset =
    typeof valueBuffer === 'number'
      ? ((100 - valueBuffer) / 100) * circumference
      : 0;
  const indeterminate = typeof value !== 'number';

  const CircleContent = (
    <CircleSvg
      className={className}
      width={numericSize}
      height={numericSize}
      viewBox={`0 0 ${numericSize} ${numericSize}`}
      $spin={indeterminate}
    >
      <CircleTrack
        cx={numericSize / 2}
        cy={numericSize / 2}
        r={radius}
        strokeWidth={usedThickness}
        $color={color}
        $indeterminate={indeterminate}
      />
      {typeof valueBuffer === 'number' && (
        <CircleBufferCircle
          cx={numericSize / 2}
          cy={numericSize / 2}
          r={radius}
          strokeWidth={usedThickness}
          $color={color}
          strokeDasharray={`${circumference - bufOffset} ${circumference}`}
        />
      )}
      <CircleProgress
        cx={numericSize / 2}
        cy={numericSize / 2}
        r={radius}
        strokeWidth={usedThickness}
        $color={color}
        strokeDasharray={
          indeterminate
            ? undefined
            : `${circumference - detOffset} ${circumference}`
        }
        className={indeterminate ? 'indeterminate' : undefined}
      />
    </CircleSvg>
  );

  if (appendTo) {
    return parent
      ? ReactDOM.createPortal(
          <Overlay>
            <div>
              {CircleContent}
              <div className='loader-label'>{label}</div>
            </div>
          </Overlay>,
          parent
        )
      : null;
  }

  return CircleContent;
};

export default Loader;
