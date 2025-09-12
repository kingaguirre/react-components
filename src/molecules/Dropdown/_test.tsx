// src/molecules/Dropdown/Dropdown.test.tsx
import React, { useState } from "react";
import {
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ReactDOM from "react-dom";
import { Dropdown } from "./index";

// Keep a handle to the real createPortal and ensure we call through to it.
// This defuses any lingering mocks from other suites.
const realCreatePortal = ReactDOM.createPortal;

let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  vi.restoreAllMocks();

  // Force ReactDOM.createPortal back to the real implementation
  vi.spyOn(ReactDOM, "createPortal").mockImplementation(
    ((...args: Parameters<typeof realCreatePortal>) =>
      realCreatePortal(...args)) as any
  );

  // Fresh user-event per test
  user = userEvent.setup();

  // Provide a dummy scrollIntoView if missing
  if (!(Element.prototype as any).scrollIntoView) {
    // @ts-ignore
    Element.prototype.scrollIntoView = vi.fn();
  }
});

afterEach(() => {
  cleanup(); // cleanly unmounts portals
});

// Sample options for testing.
const options = [
  { value: "1", text: "Option 1" },
  { value: "2", text: "Option 2" },
  { value: "3", text: "Option 3", disabled: true },
];

// Helper: click somewhere outside the dropdown/menu
const clickOutside = async () => {
  const outside = document.createElement("div");
  outside.setAttribute("data-testid", "outside");
  document.body.appendChild(outside);
  await user.click(outside);
  outside.remove();
};

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
    expect(onChange).toHaveBeenCalledWith("1");

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
    expect(onChange).toHaveBeenCalledWith(["1"]);

    const opt2 = await screen.findByText("Option 2");
    await user.click(opt2);
    expect(onChange).toHaveBeenCalledWith(["1", "2"]);

    // toggle Option 1 off
    await user.click(opt1);
    expect(onChange).toHaveBeenCalledWith(["2"]);

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

/* ---------------------- NEW TESTS: customOption & enableCustomOption ---------------------- */

