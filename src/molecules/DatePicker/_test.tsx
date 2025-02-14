import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import DatePicker from "./index";

describe("DatePicker Component", () => {
  test("renders DatePicker with label", () => {
    render(<DatePicker label="Test Date" />);
    expect(screen.getByText("Test Date")).toBeInTheDocument();
  });

  test("opens calendar on input click", async () => {
    render(<DatePicker />);
    const input = screen.getByPlaceholderText("Select Date");
    
    fireEvent.click(input);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  test("calls onChange when a date is selected", async () => {
    const handleChange = vi.fn();
    render(<DatePicker onChange={handleChange} />);
    
    fireEvent.click(screen.getByPlaceholderText("Select Date"));
    const dateToSelect = await screen.findByText("15");
    fireEvent.click(dateToSelect);
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test("supports selecting a range of dates", async () => {
    const handleChange = vi.fn();
    render(<DatePicker range onChange={handleChange} />);
    
    fireEvent.click(screen.getByPlaceholderText("Select Date"));

    // Select start date
    const startDate = await screen.findByText("10");
    fireEvent.click(startDate);

    // Select end date
    const endDate = await screen.findByText("15");
    fireEvent.click(endDate);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(expect.stringContaining("10")); // Ensure it's formatted correctly
  });

  test("disables the input when disabled prop is true", () => {
    render(<DatePicker disabled />);
    const input = screen.getByPlaceholderText("Select Date");
    expect(input).toBeDisabled();
  });

  test("respects minDate and maxDate", async () => {
    const minDate = new Date("2023-02-10");
    const maxDate = new Date("2023-02-20");

    render(<DatePicker minDate={minDate} maxDate={maxDate} />);
    fireEvent.click(screen.getByPlaceholderText("Select Date"));

    // Ensure out-of-range dates are disabled
    const disabledDateBeforeMin = screen.getByText("9");
    const disabledDateAfterMax = screen.getByText("21");

    expect(disabledDateBeforeMin).toHaveAttribute("aria-disabled", "true");
    expect(disabledDateAfterMax).toHaveAttribute("aria-disabled", "true");
  });
});
