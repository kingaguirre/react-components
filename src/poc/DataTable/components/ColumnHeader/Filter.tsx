import React from 'react'
import { FormControl } from '@atoms/FormControl'
import { FilterContainer } from './styled'
import { Column } from '@tanstack/react-table'
import DatePicker from '@molecules/DatePicker'
import Dropdown from '@molecules/Dropdown'

// Filter component using our styled inputs.
export const Filter = ({ column }: { column: Column<any, unknown> }) => {
  const columnFilterValue = column.getFilterValue()
  const { filterVariant } = column.columnDef.meta ?? {}

  const facetedUniqueValues = React.useMemo(() => column.getFacetedUniqueValues(), [column]);
  const facetedUniqueValuesSize = facetedUniqueValues.size;

  // Now, derive a boolean based on the memoized value.
  const showFacetedValues = filterVariant === 'select' || (filterVariant !== 'select' && facetedUniqueValues.size < 10000);

  const sortedUniqueValues = React.useMemo(() => {
    if (filterVariant === 'number-range') return [];
    if (!showFacetedValues) return [];

    // Using the memoized facetedUniqueValues.
    return Array.from(facetedUniqueValues.keys()).sort().slice(0, 5000);
  }, [facetedUniqueValues, filterVariant, showFacetedValues]);

  return (
    <FilterContainer className='filter-container'>
      {
        (() => {
          switch (filterVariant) {
            case 'number-range':
              return (
                <>
                  <DebouncedInput
                    type='number'
                    value={(columnFilterValue as [number, number])?.[0] ?? ''}
                    onChange={value =>
                      column.setFilterValue((old: [number, number]) => [value, old?.[1]])
                    }
                    min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
                    max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
                    placeholder={`Min ${column.getFacetedMinMaxValues()?.[0] !== undefined
                        ? `(${column.getFacetedMinMaxValues()?.[0]})`
                        : ''
                      }`}
                  />
                  <DebouncedInput
                    type='number'
                    value={(columnFilterValue as [number, number])?.[1] ?? ''}
                    onChange={value =>
                      column.setFilterValue((old: [number, number]) => [old?.[0], value])
                    }
                    min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
                    max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
                    placeholder={`Max ${column.getFacetedMinMaxValues()?.[1]
                        ? `(${column.getFacetedMinMaxValues()?.[1]})`
                        : ''
                      }`}
                  />
                </>
              );
            case 'date':
              return (
                <DebouncedInput
                  onChange={value => column.setFilterValue(value)}
                  placeholder='Select Date'
                  type='date'
                  value={(columnFilterValue ?? '') as string}
                />
              )
            case 'date-range':
              return (
                <DebouncedInput
                  onChange={value => column.setFilterValue(value)}
                  placeholder='Select Dates'
                  type='date-range'
                  range
                  value={(columnFilterValue ?? '') as string}
                />
              )
            case 'dropdown':
              return (
                <DebouncedInput
                  onChange={value => column.setFilterValue(value)}
                  placeholder={`Select Options ${showFacetedValues ? `(${facetedUniqueValuesSize})` : ''}`}
                  type='dropdown'
                  options={sortedUniqueValues.map(value => ({ value, text: value }))}
                  value={(columnFilterValue ?? '') as string}
                />
              )
            default:
              return (
                <>
                  <datalist id={column.id + 'list'}>
                    {sortedUniqueValues.map((value: any, i: number) => (
                      <option value={value} key={`${value}-${i}`} />
                    ))}
                  </datalist>
                  <DebouncedInput
                    onChange={value => column.setFilterValue(value)}
                    type='text'
                    value={(columnFilterValue ?? '') as string}
                    placeholder={`Search... ${showFacetedValues ? `(${facetedUniqueValuesSize})` : ''}`}
                    list={column.id + 'list'}
                  />
                </>
              );
          }
        })()
      }
    </FilterContainer>
  )
}

// A typical debounced input react component
export const DebouncedInput = ({ value: initialValue, onChange, debounce = 300, ...props }: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
  [key: string]: any;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) => {
  const [value, setValue] = React.useState(initialValue)

  React.useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange?.(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return (() => {
    switch (props.type) {
      case 'date': return (
        <DatePicker
          size='sm'
          selectedDate={value as string}
          onChange={(date: any) => setValue(date as string)}
          placeholder={props.placeholder}
        />
      )
      case 'date-range': return (
        <DatePicker
          size='sm'
          selectedDate={value as string}
          onChange={(date: any) => setValue(date as string)}
          range={props.type === 'date-range'}
          placeholder={props.placeholder}
        />
      )
      case 'dropdown': return (
        <Dropdown
          size='sm'
          value={value as string}
          onChange={(date: any) => setValue(date as string)}
          placeholder={props.placeholder}
          options={props.options}
        />
      )
      default: return (
        <FormControl
          {...props}
          size='sm'
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        />
      )
    }
  })()
}
