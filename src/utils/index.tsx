export const ifElse = (condition: boolean, trueValue: any, falseValue: any) => {
  if (condition) {
    return trueValue;
  }
  return falseValue;
};

export const formatNumber = (input: string | number, decimals = 2) => {
  // Convert the input to a number (if it's a string)
  const num = typeof input === "string" ? parseFloat(input) : input;

  if (isNaN(num)) {
    throw new Error("Invalid number input");
  }

  // If it's an integer, simply return the localized string without decimals.
  if (num % 1 === 0) {
    return num.toLocaleString();
  }

  // For non-integer numbers, format using the given decimal places.
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const countDigits = (value: string | number) => {
  // Convert to string.
  const strValue = value.toString();

  // Remove any negative sign and decimals (if you only care about the integer part).
  const cleanValue = strValue.replace("-", "").split(".")[0];

  return cleanValue.length;
};

export const getScrollParent = (
  element: HTMLElement | null,
): HTMLElement | Window => {
  if (!element) return window;
  const overflowRegex = /(auto|scroll)/;
  let parent: HTMLElement | null = element;
  while (parent) {
    const { overflow, overflowY, overflowX } = getComputedStyle(parent);
    if (overflowRegex.test(overflow + overflowY + overflowX)) {
      // Check if the element is actually scrollable vertically or horizontally
      if (
        parent.scrollHeight > parent.clientHeight ||
        parent.scrollWidth > parent.clientWidth
      ) {
        return parent;
      }
    }
    parent = parent.parentElement;
  }
  return window;
};
