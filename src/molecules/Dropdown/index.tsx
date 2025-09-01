// src/molecules/Dropdown/index.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  DropdownContainer,
  DropdownList,
  DropdownItem,
  HighlightedText,
  DropdownFilterContainer,
  NoOptionsContainer,
} from "./styled";
import { DropdownProps, DropdownOption } from "./interface";
import { FormControl } from "../../atoms/FormControl";
import { ifElse } from "../../utils/index";
import { getScrollParent } from "../../utils";

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  filter = false,
  filterAtBeginning = false,
  placeholder = "Select an option",
  size = "md",
  disabled = false,
  multiselect,
  clearable = true,
  dropdownHeight,
  dropdownWidth,
  hideOnScroll = false,
  onBlur,
  onFilterChange,
  loading,
  showDisabledIcon = false,
  ...rest
}) => {
  const isMulti = !!multiselect;

  // stable no-op to keep FormControl controlled when readOnly
  const noop = useCallback(() => {}, []);

  // For single select, state is a string for multiselect, an array.
  const [selectedValue, setSelectedValue] = useState<string | undefined | null>(
    !isMulti ? (value as string) : undefined,
  );
  const [selectedValues, setSelectedValues] = useState<string[]>(
    isMulti && Array.isArray(value) ? value : [],
  );

  // displayValue: text shown when dropdown is closed.
  const [displayValue, setDisplayValue] = useState("");
  // Store previous display value in single select so that it’s not cleared if options change.
  const previousDisplayRef = useRef<string>("");
  // filterText: text used for filtering when dropdown is open.
  const [filterText, setFilterText] = useState("");
  // hasTyped: tracks whether the user has started typing in filter.
  const [hasTyped, setHasTyped] = useState(false);
  const [filteredOptions, setFilteredOptions] =
    useState<DropdownOption[]>(options);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    position: "bottom",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // NEW: Ref for the filter input (multiselect filtering)
  const filterInputRef = useRef<HTMLInputElement>(null);
  // NEW: Ref for the FormControl input (single-select)
  const formControlRef = useRef<HTMLInputElement>(null);
  // NEW: Ref to store the last toggled value in multiselect mode.
  const lastMultiToggledRef = useRef<string | null>(null);
  // Existing ref to store last valid focused value.
  const lastFocusedValueRef = useRef<string | null>(null);

  // --- SYNC EXTERNAL VALUE CHANGES ---
  useEffect(() => {
    if (isMulti) {
      if (!Array.isArray(value)) return;

      setSelectedValues(value);

      const text =
        value.length > 0
          ? `${value.length} selected ${ifElse(value.length === 1, "item", "items")}`
          : "";
      setDisplayValue(text);
      return;
    }

    const currentVal = value != null ? (value as string) : "";
    const selectedOption = options.find((opt) => opt.value === currentVal);

    if (!currentVal) {
      setDisplayValue("");
      setSelectedValue(undefined);
      previousDisplayRef.current = "";
    } else if (selectedOption) {
      setDisplayValue(selectedOption.text);
      previousDisplayRef.current = selectedOption.text;
    } else {
      setDisplayValue(previousDisplayRef.current);
    }

    setSelectedValue(currentVal);
  }, [value, options, isMulti, onChange]);
  // --- END SYNC EFFECT ---

  // Filtering effect.
  useEffect(() => {
    // Filter methods:
    const startsWithFilter = (text: string, filterText: string) =>
      text.toLowerCase().startsWith(filterText.toLowerCase());

    const includesFilter = (text: string, filterText: string) =>
      text.toLowerCase().includes(filterText.toLowerCase());

    // Returns the filtered options based on whether the user has typed:
    const getFilteredOptions = () => {
      if (!hasTyped) {
        return options;
      }
      return options.filter(({ text }) =>
        filterAtBeginning
          ? startsWithFilter(text, filterText)
          : includesFilter(text, filterText),
      );
    };

    // Set filtered options depending on the filter flag:
    if (filter) {
      setFilteredOptions(getFilteredOptions());
    } else {
      setFilteredOptions(options);
    }
  }, [filterText, hasTyped, filterAtBeginning, filter, options]);

  // Recalculate dropdown position.
  useEffect(() => {
    if (isOpen && !hideOnScroll) {
      updateDropdownPosition();
    }
  }, [filteredOptions, filterText, isOpen, hideOnScroll]);

  // NEW: Focus/Blur Handlers to open/close the dropdown based on focus.
  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay to allow clicks within the dropdown to register.
    setTimeout(() => {
      const activeEl = document.activeElement;
      if (
        activeEl !== formControlRef.current &&
        !(listRef.current && listRef.current.contains(activeEl))
      ) {
        setIsOpen(false);
      }
    }, 0);

    onBlur?.(e);
  };

  // When opening the dropdown, preset filter text (for single-select) and set focus.
  useEffect(() => {
    // Choose the appropriate scroll handler based on hideOnScroll prop.
    const scrollParent = getScrollParent(formControlRef.current);
    const handleScroll = () => {
      if (hideOnScroll) {
        setIsOpen(false);
      } else {
        updateDropdownPosition();
      }
    };

    const attachEventListeners = () => {
      scrollParent.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", updateDropdownPosition);
      document.addEventListener("mousedown", handleClickOutside);
    };

    const detachEventListeners = () => {
      scrollParent.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateDropdownPosition);
      document.removeEventListener("mousedown", handleClickOutside);
    };

    const updateFilterText = () => {
      if (filter && !isMulti && !hasTyped) {
        if (selectedValue) {
          const selOpt = options.find((opt) => opt.value === selectedValue);
          setFilterText(selOpt ? selOpt.text : "");
        } else {
          setFilterText("");
        }
      }
    };

    const computeSelectedIndex = () => {
      if (isMulti) {
        if (lastMultiToggledRef.current) {
          const idx = filteredOptions.findIndex(
            (opt) => opt.value === lastMultiToggledRef.current,
          );
          if (idx !== -1) {
            return idx;
          }
        }
        if (selectedValues.length > 0) {
          const idx = filteredOptions.findIndex((opt) =>
            selectedValues.includes(opt.value),
          );
          if (idx !== -1) {
            return idx;
          }
        }
      } else if (selectedValue) {
        const idx = filteredOptions.findIndex(
          (opt) => opt.value === selectedValue,
        );
        if (idx !== -1) {
          return idx;
        }
      }
      return findNextFocusableIndex(-1, "down", filteredOptions);
    };

    if (isOpen) {
      updateFilterText();
      const selectedIndex = computeSelectedIndex();
      setFocusedIndex(selectedIndex);
      updateDropdownPosition();
      attachEventListeners();
      setTimeout(scrollToFocusedItem, 30);
    } else {
      detachEventListeners();
    }

    return detachEventListeners;
  }, [
    isOpen,
    options,
    filter,
    selectedValue,
    selectedValues,
    isMulti,
    filteredOptions,
    hideOnScroll,
  ]);

  // Update lastFocusedValueRef whenever focusedIndex is valid.
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && focusedIndex < filteredOptions?.length) {
      lastFocusedValueRef.current = filteredOptions[focusedIndex].value;
    }
  }, [focusedIndex, filteredOptions, isOpen]);

  // NEW EFFECT: When dropdown is open and filteredOptions or focusedIndex changes,
  // add a short delay then scroll the focused item into view.
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      setTimeout(() => {
        scrollToFocusedItem();
      }, 50);
    }
  }, [isOpen, filteredOptions, focusedIndex]);

  // NEW EFFECT: When closing the dropdown, clear the current filter so that reopening shows only the selected value.
  useEffect(() => {
    if (!isOpen) {
      setFilterText("");
      setHasTyped(false);
    }
  }, [isOpen]);

  const findNextFocusableIndex = (
    currentIndex: number,
    direction: "up" | "down",
    optionsArray: DropdownOption[] = filteredOptions,
  ): number => {
    if (!optionsArray?.length) return -1;

    // Check if we're starting fresh (currentIndex < 0)
    const isInitial = currentIndex < 0;
    const step = direction === "down" ? 1 : -1;
    const start = isInitial
      ? ifElse(direction === "down", 0, optionsArray.length - 1)
      : currentIndex + step;
    // For 'down' we go until optionsArray.length, for 'up' until -1 (exclusive)
    const end = direction === "down" ? optionsArray.length : -1;

    for (let i = start; direction === "down" ? i < end : i > end; i += step) {
      if (!optionsArray[i]?.disabled) return i;
    }

    // If no eligible option found, mimic original behavior:
    // Return -1 if starting fresh, else return the original currentIndex.
    return isInitial ? -1 : currentIndex;
  };

  const handleSelect = (
    selectedVal: string,
    e: React.MouseEvent<HTMLLIElement, MouseEvent> | React.KeyboardEvent,
  ) => {
    e.stopPropagation();
    if (isMulti) {
      setSelectedValues((prev) => {
        let newSelected: string[];
        if (prev.includes(selectedVal)) {
          newSelected = prev.filter((val) => val !== selectedVal);
        } else {
          newSelected = [...prev, selectedVal];
        }
        setDisplayValue(
          newSelected.length > 0
            ? `${newSelected.length} selected ${ifElse(newSelected.length === 1, "item", "items")}`
            : "",
        );
        if (filter) {
          setFilterText("");
          setHasTyped(false);
        }
        // Save toggled value so arrow navigation starts from here.
        lastMultiToggledRef.current = selectedVal;
        const newFocusIndex = filteredOptions.findIndex(
          (opt) => opt.value === selectedVal,
        );
        if (newFocusIndex !== -1) {
          setFocusedIndex(newFocusIndex);
        }
        onChange?.(newSelected);
        return newSelected;
      });
      // Re-focus the filter input so that arrow navigation and Enter still work
      if (filter) {
        setTimeout(() => {
          filterInputRef.current?.focus();
        }, 0);
      }
    } else {
      const selectedOption = options.find((opt) => opt.value === selectedVal);
      if (!selectedOption) return;
      setIsOpen(false);
      setDisplayValue(selectedOption.text);
      setSelectedValue(selectedVal);
      if (filter) {
        setFilterText(selectedOption.text);
        setHasTyped(false);
      }
      onChange?.(selectedVal);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    setDisplayValue("");
    setFilterText("");
    // NEW: Reset focusedIndex to 0 so that scroll resets to the top.
    setFocusedIndex(0);
    if (isMulti) {
      setSelectedValues([]);
      onChange?.([]);
      if (filter) {
        setIsOpen(true);
        setTimeout(() => {
          filterInputRef.current?.focus();
          scrollToFocusedItem();
        }, 0);
      }
    } else {
      // For single-select, reset the value to an empty string.
      setSelectedValue(null);
      onChange?.(null);
      // For single-select, open the dropdown and focus the FormControl.
      setIsOpen(true);
      setTimeout(() => {
        formControlRef.current?.focus();
        scrollToFocusedItem();
      }, 0);
    }
  };

  // Handle clicks outside the dropdown to close it.
  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      listRef.current &&
      !listRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  // Handle keyboard navigation within the dropdown.
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        setIsOpen(true);
        event.preventDefault();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex((prev) =>
        findNextFocusableIndex(prev, "down", filteredOptions),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex((prev) =>
        findNextFocusableIndex(prev, "up", filteredOptions),
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (focusedIndex >= 0 && !filteredOptions[focusedIndex]?.disabled) {
        handleSelect(filteredOptions[focusedIndex]?.value, event);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  const scrollToFocusedItem = () => {
    if (
      listRef.current &&
      focusedIndex >= 0 &&
      listRef.current.children[focusedIndex]
    ) {
      const focusedItem = listRef.current.children[focusedIndex] as HTMLElement;
      if (focusedItem) {
        focusedItem.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: "smooth",
        });
      }
    }
  };

  const updateDropdownPosition = () => {
    // Now using formControlRef for bounding client calculations.
    if (!formControlRef.current || !listRef.current) return;
    const rect = formControlRef.current.getBoundingClientRect();
    const dropdownHeight = listRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let position =
      spaceBelow < dropdownHeight && spaceAbove > dropdownHeight
        ? "top"
        : "bottom";
    if (filteredOptions?.length <= 1) {
      position = "bottom";
    }
    setDropdownPosition({
      top: position === "top" ? rect.top - dropdownHeight : rect.bottom,
      left: rect.left,
      width: rect.width,
      position,
    });
  };

  const highlightMatch = (text: string) => {
    if (!filter || !hasTyped || !filterText) return text;
    // If filtering by beginning, highlight only the first characters.
    if (filterAtBeginning) {
      if (text.toLowerCase().startsWith(filterText.toLowerCase())) {
        const prefix = text.substring(0, filterText.length);
        const rest = text.substring(filterText.length);
        return (
          <>
            <HighlightedText>{prefix}</HighlightedText>
            {rest}
          </>
        );
      }
      return text;
    }
    // Otherwise highlight all occurrences.
    const regex = new RegExp(`(${filterText})`, "gi");
    return (
      <span>
        {text
          .split(regex)
          .map((part, i: number) =>
            part.toLowerCase() === filterText.toLowerCase() ? (
              <HighlightedText key={`key-${part}-${i}`}>{part}</HighlightedText>
            ) : (
              part
            ),
          )}
      </span>
    );
  };

  const getSelectedClass = (index: number, value: string) => {
    let focusClass = "";
    let selectedClass = "";

    if (index === focusedIndex) {
      focusClass = "focused";
    }

    if (
      (isMulti && selectedValues.includes(value)) ||
      (!isMulti && value === selectedValue)
    ) {
      selectedClass = "selected";
    }

    return `${focusClass} ${selectedClass}`;
  };

  const getValue = () => {
    if (isMulti) {
      return displayValue;
    }

    if (isOpen && filter) {
      if (hasTyped) {
        return filterText;
      } else {
        return displayValue;
      }
    } else {
      return displayValue;
    }
  };

  const getClearIcon = () => {
    if (disabled) return []; // nothing clickable when disabled

    const shouldShowClear = isMulti ? selectedValues.length > 0 : selectedValue;

    return shouldShowClear
      ? [
          {
            icon: "clear",
            onClick: handleClear,
            color: "default",
            hoverColor: "danger",
            className: "clear-icon",
          },
        ]
      : [];
  };

  const handleFilterChange = (text: string) => {
    setFilterText(text);
    setHasTyped(true);
    if (onFilterChange) {
      onFilterChange(text);
    }
  };

  // 4) Build right-side icons with disabled-aware caret (no onClick when disabled)
  const rightIcons = [
    ...(clearable || isMulti ? getClearIcon() : []),
    ...(disabled && showDisabledIcon
      ? [
          {
            icon: "lock_outline",
            className: "disabled-icon",
          },
        ]
      : []),
    {
      icon: "keyboard_arrow_down",
      onClick: disabled ? undefined : () => setIsOpen(true),
      className: disabled ? "caret-icon disabled" : "caret-icon",
    },
  ];

  const dropdownContent = (
    <DropdownList
      ref={listRef}
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownWidth || dropdownPosition.width,
      }}
      $size={size}
      $dropdownHeight={dropdownHeight}
      $position={dropdownPosition.position}
      className="dropdown-list"
      role="dropdown-menu"
      data-testid="dropdown-menu"
    >
      {isMulti && filter && (
        <DropdownFilterContainer>
          <FormControl
            ref={filterInputRef}
            type="text"
            autoFocus
            placeholder="Filter options..."
            value={filterText}
            size="sm"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              handleFilterChange(e.target.value);
            }}
            onKeyDown={handleKeyDown}
          />
        </DropdownFilterContainer>
      )}
      {filteredOptions?.length > 0 ? (
        <>
          {isMulti && (
            <DropdownItem
              $size={size}
              role="dropdown-menu-item"
              data-testid="select-all"
              aria-disabled={undefined}
              key="select-all"
              className={`select-all ${selectedValues.length === options.filter((o) => !o.disabled).length ? "selected" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const allSelected =
                  selectedValues.length ===
                  options.filter((o) => !o.disabled).length;

                const newValues = allSelected
                  ? []
                  : options.filter((o) => !o.disabled).map((o) => o.value);

                setSelectedValues(newValues);
                setDisplayValue(
                  newValues.length > 0
                    ? `${newValues.length} selected ${ifElse(newValues.length === 1, "item", "items")}`
                    : "",
                );
                onChange?.(newValues);
                // Refocus the filter input if needed
                if (filter) {
                  setTimeout(() => {
                    filterInputRef.current?.focus();
                    setFocusedIndex(0);
                    scrollToFocusedItem();
                  }, 0);
                }
              }}
            >
              <FormControl
                type="checkbox"
                readOnly
                checked={
                  selectedValues.length ===
                  options.filter((o) => !o.disabled).length
                }
                simple
              />
              Select All
            </DropdownItem>
          )}
          {filteredOptions.map(({ value, text, disabled }, index) => (
            <DropdownItem
              $size={size}
              key={`${value}-${index}`}
              data-testid={text}
              disabled={disabled}
              onMouseDown={(e) => e.preventDefault()}
              className={getSelectedClass(index, value)}
              role="dropdown-menu-item"
              aria-disabled={disabled || undefined}
              aria-selected={
                (isMulti && selectedValues.includes(value)) ||
                (!isMulti && value === selectedValue) ||
                undefined
              }
              onClick={(e: React.MouseEvent<HTMLLIElement, MouseEvent>) =>
                !disabled && handleSelect(value, e)
              }
            >
              {isMulti && (
                <FormControl
                  type="checkbox"
                  readOnly
                  checked={selectedValues.includes(value)}
                  simple
                  disabled={disabled}
                />
              )}
              {highlightMatch(text)}
            </DropdownItem>
          ))}
        </>
      ) : (
        <NoOptionsContainer>No options found</NoOptionsContainer>
      )}
    </DropdownList>
  );

  return (
    <DropdownContainer ref={dropdownRef} className="dropdown-container">
      <FormControl
        {...rest}
        ref={formControlRef}
        type="text"
        value={getValue()}
        placeholder={placeholder}
        readOnly={isMulti || !filter || !isOpen}
        disabled={disabled}
        size={size}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={() => setIsOpen(true)}
        className={`${rest.className ?? ""} form-control-dropdown-container`}
        clearable={false}
        showDisabledIcon={false}
        onChange={
          filter && !isMulti
            ? (e: React.ChangeEvent<HTMLInputElement>) => {
                handleFilterChange(e.target.value);
              }
            : noop
        }
        onKeyDown={handleKeyDown}
        iconRight={rightIcons}
        loading={loading}
      />
      {isOpen && ReactDOM.createPortal(dropdownContent, document.body)}
    </DropdownContainer>
  );
};
