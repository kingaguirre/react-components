export const getScrollParent = (element: HTMLElement | null): HTMLElement | Window => {
  if (!element) return window;
  const overflowRegex = /(auto|scroll)/;
  let parent: HTMLElement | null = element;
  while (parent) {
    const { overflow, overflowY, overflowX } = getComputedStyle(parent);
    if (overflowRegex.test(overflow + overflowY + overflowX)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}
