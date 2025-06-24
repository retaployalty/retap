import { useState, useEffect } from 'react';

export function useHydration() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
} 