describe("Dropdown – customOption & enableCustomOption", () => {
  const base = [
    { value: "base-1", text: "Base 1" },
    { value: "base-2", text: "Base 2" },
  ];

  it("does not render custom row by default; renders when enableCustomOption is true", async () => {
    const { rerender } = render(
      <Dropdown options={base} placeholder="Pick" />
    );
    const input = screen.getByPlaceholderText("Pick");
    await user.click(input);
    await waitFor(() => expect(screen.getByText("Base 1")).toBeVisible());
    expect(screen.queryByText("Others")).toBeNull();

    // turn it on
    rerender(
      <Dropdown options={base} placeholder="Pick" enableCustomOption />
    );
    await user.click(screen.getByPlaceholderText("Pick"));
    await waitFor(() => expect(screen.getByText("Others")).toBeVisible());
  });

  it("respects customOption.label and placeholder; supports prefix & addText overrides", async () => {
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ label: "Coffee", prefix: "Coffee - ", addText: "Create" }}
      />
    );
    await user.click(screen.getByPlaceholderText("Pick"));
    await waitFor(() => expect(screen.getByText("Coffee")).toBeVisible());

    // enter custom mode
    await user.click(screen.getByText("Coffee"));
    const input = await screen.findByPlaceholderText("Coffee...");
    await user.type(input, "Mocha");
    await user.click(screen.getByText("Create"));

    // newly created with prefix
    await waitFor(() =>
      expect(screen.getByText("Coffee - Mocha")).toBeVisible()
    );
  });

  it("merges persisted customOption.options above base options; no duplicates by value", async () => {
    const persisted = [
      { value: "custom-decaf", text: "Others - Decaf" },
      // Duplicate value of a base option; with current order, persisted wins.
      { value: "base-1", text: "SHOULD NOT SHOW (dup by value)" },
    ];

    render(
      <Dropdown
        options={[
          { value: "base-1", text: "Base 1" },
          { value: "base-2", text: "Base 2" },
        ]}
        placeholder="Pick"
        enableCustomOption
        customOption={{ options: persisted }}
      />
    );

    await user.click(screen.getByPlaceholderText("Pick"));

    const lis = Array.from(document.querySelectorAll("ul.dropdown-list li"));
    const texts = lis.map((li) => li.textContent?.trim() || "");

    // persisted custom shows and appears before base options
    const idxDecaf = texts.findIndex((t) => t.includes("Others - Decaf"));
    const idxBase2 = texts.findIndex((t) => t.includes("Base 2"));
    expect(idxDecaf).toBeGreaterThan(-1);
    expect(idxBase2).toBeGreaterThan(-1);
    expect(idxDecaf).toBeLessThan(idxBase2);

    // Dedup by value: exactly ONE of the duplicate labels is present (persisted wins here)
    const hasBase1 = texts.some((t) => t.includes("Base 1"));
    const hasDupLabel = texts.some((t) => t.includes("SHOULD NOT SHOW (dup by value)"));
    expect(Number(hasBase1) + Number(hasDupLabel)).toBe(1);
  });

  it("custom add flow creates a new option; calls onAdd with option & raw text; single-select selection works", async () => {
    const onAdd = vi.fn();
    const onChange = vi.fn();

    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ onAdd }}
        onChange={onChange}
      />
    );

    await user.click(screen.getByPlaceholderText("Pick"));

    // open custom row and create
    await user.click(screen.getByText("Others"));
    const customInput = await screen.findByPlaceholderText("Others...");
    await user.type(customInput, "Mocha");
    await user.click(screen.getByText("Add"));

    // created option present
    await waitFor(() =>
      expect(screen.getByText("Others - Mocha")).toBeVisible()
    );

    // onAdd receives both formatted option and raw text
    expect(onAdd).toHaveBeenCalledTimes(1);
    const [created, raw] = onAdd.mock.calls[0];
    expect(created.value).toBe("custom-mocha");
    expect(created.text).toBe("Others - Mocha");
    expect(raw).toBe("Mocha");

    // select it in single-select mode
    await user.click(screen.getByText("Others - Mocha"));
    expect(onChange).toHaveBeenCalledWith("custom-mocha");

    // input reflects selection
    await waitFor(() =>
      expect(
        screen.getByDisplayValue("Others - Mocha")
      ).toBeInTheDocument()
    );
  });

  it("custom add flow prevents duplicates (second add does not create another item)", async () => {
    render(
      <Dropdown options={base} placeholder="Pick" enableCustomOption />
    );

    await user.click(screen.getByPlaceholderText("Pick"));

    // First create "Mocha"
    await user.click(screen.getByText("Others"));
    let ci = await screen.findByPlaceholderText("Others...");
    await user.type(ci, "Mocha");
    await user.click(screen.getByText("Add"));
    await waitFor(() =>
      expect(screen.getByText("Others - Mocha")).toBeVisible()
    );

    // Try to create duplicate "Mocha" again
    await user.click(screen.getByText("Others"));
    ci = await screen.findByPlaceholderText("Others...");
    await user.clear(ci);
    await user.type(ci, "Mocha");
    await user.click(screen.getByText("Add"));

    // Still only one
    const allMocha = screen.getAllByText("Others - Mocha");
    expect(allMocha.length).toBe(1);
  });

  it("Escape in custom edit mode exits creator but keeps menu open", async () => {
    render(
      <Dropdown options={base} placeholder="Pick" enableCustomOption />
    );
    await user.click(screen.getByPlaceholderText("Pick"));

    await user.click(screen.getByText("Others"));
    const edit = await screen.findByPlaceholderText("Others...");
    await user.keyboard("{Escape}");

    // Back to non-editing state (label visible) and menu still open (base item visible)
    await waitFor(() => expect(screen.getByText("Others")).toBeVisible());
    expect(screen.getByText("Base 1")).toBeVisible();
  });

  it("multiselect + custom: can create and select a custom option; 'Select All' remains available", async () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        options={base}
        placeholder="Pick many"
        multiselect
        filter
        enableCustomOption
        onChange={onChange}
      />
    );
    await user.click(screen.getByPlaceholderText("Pick many"));

    // 'Select All' should be present in multiselect
    await waitFor(() =>
      expect(screen.getByText("Select All")).toBeVisible()
    );

    // Create Cappuccino
    await user.click(screen.getByText("Others"));
    const ci = await screen.findByPlaceholderText("Others...");
    await user.type(ci, "Cappuccino");
    await user.click(screen.getByText("Add"));
    await waitFor(() =>
      expect(screen.getByText("Others - Cappuccino")).toBeVisible()
    );

    // Select it
    await user.click(screen.getByText("Others - Cappuccino"));
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls.at(-1)![0] as string[];
    expect(lastCall).toContain("custom-cappuccino");

    // summary text in control
    expect(screen.getByDisplayValue("1 selected item")).toBeInTheDocument();
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
          <button
            data-testid="clear-persisted"
            onClick={() => setPersisted([])}
          >
            Clear persisted
          </button>
        </>
      );
    };

    render(<Harness />);
    const input = screen.getByPlaceholderText("Pick");
    await user.click(input);

    // Create a session custom option "Latte"
    await user.click(screen.getByText("Others"));
    const ci = await screen.findByPlaceholderText("Others...");
    await user.type(ci, "Latte");
    await user.click(screen.getByText("Add"));
    await waitFor(() =>
      expect(screen.getByText("Others - Latte")).toBeVisible()
    );
    expect(screen.getByText("Others - Decaf")).toBeVisible(); // persisted present too

    // Clear persisted -> should also wipe session-added
    await user.click(screen.getByTestId("clear-persisted"));

    // Re-open (ensure we observe fresh list after state change)
    await user.click(input);

    await waitFor(() => {
      expect(screen.queryByText("Others - Decaf")).toBeNull();
      expect(screen.queryByText("Others - Latte")).toBeNull();
      // Base options still there
      expect(screen.getByText("Base 1")).toBeVisible();
    });
  });
});

