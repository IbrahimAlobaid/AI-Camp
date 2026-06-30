import { useEffect, useState } from "react";

import { DEFAULT_SETTINGS } from "../lib/constants";
import type { SessionSettings } from "../types/voice";

const STORAGE_KEY = "english-voice-coach:settings:v1";

function loadSettings(): SessionSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } as SessionSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSessionSettings() {
  const [settings, setSettings] = useState<SessionSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <Key extends keyof SessionSettings>(
    key: Key,
    value: SessionSettings[Key],
  ) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  return { settings, updateSetting };
}
