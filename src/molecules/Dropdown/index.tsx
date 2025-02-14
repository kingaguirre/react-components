// src/molecules/Dropdown/index.tsx
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  DropdownContainer,
  DropdownList,
  DropdownItem,
  HighlightedText,
  DropdownFilterContainer,
  NoOptionsContainer
} from "./styled";
import { DropdownProps, DropdownOption } from "./interface";
import FormControl from "@atoms/FormControl";

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
  ...rest
}) => {
  const isMulti = !!multiselect;

  // For single select, state is a string; for multiselect, an array.
  const [selectedValue, setSelectedValue] = useState<string | undefined>(
    !isMulti ? (value as string) : undefined
  );
  const [selectedValues, setSelectedValues] = useState<string[]>(
    isMulti && Array.isArray(value) ? value : []
  );

  // displayValue: text shown when dropdown is closed.
  const [displayValue, setDisplayValue] = useState("");
  // Store previous display value in single select so that it’s not cleared if options change.
  const previousDisplayRef = useRef<string>("");
  // filterText: text used for filtering when dropdown is open.
  const [filterText, setFilterText] = useState("");
  // hasTyped: tracks whether the user has started typing in filter.
  const [hasTyped, setHasTyped] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<DropdownOption[]>(options);
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
      if (Array.isArray(value)) {
        setSelectedValues(value);
        setDisplayValue(
          value.length > 0
            ? `${value.length} selected ${value.length === 1 ? "item" : "items"}`
            : ""
        );
      }
    } else {
      // Use the external value if defined (even if empty), otherwise fall back to our internal selectedValue.
      const currentVal =
        value !== undefined && value !== null
          ? (value as string)
          : selectedValue;
      if (currentVal) {
        const selectedOption = options.find(opt => opt.value === currentVal);
        if (selectedOption) {
          setDisplayValue(selectedOption.text);
          previousDisplayRef.current = selectedOption.text;
        } else {
          // If not found in new options, preserve previous display.
          setDisplayValue(previousDisplayRef.current);
        }
        setSelectedValue(currentVal);
      } else {
        setDisplayValue("");
        setSelectedValue(undefined);
        previousDisplayRef.current = "";
      }
    }
  }, [value, options, isMulti]);
  // --- END SYNC EFFECT ---

  // Filtering effect.
  useEffect(() => {
    if (filter) {
      if (!hasTyped) {
        setFilteredOptions(options);
      } else {
        setFilteredOptions(
          options.filter(({ text }) =>
            filterAtBeginning
              ? text.toLowerCase().startsWith(filterText.toLowerCase())
              : text.toLowerCase().includes(filterText.toLowerCase())
          )
        );
      }
    } else {
      setFilteredOptions(options);
    }
  }, [filterText, hasTyped, filterAtBeginning, filter, options]);

  // Recalculate dropdown position.
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  }, [filteredOptions, filterText, isOpen]);

  // When opening the dropdown, preset filter text (for single-select) and set focus.
  useEffect(() => {
    if (isOpen) {
      if (filter && !isMulti && !hasTyped) {
        if (selectedValue) {
          const selOpt = options.find(opt => opt.value === selectedValue);
          setFilterText(selOpt ? selOpt.text : "");
        } else {
          setFilterText("");
        }
      }
      let selectedIndex = -1;
      if (isMulti) {
        if (lastMultiToggledRef.current) {
          const idx = filteredOptions.findIndex(
            opt => opt.value === lastMultiToggledRef.current
          );
          if (idx !== -1) {
            selectedIndex = idx;
          }
        }
        if (selectedIndex === -1 && selectedValues.length > 0) {
          selectedIndex = filteredOptions.findIndex(opt =>
            selectedValues.includes(opt.value)
          );
        }
      } else {
        if (selectedValue) {
          selectedIndex = filteredOptions.findIndex(opt => opt.value === selectedValue);
        }
      }
      if (selectedIndex === -1) {
        selectedIndex = findNextFocusableIndex(-1, "down", filteredOptions);
      }
      setFocusedIndex(selectedIndex);
      updateDropdownPosition();
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", updateDropdownPosition);
      window.addEventListener("resize", updateDropdownPosition);
      setTimeout(() => {
        scrollToFocusedItem();
      }, 30);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updateDropdownPosition);
      window.removeEventListener("resize", updateDropdownPosition);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updateDropdownPosition);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen, options, filter, selectedValue, selectedValues, isMulti, filteredOptions]);

  // Update lastFocusedValueRef whenever focusedIndex is valid.
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
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

  // NEW EFFECT: If filtering causes the current focused option to vanish,
  // set focus to index 0 or revert to the previously focused item if available.
  useEffect(() => {
    if (!isOpen) return;
    if (filteredOptions.length === 0) {
      setFocusedIndex(-1);
      return;
    }
    if (
      focusedIndex < 0 ||
      focusedIndex >= filteredOptions.length ||
      (filteredOptions[focusedIndex] && filteredOptions[focusedIndex].disabled)
    ) {
      setFocusedIndex(0);
      return;
    }
    if (lastFocusedValueRef.current) {
      const lastIndex = filteredOptions.findIndex(
        opt => opt.value === lastFocusedValueRef.current
      );
      if (lastIndex !== -1 && lastIndex !== focusedIndex) {
        setFocusedIndex(lastIndex);
      }
    }
  }, [filteredOptions, isOpen]);

  // Always scroll the focused item into view.
  useEffect(() => {
    scrollToFocusedItem();
  }, [focusedIndex]);

  const findNextFocusableIndex = (
    currentIndex: number,
    direction: "up" | "down",
    optionsArray: DropdownOption[] = filteredOptions
  ): number => {
    if (optionsArray.length === 0) return -1;
    if (direction === "down") {
      if (currentIndex < 0) {
        for (let i = 0; i < optionsArray.length; i++) {
          if (!optionsArray[i]?.disabled) return i;
        }
        return -1;
      }
      for (let i = currentIndex + 1; i < optionsArray.length; i++) {
        if (!optionsArray[i]?.disabled) return i;
      }
      return currentIndex;
    } else {
      if (currentIndex < 0) {
        for (let i = optionsArray.length - 1; i >= 0; i--) {
          if (!optionsArray[i]?.disabled) return i;
        }
        return -1;
      }
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (!optionsArray[i]?.disabled) return i;
      }
      return currentIndex;
    }
  };

  const handleSelect = (selectedVal: string) => {
    if (isMulti) {
      setSelectedValues(prev => {
        let newSelected: string[];
        if (prev.includes(selectedVal)) {
          newSelected = prev.filter(val => val !== selectedVal);
        } else {
          newSelected = [...prev, selectedVal];
        }
        setDisplayValue(
          newSelected.length > 0
            ? `${newSelected.length} selected ${newSelected.length === 1 ? "item" : "items"}`
            : ""
        );
        if (filter) {
          setFilterText("");
          setHasTyped(false);
        }
        // Save toggled value so arrow navigation starts from here.
        lastMultiToggledRef.current = selectedVal;
        const newFocusIndex = filteredOptions.findIndex(opt => opt.value === selectedVal);
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
      const selectedOption = options.find(opt => opt.value === selectedVal);
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
      setSelectedValue(undefined);
      onChange?.("");
      // For single-select, open the dropdown and focus the FormControl.
      setIsOpen(true);
      setTimeout(() => {
        formControlRef.current?.focus();
        scrollToFocusedItem();
      }, 0);
    }
  };

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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        setIsOpen(true);
        event.preventDefault();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex(prev => findNextFocusableIndex(prev, "down", filteredOptions));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex(prev => findNextFocusableIndex(prev, "up", filteredOptions));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (focusedIndex >= 0 && !filteredOptions[focusedIndex]?.disabled) {
        handleSelect(filteredOptions[focusedIndex]?.value);
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
      spaceBelow < dropdownHeight && spaceAbove > dropdownHeight ? "top" : "bottom";
    if (filteredOptions.length <= 1) {
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
    return text.split(regex).map((part, index) =>
      part.toLowerCase() === filterText.toLowerCase() ? (
        <HighlightedText key={index}>{part}</HighlightedText>
      ) : (
        part
      )
    );
  };

  const dropdownContent = (
    <DropdownList
      ref={listRef}
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
      $size={size}
      $position={dropdownPosition.position}
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
            onChange={(e: any) => {
              setFilterText(e.target.value);
              setHasTyped(true);
            }}
            onKeyDown={handleKeyDown}
          />
        </DropdownFilterContainer>
      )}
      {filteredOptions.length > 0 ? (
        filteredOptions.map(({ value, text, disabled }, index) => (
          <DropdownItem
            $size={size}
            key={value}
            disabled={disabled}
            className={`${index === focusedIndex ? "focused" : ""} ${
              isMulti
                ? selectedValues.includes(value)
                  ? "selected"
                  : ""
                : value === selectedValue
                ? "selected"
                : ""
            }`}
            onClick={() => !disabled && handleSelect(value)}
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
        ))
      ) : <NoOptionsContainer>No options found</NoOptionsContainer>}
    </DropdownList>
  );

  return (
    <DropdownContainer ref={dropdownRef}>
      <FormControl
        {...rest}
        ref={formControlRef}
        type="text"
        autoComplete="off"
        value={
          isMulti
            ? displayValue
            : isOpen && filter
            ? hasTyped
              ? filterText
              : displayValue
            : displayValue
        }
        placeholder={placeholder}
        readOnly={isMulti || !filter || !isOpen}
        disabled={disabled}
        size={size}
        onClick={() => setIsOpen(prev => !prev)}
        onChange={
          filter && !isMulti
            ? (e: React.ChangeEvent<HTMLInputElement>) => {
                setFilterText(e.target.value);
                setHasTyped(true);
              }
            : undefined
        }
        onKeyDown={handleKeyDown}
        iconRight={[
          ...((isMulti ? selectedValues.length > 0 : selectedValue)
            ? [
                {
                  icon: "clear",
                  onClick: handleClear,
                  color: "default",
                  hoverColor: "danger",
                  className: "clear-icon"
                },
              ]
            : []),
          { icon: "keyboard_arrow_down", onClick: () => setIsOpen(prev => !prev) },
        ]}
      />
      {isOpen && ReactDOM.createPortal(dropdownContent, document.body)}
    </DropdownContainer>
  );
};

export default Dropdown;
