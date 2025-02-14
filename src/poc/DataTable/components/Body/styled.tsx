import theme from '@styles/theme';
import styled from 'styled-components'

export const BodyContainer = styled.div``

export const CellContainer = styled.div`
  background-color: white;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  z-index: 1;
  box-shadow: 0 0 0 1px ${theme.colors.default.pale};
`

export const DataTableRow = styled.div`
  background-color: white;
  width: fit-content;
  display: flex;
  justify-content: flex-start;
  background-color: ${theme.colors.lightA};

  &:nth-child(even) {
    ${CellContainer} {
      background-color: #f8f8f8;
    }
  }
`

export const CellContent = styled.div`
  color: ${theme.colors.default.darker};
  font-size: 14px;
  line-height: 1.2;
  padding: 4px;
  flex: 1;
  width: 100%;
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  * { color: ${theme.colors.default.dark}; }

  > span {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    cursor: default;
  }
`