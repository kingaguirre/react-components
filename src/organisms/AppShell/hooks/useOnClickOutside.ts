import { useEffect } from "react";

export const useOnClickOutside = (ref, handler, active = true) => {
  useEffect(() => {
    if (!active) return;

    const handleClickOutside = (event) => {
      // If the click is outside the ref element, call the handler
      if (ref.current && !ref.current.contains(event.target)) {
        handler(event);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, handler, active]);
};