/* ---------------------- NEW TESTS: add/edit exclusivity, edit affordance & validation ---------------------- */

describe("Dropdown – add/edit exclusivity & edit flow", () => {
  const base = [
    { value: "base-1", text: "Base 1" },
    { value: "base-2", text: "Base 2" },
  ];
  const persisted = [
    { value: "custom-decaf", text: "Others - Decaf" },
    { value: "custom-latte", text: "Others - Latte" },
  ];

  const open = async (ph = "Pick") => {
    await user.click(screen.getByPlaceholderText(ph));
    await waitFor(() => {
      // menu opened
      expect(screen.getByRole("dropdown-menu")).toBeInTheDocument();
    });
  };

  const clickEditFor = async (label: string) => {
    // Find the li that contains the label and click its edit affordance
    const lis = Array.from(document.querySelectorAll("ul.dropdown-list li"));
    const row = lis.find((li) => (li.textContent || "").includes(label));
    expect(row, `Row for "${label}" should exist`).toBeTruthy();
    const btn = row!.querySelector('[aria-label="Edit custom option"]') as HTMLElement | null;
    expect(btn, `Edit button for "${label}" should exist`).toBeTruthy();
    await user.click(btn!);
  };

  it("Add and Edit are mutually exclusive: starting Add cancels active Edit", async () => {
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ options: persisted }}
      />
    );

    await open();

    // start Edit on Decaf
    await clickEditFor("Others - Decaf");
    // edit row is visible (Save button present)
    expect(await screen.findByText("Save")).toBeVisible();

    // click "Others" to start Add — should cancel Edit
    await user.click(screen.getByText("Others"));
    // Add input visible (Add button present), and Save gone
    expect(await screen.findByText("Add")).toBeVisible();
    expect(screen.queryByText("Save")).toBeNull();
  });

  it("Add and Edit are mutually exclusive: starting Edit cancels active Add", async () => {
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
        customOption={{ options: persisted }}
      />
    );

    await open();

    // Start Add
    await user.click(screen.getByText("Others"));
    expect(await screen.findByText("Add")).toBeVisible();

    // Now start Edit on Latte — should cancel Add
    await clickEditFor("Others - Latte");
    expect(await screen.findByText("Save")).toBeVisible();
    expect(screen.queryByText("Add")).toBeNull();
  });

  it("Edit affordance focuses the edit input; typing updates the value", async () => {
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

    const editInput = await screen.findByPlaceholderText("Others...") as HTMLInputElement;
    // Should be focused and have "Decaf" as raw text
    expect(document.activeElement).toBe(editInput);
    expect(editInput.value).toBe("Decaf");

    await user.type(editInput, " (Edited)");
    expect(editInput.value).toBe("Decaf (Edited)");
  });

  it("Saving edit updates text and calls onEdit with (prev, next, raw)", async () => {
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

    // replace "Latte" with "Flat White"
    await user.clear(editInput);
    await user.type(editInput, "Flat White");
    await user.click(screen.getByText("Save"));

    // Label updates
    await waitFor(() => {
      expect(screen.getByText("Others - Flat White")).toBeVisible();
    });

    // onEdit invoked with correct args
    expect(onEdit).toHaveBeenCalledTimes(1);
    const [prev, next, raw] = onEdit.mock.calls[0];
    expect(prev.value).toBe("custom-latte");
    expect(prev.text).toBe("Others - Latte");
    expect(next.value).toBe("custom-latte");
    expect(next.text).toBe("Others - Flat White");
    expect(raw).toBe("Flat White");
  });

  it("Add validation: clicking Add with empty input shows required error and stays in add mode", async () => {
    render(
      <Dropdown
        options={base}
        placeholder="Pick"
        enableCustomOption
      />
    );

    await open();

    await user.click(screen.getByText("Others"));
    // Do not type anything, just click Add
    await user.click(await screen.findByText("Add"));

    // Error text appears and creator remains visible
    expect(await screen.findByText("This field is Required")).toBeVisible();
    expect(screen.getByText("Add")).toBeVisible();
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
    await user.click(screen.getByText("Save"));

    expect(await screen.findByText("This field is Required")).toBeVisible();
    // Still in edit mode (Save still visible)
    expect(screen.getByText("Save")).toBeVisible();
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
    const editInput = await screen.findByPlaceholderText("Others...");
    await user.keyboard("{Escape}");

    // Back to normal row; menu still open (base option visible)
    await waitFor(() => expect(screen.getByText("Base 1")).toBeVisible());
    expect(screen.getByText("Others - Decaf")).toBeVisible();
  });
});
