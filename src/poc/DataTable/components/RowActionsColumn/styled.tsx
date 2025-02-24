import theme from '@styles/theme'
import styled from 'styled-components'

export const ActionContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  > button {
    transition: ${theme.transition};
    border: transparent;
    background-color: ${theme.colors.default.pale};
    padding: 0;
    height: 22px;
    width: 22px;
    border-radius: 2px;
    color: ${theme.colors.default.dark};
    font-size: 16px;
    cursor: pointer;
    backface-visibility: hidden;

    &.delete,
    &.cancel {
      &:hover:not(:disabled) {
        color: ${theme.colors.danger.base};
      }

      &:active:not(:disabled) {
        color: ${theme.colors.danger.darker};
      }
    }

    &.save {
      &:hover:not(:disabled) {
        color: ${theme.colors.success.base};
      }

      &:active:not(:disabled) {
        color: ${theme.colors.success.darker};
      }
    }

    &:hover:not(:disabled) {
      transform: scale(1.05);
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
      color: ${theme.colors.default.base};
    }
  }
`