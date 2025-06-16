import styled from 'styled-components'
import { theme, fadeInOnMount } from 'src/styles'

export const DropdownMenu = styled.div<{ $open: boolean }>`
  ${fadeInOnMount}
  position: absolute;
  top: 100%;
  right: 0;
  background: #fff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  z-index: 1000;
  opacity: ${props => (props.$open ? 1 : 0)};
  transition: opacity 0.3s ease;
  min-width: 120px;
  border-radius: 2px;
  overflow: hidden;
`

export const DropdownItem = styled.div<{ $active?: boolean; $disabled?: boolean }>`
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  background-color: ${({ $active, $disabled }) =>
    $disabled ? '#f5f5f5' : $active ? '#e0e0e0' : 'transparent'};
  color: ${({ $disabled }) => ($disabled ? '#999' : 'inherit')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all .3s ease;
  &:hover {
    background-color: ${({ $disabled }) => ($disabled ? 'transparent' : '#f0f0f0')};
  }
`

export const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`

export const ProfileDropdownButton = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.primary.base};
  height: 32px;
  transition: all .3s ease;
  padding: 0 6px;
  border-top-right-radius: 2px;
  border-top-left-radius: 2px;
  &.open,
  &:hover {
    background-color: ${theme.colors.primary.pale};
  }
  > div {
    font-size:12px;
    color: ${theme.colors.primary.base};
  }
  .icon {
    &:first-child {
      font-size: 14px;
      margin-right: 6px;
    }
    &:last-child {
      font-size: 18px;
      margin-left: 2px;
    }
  }
`

export const CloseIconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  position: absolute;
  top: 12px;
  right: 10px;
  transition: all .3s ease;
  color: ${theme.colors.primary.base};
  font-size: 14px;
  padding: 0;
  &:hover {
    color: ${theme.colors.danger.base};
  }
`

export const CustomDropdownContainer = styled.div`
  position: relative;
  width: 400px;
`

export const Header = styled.div`
  position: relative;
  padding: 12px;
  border-bottom: 1px solid ${theme.colors.primary.base};

  > span {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    font-size: 14px;
    font-weight: bold;
    color: ${theme.colors.primary.darker};
  }
`

export const Body = styled.div`
  padding: 12px;
`
