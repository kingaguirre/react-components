import React, { useState, useRef, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownItem,
  DropdownContainer,
  ProfileDropdownButton,
  CloseIconButton,
  CustomDropdownContainer,
  Header,
  Body
} from './styled'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { Icon } from 'src/atoms/Icon'
import { Grid, GridItem } from 'src/atoms/Grid'
import { Profile } from '../../interface'
import { IconLabelText } from './IconLabelText'
import { formatDate } from './utils'

const ANIMATION_DURATION = 300 // in ms

export const ProfileDropdown: React.FC<Profile> = ({
  name,
  dropdownItems,
  dropdownCustomContent,
  userId,
  lastLoginTime,
  lastProfileUpdate
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev)
  }

  const closeDropdown = () => {
    setDropdownOpen(false)
  }

  useOnClickOutside(containerRef, closeDropdown, dropdownOpen)

  // Control rendering: when opening, render immediately; when closing, wait for exit animation.
  useEffect(() => {
    if (dropdownOpen) {
      setShouldRender(true)
    } else {
      const timer = setTimeout(() => setShouldRender(false), ANIMATION_DURATION)
      return () => clearTimeout(timer)
    }
  }, [dropdownOpen])

  const handleItemClick = (item: { onItemClick: () => void }) => {
    item.onItemClick()
    closeDropdown()
  }

  return (
    <DropdownContainer ref={containerRef}>
      <ProfileDropdownButton
        data-testid="profile-dropdown-button"
        onClick={toggleDropdown}
        className={dropdownOpen ? 'open' : ''}
      >
        <Icon icon="logo-icon" />
        <div>{name}</div>
        <Icon icon="keyboard_arrow_down" />
      </ProfileDropdownButton>
      {shouldRender && (
        <DropdownMenu $open={dropdownOpen}>
          {dropdownCustomContent ? (
            <CustomDropdownContainer>
              <Header>
                <span>{name}{userId ? ` | ${userId}` : ''}</span>
                <CloseIconButton onClick={closeDropdown}>
                  <Icon icon="clear" />
                </CloseIconButton>
              </Header>
              <Body>
                <Grid>
                  <GridItem xs={6}>
                    <IconLabelText
                      icon='alarm-clock'
                      label='Last Login Time'
                      text={formatDate(lastLoginTime)}
                    />
                  </GridItem>
                  <GridItem xs={6}>
                    <IconLabelText
                      icon='calendar'
                      label='Last Profile Update'
                      text={formatDate(lastProfileUpdate)}
                    />
                  </GridItem>
                </Grid>
                {dropdownCustomContent}
              </Body>
            </CustomDropdownContainer>
          ) : (
            dropdownItems?.map((item, index) => (
              <DropdownItem
                key={index}
                $active={item.active}
                $disabled={item.disabled}
                onClick={() => !item.disabled && handleItemClick(item)}
              >
                <Icon icon={item.icon} />
                <span>{item.text}</span>
              </DropdownItem>
            ))
          )}
        </DropdownMenu>
      )}
    </DropdownContainer>
  )
}
