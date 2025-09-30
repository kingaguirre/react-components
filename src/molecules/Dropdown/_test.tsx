// src/molecules/Dropdown/Dropdown.test.tsx
import React, { useState } from "react";
import {
  render,
  screen,
  waitFor,
  cleanup,
  within
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ReactDOM from "react-dom";
import { Dropdown } from "./index";

/* ---------------------------------------------------------------------------------- */
/*  Test Harness Setup (portal + user-event + polyfills)                              */
/* ---------------------------------------------------------------------------------- */

const realCreatePortal = ReactDOM.createPortal;
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  vi.restoreAllMocks();

  // Ensure we always use the real portal implementation
  vi.spyOn(ReactDOM, "createPortal").mockImplementation(
    ((...args: Parameters<typeof realCreatePortal>) =>
      realCreatePortal(...args)) as any
  );

  user = userEvent.setup();

  // Polyfill scrollIntoView used by the dropdown
  if (!(Element.prototype as any).scrollIntoView) {
    // @ts-ignore
    Element.prototype.scrollIntoView = vi.fn();
  }
});

afterEach(() => {
  cleanup(); // unmounts portals too
});

/* ---------------------------------------------------------------------------------- */
/*  DOM helpers (robust: target the content <div> inside each li.nav-item)            */
/* ---------------------------------------------------------------------------------- */

const menuEl = () => screen.getByRole("dropdown-menu");

const open = async (ph = "Pick") => {
  await user.click(screen.getByPlaceholderText(ph));
  await waitFor(() => expect(menuEl()).toBeInTheDocument());
};

/** All option rows (li.nav-item) currently in the open menu */
const listItems = (): HTMLLIElement[] =>
  Array.from(menuEl().querySelectorAll("li.nav-item")) as HTMLLIElement[];

/** Returns the text label shown in the row (first content <div> inside li) */
const labelOf = (li: HTMLLIElement): string => {
  // first content div is the one with the visible label (flex:1)
  const contentDiv = li.querySelector(":scope > div");
  return (contentDiv?.textContent ?? "").trim();
};

/** All labels (content text only, excluding affordances like 'edit') */
const labels = (): string[] => listItems().map(labelOf);

/** Find the li.nav-item whose content label equals `label` */
const getRow = (label: string): HTMLLIElement => {
  const row = listItems().find((li) => labelOf(li) === label);
  expect(row, `Expected <li> for "${label}"`).toBeTruthy();
  return row!;
};

/** Query the li.nav-item whose content label equals `label` */
const queryRow = (label: string): HTMLLIElement | null =>
  listItems().find((li) => labelOf(li) === label) ?? null;

const clickRow = async (label: string) => {
  const row = getRow(label);
  await user.click(row);
};

const clickOutside = async () => {
  const outside = document.createElement("div");
  outside.setAttribute("data-testid", "outside");
  document.body.appendChild(outside);
  await user.click(outside);
  outside.remove();
};

// Robust: find the exact-label row inside the open dropdown menu
const getLiByExactLabel = (s: string) => {
  const menu = document.querySelector("ul.dropdown-list");
  if (!menu) return null;
  const items = Array.from(menu.querySelectorAll("li.nav-item")) as HTMLLIElement[];
  return items.find((li) => (li.textContent ?? "").trim() === s) ?? null;
};

// Sample options for testing.
const options = [
  { value: "1", text: "Option 1" },
  { value: "2", text: "Option 2" },
  { value: "3", text: "Option 3", disabled: true },
];

