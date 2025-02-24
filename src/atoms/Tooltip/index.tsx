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
  placement = 'top',
  maxWidth
}) => {
  // Use React's built-in useId hook (available in React 18+) to generate a unique tooltip ID.
  const tooltipId = React.useId()

  return (
    <>
      {/* The child is wrapped with a span that holds the data attributes for the tooltip. */}
      <span data-tooltip-id={tooltipId} data-tooltip-trigger={trigger}>
        {children}
      </span>
      {ReactDOM.createPortal(
        <ReactTooltip
          id={tooltipId}
          place={placement}
          openOnClick={trigger === 'click'}
          border={`1px solid ${theme.colors[color].base}`}
          style={{
            fontSize: 12,
            fontFamily: theme.fontFamily,
            padding: '4px 6px',
            lineHeight: '1.3',
            backgroundColor: theme.colors[color].base,
            borderRadius: '2px',
            zIndex: 998,
            maxWidth
          }}
        >
          {content}
        </ReactTooltip>,
        document.body
      )}
    </>
  )
}

export default Tooltip
