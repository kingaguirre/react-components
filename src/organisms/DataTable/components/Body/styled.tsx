import { theme } from '../../../../styles/theme'
import styled, { css } from 'styled-components'
import { ifElse } from '../../../../utils'

export const BodyContainer = styled.div``

export const CellContainer = styled.div<{
  $hasError?: boolean
  $isEditMode?: boolean
  $isPinned?: boolean
  $isDisabled?: boolean
}>`
  background-color: white;
  height: auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  ${({ $isEditMode, $isPinned }) => $isEditMode ? `z-index: ${ifElse(!!$isPinned, 14, 10)}!important;` : ''}
  box-shadow: 0 0 0 1px ${theme.colors.default.pale};

  &.disabled.disabled {
    cursor: not-allowed;
    background-color: #e9e9e9!important;
  }

  ${({ $hasError, $isDisabled }) => $hasError && !$isDisabled ? `
    &:before {
      content: "";
      top: 1px;
      left: 1px;
      right: 1px;
      bottom: 1px;
      pointer-events: none;
      position: absolute;
      border: 1px solid ${theme.colors.danger.base};
    }
  ` : ''}
`

const getCellBgColor = (isActiveRow: boolean, isNewRow: boolean, isDisabled: boolean) => {
  if (isNewRow) {
    return `${theme.colors.success.pale}!important`
  } else {
    if (isActiveRow) {
      return `${theme.colors.primary.pale}!important`
    } else if (isDisabled) {
      return `${theme.colors.default.pale}!important`
    } else {
      return 'white'
    }
  }
}

export const DataTableRow = styled.div<{
  $isActiveRow?: boolean
  $isNewRow?: boolean
  $isDisabled?: boolean
}>`
  position: relative;
  background-color: white;
  width: fit-content;
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  background-color: white;
  ${({ $isDisabled }) => $isDisabled ? css`
    cursor: not-allowed;
    opacity: 0.6;
    * {
      pointer-events: none;
    }
  ` : ''}

  .tooltip-container {
    width: 100%;
  }

  &:nth-child(odd) {
    ${CellContainer} {
      background-color: #f8f8f8;
    }
  }

  ${CellContainer} {
    background-color: ${({
      $isActiveRow = false,
      $isNewRow = false,
      $isDisabled = false
    }) => getCellBgColor($isActiveRow, $isNewRow, $isDisabled)};
    ${({ $isDisabled }) => $isDisabled ? css`pointer-events: none;` : ''}
  }

  &.active {
    &:after {
      content: "";
      position: absolute;
      top: 1px;
      left: 1px;
      right: 1px;
      bottom: 1px;
      pointer-events: none;
      border: 1px solid ${theme.colors.primary.base};
      z-index: 11;
    }
  }

  /* &.bottom .help-text {
    top: -2px!important;
    transform: translateY(-100%);
    box-shadow: 0 -2px 4px 2px rgba(0,0,0,0.3)!important;
    border-top-left-radius: 2px!important;
    border-top-right-radius: 2px!important;
  } */
`

const getTextAlignment = (align?: string) => {
  switch(align) {
    case 'left': return 'flex-start'
    case 'right': return 'flex-end'
    default: return 'center'
  }
}

export const CellContent = styled.div<{
  $isEditMode?: boolean
  $isEditable?: boolean
  $isCellSelected?: boolean
  $align?: string
}>`
  color: ${theme.colors.default.darker};
  font-size: 12px;
  line-height: 1.2;
  padding: ${({ $isEditMode }) => $isEditMode ? '0' : '4px'};
  flex: 1;
  width: 100%;
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: ${({ $align }) => getTextAlignment($align)};
  transition: background-color .3s ease;
  position: relative;
  cursor: default;

  &.disabled {
    pointer-events: none;
  }

  > span,
  .tooltip-container {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    cursor: inherit;
    color: ${theme.colors.default.dark};
  }

  .form-control-input-container {
    width: 100%;
    z-index: 1;

    .wrapper-icon {
      height: 30px;
    }

    &.editable-element {
      &.form-control-dropdown-container {
        .form-control-text {
          text-align: left
        }
      }
      
      .form-control-text,
      .form-control-number,
      .form-control-textarea {
        height: 30px;
        padding: 4px;
      }

      .form-control-text,
      .form-control-number,
      .form-control-textarea {
        text-align: ${({ $align }) => $align ?? 'center'};
      }
      
      .form-control-text,
      .form-control-number {
        margin-top: -1px;
      }

      .help-text {
        position: absolute;
        z-index: 1;
        background-color: white;
        padding: 4px;
        box-shadow: 0 2px 4px 2px rgba(0,0,0,0.3);
        border-bottom-left-radius: 2px;
        border-bottom-right-radius: 2px;
        left: 2px;
        width: calc(100% - 4px);
        min-width: 120px;
        top: 32px;
      }
    }

    &.checkbox-group, &.switch-group, &.radio-group {
      padding: 6px 8px;
      .group-control-container {
        gap: 4px;
      }
    }
  }

  ${({ $isEditable }) => $isEditable ? `
    &:not(.custom-column) {
      cursor: pointer;
    }
  ` : ''}

  ${({ $isCellSelected }) => $isCellSelected ? `
    &:after {
      z-index: 0;
      pointer-events: none;
      content: "";
      position: absolute;
      top: 1px;
      left: 1px;
      right: 1px;
      bottom: 1px;
      border: 2px solid ${theme.colors.primary.base};
    }
  ` : ''}
`

export const NoDataContainer = styled.div<{ $hasError?: boolean }>`
  text-align: left;
  padding: 12px;
  font-size: 14px;
  font-weight: bold;
  color: ${({ $hasError }) => $hasError ? theme.colors.danger.base : theme.colors.default.base};
  text-shadow: 0 1px 1px white, 1px 0px 1px white, 0px -1px 1px white, -1px 0 1px white;
  min-width: 250px;
`

export const ExpandedRowContainer = styled.div<{ $expandedRowRightOffset?: number }>`
  padding: 12px;
  background-color: ${theme.colors.default.pale};
  color: ${theme.colors.default.darker};
  font-size: 14px;
  width: calc(100% + ${({ $expandedRowRightOffset }) => $expandedRowRightOffset ?? 0}px);
`

export const TooltipContent = styled.span`
  white-space: pre-line;
`