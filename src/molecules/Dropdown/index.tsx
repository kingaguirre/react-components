// src/molecules/Dropdown/index.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import ReactDOM from "react-dom";
import {
  DropdownContainer,
  DropdownList,
  DropdownItem,
  HighlightedText,
  DropdownFilterContainer,
  NoOptionsContainer,
  CustomRow,
  CustomInputWrap,
  OverlapAction,
  RowAffordance,
  EditRow,
} from "./styled";
import { DropdownProps, DropdownOption } from "./interface";
import { FormControl } from "../../atoms/FormControl";
import { Button } from "../../atoms/Button";
import { Icon } from "../../atoms/Icon";
import { ifElse } from "../../utils";
import { getScrollParent } from "../../utils";

const CUSTOM_SENTINEL = "__dropdown_custom__";
const isCustomValue = (v: string) => v.startsWith("custom-");

/** slugify -> lower, trim, non-alnum => '-', collapse, trim '-' */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isInteractiveElement = (node: Element | null) => {
  if (!node) return false;
  const el = node as HTMLElement;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    tag === "BUTTON"
  );
};

const sameOptions = (a: DropdownOption[], b: DropdownOption[]) =>
  a === b ||
  (a?.length === b?.length &&
    a.every(
      (o, i) =>
        o.value === b[i].value &&
        o.text === b[i].text &&
        !!o.disabled === !!b[i].disabled,
    ));

