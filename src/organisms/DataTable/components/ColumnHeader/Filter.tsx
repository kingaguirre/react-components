import React from "react";
import { FormControl } from "../../../../atoms/FormControl";
import { FilterContainer } from "./styled";
import { Column } from "@tanstack/react-table";
import { DatePicker } from "../../../../molecules/DatePicker";
import { Dropdown } from "../../../../molecules/Dropdown";

// Filter component using our styled inputs.
export const Filter = ({ column }: { column: Column<any, unknown> }) => {
  const columnFilterValue = column.getFilterValue();
  const colMeta: any = column.columnDef.meta ?? {};
  const { filter } = colMeta;
  const { type: filterType } = filter ?? {};

  const facetedUniqueValues = React.useMemo(
    () => column.getFacetedUniqueValues(),
    [column],
  );
  const facetedUniqueValuesSize = facetedUniqueValues.size;

  const showFacetedValues =
    filterType === "select" ||
    (filterType !== "select" && facetedUniqueValues.size < 10000);

  const sortedUniqueValues = React.useMemo(() => {
    if (filterType === "number-range") return [];
    if (!showFacetedValues) return [];
    return Array.from(facetedUniqueValues.keys())
      .sort((a, b) => a - b)
      .slice(0, 5000);
  }, [facetedUniqueValues, filterType, showFacetedValues]);

  return (
    <FilterContainer className="filter-container">
      {(() => {
        switch (filterType) {
          case "number-range":
            return (
              <>
                <DebouncedInput
                  type="number"
                  value={(columnFilterValue as [number, number])?.[0] ?? ""}
                  onChange={(value) =>
                    column.setFilterValue((old: [number, number]) => [
                      value,
                      old?.[1],
                    ])
                  }
                  min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
                  max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
                  placeholder={`Min ${
                    column.getFacetedMinMaxValues()?.[0] !== undefined
                      ? `(${column.getFacetedMinMaxValues()?.[0]})`
                      : ""
                  }`}
                  columnId={column.id}
                  testId={`filter-${column.id}-min`}
                />
                <DebouncedInput
                  type="number"
                  value={(columnFilterValue as [number, number])?.[1] ?? ""}
                  onChange={(value) =>
                    column.setFilterValue((old: [number, number]) => [
                      old?.[0],
                      value,
                    ])
                  }
                  min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
                  max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
                  placeholder={`Max ${
                    column.getFacetedMinMaxValues()?.[1]
                      ? `(${column.getFacetedMinMaxValues()?.[1]})`
                      : ""
                  }`}
                  columnId={column.id}
                  testId={`filter-${column.id}-max`}
                />
              </>
            );

          case "date":
            return (
              <DebouncedInput
                onChange={(value) => column.setFilterValue(value)}
                placeholder="Select Date"
                type="date"
                value={(columnFilterValue ?? "") as string}
                columnId={column.id}
                testId={`filter-${column.id}`}
              />
            );

          case "date-range":
            return (
              <DebouncedInput
                onChange={(value) => column.setFilterValue(value)}
                placeholder="Select Dates"
                type="date-range"
                range
                value={(columnFilterValue ?? "") as string}
                columnId={column.id}
                testId={`filter-${column.id}`}
            />
            );

          case "dropdown": {
            const options = colMeta?.filter?.options ?? [];
            let _options: any[] = [];

            if (options?.length > 0) {
              _options = options;
            } else {
              const generatedOptions = sortedUniqueValues
                .map((value) => {
                  const isArray = Array.isArray(value);
                  return !isArray
                    ? { value, text: value?.toString() }
                    : undefined;
                })
                .filter((i) => i);

              _options = generatedOptions.length > 0 ? generatedOptions : [];
            }

            return (
              <DebouncedInput
                onChange={(value) => column.setFilterValue(value)}
                placeholder={`Select Options ${
                  showFacetedValues && options?.length > 0
                    ? `(${facetedUniqueValuesSize})`
                    : ""
                }`}
                type="dropdown"
                options={_options}
                value={(columnFilterValue ?? "") as string}
                columnId={column.id}
                testId={`filter-${column.id}`}
              />
            );
          }

          case "number":
            return (
              <DebouncedInput
                onChange={(value) => column.setFilterValue(value)}
                placeholder="Enter number"
                type="number"
                value={(columnFilterValue ?? "") as string}
                columnId={column.id}
                testId={`filter-${column.id}`}
              />
            );

          default:
            return (
              <>
                <DebouncedInput
                  onChange={(value) => column.setFilterValue(value)}
                  type="text"
                  value={(columnFilterValue ?? "") as string}
                  placeholder={`Search... ${
                    showFacetedValues ? `(${facetedUniqueValuesSize})` : ""
                  }`}
                  list={column.id + "list"}
                  columnId={column.id}
                  testId={`filter-${column.id}`}
                />
              </>
            );
        }
      })()}
    </FilterContainer>
  );
};

