import React, { ChangeEvent } from 'react'
import { FooterContainer, } from './styled'
import { CheckboxCell } from '../SelectColumn/CheckboxCell'
import {
  SelectRowContainer, FooterDetailsContainer, LeftDetails,
  RightDetails, Button, SelectedContainer
} from './styled'
import { formatNumber, countDigits } from '@utils/index'
import { Dropdown } from '@molecules/Dropdown'
import { Icon } from '@atoms/Icon'
import { FormControl } from '@atoms/FormControl'
import { Tooltip } from '@atoms/Tooltip'

interface FooterProps {
  table: any
  selectedRows: number
}

export const Footer: React.FC<FooterProps> = ({ table, selectedRows }) => {
  const rerender = React.useReducer(() => ({}), {})[1]
  const isPrevDisabled = !table.getCanPreviousPage()
  const isNextDisabled = !table.getCanNextPage()

  return (
    <FooterContainer className='footer-container'>
      <SelectRowContainer>
        <CheckboxCell
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          text={`Page Rows (${table.getRowModel().rows.length})`}
        />
        {selectedRows > 0 && (
          <SelectedContainer>
            <Icon icon='done_all'/> {formatNumber(selectedRows)} Total Selected Row{selectedRows > 1 ? 's' : ''}
          </SelectedContainer>
        )}
      </SelectRowContainer>
      <FooterDetailsContainer>
        <LeftDetails>
          <span>Displaying</span>
          <span>{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span>
          <span>to</span>
          <span>
            {Math.min(
              50000,
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize
            )}
          </span>
          <span>of</span>
          <span>{formatNumber(table.getFilteredRowModel().rows.length)}</span>
          <span>Records</span>
          <Button title='Refresh' onClick={() => rerender()}><Icon icon='refresh'></Icon></Button>
        </LeftDetails>
        <RightDetails $totalCount={countDigits(table.getPageCount())}>
          <span>Rows</span>
          <Dropdown
            size='sm'
            value={table.getState().pagination.pageSize.toString()}
            onChange={(value) => table.setPageSize(Number(value))}
            clearable
            options={[
              { text: '10', value: '10' },
              { text: '20', value: '20' },
              { text: '30', value: '30' },
              { text: '40', value: '40' },
              { text: '50', value: '50' },
            ]}
          />
          <Button
            disabled={isPrevDisabled}
            {...(!isPrevDisabled ? {
              onClick: () => table.setPageIndex(0)
            } : {})}
          >
            <Icon icon='first_page'/>
          </Button>
          <Button
            disabled={isPrevDisabled}
            {...(!isPrevDisabled ? {
              onClick: () => table.previousPage()
            } : {})}
          >
            <Icon icon='keyboard_arrow_left'/>
          </Button>

          <Tooltip content={`Jump page (${table.getState().pagination.pageIndex + 1} of ${formatNumber(table.getPageCount())})`}>
            <FormControl
              type='number'
              min='1'
              size='sm'
              max={table.getPageCount()}
              value={table.getState().pagination.pageIndex + 1}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0
                table.setPageIndex(page)
              }}
            />
          </Tooltip>
          <Button
            disabled={isNextDisabled}
            {...(!isNextDisabled ? {
              onClick: () => table.nextPage()
            } : {})}
          >
            <Icon icon='keyboard_arrow_right'/>
          </Button>
          <Button
            disabled={isNextDisabled}
            {...(!isNextDisabled ? {
              onClick: () => table.setPageIndex(table.getPageCount() - 1)
            } : {})}
          >
            <Icon icon='last_page'/>
          </Button>
        </RightDetails>
      </FooterDetailsContainer>
    </FooterContainer>
  )
}

export default Footer