describe("Dropdown Component", () => {
  it("renders with placeholder when no selection is made", () => {
    render(<Dropdown options={options} placeholder="Select an option" />);
    const input = screen.getByPlaceholderText("Select an option") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("");
  });

  it("opens dropdown on input click and displays options", async () => {
    render(<Dropdown options={options} placeholder="Select an option" />);
    const input = screen.getByPlaceholderText("Select an option");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("Option 1")).toBeVisible();
      expect(screen.getByText("Option 2")).toBeVisible();
      expect(screen.getByText("Option 3")).toBeVisible();
    });
  });

  // src/molecules/Dropdown/Dropdown.test.tsx
  it("selects an option in single select mode", async () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        options={options}
        placeholder="Select an option"
        onChange={onChange}
      />
    );

    const input = screen.getByPlaceholderText("Select an option") as HTMLInputElement;
    await user.click(input);

    await user.click(await screen.findByText("Option 1"));
    expect(onChange).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({ value: "1", text: "Option 1" })
    );

    // menu should close; item should become absent or hidden
    await waitFor(() => {
      const opt = screen.queryByText("Option 1");
      if (opt) expect(opt).not.toBeVisible();
    });
    expect(input.value).toBe("Option 1");
  });

  it("does not select a disabled option in single select mode", async () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        options={options}
        placeholder="Select an option"
        onChange={onChange}
      />
    );
    const input = screen.getByPlaceholderText("Select an option");
    await user.click(input);
    await user.click(await screen.findByText("Option 3")); // disabled
    expect(onChange).not.toHaveBeenCalled();
  });

  it("filters options when filter is enabled (multiselect)", async () => {
    render(
      <Dropdown
        options={options}
        placeholder="Select options"
        filter
        multiselect
      />
    );
    const input = screen.getByPlaceholderText("Select options");
    await user.click(input);

    const filterInput = await screen.findByPlaceholderText("Filter options...");
    expect(filterInput).toBeVisible();

    await user.type(filterInput, "Option 2");

    await waitFor(() => {
      const opt1 = screen.queryByText("Option 1");
      if (opt1) expect(opt1).not.toBeVisible();
      expect(screen.getByText("Option 2")).toBeVisible();
    });
  });

  it("selects and toggles options in multi-select mode", async () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        options={options}
        placeholder="Select options"
        multiselect
        filter
        onChange={onChange}
      />
    );
    const input = screen.getByPlaceholderText("Select options");
    await user.click(input);

    await screen.findByPlaceholderText("Filter options...");

    const opt1 = await screen.findByText("Option 1");
    await user.click(opt1);
    expect(onChange).toHaveBeenLastCalledWith(
      ["1"],
      [expect.objectContaining({ value: "1", text: "Option 1" })]
    );

    const opt2 = await screen.findByText("Option 2");
    await user.click(opt2);
    expect(onChange).toHaveBeenLastCalledWith(
      ["1", "2"],
      [
        expect.objectContaining({ value: "1", text: "Option 1" }),
        expect.objectContaining({ value: "2", text: "Option 2" }),
      ]
    );

    // toggle Option 1 off
    await user.click(opt1);
    expect(onChange).toHaveBeenLastCalledWith(
      ["2"],
      [expect.objectContaining({ value: "2", text: "Option 2" })]
    );

    // summary text shown in input
    expect(screen.getByDisplayValue("1 selected item")).toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", async () => {
    render(<Dropdown options={options} placeholder="Select an option" />);
    const input = screen.getByPlaceholderText("Select an option");
    await user.click(input);

    await waitFor(() => expect(screen.getByText("Option 1")).toBeVisible());

    await clickOutside();

    await waitFor(() => {
      const opt = screen.queryByText("Option 1");
      if (opt) expect(opt).not.toBeVisible();
    });
  });

  it("handles keyboard navigation and selection in multiselect mode", async () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        options={options}
        placeholder="Select options"
        filter
        multiselect
        onChange={onChange}
      />
    );
    const input = screen.getByPlaceholderText("Select options");
    await user.click(input);

    const filterInput = await screen.findByPlaceholderText("Filter options...");
    filterInput.focus();

    await user.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalled(); // selected first focusable item
  });

  it("clears selection on clear icon click in single select mode", async () => {
    const onChange = vi.fn();

    // Controlled wrapper so value truly updates after clear
    const ControlledDropdown = () => {
      const [value, setValue] = useState<string | string[] | null>("1");
      return (
        <Dropdown
          options={options}
          placeholder="Select an option"
          onChange={(newVal: string | string[] | null) => {
            setValue(newVal);
            onChange(newVal);
          }}
          value={value as any}
        />
      );
    };

    render(<ControlledDropdown />);

    const input = screen.getByPlaceholderText("Select an option") as HTMLInputElement;
    expect(input.value).toBe("Option 1");

    // open menu so clear icon is rendered in control
    await user.click(input);
    const clearIcon = await screen.findByTestId("clear-icon");
    expect(clearIcon).toBeVisible();

    await user.click(clearIcon);
    expect(onChange).toHaveBeenCalledWith(null);

    await waitFor(() => expect(input.value).toBe(""));
  });

  it("does not render clear icon when no selection (single)", () => {
    render(<Dropdown options={options} placeholder="Select an option" />);
    expect(screen.queryByTestId("clear-icon")).toBeNull();
  });

  it("renders clear icon when single selection exists and clears to empty", async () => {
    const onChange = vi.fn();
    const Controlled = () => {
      const [val, setVal] = React.useState<string | null>("2");
      return (
        <Dropdown
          options={options}
          placeholder="Select an option"
          value={val as any}
          onChange={(nv) => {
            setVal(nv as any);
            onChange(nv);
          }}
        />
      );
    };

    render(<Controlled />);
    const input = screen.getByPlaceholderText("Select an option") as HTMLInputElement;
    expect(input.value).toBe("Option 2");

    const clear = await screen.findByTestId("clear-icon");
    expect(clear).toBeVisible();

    await user.click(clear);
    expect(onChange).toHaveBeenCalledWith(null);
    await waitFor(() => expect(input.value).toBe(""));
    expect(screen.queryByTestId("clear-icon")).toBeNull();
  });

  it("clears multi-select selections via clear icon", async () => {
    const onChange = vi.fn();
    const ControlledMulti = () => {
      const [vals, setVals] = React.useState<string[]>(["1", "2"]);
      return (
        <Dropdown
          options={options}
          placeholder="Select options"
          multiselect
          filter
          value={vals}
          onChange={(nv) => {
            setVals(nv as string[]);
            onChange(nv);
          }}
        />
      );
    };

    render(<ControlledMulti />);
    const input = screen.getByPlaceholderText("Select options") as HTMLInputElement;

    expect(input.value).toBe("2 selected items");

    const clear = await screen.findByTestId("clear-icon");
    await user.click(clear);
    expect(onChange).toHaveBeenCalledWith([]);
    await waitFor(() => expect(input.value).toBe(""));
    expect(screen.queryByTestId("clear-icon")).toBeNull();
  });

  it("single + filter: clear resets filter text, keeps dropdown open, and focuses input", async () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        options={options}
        placeholder="Select an option"
        filter
        onChange={onChange}
        value="1"
      />
    );

    const input = screen.getByPlaceholderText("Select an option") as HTMLInputElement;
    await user.click(input);
    await waitFor(() => expect(screen.getByText("Option 1")).toBeVisible());

    // When filter=true (single), typing usually goes into the same input
    await user.type(input, "Opt");

    const clear = await screen.findByTestId("clear-icon");
    await user.click(clear);

    await waitFor(() => expect(input.value).toBe(""));
    expect(document.activeElement).toBe(input);

    // still open after clear
    await waitFor(() => expect(screen.getByText("Option 1")).toBeVisible());
  });

  it("disabled: hides clear icon and does not open", async () => {
    render(
      <Dropdown
        options={options}
        placeholder="Select an option"
        value="1"
        disabled
        showDisabledIcon
      />
    );
    const input = screen.getByPlaceholderText("Select an option");

    expect(screen.queryByTestId("clear-icon")).toBeNull();
    expect(screen.getByTestId("disabled-icon")).toBeInTheDocument();

    await user.click(input);

    // give a microtask turn for any async open; options should not appear
    await waitFor(() => {
      expect(screen.queryByText("Option 1")).toBeNull();
    });
  });
});

