import { useCallback, useState } from "react";

import type { MicrophonePermission } from "../types/voice";

export function useMicrophonePermission() {
  const [permission, setPermission] =
    useState<MicrophonePermission>("unknown");

  const refreshPermission = useCallback(async () => {
    if (!navigator.permissions?.query) {
      setPermission("prompt");
      return;
    }

    try {
      const result = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      setPermission(result.state as MicrophonePermission);
    } catch {
      setPermission("prompt");
    }
  }, []);

  return { permission, setPermission, refreshPermission };
}
