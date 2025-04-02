// src/organisms/DataTable/workers/cellCommitWorker.ts
import { getDeepValue, setDeepValue } from "../utils";

self.onmessage = function(e) {
  try {
    const { rowData, accessor, val } = e.data;
    // Retrieve the current value.
    const currentValue = getDeepValue(rowData, accessor);
    const currentValueStr = currentValue == null ? '' : String(currentValue);
    const newValueStr = val == null ? '' : String(val);
    
    // If the new value is the same, signal no change.
    if (currentValueStr === newValueStr) {
      self.postMessage({ unchanged: true });
      return;
    }
    
    // Otherwise, update the row.
    const updatedRow = setDeepValue(rowData, accessor, val);
    self.postMessage({ updatedRow });
  } catch (error: any) {
    self.postMessage({ error: error.message });
  }
};
