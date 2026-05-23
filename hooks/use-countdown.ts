"use client";

import { useEffect, useMemo, useState } from "react";

export function useCountdown(expiresAt?: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [expiresAt]);

  return useMemo(() => {
    if (!expiresAt) {
      return {
        remainingMs: 0,
        label: "00:00",
        isExpired: false,
      };
    }

    const remainingMs = Math.max(new Date(expiresAt).getTime() - now, 0);
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return {
      remainingMs,
      label: `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`,
      isExpired: remainingMs === 0,
    };
  }, [expiresAt, now]);
}