// DebouncedInput (drop-in replacement)
export const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 150,
  columnId,
  testId,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
  columnId?: string;
  testId?: string;
  [key: string]: any;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) => {
  const [value, setValue] = React.useState(initialValue);

  // keep latest onChange without retriggering the effect
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // prevent re-emitting identical values
  const lastEmittedRef = React.useRef<typeof initialValue>(initialValue);

  const inferredBlur =
    props.type === "dropdown" ||
    props.type === "date" ||
    props.type === "date-range";

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    // don’t emit if nothing changed (breaks the loop)
    if (Object.is(value, lastEmittedRef.current)) return;

    const timeout = setTimeout(() => {
      lastEmittedRef.current = value;
      onChangeRef.current?.(value);

      // only try to blur when we actually emitted
      if (
        inferredBlur &&
        typeof window !== "undefined" &&
        typeof document !== "undefined"
      ) {
        // 1) try a forwarded ref if your control supports it (not shown here)
        // 2) prefer explicit testId (more precise than generic columnId)
        const selector = testId
          ? `[data-testid="${testId}"]`
          : columnId
          ? `[data-testid="filter-${columnId}"]`
          : null;

        const el = selector
          ? (document.querySelector(selector) as HTMLElement | null)
          : (document.activeElement as HTMLElement | null);

        if (el && typeof el.blur === "function") el.blur();
      }
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, debounce, inferredBlur, testId, columnId]);

  const resolvedTestId = testId ?? (columnId ? `filter-${columnId}` : undefined);

  // small helper to normalize numbers
  const coerceNumber = (s: string) => {
    if (s === "" || s === null || s === undefined) return "";
    const n = Number(s);
    return Number.isNaN(n) ? "" : n;
  };

  return (() => {
    switch (props.type) {
      case "date":
        return (
          <DatePicker
            size="sm"
            value={value as string}
            onChange={(date: any) => setValue(date as string)}
            placeholder={props.placeholder}
            testId={resolvedTestId} // your DatePicker should render -date internally
          />
        );

      case "date-range":
        return (
          <DatePicker
            size="sm"
            value={value as string}
            onChange={(date: any) => setValue(date as string)}
            range
            placeholder={props.placeholder}
            testId={resolvedTestId} // your DatePicker should render -start / -end internally
          />
        );

      case "dropdown":
        return (
          <Dropdown
            size="sm"
            value={value as string}
            onChange={(val: any) => setValue(val as string)}
            placeholder={props.placeholder}
            options={props.options}
            hideOnScroll
            testId={resolvedTestId}
          />
        );

      default:
        // supports text/number inputs rendered via FormControl
        return (
          <FormControl
            {...props}
            size="sm"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(
                props.type === "number" ? coerceNumber(e.target.value) : e.target.value
              )
            }
            testId={resolvedTestId}
          />
        );
    }
  })();
};