/* ---------------------------------------------------------------------------------- */
/*  SECTION: enableCustomOption + basic customOption config                           */
/* ---------------------------------------------------------------------------------- */

describe("Dropdown – customOption & enableCustomOption", () => {
  const base = [
    { value: "base-1", text: "Base 1" },
    { value: "base-2", text: "Base 2" },
  ];

  it("does not render custom row by default; renders when enableCustomOption is true", async () => {
    const { rerender } = render(<Dropdown options={base} placeholder="Pick" />);
    await user.click(screen.getByPlaceholderText("Pick"));
    await waitFor(() => expect(screen.getByText("Base 1")).toBeVisible());
    expect(queryRow("Others")).toBeNull();

    rerender(<Dropdown options={base} placeholder="Pick" enableCustomOption />);
    await user.click(screen.getByPlaceholderText("Pick"));
    await waitFor(() => expect(getRow("Others")).toBeTruthy());
  });

  it("respects customOption.label/placeholder and addText/prefix; with allowMultiple=false created value auto-selects", async () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        onChange={onChange}
        customOption={{ label: "Coffee", prefix: "Coffee - ", addText: "Create" }} // allowMultiple defaults to false
      />
    );

    await open();
    await waitFor(() => expect(getRow("Coffee")).toBeTruthy());

    // Enter add mode
    await clickRow("Coffee");
    const input = await screen.findByPlaceholderText("Coffee...");
    await user.type(input, "Mocha");

    // Click Create → should auto-select & close (single-select + allowMultiple=false)
    await user.click(within(menuEl()).getByText("Create"));

    // onChange with slug, input displays selected label, menu closed
    await waitFor(() =>
      expect(screen.getByDisplayValue("Coffee - Mocha")).toBeInTheDocument()
    );
    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)![0];
    expect(last).toBe("custom-mocha");
    expect(screen.queryByRole("dropdown-menu")).toBeNull();

    // Reopen: creator row hidden (since allowMultiple=false and we already created one)
    await open();
    expect(queryRow("Coffee")).toBeNull();
  });

  it("merges customOption.options and de-duplicates by value (ordering not asserted)", async () => {
    const persisted = [
      { value: "custom-decaf", text: "Others - Decaf" },
      { value: "base-1", text: "SHOULD NOT SHOW (dup by value)" },
    ];

    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ options: persisted }}
      />
    );

    await open();
    const t = labels();

    // persisted present
    expect(t.some((x) => x.includes("Others - Decaf"))).toBe(true);

    // Dedup by value: exactly ONE of the duplicate labels is present
    const hasBase1 = t.some((x) => x.includes("Base 1"));
    const hasDupLabel = t.some((x) => x.includes("SHOULD NOT SHOW (dup by value)"));
    expect(Number(hasBase1) + Number(hasDupLabel)).toBe(1);
  });

  it("custom add flow: onAdd gets (option, raw); single-select auto-selects immediately (no extra click)", async () => {
    const onAdd = vi.fn();
    const onChange = vi.fn();

    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ onAdd }} // allowMultiple false
        onChange={onChange}
      />
    );

    await open();

    // Create "Mocha"
    await clickRow("Others");
    const customInput = await screen.findByPlaceholderText("Others...");
    await user.type(customInput, "Mocha");
    await user.click(within(menuEl()).getByText("Add"));

    // Auto-selected
    await waitFor(() =>
      expect(screen.getByDisplayValue("Others - Mocha")).toBeInTheDocument()
    );
    expect(onAdd).toHaveBeenCalledTimes(1);
    const [created, raw] = onAdd.mock.calls[0];
    expect(created.value).toBe("custom-mocha");
    expect(created.text).toBe("Others - Mocha");
    expect(raw).toBe("Mocha");

    expect(onChange).toHaveBeenCalledWith(
      "custom-mocha",
      expect.objectContaining({ value: "custom-mocha", text: "Others - Mocha" })
    );
  });

  it("multiselect + custom: auto-selects on add when allowMultiple=false; 'Select All' shown", async () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        options={base}
        placeholder="Pick many"
        multiselect
        filter
        enableCustomOption
        customOption={{ allowMultiple: false }} // 👈 explicit
        onChange={onChange}
      />
    );

    await user.click(screen.getByPlaceholderText("Pick many"));

    // 'Select All' should be present in multiselect
    await waitFor(() => expect(screen.getByText("Select All")).toBeVisible());

    // Create "Cappuccino"
    await user.click(screen.getByText("Others"));
    const ci = await screen.findByPlaceholderText("Others...");
    await user.type(ci, "Cappuccino");
    await user.click(screen.getByText("Add"));

    // ✅ Auto-selected immediately on add (because allowMultiple=false)
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls.at(-1)![0] as string[];
    expect(Array.isArray(lastCall)).toBe(true);
    expect(lastCall).toContain("custom-cappuccino");

    // summary text in control reflects 1 selection
    expect(screen.getByDisplayValue("1 selected item")).toBeInTheDocument();

    // (Optional) clicking it again toggles it off
    await waitFor(() =>
      expect(screen.getByText("Others - Cappuccino")).toBeVisible()
    );
    await user.click(screen.getByText("Others - Cappuccino"));
    const afterToggle = onChange.mock.calls.at(-1)![0] as string[];
    expect(afterToggle).not.toContain("custom-cappuccino");
  });


  it("clearing persisted customOption.options also clears session-added custom options", async () => {
    const Harness = () => {
      const [persisted, setPersisted] = useState([
        { value: "custom-decaf", text: "Others - Decaf" },
      ]);
      return (
        <>
          <Dropdown
            options={base}
            placeholder="Pick"
            enableCustomOption
            customOption={{ options: persisted }}
          />
          <button data-testid="clear-persisted" onClick={() => setPersisted([])}>
            Clear persisted
          </button>
        </>
      );
    };

    render(<Harness />);
    const input = screen.getByPlaceholderText("Pick");
    await user.click(input);

    // Create "Latte" -> auto-selects and closes
    await clickRow("Others");
    const ci = await screen.findByPlaceholderText("Others...");
    await user.type(ci, "Latte");
    await user.click(within(menuEl()).getByText("Add"));
    await waitFor(() =>
      expect(screen.getByDisplayValue("Others - Latte")).toBeInTheDocument()
    );

    // Persisted is present before clearing
    await open();
    expect(getRow("Others - Decaf")).toBeTruthy();

    // Clear persisted -> should also wipe session-added
    await user.click(screen.getByTestId("clear-persisted"));

    // Re-open fresh list
    await user.click(input);
    await waitFor(() => {
      expect(queryRow("Others - Decaf")).toBeNull();
      expect(queryRow("Others - Latte")).toBeNull();
      expect(getRow("Base 1")).toBeTruthy();
    });
  });
});

