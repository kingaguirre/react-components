import { theme, fadeInOnMount } from '../../../../styles'
import styled from 'styled-components'

export const FooterContainer = styled.div`
  background-color: #f2f2f2;
`

export const SelectRowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 7px;
  border-bottom: 1px solid ${theme.colors.default.pale};
  border-top: 1px solid ${theme.colors.default.pale};
  flex-wrap: wrap;
  gap: 8px;
`

export const FooterDetailsContainer = styled.div`
  padding: 8px 6px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  overflow: auto;
`

export const LeftDetails = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 14px;
  color: ${theme.colors.default.dark};
  gap: 6px;

  > span {
    display: block;
    color: ${theme.colors.default.dark};
    font-size: 14px;
  }
`
const getTextBoxWidth = (count: number) => {
  switch(count) {
    case 4: return 45
    case 3: return 38
    case 2: return 32
    default: return 24
  }
}

export const RightDetails = styled(LeftDetails)<{ $totalCount: number }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .footer-page {
    width: ${({ $totalCount }) => getTextBoxWidth($totalCount)}px;

    .form-control-number {
      text-align: center;
    }
  }

  > .dropdown-container {
    width: 52px;
  }
`

export const Button = styled.button<{ $outlined?: boolean}>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  padding: 0;
  background-color: ${({ $outlined }) => $outlined ? 'transparent' : 'white'};
  cursor: pointer;
  min-height: 22px;
  min-width: 22px;
  border: 0.5px solid ${theme.colors.default.pale};
  color: ${theme.colors.default.dark};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  transition: all .3s ease;

  &:hover {
    color: white;
    background-color: ${theme.colors.primary.base};
  }

  &:active {
    background-color: ${theme.colors.primary.dark};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${theme.colors.default.base};
    background-color: ${theme.colors.lightA};
  }
`

export const SelectedContainer = styled.div`
  ${fadeInOnMount}
  font-size: 12px;
  color: ${theme.colors.default.dark};
  text-transform: uppercase;
  font-weight: bold;

  > .icon {
    color: ${theme.colors.success.base};
    font-size: 14px;
  }
`