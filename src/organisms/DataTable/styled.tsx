import { fadeInOnMount, scrollStyle, theme } from '../../styles'
import styled from 'styled-components'

export const DataTableWrapper = styled.div<{ $disabled?: boolean }>`
  position: relative;
  display: block;
  border: 1px solid ${theme.colors.default.pale};
  border-radius: 2px;
  box-sizing: border-box;
  background-color: ${theme.colors.default.pale};
  ${scrollStyle}
  
  * { box-sizing: border-box; }

  button {
    outline: none!important;
  }

  ${({ $disabled }) => $disabled ? `
    &:after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000;
      background-color: rgba(255, 255, 255, 0.3);
      cursor: not-allowed;
      ${fadeInOnMount}
    }
  ` : ''}
`

export const DataTableContainer = styled.div`
  overflow: auto;
`
export const DataTableContentContainer = styled.div``

export const RowsToDeleteText = styled.div`
  > b {
    color: ${theme.colors.danger.base};
  }
`

export const TableTitle = styled.div`
  padding: 8px 6px;
  font-weight: bold;
  font-size: 14px;
  line-height: 1;
  color: ${theme.colors.default.dark};
  background-color: ${theme.colors.lightA};
  border-bottom: 1px solid ${theme.colors.default.pale};
  cursor: default;
`