/* ---------------------------------------------------------------------------------- */
/*  SECTION: Add/Edit exclusivity & edit flow                                         */
/* ---------------------------------------------------------------------------------- */

describe("Dropdown – add/edit exclusivity & edit flow", () => {
  const base = [
    { value: "base-1", text: "Base 1" },
    { value: "base-2", text: "Base 2" },
  ];
  const persisted = [
    { value: "custom-decaf", text: "Others - Decaf" },
    { value: "custom-latte", text: "Others - Latte" },
  ];

  const clickEditFor = async (label: string) => {
    const row = getRow(label);
    const btn = row.querySelector('[aria-label="Edit custom option"]') as HTMLElement | null;
    expect(btn, `Edit button for "${label}" should exist`).toBeTruthy();
    await user.click(btn!);
  };

  it("starting Add cancels active Edit", async () => {
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ options: persisted }}
      />
    );

    await open();
    await clickEditFor("Others - Decaf");
    expect(await within(menuEl()).findByText("Save")).toBeVisible();

    await clickRow("Others"); // start Add
    expect(await within(menuEl()).findByText("Add")).toBeVisible();
    expect(within(menuEl()).queryByText("Save")).toBeNull();
  });

  it("starting Edit cancels active Add", async () => {
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ options: persisted }}
      />
    );

    await open();
    await clickRow("Others"); // start Add
    expect(await within(menuEl()).findByText("Add")).toBeVisible();

    await clickEditFor("Others - Latte"); // start Edit
    expect(await within(menuEl()).findByText("Save")).toBeVisible();
    expect(within(menuEl()).queryByText("Add")).toBeNull();
  });

  it("Edit affordance focuses the edit input; typing updates the raw value", async () => {
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ options: persisted }}
      />
    );

    await open();
    await clickEditFor("Others - Decaf");

    const editInput = (await screen.findByPlaceholderText("Others...")) as HTMLInputElement;
    expect(document.activeElement).toBe(editInput);
    expect(editInput.value).toBe("Decaf");

    await user.type(editInput, " (Edited)");
    expect(editInput.value).toBe("Decaf (Edited)");
  });

  it("Saving an edit updates text and calls onEdit(prev, next, raw)", async () => {
    const onEdit = vi.fn();
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ options: persisted, onEdit }}
      />
    );

    await open();
    await clickEditFor("Others - Latte");
    const editInput = await screen.findByPlaceholderText("Others...");

    await user.clear(editInput);
    await user.type(editInput, "Flat White");
    await user.click(within(menuEl()).getByText("Save"));

    await waitFor(() => expect(getRow("Others - Flat White")).toBeTruthy());

    expect(onEdit).toHaveBeenCalledTimes(1);
    const [prev, next, raw] = onEdit.mock.calls[0];
    expect(prev.value).toBe("custom-latte");
    expect(prev.text).toBe("Others - Latte");
    expect(next.value).toBe("custom-latte");
    expect(next.text).toBe("Others - Flat White");
    expect(raw).toBe("Flat White");
  });

  it("Add validation: clicking Add with empty input shows required error and stays in add mode", async () => {
    render(<Dropdown options={base} placeholder="Pick" enableCustomOption />);

    await open();
    await clickRow("Others");
    await user.click(await within(menuEl()).findByText("Add"));

    expect(await screen.findByText("This field is Required")).toBeVisible();
    expect(within(menuEl()).getByText("Add")).toBeVisible();
  });

  it("Edit validation: clicking Save with empty input shows required error and stays in edit mode", async () => {
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ options: persisted }}
      />
    );

    await open();
    await clickEditFor("Others - Decaf");
    const editInput = await screen.findByPlaceholderText("Others...");
    await user.clear(editInput);
    await user.click(within(menuEl()).getByText("Save"));

    expect(await screen.findByText("This field is Required")).toBeVisible();
    expect(within(menuEl()).getByText("Save")).toBeVisible();
  });

  it("Escape in edit mode cancels edit and keeps dropdown open", async () => {
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ options: persisted }}
      />
    );

    await open();
    await clickEditFor("Others - Decaf");
    await screen.findByPlaceholderText("Others...");
    await user.keyboard("{Escape}");

    await waitFor(() => expect(getRow("Base 1")).toBeTruthy());
    expect(getRow("Others - Decaf")).toBeTruthy();
  });
});

