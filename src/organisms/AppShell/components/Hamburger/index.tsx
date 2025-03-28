import React from 'react'
import { theme } from 'src/styles';
import styled, { css } from 'styled-components'

interface HamburgerProps {
  show: boolean;
  onClick?: () => void;
}

const Container = styled.div`
  width: 30px;
  height: 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  padding: 8px 7px;
`

interface BarProps {
  $show: boolean;
  $position: 'top' | 'middle' | 'bottom';
}

const Bar = styled.span<BarProps>`
  display: block;
  height: 3px;
  width: 16px;
  background-color: ${theme.colors.default.base};
  transition: transform 0.3s ease, opacity 0.3s ease;

  ${({ $show, $position }) =>
    $show &&
    css`
      ${$position === 'top' && 'transform: translateY(6px) rotate(45deg);'}
      ${$position === 'middle' && 'transform: scale(0);'}
      ${$position === 'bottom' && 'transform: translateY(-5px) rotate(-45deg);'}
    `}
`

export const Hamburger: React.FC<HamburgerProps> = ({ show, onClick }) => (
  <Container data-testid='toggle-button' onClick={onClick}>
    <Bar $show={show} $position="top" />
    <Bar $show={show} $position="middle" />
    <Bar $show={show} $position="bottom" />
  </Container>
)
