import theme from '@styles/theme';
import styled from 'styled-components'
import {
  CellContainer as CellContainerStyles,
  CellContent as CellContentStyles,
  DataTableRow as DataTableRowStyles,
} from '../Body/styled'

export const CellContainer = styled(CellContainerStyles)``

export const CellContent = styled(CellContentStyles)<{
  $hasDND?: boolean
  $hasPin?: boolean
  $hasSort?: boolean
}>`
  font-size: 12px;
  min-height: 25px;
  align-items: flex-end;
  * {
    color: ${theme.colors.default.darker};
  }
  ${({ $hasDND }) => $hasDND ? 'padding-left: 22px;' : ''}
  ${({ $hasPin, $hasSort }) => {
    if (!$hasPin && !$hasSort) {
      return ''
    }

    if ($hasPin && $hasSort) {
      return 'padding-right: 42px;'
    }

    if ($hasPin || $hasSort) {
      return 'padding-right: 22px;'
    }
  }}
`

export const ColumnHeaderContainer = styled(DataTableRowStyles)`
  position: sticky;
  top: 0;
  z-index: 12;
  border-bottom: 1px solid ${theme.colors.default.pale};
  ${CellContainer} {
    background-color: ${theme.colors.lightA};
    color: ${theme.colors.default.darker};
    font-weight: bold;
    text-transform: uppercase;
    justify-content: flex-end;
  }
`

export const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-top: 1px solid ${theme.colors.default.pale};
  width: 100%;
  flex: 1;
  padding: 4px;
  > * {
    flex: 1;
  }
`

export const Resizer = styled.div`
  position: absolute;
  top: 0;
  height: 100%;
  width: 4px;
  background: transparent;
  cursor: col-resize;
  user-select: none;
  touch-action: none;
  right: 0;
  transition: all .3s ease;
  opacity: 1;
`

export const IconContainer = styled.span`
  height: 16px;
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .3s ease;
  border-radius: 2px;
  cursor: pointer;
  font-size: 14px;
  > span {
    color: ${theme.colors.default.base};
  }

  &:hover {
    background: ${theme.colors.default.pale};
    box-shadow: 0 0 1px 0 ${theme.colors.default.base};
    > span {
      color: ${theme.colors.default.darker};
    }
  }
`

export const DragHandle = styled(IconContainer)`
  position: absolute;
  top: 6px;
  left: 4px;
  cursor: grab;

  &:active {
    cursor: all-scroll;
    background: ${theme.colors.default.pale};
    transform: scale(0.9);
  }
`

export const LeftIconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: absolute;
  right: 4px;
  top: 6px;

  ${IconContainer} {
    &.pin-container {
      &.pin {
        > span {
          color: ${theme.colors.primary.dark};
          transform: rotate(45deg)
        }
      }
    }
  }
`

export const CellFilterPlaceholder = styled.div`
  height: 33px;
  width: 100%;
  border-top: 1px solid ${theme.colors.default.pale};
`