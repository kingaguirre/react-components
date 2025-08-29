
import styled from "styled-components";
import { theme, fadeInOnMount } from "../../../../../styles";

export const RightIconButtonContainer = styled.button`
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: ${theme.transition};
  min-width: 38px;
  height: 38px;
  border: none;
  background-color: ${theme.colors.lightA};
  color: ${theme.colors.primary.base};
  font-size: 22px;
  padding: 0;
  cursor: pointer;
  border-radius: 0;

  &.delete-icon {
    color: ${theme.colors.danger.base};

    &:hover {
      color: ${theme.colors.danger.dark};
    }

    &:active {
      color: ${theme.colors.danger.darker};
    }
  }

  &.restore-icon {
    color: ${theme.colors.info.base};

    &:hover {
      color: ${theme.colors.info.dark};
    }

    &:active {
      color: ${theme.colors.info.darker};
    }
  }

  &:hover {
    background-color: ${theme.colors.default.pale};
    color: ${theme.colors.primary.dark};
  }

  &:active {
    color: ${theme.colors.primary.darker};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${theme.colors.default.base};
  }


  ${fadeInOnMount}

  &:hover,
  &.active {
    background-color: ${theme.colors.primary.pale};
  }

  &.disabled:hover,
  &.disabled {
    background-color: ${theme.colors.default.pale};
    cursor: not-allowed;
    color: ${theme.colors.default.base}!important;
  }
`;
