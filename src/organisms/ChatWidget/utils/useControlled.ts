import { useState } from "react";

/** Local controlled/uncontrolled helper */
export const useControlled = <T>(
  controlled: T | undefined,
  defaultValue: T,
) => {
  const [uncontrolled, setUncontrolled] = useState<T>(defaultValue);
  const isCtrl = controlled !== undefined;
  return [
    isCtrl ? controlled : uncontrolled,
    isCtrl ? () => {} : setUncontrolled,
  ] as const;
};