/* ---------------------------------------------------------------------------------- */
/*  SECTION: Keyboard flows (inside inputs) & outside clicks                          */
/* ---------------------------------------------------------------------------------- */

describe("Dropdown – custom option keyboard flows & outside clicks", () => {
  const base = [
    { value: "base-1", text: "Base 1" },
    { value: "base-2", text: "Base 2" },
  ];

  it("keyboard: Enter to create inside add input auto-selects when allowMultiple=false", async () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        onChange={onChange}
      />
    );

    await open();

    // Enter add mode via click (avoid relying on focus classes)
    await clickRow("Others");
    const addInput = (await screen.findByPlaceholderText("Others...")) as HTMLInputElement;
    expect(document.activeElement).toBe(addInput);

    // Press Enter with text -> create & auto-select -> dropdown closes
    await user.type(addInput, "New Value");
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalled();
    const [val, opt] = onChange.mock.calls.at(-1)!;
    expect(val).toBe("custom-new-value");
    expect(opt).toEqual(
      expect.objectContaining({ value: "custom-new-value", text: "Others - New Value" })
    );

    await waitFor(() =>
      expect(screen.getByDisplayValue("Others - New Value")).toBeInTheDocument()
    );
    expect(screen.queryByRole("dropdown-menu")).toBeNull();
  });

  it("add mode: pressing Enter with empty input shows required error and stays in add mode", async () => {
    render(<Dropdown options={base} placeholder="Pick" enableCustomOption />);

    await open();
    await clickRow("Others");
    const addInput = await screen.findByPlaceholderText("Others...");
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.getByText("This field is Required")).toBeVisible()
    );
    expect(addInput).toBeInTheDocument();
  });

  it("clicking outside while in add mode closes dropdown and exits add mode", async () => {
    render(<Dropdown options={base} placeholder="Pick" enableCustomOption />);
    await open();
    await clickRow("Others");
    await screen.findByPlaceholderText("Others...");

    await clickOutside();

    await waitFor(() => expect(screen.queryByRole("dropdown-menu")).toBeNull());
    expect(screen.queryByPlaceholderText("Others...")).toBeNull();
  });

  it("clicking outside while in edit mode closes dropdown and exits edit mode", async () => {
    const persisted = [
      { value: "custom-decaf", text: "Others - Decaf" },
      { value: "custom-latte", text: "Others - Latte" },
    ];

    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ options: persisted }}
      />
    );

    await open();

    const row = getRow("Others - Decaf");
    const editBtn = row.querySelector('[aria-label="Edit custom option"]') as HTMLElement | null;
    expect(editBtn).toBeTruthy();
    await user.click(editBtn!);
    await screen.findByPlaceholderText("Others...");

    await clickOutside();

    await waitFor(() => expect(screen.queryByRole("dropdown-menu")).toBeNull());
    expect(screen.queryByPlaceholderText("Others...")).toBeNull();
  });

  it("clicking Add button also auto-selects when allowMultiple=false", async () => {
    const onChange = vi.fn();

    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        onChange={onChange}
      />
    );

    await open();
    await clickRow("Others");
    const addInput = await screen.findByPlaceholderText("Others...");
    await user.type(addInput, "Clicky");
    await user.click(within(menuEl()).getByText("Add"));

    // Auto-selected & menu closed
    await waitFor(() =>
      expect(screen.getByDisplayValue("Others - Clicky")).toBeInTheDocument()
    );
    expect(onChange).toHaveBeenCalledWith(
      "custom-clicky",
      expect.objectContaining({ value: "custom-clicky", text: "Others - Clicky" })
    );
    expect(screen.queryByRole("dropdown-menu")).toBeNull();
  });


  it("duplicate add when allowMultiple=true: second add does not create another item (no duplicates)", async () => {
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ allowMultiple: true }}
      />
    );

    await open();

    // First create "Mocha"
    await clickRow("Others");
    let ci = await screen.findByPlaceholderText("Others...");
    await user.type(ci, "Mocha");
    await user.click(within(menuEl()).getByText("Add"));
    await waitFor(() => expect(getRow("Others - Mocha")).toBeTruthy());

    // Try to create duplicate "Mocha" again (Others still visible because allowMultiple=true)
    await clickRow("Others");
    ci = await screen.findByPlaceholderText("Others...");
    await user.clear(ci);
    await user.type(ci, "Mocha");
    await user.click(within(menuEl()).getByText("Add"));

    // Still only one
    const allMocha = labels().filter((l) => l === "Others - Mocha");
    expect(allMocha.length).toBe(1);
  });
});

