// src/molecules/Dropdown/Dropdown.test.tsx
import React, { useState } from "react";
import {
  render,
  screen,
  fireEvent,
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
