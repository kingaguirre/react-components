// src/molecules/Dropdown/Dropdown.test.tsx
import React, { useState } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Dropdown } from "./index";
import ReactDOM from "react-dom";

// Override createPortal to render inline for testing.
vi.spyOn(ReactDOM, "createPortal").mockImplementation((node) => node as React.ReactPortal);

beforeEach(() => {
  // Reset any DOM changes between tests.
  document.body.innerHTML = "";
  // Provide a dummy scrollIntoView implementation.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  // Clean up any leftover DOM.
  document.body.innerHTML = "";
});

// Sample options for testing.
const options = [
  { value: "1", text: "Option 1" },
  { value: "2", text: "Option 2" },
  { value: "3", text: "Option 3", disabled: true },
];

describe("Dropdown Component", () => {
  it("renders with placeholder when no selection is made", () => {
    render(<Dropdown options={options} placeholder="Select an option" />);
    const input = screen.getByPlaceholderText("Select an option");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("opens dropdown on input click and displays options", async () => {
    render(<Dropdown options={options} placeholder="Select an option" />);
    const input = screen.getByPlaceholderText("Select an option");
    fireEvent.click(input);
    // Wait for the dropdown options to appear.
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
    const input = screen.getByPlaceholderText("Select an option");
    fireEvent.click(input);
    const option1 = await waitFor(() => screen.getByText("Option 1"));
    fireEvent.click(option1);
    // onChange should be called with "1"
    expect(onChange).toHaveBeenCalledWith("1");
    // Wait until the dropdown options are hidden.
    await waitFor(() => {
      const opt = screen.queryByText("Option 1");
      if (opt) expect(opt).not.toBeVisible();
    });
    // The input should now display Option 1's text.
    expect(input).toHaveValue("Option 1");
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
    fireEvent.click(input);
    const option3 = await waitFor(() => screen.getByText("Option 3"));
    fireEvent.click(option3);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("filters options when filter is enabled (multiselect)", async () => {
    // For filtering, use multiselect so that the filter input is rendered.
    render(
      <Dropdown
        options={options}
        placeholder="Select options"
        filter
        multiselect
      />
    );
    const input = screen.getByPlaceholderText("Select options");
    fireEvent.click(input);
    // Wait for the filter input to appear.
    const filterInput = await waitFor(() =>
      screen.getByPlaceholderText("Filter options...")
    );
    expect(filterInput).toBeVisible();
    // Type filter text that should only match "Option 2".
    userEvent.type(filterInput, "Option 2");
    // Wait for options to update.
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
    fireEvent.click(input);
    // Wait for filter input.
    await waitFor(() => screen.getByPlaceholderText("Filter options..."));
    // Select Option 1.
    const option1 = await waitFor(() => screen.getByText("Option 1"));
    fireEvent.click(option1);
    expect(onChange).toHaveBeenCalledWith(["1"]);
    // Select Option 2.
    const option2 = await waitFor(() => screen.getByText("Option 2"));
    fireEvent.click(option2);
    expect(onChange).toHaveBeenCalledWith(["1", "2"]);
    // Toggle Option 1 off.
    fireEvent.click(option1);
    expect(onChange).toHaveBeenCalledWith(["2"]);
    // The input should display a summary (e.g., "1 selected item").
    expect(screen.getByDisplayValue("1 selected item")).toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", async () => {
    render(<Dropdown options={options} placeholder="Select an option" />);
    const input = screen.getByPlaceholderText("Select an option");
    fireEvent.click(input);
    await waitFor(() => {
      expect(screen.getByText("Option 1")).toBeVisible();
    });
    // Simulate clicking outside.
    fireEvent.mouseDown(document.body);
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
    fireEvent.click(input);
    // Wait for the filter input.
    const filterInput = await waitFor(() =>
      screen.getByPlaceholderText("Filter options...")
    );
    filterInput.focus();
    // Press ArrowDown to change focus.
    fireEvent.keyDown(filterInput, { key: "ArrowDown" });
    // Press Enter to select the focused option.
    fireEvent.keyDown(filterInput, { key: "Enter" });
    expect(onChange).toHaveBeenCalled();
  });

  it("clears selection on clear icon click in single select mode", async () => {
    const onChange = vi.fn();
    
    // A wrapper component that controls the value
    const ControlledDropdown = () => {
      const [value, setValue] = useState<string | string[]>("1");
      return (
        <Dropdown
          options={options}
          placeholder="Select an option"
          onChange={(newVal: string | string[]) => {
            setValue(newVal);
            onChange(newVal);
          }}
          value={value}
        />
      );
    };
  
    render(<ControlledDropdown />);
    
    const input = screen.getByPlaceholderText("Select an option");
    // Initially, the input displays Option 1.
    expect(input).toHaveValue("Option 1");
  
    // Open the dropdown so the clear icon is rendered.
    fireEvent.click(input);
    // Assume the clear icon has a test id "clear-icon".
    const clearIcon = await waitFor(() => screen.getByTestId("clear-icon"));
    expect(clearIcon).toBeVisible();
  
    fireEvent.click(clearIcon);
    // onChange should have been called with an empty string.
    expect(onChange).toHaveBeenCalledWith("");
    // Wait for the component to re-render with an empty value.
    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });
  
});
