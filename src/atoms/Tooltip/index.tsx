import React from 'react'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'
import type { TooltipProps } from './interface'
import { theme } from '../../styles/theme'
import ReactDOM from 'react-dom'

export const Tooltip: React.FC<TooltipProps> = ({
  color = 'primary',
  content,
  children,
  trigger = 'hover',
  placement,
  maxWidth,
  type = 'tooltip', // default to tooltip
  testId,
}) => {
  const tooltipId = React.useId()
  const isTitle = type === 'title'

  // For title type, let the tooltip follow the cursor and hide the arrow.
  // For regular tooltip, stick with the passed placement.
  const tooltipProps = isTitle
    ? { followCursor: true, arrowColor: 'transparent', place: placement ?? 'bottom-start', openOnClick: false }
    : { place: placement ?? 'top' }

  // Define styles based on the tooltip type.
  // For title: grey background, white text, minimal padding, no border.
  // For tooltip: use theme-based colors and borders.
  const commonStyle = {
    fontSize: 12,
    fontFamily: theme.fontFamily,
    lineHeight: '1.3',
    borderRadius: '2px',
    color: '#fff',
    zIndex: 998,
    maxWidth
  }
  const tooltipStyle = isTitle
    ? {
        ...commonStyle,
        padding: '2px 4px',
        backgroundColor: '#555',
      }
    : {
        ...commonStyle,
        padding: '4px 6px',
        backgroundColor: theme.colors[color].base,
      }

  return (
    <>
      <span
        className={`tooltip-container`}
        data-tooltip-id={tooltipId}
        data-tooltip-trigger={trigger}
        {...isTitle ? {
          "data-tooltip-delay-show": 150,
          "data-tooltip-delay-hide": 150
        } : {}}
      >
        {children}
      </span>
      {ReactDOM.createPortal(
        <ReactTooltip
          id={tooltipId}
          openOnClick={trigger === 'click'}
          delayShow={isTitle ? 0 : undefined}
          border={tooltipStyle ? 'none' : `1px solid ${theme.colors[color].base}`}
          style={tooltipStyle}
          className={testId}
          /* eslint-disable @typescript-eslint/no-explicit-any */
          {...tooltipProps as any}
        >
          {content}
        </ReactTooltip>,
        document.body
      )}
    </>
  )
}
