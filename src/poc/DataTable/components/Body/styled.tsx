import theme from '@styles/theme';
import styled from 'styled-components'

export const BodyContainer = styled.div``

export const CellContainer = styled.div<{ $hasError?: boolean; $isEditMode?: boolean }>`
  background-color: 'white';
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  ${({ $isEditMode }) => !!$isEditMode ? 'z-index: 10!important;' : ''}
  box-shadow: 0 0 0 1px ${theme.colors.default.pale};

  ${({ $hasError }) => !!$hasError ? `
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

export const DataTableRow = styled.div`
  background-color: white;
  width: fit-content;
  display: flex;
  justify-content: flex-start;
  background-color: ${theme.colors.lightA};

  ${CellContainer} {
    background-color: ${theme.colors.lightA};
  }

  &:nth-child(odd) {
    ${CellContainer} {
      background-color: #f8f8f8;
    }
  }
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
  $hasError?: boolean
  $isEditable?: boolean
  $align?: string
}>`
  color: ${theme.colors.default.darker};
  font-size: 14px;
  line-height: 1.2;
  padding: ${({ $isEditMode }) => !!$isEditMode ? '0' : '4px'};
  flex: 1;
  width: 100%;
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: ${({ $align }) => getTextAlignment($align)};
  transition: background-color .3s ease;

  > span {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    cursor: inherit;
    color: ${theme.colors.default.dark};
  }

  .form-control-input-container:not(.form-control-dropdown-container) {
    &.editable-element {
      .form-control-text,
      .form-control-number,
      .form-control-textarea {
        text-align: ${({ $align }) => $align ?? 'center'};
        height: 30px;
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
      padding: 4px 8px;
      .group-control-container {
        gap: 4px;
      }
    }
  }

  ${({ $isEditable, $hasError }) => $isEditable ? `
    &:hover {
      background-color: ${$hasError ? theme.colors.danger.pale : theme.colors.primary.pale};
    }
  ` : ''}
`