import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event'
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { DatePicker } from "./index";

describe("DatePicker Component", () => {
  test("renders DatePicker with label", () => {
    render(<DatePicker label="Test Date" />);
    expect(screen.getByText("Test Date")).toBeInTheDocument();
  });

  test("opens calendar on input click", async () => {
    render(<DatePicker />);
    const input = screen.getByPlaceholderText("Select Date");
    
    fireEvent.click(input);

    expect(await screen.findByTestId('datepicker-popper')).toBeInTheDocument();
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

  test('clears selected single date when clear icon is clicked', async () => {
    const handleChange = vi.fn()
    render(<DatePicker onChange={handleChange} />)

    const input = screen.getByPlaceholderText('Select Date') as HTMLInputElement

    // open and pick a date
    await userEvent.click(input)
    const dateToSelect = await screen.findByText('15')
    await userEvent.click(dateToSelect)

    // should have called onChange for selection
    expect(handleChange).toHaveBeenCalled()

    // clear icon should now be visible
    const clearIcon = await screen.findByTestId('clear-icon')
    await userEvent.click(clearIcon)

    // input should be cleared and onChange called again
    await waitFor(() => expect(input.value).toBe(''))
    expect(handleChange.mock.calls.length).toBeGreaterThan(1)
  })

  test('clears selected range when clear icon is clicked', async () => {
    const handleChange = vi.fn()
    render(<DatePicker range onChange={handleChange} />)

    const input = screen.getByPlaceholderText('Select Date') as HTMLInputElement

    // open and pick start + end
    await userEvent.click(input)
    const start = await screen.findByText('10')
    await userEvent.click(start)
    const end = await screen.findByText('15')
    await userEvent.click(end)

    // selection should trigger onChange at least once
    expect(handleChange).toHaveBeenCalled()
    const callsBeforeClear = handleChange.mock.calls.length

    // click clear
    const clearIcon = await screen.findByTestId('clear-icon')
    await userEvent.click(clearIcon)

    // input cleared and onChange fired again
    await waitFor(() => expect(input.value).toBe(''))
    expect(handleChange.mock.calls.length).toBeGreaterThan(callsBeforeClear)
  })

  test('does not show clear icon when disabled', async () => {
    render(<DatePicker disabled />)

    const input = screen.getByPlaceholderText('Select Date')
    // clicking should not open or allow selection → no clear icon appears
    await userEvent.click(input)
    expect(screen.queryByTestId('clear-icon')).toBeNull()
  })

  test('applies custom dateFormat to single selection (display equals onChange)', async () => {
    const handleChange = vi.fn();
    render(<DatePicker onChange={handleChange} dateFormat="yyyy-MM-dd" />);

    const input = screen.getByPlaceholderText('Select Date') as HTMLInputElement;
    await userEvent.click(input);

    const day = await screen.findByText('15');
    await userEvent.click(day);

    await waitFor(() => expect(handleChange).toHaveBeenCalled());
    const payload = handleChange.mock.calls.at(-1)?.[0] as string;

    // onChange payload matches the custom format
    expect(payload).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // input display matches onChange exactly for single date
    await waitFor(() => expect(input.value).toBe(payload));
  });

  test('applies custom dateFormat to range selection (display contains same formatted values)', async () => {
    const handleChange = vi.fn();
    render(<DatePicker range onChange={handleChange} dateFormat="dd/MM/yyyy" />);

    const input = screen.getByPlaceholderText('Select Date') as HTMLInputElement;

    await userEvent.click(input);
    const start = await screen.findByText('10');
    await userEvent.click(start);
    const end = await screen.findByText('15');
    await userEvent.click(end);

    await waitFor(() => expect(handleChange).toHaveBeenCalled());
    const payload = handleChange.mock.calls.at(-1)?.[0] as string;

    // onChange payload is "start,end" using the custom format
    expect(payload).toMatch(/^\d{2}\/\d{2}\/\d{4},\d{2}\/\d{2}\/\d{4}$/);

    const [s, e] = payload.split(',');
    // The input usually renders "start - end"; assert both tokens are present
    await waitFor(() => {
      expect(input.value).toContain(s);
      expect(input.value).toContain(e);
    });
  });

  test('parses incoming string value in given dateFormat (range)', async () => {
    render(
      <DatePicker
        range
        value="2024-02-10,2024-02-15"
        dateFormat="yyyy-MM-dd"
      />,
    );

    const input = screen.getByPlaceholderText('Select Date') as HTMLInputElement;

    await waitFor(() => {
      expect(input.value).toContain('2024-02-10');
      expect(input.value).toContain('2024-02-15');
    });
  });

  test('uses default dateFormat (dd-MMM-yyyy) when none provided', async () => {
    // Months are 0-based; 9 = October
    render(<DatePicker value={new Date(2024, 9, 5)} />);

    const input = screen.getByPlaceholderText('Select Date') as HTMLInputElement;

    await waitFor(() => {
      // e.g., "05-Oct-2024"
      expect(input.value).toMatch(/^\d{2}-[A-Za-z]{3}-\d{4}$/);
    });
  });

  test('re-renders input when dateFormat prop changes', async () => {
    const { rerender } = render(
      <DatePicker value={new Date(2024, 1, 11)} dateFormat="yyyy-MM-dd" />,
    );

    const input = screen.getByPlaceholderText('Select Date') as HTMLInputElement;

    await waitFor(() => expect(input.value).toBe('2024-02-11'));

    rerender(
      <DatePicker value={new Date(2024, 1, 11)} dateFormat="dd/MM/yyyy" />,
    );

    await waitFor(() => expect(input.value).toBe('11/02/2024'));
  });

});