// Defer a callback to avoid "update parent while rendering child" warnings
const defer = (fn: () => void) => {
  if (typeof queueMicrotask === "function") queueMicrotask(fn);
  else Promise.resolve().then(fn);
};

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

  enableCustomOption,
  customOption,

  ...rest
}) => {
  const isMulti = !!multiselect;
  const noop = useCallback(() => {}, []);

  // Custom-option config
  const customEnabled = !!enableCustomOption;
  const mergedCustomCfg = useMemo(
    () => ({
      label: customOption?.label ?? "Others",
      prefix: customOption?.prefix ?? "Others - ",
      addText: customOption?.addText ?? "Add",
      onAdd: customOption?.onAdd,
      onEdit: customOption?.onEdit,
      options: customOption?.options ?? [],
      allowMultiple: customOption?.allowMultiple ?? false,
      optionAtTop: customOption?.optionAtTop ?? false,
    }),
    [customOption],
  );

  // Local custom options created during this session
  const [newOptions, setNewOptions] = useState<DropdownOption[]>([]);
  // Local label overrides for edits to persisted options (value is preserved)
  const [editedLabels, setEditedLabels] = useState<Record<string, string>>({});

  // Validation state for add/edit
  const [addError, setAddError] = useState(false);
  const [editError, setEditError] = useState(false);
  const REQUIRED_MSG = "This field is Required";

  // Hide "Others" once a custom is added when allowMultiple is false
  const showCustomRow =
    customEnabled && (mergedCustomCfg.allowMultiple || newOptions.length === 0);

  /**
   * If caller clears persisted custom options, also clear session-added ones
   * so “Clear persisted” truly resets everything. Also reset validation state.
   */
  const prevPersistedLenRef = useRef<number>(mergedCustomCfg.options.length);
  useEffect(() => {
    const len = mergedCustomCfg.options.length;
    if (prevPersistedLenRef.current !== len && len === 0) {
      if (newOptions.length) setNewOptions([]);
      if (Object.keys(editedLabels).length) setEditedLabels({});
      if (addError) setAddError(false);
      if (editError) setEditError(false);
    }
    prevPersistedLenRef.current = len;
  }, [
    mergedCustomCfg.options,
    newOptions.length,
    editedLabels,
    addError,
    editError,
  ]);

  /**
   * Build final list with explicit dedupe + render-order control.
   * - Dedupe winners: persisted > base > session
   * - Render order:
   *    optionAtTop = true  => session → persisted → base
   *    optionAtTop = false => base → persisted → session  (new customs at bottom)
   */
  const combinedOptions = useMemo(() => {
    const persisted = mergedCustomCfg.options || [];
    const base = options || [];
    const session = newOptions || [];

    // 1) Decide dedupe winners (first-wins with persisted before base)
    const winnersOrder = [persisted, base, session];
    const keep = new Map<string, DropdownOption>();
    for (const group of winnersOrder) {
      for (const o of group) {
        if (!keep.has(o.value)) keep.set(o.value, o);
      }
    }

    // 2) Decide render order (top vs bottom for session customs)
    const renderOrder = mergedCustomCfg.optionAtTop
      ? [session, persisted, base] // TOP: session first
      : [base, persisted, session]; // BOTTOM: session last

    // 3) Emit in render order, but only the dedupe winners; apply edited label overrides
    const out: DropdownOption[] = [];
    for (const group of renderOrder) {
      for (const o of group) {
        const win = keep.get(o.value);
        if (!win) continue;
        // push only once
        if (out.find((x) => x.value === win.value)) continue;
        const finalItem = editedLabels[win.value]
          ? { ...win, text: editedLabels[win.value] }
          : win;
        out.push(finalItem);
      }
    }
    return out;
  }, [
    options,
    mergedCustomCfg.options,
    newOptions,
    editedLabels,
    mergedCustomCfg.optionAtTop,
  ]);

  // Which values are editable? (all custom ones: session or persisted)
  const editableSet = useMemo(() => {
    const s = new Set<string>();
    for (const o of newOptions) s.add(o.value);
    for (const o of mergedCustomCfg.options) s.add(o.value);
    for (const o of combinedOptions) if (isCustomValue(o.value)) s.add(o.value);
    return s;
  }, [newOptions, mergedCustomCfg.options, combinedOptions]);

  // Value state
  const [selectedValue, setSelectedValue] = useState<string | undefined | null>(
    !isMulti ? (value as string) : undefined,
  );
  const [selectedValues, setSelectedValues] = useState<string[]>(
    isMulti && Array.isArray(value) ? value : [],
  );

  // Display/filter
  const [displayValue, setDisplayValue] = useState("");
  const previousDisplayRef = useRef<string>("");
  const [filterText, setFilterText] = useState("");
  const [hasTyped, setHasTyped] = useState(false);
  const [filteredOptions, setFilteredOptions] =
    useState<DropdownOption[]>(combinedOptions);

  // Positioning
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    position: "bottom" as "bottom" | "top",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const formControlRef = useRef<HTMLInputElement>(null);

  // Custom creation mode
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);
  const [customText, setCustomText] = useState<string>("");

  // Inline edit mode for a specific custom value
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [editText, setEditText] = useState<string>("");

  // Navigation helpers
  const lastMultiToggledRef = useRef<string | null>(null);
  const lastFocusedValueRef = useRef<string | null>(null);

  // Pointer-inside guard to avoid blur-closing when clicking inside the list
  const mouseDownInsideRef = useRef(false);
  useEffect(() => {
    const onMouseUp = () => {
      setTimeout(() => (mouseDownInsideRef.current = false), 0);
    };
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, []);

  // Flash-highlight value (for newly added or duplicates)
  const [flashValue, setFlashValue] = useState<string | null>(null);
  useEffect(() => {
    if (!flashValue) return;
    const t = setTimeout(() => setFlashValue(null), 700);
    return () => clearTimeout(t);
  }, [flashValue]);

  // When we need to move focus to a specific value after list changes
  const focusRequestRef = useRef<string | null>(null);

  // --- SYNC EXTERNAL VALUE CHANGES ---
  useEffect(() => {
    if (typeof value === "undefined") return; // uncontrolled → do nothing here

    if (isMulti) {
      if (!Array.isArray(value)) return;
      setSelectedValues((prev) => (prev === value ? prev : value));
      const text = value.length
        ? `${value.length} selected ${ifElse(value.length === 1, "item", "items")}`
        : "";
      setDisplayValue((prev) => (prev === text ? prev : text));
      return;
    }

    const currentVal = value != null ? (value as string) : "";
    const selectedOption = combinedOptions.find((o) => o.value === currentVal);

    if (!currentVal) {
      if (displayValue !== "") setDisplayValue("");
      if (selectedValue !== undefined) setSelectedValue(undefined);
      previousDisplayRef.current = "";
    } else if (selectedOption) {
      if (displayValue !== selectedOption.text)
        setDisplayValue(selectedOption.text);
      if (selectedValue !== currentVal) setSelectedValue(currentVal);
      previousDisplayRef.current = selectedOption.text;
    } else {
      if (displayValue !== previousDisplayRef.current)
        setDisplayValue(previousDisplayRef.current);
      if (selectedValue !== currentVal) setSelectedValue(currentVal);
    }
  }, [value, combinedOptions, isMulti]);

  useEffect(() => {
    if (typeof value !== "undefined") return; // controlled handled above
    if (isMulti) return;
    if (!selectedValue) return;
    const sel = combinedOptions.find((o) => o.value === selectedValue);
    if (sel && displayValue !== sel.text) {
      setDisplayValue(sel.text);
    }
  }, [combinedOptions, selectedValue, isMulti, value, displayValue]);

  // Filtering
  useEffect(() => {
    const startsWith = (t: string, ft: string) =>
      t.toLowerCase().startsWith(ft.toLowerCase());
    const includes = (t: string, ft: string) =>
      t.toLowerCase().includes(ft.toLowerCase());

    const next =
      !filter || !hasTyped
        ? combinedOptions
        : combinedOptions.filter(({ text }) =>
            filterAtBeginning
              ? startsWith(text, filterText)
              : includes(text, filterText),
          );

    setFilteredOptions((prev) => (sameOptions(prev, next) ? prev : next));
  }, [filterText, hasTyped, filterAtBeginning, filter, combinedOptions]);

  // Build list with position control
  const visibleItems = useMemo(() => {
    if (!showCustomRow) return filteredOptions;
    const others = {
      value: CUSTOM_SENTINEL,
      text: mergedCustomCfg.label,
      disabled: false,
    };
    return mergedCustomCfg.optionAtTop
      ? [others, ...filteredOptions]
      : [...filteredOptions, others];
  }, [
    showCustomRow,
    filteredOptions,
    mergedCustomCfg.label,
    mergedCustomCfg.optionAtTop,
  ]);

  // Recompute position
  useEffect(() => {
    if (isOpen && !hideOnScroll) updateDropdownPosition();
  }, [visibleItems, filterText, isOpen, hideOnScroll]);

  const handleFocus = () => setIsOpen(true);

  const handleBlur = (e: React.FocusEvent) => {
    setTimeout(() => {
      const activeEl = document.activeElement;
      const clickingInside = mouseDownInsideRef.current;
      const insideList =
        !!listRef.current && !!activeEl && listRef.current.contains(activeEl);
      const onTrigger = activeEl === formControlRef.current;

      if (clickingInside) return;

      if (insideList) {
        if (isInteractiveElement(activeEl)) return;
        formControlRef.current?.focus();
        return;
      }

      if (onTrigger) return;

      setIsOpen(false);
      setIsCreatingCustom(false);
      setEditingValue(null);
      setAddError(false);
      setEditError(false);
    }, 0);

    onBlur?.(e);
  };

  // Open lifecycle: listeners + initial focus index
  useEffect(() => {
    const scrollParent = getScrollParent(formControlRef.current);
    const onScroll = () =>
      hideOnScroll ? setIsOpen(false) : updateDropdownPosition();

    const attach = () => {
      scrollParent.addEventListener("scroll", onScroll);
      window.addEventListener("resize", updateDropdownPosition);
      document.addEventListener("mousedown", handleClickOutside);
    };
    const detach = () => {
      scrollParent.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateDropdownPosition);
      document.removeEventListener("mousedown", handleClickOutside);
    };

    const findNextFocusableIndex = (
      currentIndex: number,
      direction: "up" | "down",
      arr: DropdownOption[] = visibleItems,
    ) => {
      if (!arr.length) return -1;
      const initial = currentIndex < 0;
      const step = direction === "down" ? 1 : -1;
      const start = initial
        ? direction === "down"
          ? 0
          : arr.length - 1
        : currentIndex + step;
      const end = direction === "down" ? arr.length : -1;

      for (let i = start; direction === "down" ? i < end : i > end; i += step) {
        if (!arr[i]?.disabled) return i;
      }
      return initial ? -1 : currentIndex;
    };

    const computeIndex = () => {
      if (isMulti && lastMultiToggledRef.current) {
        const i = visibleItems.findIndex(
          (o) => o.value === lastMultiToggledRef.current,
        );
        if (i !== -1) return i;
      }
      if (isMulti && selectedValues.length) {
        const i = visibleItems.findIndex((o) =>
          selectedValues.includes(o.value),
        );
        if (i !== -1) return i;
      }
      if (!isMulti && selectedValue) {
        const i = visibleItems.findIndex((o) => o.value === selectedValue);
        if (i !== -1) return i;
      }
      return findNextFocusableIndex(-1, "down", visibleItems);
    };

    if (isOpen) {
      if (filter && !isMulti && !hasTyped) {
        if (selectedValue) {
          const sel = combinedOptions.find((o) => o.value === selectedValue);
          setFilterText(sel ? sel.text : "");
        } else {
          setFilterText("");
        }
      }
      const idx = computeIndex();
      setFocusedIndex((prev) => (prev === idx ? prev : idx));
      updateDropdownPosition();
      attach();
      setTimeout(scrollToFocusedItem, 30);
    } else {
      detach();
    }
    return detach;
  }, [
    isOpen,
    filter,
    selectedValue,
    selectedValues,
    isMulti,
    visibleItems,
    hideOnScroll,
    hasTyped,
    combinedOptions,
  ]);

  // Track last focused value
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && focusedIndex < visibleItems.length) {
      lastFocusedValueRef.current = visibleItems[focusedIndex].value;
    }
  }, [focusedIndex, visibleItems, isOpen]);

  // Smooth scroll to focused
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) setTimeout(scrollToFocusedItem, 50);
  }, [isOpen, visibleItems, focusedIndex]);

  // Apply any queued focus (e.g. after add/duplicate)
  useEffect(() => {
    const want = focusRequestRef.current;
    if (!want || !isOpen) return;
    const idx = visibleItems.findIndex((o) => o.value === want);
    if (idx !== -1) {
      setFocusedIndex((prev) => (prev === idx ? prev : idx));
      setTimeout(scrollToFocusedItem, 0);
      focusRequestRef.current = null;
    }
  }, [isOpen, visibleItems]);

  // Reset filter on close
  useEffect(() => {
    if (!isOpen) {
      setFilterText("");
      setHasTyped(false);
      setIsCreatingCustom(false);
      setEditingValue(null);
      setCustomText("");
      setEditText("");
      setAddError(false);
      setEditError(false);
    }
  }, [isOpen]);

  const findNextFocusableIndex = (
    currentIndex: number,
    direction: "up" | "down",
    arr: DropdownOption[] = visibleItems,
  ) => {
    if (!arr.length) return -1;
    const initial = currentIndex < 0;
    const step = direction === "down" ? 1 : -1;
    const start = initial
      ? direction === "down"
        ? 0
        : arr.length - 1
      : currentIndex + step;
    const end = direction === "down" ? arr.length : -1;

    for (let i = start; direction === "down" ? i < end : i > end; i += step) {
      if (!arr[i]?.disabled) return i;
    }
    return initial ? -1 : currentIndex;
  };

  /** Leave custom add mode but keep menu open and restore keyboard nav. */
  const exitCustomMode = useCallback(() => {
    setIsCreatingCustom(false);
    setCustomText("");
    setAddError(false);
    setTimeout(() => {
      if (!isOpen) setIsOpen(true);
      formControlRef.current?.focus();
      const customIdx = visibleItems.findIndex(
        (o) => o.value === CUSTOM_SENTINEL,
      );
      setFocusedIndex((prev) => {
        const next =
          customIdx !== -1
            ? customIdx
            : findNextFocusableIndex(-1, "down", visibleItems);
        return prev === next ? prev : next;
      });
      scrollToFocusedItem();
    }, 0);
  }, [isOpen, visibleItems]);

  /** Enter inline edit for a given custom value (internal). */
  const enterEdit = useCallback(
    (val: string) => {
      const opt = combinedOptions.find((o) => o.value === val);
      if (!opt) return;
      const raw = opt.text.startsWith(mergedCustomCfg.prefix)
        ? opt.text.slice(mergedCustomCfg.prefix.length)
        : opt.text;
      setEditingValue(val);
      setEditText(raw);
      setEditError(false);
      setTimeout(() => editInputRef.current?.focus(), 0);
    },
    [combinedOptions, mergedCustomCfg.prefix],
  );

  /** Public helper: start Edit; cancels Add if active. */
  const startEdit = useCallback(
    (val: string) => {
      if (isCreatingCustom) {
        setIsCreatingCustom(false);
        setCustomText("");
        setAddError(false);
      }
      enterEdit(val);
    },
    [isCreatingCustom, enterEdit],
  );

  /** Cancel inline edit. */
  const cancelEdit = useCallback(() => {
    setEditingValue(null);
    setEditText("");
    setEditError(false);
    setTimeout(() => formControlRef.current?.focus(), 0);
  }, []);

  /** Public helper: start Add; cancels Edit if active. */
  const startAdd = useCallback(() => {
    if (!isCreatingCustom) {
      if (editingValue) {
        setEditingValue(null);
        setEditText("");
        setEditError(false);
      }
      setIsCreatingCustom(true);
      setTimeout(() => customInputRef.current?.focus(), 0);
    }
  }, [isCreatingCustom, editingValue]);

  /** Commit inline edit (preserve value; update text). */
  const commitEdit = useCallback(() => {
    if (!editingValue) return;
    const prev = combinedOptions.find((o) => o.value === editingValue);
    if (!prev) return;
    const raw = (editText ?? "").trim();
    if (!raw) {
      setEditError(true);
      return;
    }
    setEditError(false);

    const nextText = `${mergedCustomCfg.prefix}${raw}`;
    const nextOpt: DropdownOption = { value: prev.value, text: nextText };

    // Update session-created list if present
    setNewOptions((prevArr) =>
      prevArr.some((o) => o.value === editingValue)
        ? prevArr.map((o) => (o.value === editingValue ? nextOpt : o))
        : prevArr,
    );

    // For persisted ones, store local override
    setEditedLabels((prevMap) =>
      prevMap[editingValue] === nextText
        ? prevMap
        : { ...prevMap, [editingValue]: nextText },
    );

    if (mergedCustomCfg.onEdit)
      defer(() => mergedCustomCfg.onEdit!(prev, nextOpt, raw));

    // Flash & refocus
    setFlashValue(editingValue);
    focusRequestRef.current = editingValue;
    setEditingValue(null);
    setEditText("");
    setTimeout(() => formControlRef.current?.focus(), 0);
  }, [
    editingValue,
    combinedOptions,
    editText,
    mergedCustomCfg.prefix,
    mergedCustomCfg.onEdit,
  ]);

  const handleSelect = (
    selectedVal: string,
    e: React.MouseEvent<HTMLLIElement, MouseEvent> | React.KeyboardEvent,
  ) => {
    e.stopPropagation();

    if (selectedVal === CUSTOM_SENTINEL) {
      startAdd();
      return;
    }

    if (editingValue === selectedVal) return;

    if (isMulti) {
      setSelectedValues((prev) => {
        const next = prev.includes(selectedVal)
          ? prev.filter((v) => v !== selectedVal)
          : [...prev, selectedVal];

        setDisplayValue(
          next.length
            ? `${next.length} selected ${ifElse(next.length === 1, "item", "items")}`
            : "",
        );

        if (filter) {
          setFilterText("");
          setHasTyped(false);
        }

        lastMultiToggledRef.current = selectedVal;
        const i = visibleItems.findIndex((o) => o.value === selectedVal);
        if (i !== -1) setFocusedIndex((prevIdx) => (prevIdx === i ? prevIdx : i));

        const nextOptions = combinedOptions.filter((o) => next.includes(o.value));
        onChange?.(next, nextOptions);

        return next;
      });

      if (filter) setTimeout(() => filterInputRef.current?.focus(), 0);
    } else {
      const opt = combinedOptions.find((o) => o.value === selectedVal) || null;
      if (!opt) return;

      setIsOpen(false);
      setDisplayValue(opt.text);
      setSelectedValue(selectedVal);

      if (filter) {
        setFilterText(opt.text);
        setHasTyped(false);
      }

      onChange?.(selectedVal, opt);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();

    setDisplayValue("");
    setFilterText("");
    setFocusedIndex((prev) => (prev === 0 ? prev : 0));

    if (isMulti) {
      setSelectedValues([]);
      onChange?.([], []);
      if (filter) {
        setIsOpen(true);
        setTimeout(() => {
          filterInputRef.current?.focus();
          scrollToFocusedItem();
        }, 0);
      }
    } else {
      setSelectedValue(null);
      onChange?.(null, null);
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
      setIsCreatingCustom(false);
      setEditingValue(null);
      setAddError(false);
      setEditError(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    // ⛔ While in add or edit text input, handle Enter/Escape locally and ignore Up/Down at the menu level.
    const inCustomInput =
      (isCreatingCustom &&
        customInputRef.current &&
        document.activeElement === customInputRef.current) ||
      (editingValue &&
        editInputRef.current &&
        document.activeElement === editInputRef.current);

    if (inCustomInput) {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        if (isCreatingCustom) return addCustomOption();
        if (editingValue) return commitEdit();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (isCreatingCustom) return exitCustomMode();
        if (editingValue) return cancelEdit();
      }
    }

    // If menu is closed, Up/Down opens it
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        setIsOpen(true);
        event.preventDefault();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex((p) => findNextFocusableIndex(p, "down", visibleItems));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex((p) => findNextFocusableIndex(p, "up", visibleItems));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (focusedIndex >= 0 && !visibleItems[focusedIndex]?.disabled) {
        handleSelect(visibleItems[focusedIndex].value, event);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (isCreatingCustom) return exitCustomMode();
      if (editingValue) return cancelEdit();
      setIsOpen(false);
    }
  };

  const scrollToFocusedItem = () => {
    if (!listRef.current || focusedIndex < 0) return;
    const navItems = listRef.current.querySelectorAll("li.nav-item");
    const target = navItems[focusedIndex] as HTMLElement | undefined;
    target?.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  };

  const updateDropdownPosition = () => {
    if (!formControlRef.current || !listRef.current) return;
    const rect = formControlRef.current.getBoundingClientRect();
    const ddHeight = listRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let position: "bottom" | "top" =
      spaceBelow < ddHeight && spaceAbove > ddHeight ? "top" : "bottom";
    if (visibleItems.length <= 1) position = "bottom";

    const next = {
      top: position === "top" ? rect.top - ddHeight : rect.bottom,
      left: rect.left,
      width: rect.width,
      position,
    };

    setDropdownPosition((prev) =>
      prev.top === next.top &&
      prev.left === next.left &&
      prev.width === next.width &&
      prev.position === next.position
        ? prev
        : next,
    );
  };

  const highlightMatch = (text: string) => {
    if (!filter || !hasTyped || !filterText) return text;
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
    const regex = new RegExp(`(${filterText})`, "gi");
    return (
      <span>
        {text
          .split(regex)
          .map((part, i) =>
            part.toLowerCase() === filterText.toLowerCase() ? (
              <HighlightedText key={`m-${i}`}>{part}</HighlightedText>
            ) : (
              part
            ),
          )}
      </span>
    );
  };

  const getSelectedClass = (index: number, val: string, isFlash = false) => {
    const focused = index === focusedIndex ? "focused" : "";
    const selected =
      (isMulti && selectedValues.includes(val)) ||
      (!isMulti && val === selectedValue)
        ? "selected"
        : "";
    const flash = isFlash ? "flash" : "";
    return `${focused} ${selected} ${flash}`.trim();
  };

  const getValue = () => {
    if (isMulti) return displayValue;
    return isOpen && filter
      ? hasTyped
        ? filterText
        : displayValue
      : displayValue;
  };

  const getClearIcon = () => {
    if (disabled) return [] as any[];
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
    onFilterChange?.(text);
  };

  // Create custom option (slug, duplicate detection, ordered insert, flash, focus)
  const addCustomOption = useCallback(() => {
    const safe = customText ?? "";
    const raw = safe.trim();
    if (!raw) {
      setAddError(true);
      return;
    }
    setAddError(false);

    const slug = slugify(raw);
    if (!slug) {
      setAddError(true);
      return;
    }

    const value = `custom-${slug}`;
    const label = `${mergedCustomCfg.prefix}${raw}`;

    // Duplicate? (search across full combined list)
    const dup = combinedOptions.find((o) => o.value === value);
    if (dup) {
      setIsCreatingCustom(false);
      setHasTyped(false);
      setFilterText("");
      setFlashValue(value);
      focusRequestRef.current = value;
      setTimeout(() => {
        if (!isOpen) setIsOpen(true);
        formControlRef.current?.focus();
      }, 0);
      return;
    }

    const created: DropdownOption = { value, text: label };

    // Insert by position rule
    setNewOptions((prev) =>
      mergedCustomCfg.optionAtTop ? [created, ...prev] : [...prev, created],
    );
    if (mergedCustomCfg.onAdd) defer(() => mergedCustomCfg.onAdd!(created, raw));

    // ✅ Auto-select the newly added option when allowMultiple is false
    if (!mergedCustomCfg.allowMultiple) {
      if (isMulti) {
        const next = selectedValues.includes(value)
          ? selectedValues
          : [...selectedValues, value];

        setSelectedValues(next);
        setDisplayValue(
          next.length
            ? `${next.length} selected ${ifElse(next.length === 1, "item", "items")}`
            : "",
        );

        if (onChange) {
          // Map to option objects; include the just-created option.
          const lookup = new Map(combinedOptions.map((o) => [o.value, o]));
          lookup.set(created.value, created);
          const nextOptions = next
            .map((v) => lookup.get(v))
            .filter(Boolean) as DropdownOption[];
          defer(() => onChange(next, nextOptions));
        }
      } else {
        setSelectedValue(value);
        setDisplayValue(label);
        if (onChange) defer(() => onChange(value, created));
        setIsOpen(false);
      }
    }


    setIsCreatingCustom(false);
    setCustomText("");
    setHasTyped(false);
    setFilterText("");

    // Only flash & refocus when we didn't just close for single-select auto-pick
    const skipReopen = !isMulti && !mergedCustomCfg.allowMultiple;
    if (!skipReopen) {
      setFlashValue(value);
      focusRequestRef.current = value;
      setTimeout(() => {
        if (!isOpen) setIsOpen(true);
        formControlRef.current?.focus();
      }, 0);
    }
  }, [
    customText,
    combinedOptions,
    mergedCustomCfg.prefix,
    mergedCustomCfg.onAdd,
    mergedCustomCfg.optionAtTop,
    mergedCustomCfg.allowMultiple,
    isOpen,
    isMulti,
    onChange,
  ]);

  const rightIcons = [
    ...(clearable || isMulti ? getClearIcon() : []),
    ...(disabled && showDisabledIcon
      ? [{ icon: "lock_outline", className: "disabled-icon" }]
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
      onMouseDown={(e) => {
        if (listRef.current?.contains(e.target as Node)) {
          mouseDownInsideRef.current = true;
        }
      }}
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownWidth || dropdownPosition.width,
      }}
      $size={size as any}
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

      {visibleItems.length > 0 ? (
        <>
          {isMulti && (
            <DropdownItem
              $size={size as any}
              role="dropdown-menu-item"
              data-testid="select-all"
              key="select-all"
              className={`select-all ${
                selectedValues.length ===
                combinedOptions.filter((o) => !o.disabled).length
                  ? "selected"
                  : ""
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const allEnabled = combinedOptions.filter((o) => !o.disabled);
                const allSelected = selectedValues.length === allEnabled.length;
                const next = allSelected ? [] : allEnabled.map((o) => o.value);

                setSelectedValues(next);
                setDisplayValue(
                  next.length
                    ? `${next.length} selected ${ifElse(next.length === 1, "item", "items")}`
                    : "",
                );

                const nextOptions = allSelected ? [] : allEnabled;
                onChange?.(next, nextOptions);

                if (filter) {
                  setTimeout(() => {
                    filterInputRef.current?.focus();
                    setFocusedIndex((prev) => (prev === 0 ? prev : 0));
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
                  combinedOptions.filter((o) => !o.disabled).length
                }
                simple
              />
              Select All
            </DropdownItem>
          )}

          {visibleItems.map(({ value: v, text, disabled }, index) => {
            const isCustomRow = v === CUSTOM_SENTINEL;
            const isFlashing = flashValue === v;

            if (isCustomRow) {
              const liClasses = [
                "nav-item",
                isCreatingCustom ? "custom-row-item" : "",
                getSelectedClass(index, v, isFlashing),
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <DropdownItem
                  $size={size as any}
                  key="custom-row"
                  role="dropdown-menu-item"
                  className={liClasses}
                  $noHover={isCreatingCustom}
                  disabled={false}
                  aria-disabled={undefined}
                  onClick={(e: React.MouseEvent<HTMLLIElement>) => {
                    e.stopPropagation();
                    startAdd();
                  }}
                >
                  {!isCreatingCustom ? (
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {mergedCustomCfg.label}
                    </div>
                  ) : (
                    <CustomRow onClick={(e) => e.stopPropagation()}>
                      <CustomInputWrap>
                        <FormControl
                          ref={customInputRef}
                          type="text"
                          placeholder={`${mergedCustomCfg.label}...`}
                          value={customText}
                          clearable={false}
                          color={addError ? "danger" : undefined}
                          helpText={addError ? REQUIRED_MSG : undefined}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>,
                          ) => {
                            const v = e.target.value ?? "";
                            setCustomText(v);
                            if (addError && v.trim()) setAddError(false);
                          }}
                          onKeyDown={handleKeyDown}
                        />
                      </CustomInputWrap>

                      <OverlapAction>
                        <Button
                          size="xs"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            addCustomOption();
                          }}
                        >
                          {mergedCustomCfg.addText}
                        </Button>

                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            exitCustomMode();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              exitCustomMode();
                            }
                          }}
                          style={{
                            fontSize: 11,
                            color: "#d32f2f",
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                        >
                          Cancel
                        </span>
                      </OverlapAction>
                    </CustomRow>
                  )}
                </DropdownItem>
              );
            }

            // Normal option rows (with optional inline edit for editable custom values)
            const editable = editableSet.has(v);
            const isEditingThis = editingValue === v;

            if (isEditingThis) {
              return (
                <DropdownItem
                  $size={size as any}
                  key={`${v}-editing`}
                  className={`nav-item editing-item ${getSelectedClass(index, v, isFlashing)}`}
                  role="dropdown-menu-item"
                  $noHover
                >
                  <EditRow onClick={(e) => e.stopPropagation()}>
                    <FormControl
                      ref={editInputRef}
                      type="text"
                      placeholder={`${mergedCustomCfg.label}...`}
                      value={editText}
                      clearable={false}
                      color={editError ? "danger" : undefined}
                      helpText={editError ? REQUIRED_MSG : undefined}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const v = e.target.value ?? "";
                        setEditText(v);
                        if (editError && v.trim()) setEditError(false);
                      }}
                      onKeyDown={handleKeyDown}
                    />
                    <OverlapAction>
                      <Button
                        size="xs"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          commitEdit();
                        }}
                      >
                        Save
                      </Button>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEdit();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            cancelEdit();
                          }
                        }}
                        style={{
                          fontSize: 11,
                          color: "#d32f2f",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        Cancel
                      </span>
                    </OverlapAction>
                  </EditRow>
                </DropdownItem>
              );
            }

            return (
              <DropdownItem
                $size={size as any}
                key={`${v}-${index}`}
                data-testid={text}
                disabled={disabled}
                onMouseDown={(e) => e.preventDefault()}
                className={`nav-item option-item ${getSelectedClass(index, v, isFlashing)}`}
                role="dropdown-menu-item"
                aria-disabled={disabled || undefined}
                aria-selected={
                  (isMulti && selectedValues.includes(v)) ||
                  (!isMulti && v === selectedValue) ||
                  undefined
                }
                onClick={(e: React.MouseEvent<HTMLLIElement, MouseEvent>) =>
                  !disabled && handleSelect(v, e)
                }
              >
                {isMulti && (
                  <FormControl
                    type="checkbox"
                    readOnly
                    checked={selectedValues.includes(v)}
                    simple
                    disabled={disabled}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {highlightMatch(text)}
                </div>

                {editable && !disabled && (
                  <RowAffordance
                    className="row-affordance"
                    role="button"
                    aria-label="Edit custom option"
                    title="Edit custom option"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(v);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        startEdit(v);
                      }
                    }}
                  >
                    <Icon icon="edit" />
                  </RowAffordance>
                )}
              </DropdownItem>
            );
          })}
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
        size={size as any}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={() => setIsOpen(true)}
        className={`${rest.className ?? ""} form-control-dropdown-container`}
        clearable={false}
        showDisabledIcon={false}
        onChange={
          filter && !isMulti
            ? (e: React.ChangeEvent<HTMLInputElement>) => {
                setFilterText(e.target.value);
                setHasTyped(true);
                onFilterChange?.(e.target.value);
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
