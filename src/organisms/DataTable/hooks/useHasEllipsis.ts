import { useState, useEffect, useRef } from 'react';

// Custom hook to detect ellipsis/truncation on an element
export const useHasEllipsis = (dependency) => {
  const ref = useRef(null);
  const [hasEllipsis, setHasEllipsis] = useState(false);

  useEffect(() => {
    const el: any = ref.current;
    if (el) {
      // Check if the content is truncated
      setHasEllipsis(el.scrollWidth > el.clientWidth);
    }
    // Optionally, re-run on window resize if the container may change size.
    const handleResize = () => {
      if (el) {
        setHasEllipsis(el.scrollWidth > el.clientWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dependency]); // re-run when dependency (e.g. text content) changes

  return { ref, hasEllipsis };
}