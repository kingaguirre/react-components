import { INode } from "./interfaces";

export const rowHeightPx = 30;

export const ensureSelection = (
  data: INode[],
  selectedItem: string | undefined,
  selectedChildItem: string | undefined,
): {
  selectedItem: string | undefined;
  selectedChildItem: string | undefined;
} => {
  if (!data || data.length === 0) return { selectedItem, selectedChildItem };

  // If no selectedItem provided, use "isSelected" or first item
  if (!selectedItem) {
    const selectedFromObject = data.find((it) => it.isSelected);
    const parent = selectedFromObject || data[0];
    const firstChild = parent.childNodes?.[0];
    return {
      selectedItem: parent.id,
      selectedChildItem: firstChild ? firstChild.id : undefined,
    };
  }

  // Ensure selectedItem exists in data
  const parent = data.find((it) => it.id === selectedItem) || data[0];
  if (!parent) return { selectedItem: undefined, selectedChildItem: undefined };

  // If selectedChildItem exists and is valid, keep it; else default to first child (if any)
  if (parent.childNodes && parent.childNodes.length > 0) {
    const hasChild = parent.childNodes.find((c) => c.id === selectedChildItem);
    return {
      selectedItem: parent.id,
      selectedChildItem: hasChild ? hasChild.id : parent.childNodes[0].id,
    };
  }

  return { selectedItem: parent.id, selectedChildItem: undefined };
};
