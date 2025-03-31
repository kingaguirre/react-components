import React, { useState, useRef, useEffect } from 'react'
import { theme } from 'src/styles'
import styled from 'styled-components'

const AnimatedTextWrapper = styled.div<{
  $expanded?: boolean
  $width: number
}>`
  display: inline-block;
  overflow: hidden;
  transition: all 0.3s ease;;
  /* If expanded, use the measured width; if not, collapse to 0 */
  max-width: ${({ $expanded, $width }) => ($expanded ? `${$width}px` : 0)};
  background-color: ${theme.colors.primary.dark};
  height: 30px;
  box-sizing: border-box;
  * { box-sizing: border-box; }
`

const Text = styled.div<{ $expanded?: boolean }>`
  font-size: 12px;
  font-weight: bold;
  color: white;
  padding: 7px 8px;
  transition: all .3s ease;
  opacity: ${({ $expanded }) => ($expanded ? 1 : 0)};
`

export const AnimatedText = ({ children, expanded }) => {
  const textRef: any = useRef(null)
  const [width, setWidth] = useState(0)

  // Measure the width after the component mounts or whenever the children change
  useEffect(() => {
    if (textRef.current) {
      setWidth(textRef.current.scrollWidth)
    }
  }, [children])

  return (
    <>
    {/* Hidden element for measuring natural width */}
    <div
      ref={textRef}
      style={{
        position: 'absolute',
        visibility: 'hidden',
        whiteSpace: 'nowrap',
        padding: '7px 8px'
      }}
    >
      {children}
    </div>

    <AnimatedTextWrapper $expanded={expanded} $width={width}>
      <Text $expanded={expanded}>{children}</Text>
    </AnimatedTextWrapper>
  </>
  )
}

