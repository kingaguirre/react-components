import React from 'react'
import { MainHeadercontainer, SearhContainer, RightDetailsContainer, IconContainer, RightIconButtonContainer } from './styled'
import { DebouncedInput } from '../ColumnHeader/Filter'
import { Button as FooterButton } from '../Footer/styled'
import { Icon } from '../../../../atoms/Icon'
import { Tooltip } from '../../../../atoms/Tooltip'
import { Button } from '../../../../atoms/Button'

interface MainHeaderProps {
  value?: string
  enableGlobalFiltering?: boolean
  onChange: (value: string | number) => void
  onClear?: () => void
  isClearDisabled?: boolean
  isAddBtnDisabled?: boolean
  enableRowAdding?: boolean
  onClearAllIconClick?: () => void
  onAddBtnClick?: () => void
  onSettingsIconClick?: () => void
  isSettingsPanelOpen?: boolean
  handleDeleteIconClick?: () => void
  showDeleteIcon?: boolean
  handleResetColumnSettings?: () => void
  headerRightControls?: boolean
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  value,
  enableGlobalFiltering,
  onChange,
  onClear,
  isClearDisabled,
  isAddBtnDisabled,
  enableRowAdding,
  onClearAllIconClick,
  onAddBtnClick,
  onSettingsIconClick,
  isSettingsPanelOpen,
  handleDeleteIconClick,
  showDeleteIcon,
  handleResetColumnSettings,
  headerRightControls
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  return (enableGlobalFiltering || enableRowAdding || showDeleteIcon || headerRightControls) ? (
    <MainHeadercontainer className='main-header-container'>
      {enableGlobalFiltering && (
        <SearhContainer className='search-container'>
          <DebouncedInput
            name='main-header-search-input'
            value={value ?? ''}
            onChange={onChange}
            placeholder='Search all columns...'
            ref={inputRef}
            iconRight={[
              ...(value ? [{
                icon: 'clear',
                color: 'default',
                hoverColor: 'danger',
                onClick: onClear
              }] : []),
              {
                icon: 'search',
                onClick: () => inputRef?.current?.focus()
              }
            ]}
          />
          <FooterButton title='Clear All Filters' $outlined onClick={onClearAllIconClick} disabled={isClearDisabled}>
            <Icon icon='clear'/>
          </FooterButton>
        </SearhContainer>
      )}

      <RightDetailsContainer className='right-details-container'>
        {enableRowAdding && (
          <Button data-testid='add-row-button' size='sm' disabled={isAddBtnDisabled || isSettingsPanelOpen} {...!isAddBtnDisabled ? { onClick: onAddBtnClick } : {}}>
            Add New <Icon icon='add_circle_outline'/>
          </Button>
        )}
        <IconContainer className='container-icon'>
          {showDeleteIcon && (
            <RightIconButton
              icon='delete_forever'
              title='Delete Selected Rows'
              onClick={handleDeleteIconClick}
              className='delete-icon'
              disabled={isAddBtnDisabled || isSettingsPanelOpen}
            />
          )}
          {/* <RightIconButton
            icon='file_upload'
            title='Upload Excel'
            onClick={() => {}}
          />
          <RightIconButton
            icon='file_download'
            title='Download to Excel'
            onClick={() => {}}
          /> */}
          {headerRightControls && (
            <>
              <RightIconButton
                icon='settings'
                title='Settings'
                onClick={onSettingsIconClick}
                isAction={isSettingsPanelOpen}
                disabled={isAddBtnDisabled}
              />
              <RightIconButton
                icon='replay'
                title='Reset to default'
                onClick={handleResetColumnSettings}
                disabled={isAddBtnDisabled}
              />
            </>
          )}
        </IconContainer>
      </RightDetailsContainer>
    </MainHeadercontainer>
  ) : null
}

const RightIconButton = ({ onClick, title, icon, className, isAction, disabled }: {
  onClick?: () => void
  title?: string
  icon: string
  className?: string
  isAction?: boolean
  disabled?: boolean
}) => (
  <Tooltip content={title} type='title'>
    <RightIconButtonContainer
      {...!disabled ? { onClick } : {}}
      className={`${className ?? ''} ${isAction ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
    >
      <Icon icon={icon}/>
    </RightIconButtonContainer>
  </Tooltip>
)