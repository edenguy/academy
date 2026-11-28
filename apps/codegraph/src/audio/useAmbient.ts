import { useCallback, useEffect, useRef, useState } from 'react';
import { AmbientPad } from './ambient';

export function useAmbient(): { enabled: boolean; toggle: () => void } {
  const padRef = useRef<AmbientPad | null>(null);
  const [enabled, setEnabled] = useState(false);

  const toggle = useCallback(() => {
    if (!padRef.current) padRef.current = new AmbientPad();
    setEnabled((prev) => {
      const next = !prev;
      if (next) padRef.current!.start();
      else padRef.current!.stop();
      return next;
    });
  }, []);

  // Stop cleanly if the shell ever unmounts (SPA navigation keeps it mounted in practice).
  useEffect(() => () => padRef.current?.stop(), []);

  return { enabled, toggle };
}
