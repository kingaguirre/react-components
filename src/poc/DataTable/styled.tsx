import { scrollStyle } from '@styles/GlobalStyles'
import { theme } from '@styles/theme'
import styled from 'styled-components'

export const DataTableWrapper = styled.div`
  position: relative;
  display: block;
  border: 1px solid ${theme.colors.default.pale};
  border-radius: 2px;
  box-sizing: border-box;
  background-color: ${theme.colors.default.pale};
  ${scrollStyle}
  
  * { box-sizing: border-box; }
`

export const DataTableContainer = styled.div`
  overflow: auto;
`
export const DataTableContentContainer = styled.div``
