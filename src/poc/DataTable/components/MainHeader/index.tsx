import React from 'react'
import { MainHeadercontainer, SearhContainer, RightDetailsContainer, IconContainer } from './styled'
import { DebouncedInput } from '../ColumnHeader/Filter'
import { Button as FooterButton } from '../Footer/styled'
import { Icon } from '@atoms/Icon'
import { Button } from '@atoms/Button'

interface MainHeaderProps {
  value?: string
  onChange: (value: string | number) => void
  onClear?: () => void
  isClearDisabled?: boolean
  isAddBtnDisabled?: boolean
  onClearAllIconClick?: () => void
  onAddBtnClick?: () => void
  onSettingsIconClick?: () => void
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  value,
  onChange,
  onClear,
  isClearDisabled,
  isAddBtnDisabled,
  onClearAllIconClick,
  onAddBtnClick,
  onSettingsIconClick
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  return (
    <MainHeadercontainer className="main-header-container">
      <SearhContainer className='search-container'>
        <DebouncedInput
          name="main-header-search-input"
          value={value ?? ''}
          onChange={onChange}
          placeholder="Search all columns..."
          iconRight={[
            ...(!!value ? [{
              icon: "clear",
              color: "default",
              hoverColor: "danger",
              onClick: onClear
            }] : []),
            {
              icon: "search",
              onClick: () => inputRef?.current?.focus()
            }
          ]}
        />
        <FooterButton title='Clear All Filters' $outlined onClick={onClearAllIconClick} disabled={isClearDisabled}>
          <Icon icon='clear'/>
        </FooterButton>
      </SearhContainer>

      <RightDetailsContainer className='right-details-container'>
        <Button size='sm' disabled={isAddBtnDisabled} {...!isAddBtnDisabled ? { onClick: onAddBtnClick } : {}}>
          Add New <Icon icon='add_circle_outline'/>
        </Button>
        <IconContainer className='icon-container'>
          <RightIconButton
            icon='file_upload'
            title='Upload'
            onClick={() => {}}
          />
          <RightIconButton
            icon='file_download'
            title='Download'
            onClick={() => {}}
          />
          <RightIconButton
            icon='settings'
            title='Settings'
            onClick={onSettingsIconClick}
          />
          <RightIconButton
            icon='replay'
            title='Reset to default'
            onClick={() => {}}
          />
        </IconContainer>
      </RightDetailsContainer>
    </MainHeadercontainer>
  )
}

export default MainHeader

const RightIconButton = ({ onClick, title, icon }: {
  onClick?: () => void
  title?: string
  icon: string
}) => (
  <button onClick={onClick} title={title}>
    <Icon icon={icon}/>
  </button>
)