'use client';

import { useState } from 'react';

export function usePressFeedback<T extends string>(durationMs = 180) {
  const [pressedKey, setPressedKey] = useState<T | null>(null);

  function release(key: T) {
    setPressedKey((current) => (current === key ? null : current));
  }

  function trigger(key: T) {
    setPressedKey(key);
  }

  function flash(key: T) {
    setPressedKey(key);
    window.setTimeout(() => {
      setPressedKey((current) => (current === key ? null : current));
    }, durationMs);
  }

  function getPressProps(key: T) {
    return {
      onPointerDown: () => trigger(key),
      onPointerUp: () => release(key),
      onPointerLeave: () => release(key),
      onPointerCancel: () => release(key),
      onBlur: () => release(key),
    };
  }

  return { pressedKey, flash, getPressProps };
}
