import { theme } from "../../../../styles/theme";
import styled from "styled-components";

export const ButtonIcon = styled.button`
  border: none;
  padding: 0;
  cursor: pointer;
  background-color: ${theme.colors.default.pale};
  color: ${theme.colors.default.dark};
  transition: ${theme.transition};
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16px;
  width: 16px;
  border-radius: 0;
  &.expanded,
  &:hover {
    color: ${theme.colors.primary.base};
  }

  &:active {
    color: ${theme.colors.primary.darker};
  }
`;