/* ---------------------------------------------------------------------------------- */
/*  SECTION: allowMultiple + optionAtTop (append/prepend + visibility)                */
/* ---------------------------------------------------------------------------------- */

describe("Dropdown – customOption.allowMultiple & customOption.optionAtTop insertion/visibility", () => {
  const base = [
    { value: "base-1", text: "Base 1" },
    { value: "base-2", text: "Base 2" },
  ];

  it("default (allowMultiple=false, optionAtTop=false): 'Others' at bottom; first add hides 'Others'; newly created option is appended and auto-selected", async () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{}} // defaults
        onChange={onChange}
      />
    );

    await open();

    // 'Others' is at the bottom initially
    expect(labels().at(-1)).toBe("Others");

    // Add "Alpha" – auto-selects & closes
    await clickRow("Others");
    const addInput = await screen.findByPlaceholderText("Others...");
    await user.type(addInput, "Alpha");
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.getByDisplayValue("Others - Alpha")).toBeInTheDocument()
    );
    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith(
      "custom-alpha",
      expect.objectContaining({ value: "custom-alpha", text: "Others - Alpha" })
    );

    // Re-open: 'Others' should now be hidden (allowMultiple=false)
    await open();
    expect(queryRow("Others")).toBeNull();

    // Created option is appended (after Base 1 & Base 2)
    const after = labels();
    const iBase1 = after.indexOf("Base 1");
    const iBase2 = after.indexOf("Base 2");
    const iCreated = after.indexOf("Others - Alpha");
    expect(iCreated).toBeGreaterThan(iBase1);
    expect(iCreated).toBeGreaterThan(iBase2);
    expect(iCreated).toBe(after.length - 1);
  });

  it("allowMultiple=true keeps 'Others' visible; optionAtTop=false appends new option near bottom (after bases, before 'Others')", async () => {
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ allowMultiple: true }} // optionAtTop default false
      />
    );

    await open();
    expect(labels().at(-1)).toBe("Others");

    // Add "Beta"
    await clickRow("Others");
    let addInput = await screen.findByPlaceholderText("Others...");
    await user.type(addInput, "Beta");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(getRow("Others - Beta")).toBeTruthy());

    // Others stays visible; created item appended just above Others
    await open();
    const after = labels();
    const iBase1 = after.indexOf("Base 1");
    const iBase2 = after.indexOf("Base 2");
    const iOthers = after.lastIndexOf("Others");
    const iBeta = after.indexOf("Others - Beta");

    expect(iBeta).toBeGreaterThan(iBase1);
    expect(iBeta).toBeGreaterThan(iBase2);
    expect(iBeta).toBe(iOthers - 1);
  });

  it("optionAtTop=true + allowMultiple=false: 'Others' at top; created option is PREPENDED and auto-selected (first after reopen)", async () => {
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ optionAtTop: true }} // allowMultiple defaults to false
      />
    );

    await open();
    expect(labels()[0]).toBe("Others");

    // Add "TopRow" – auto-selects & closes
    await clickRow("Others");
    const addInput = await screen.findByPlaceholderText("Others...");
    await user.type(addInput, "TopRow");
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(screen.getByDisplayValue("Others - TopRow")).toBeInTheDocument()
    );

    // Re-open: 'Others' hidden; created is now first (PREPEND)
    await open();
    const after = labels();
    expect(after[0]).toBe("Others - TopRow");
    expect(queryRow("Others")).toBeNull();
  });

  it("optionAtTop=true & allowMultiple=true: 'Others' stays on top; newly created options are PREPENDED directly under 'Others'", async () => {
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ optionAtTop: true, allowMultiple: true }}
      />
    );

    await open();
    expect(labels()[0]).toBe("Others");

    // Add "Gamma"
    await clickRow("Others");
    let addInput = await screen.findByPlaceholderText("Others...");
    await user.type(addInput, "Gamma");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(getRow("Others - Gamma")).toBeTruthy());

    // Re-open and check: Others (0), then Gamma (1)
    await open();
    let after = labels();
    expect(after[0]).toBe("Others");
    expect(after[1]).toBe("Others - Gamma");

    // Add "Delta" – should PREPEND under Others, shifting Gamma down
    await clickRow("Others");
    addInput = await screen.findByPlaceholderText("Others...");
    await user.type(addInput, "Delta");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(getRow("Others - Delta")).toBeTruthy());

    await open();
    after = labels();
    expect(after[0]).toBe("Others");
    expect(after[1]).toBe("Others - Delta");
    expect(after[2]).toBe("Others - Gamma");
  });
});
