import styled from 'styled-components'
import { theme } from '@styles/theme'

export const MainHeadercontainer = styled.div`
  position: relative;
  background-color: white;
  border-bottom: 1px solid rgba(212, 212, 212);
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
  min-height: 38px;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  flex-wrap: wrap;
  gap: 6px;
`

export const SearhContainer = styled.div`
  max-width: 220px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 6px;

  .form-control-input-container {
    width: 100%;
  }

  > button {
    background-color: transparent;
    border-color: transparent;
    box-shadow: none;

    &:not(:disabled) {
      &:hover {
        background-color: ${theme.colors.danger.base};
      }

      &:active {
        background-color: ${theme.colors.danger.dark};
      }
    }
  }
`

export const RightDetailsContainer = styled.div`
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;

  .button {
    align-self: center;
    justify-self: center;
    @media (max-width: 480px) {
      margin-right: 8px;
    }
  }
`

export const IconContainer = styled.div`
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;

  > button {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: ${theme.transition};
    min-width: 38px;
    border-color: transparent;
    background-color: ${theme.colors.lightA};
    color: ${theme.colors.primary.base};
    font-size: 22px;
    padding: 0;
    cursor: pointer;

    &:hover {
      background-color: ${theme.colors.default.pale};
      color: ${theme.colors.primary.dark};
    }

    &:disabled {
      cursor: not-allowed;
      color: ${theme.colors.default.base};
    }
  }
`
