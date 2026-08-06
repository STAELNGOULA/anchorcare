"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PullToRefreshOptions = {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
};

export function usePullToRefresh({ onRefresh, disabled }: PullToRefreshOptions) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const active = useRef(false);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (disabled || window.scrollY > 8) return;
      startY.current = event.touches[0]?.clientY ?? 0;
      active.current = true;
    },
    [disabled],
  );

  const onTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!active.current || disabled) return;
      const y = event.touches[0]?.clientY ?? 0;
      const delta = Math.max(0, y - startY.current);
      if (delta > 0) setPullDistance(Math.min(delta, 96));
    },
    [disabled],
  );

  const onTouchEnd = useCallback(async () => {
    if (!active.current) return;
    active.current = false;
    if (pullDistance >= 72) {
      setPulling(true);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(10);
      }
      try {
        await onRefresh();
      } finally {
        setPulling(false);
      }
    }
    setPullDistance(0);
  }, [onRefresh, pullDistance]);

  useEffect(() => {
    if (!pulling) setPullDistance(0);
  }, [pulling]);

  return {
    pulling,
    pullDistance,
    pullHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
