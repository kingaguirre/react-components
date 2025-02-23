import { flexRender } from '@tanstack/react-table'
import { SettingsPanelContainer, SettingsContainer } from './styled'
import { Panel } from '@molecules/Panel'
import { FormControl } from '@atoms/FormControl'
import { DATA_TABLE_SELECT_ID } from '../../../utils'

export const SettingsPanel = ({
  table,
  show,
  onClose
}: {
  table: any
  show: boolean
  onClose?: () => void
}) => !!show ? (
  <SettingsPanelContainer className='settings-panel-container'>
    <Panel
      title='Visible Columns'
      rightIcons={[{
        icon: 'clear',
        onClick: onClose,
      }]}
      leftIcon={{
        icon: 'replay',
        onClick: () => {},
        title: 'Reset'
      }}
    >
      <SettingsContainer>
        <FormControl
          type='checkbox'
          text='Toggle All'
          checked={table.getIsAllColumnsVisible()}
          onChange={table.getToggleAllColumnsVisibilityHandler()}
          simple
        />
        {table.getAllLeafColumns()
          .filter((i: any) => i.id !== DATA_TABLE_SELECT_ID)
          .map((column: any) => {
            const header = column.columnDef.header
            const headerContext = { column, table }

            return (
            <FormControl
              key={column.id}
              type='checkbox'
              text={flexRender(header, headerContext)}
              checked={column.getIsVisible()}
              onChange={column.getToggleVisibilityHandler()}
              simple
            />
          )
        })}
      </SettingsContainer>
    </Panel>
  </SettingsPanelContainer>
) : null

export default SettingsPanel