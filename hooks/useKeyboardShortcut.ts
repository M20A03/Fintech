'use client';

import { useEffect } from 'react';

interface KeyboardShortcutConfig {
  onCmdK?: () => void;
  onEscape?: () => void;
  disabled?: boolean;
}

export function useKeyboardShortcut({ onCmdK, onEscape, disabled = false }: KeyboardShortcutConfig) {
  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd + K or Ctrl + K (Search / Command Palette)
      if ((event.metaKey || event.ctrlKey) && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault();
        onCmdK?.();
      }

      // Escape key (Close modals, drawers, command palettes)
      if (event.key === 'Escape' || event.key === 'Esc') {
        onEscape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCmdK, onEscape, disabled]);
}
