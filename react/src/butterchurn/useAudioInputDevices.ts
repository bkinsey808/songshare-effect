import { useEffect, useState } from "react";
import { clientDebug } from "@/react/utils/clientLogger";

const FIRST_INDEX = 0;

export default function useAudioInputDevices(
  selectedDeviceId: string | undefined,
  setSelectedDeviceId: (id?: string) => void,
): { audioInputDevices: MediaDeviceInfo[]; setAudioInputDevices: (devices: MediaDeviceInfo[]) => void } {
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    let mounted = true;

    async function refreshDevices(): Promise<void> {
      if (
        !(typeof navigator !== "undefined" &&
        typeof navigator.mediaDevices === "object" &&
        typeof navigator.mediaDevices.enumerateDevices === "function")
      ) {
        return;
      }
      let devices: MediaDeviceInfo[] = [];
      try {
        devices = await navigator.mediaDevices.enumerateDevices();
      } catch (error) {
        clientDebug("enumerateDevices failed", error);
        return;
      }

      const inputs = devices.filter((device) => device.kind === "audioinput");
      if (!mounted) { return; }
      setAudioInputDevices(inputs);

      if (selectedDeviceId !== undefined) { return; }

      const preferred = inputs.find((device) => {
        const label = String(device.label || "").toLowerCase();
        return /voicemeeter|vb-audio|virtual|cable/.test(label);
      });
      if (preferred) {
        const preferredId = preferred.deviceId;
        try {
          setSelectedDeviceId(preferredId);
        } catch {
          // ignore
        }
        return;
      }

      if (inputs.length > FIRST_INDEX) {
        const firstDevice = inputs[FIRST_INDEX];
        const firstId = firstDevice ? firstDevice.deviceId : undefined;
        try {
          setSelectedDeviceId(firstId);
        } catch {
          // ignore
        }
      }
    }

    function changeHandler(): void {
      void refreshDevices();
    }

    void refreshDevices();

    if (typeof navigator !== "undefined" && typeof navigator.mediaDevices === "object") {
      try {
        const md = navigator.mediaDevices;
        if (typeof md.addEventListener === "function") {
          md.addEventListener("devicechange", changeHandler as EventListener);
        }
      } catch {
        // ignore
      }
    }

    return (): void => {
      mounted = false;
      if (typeof navigator !== "undefined" && typeof navigator.mediaDevices === "object") {
        try {
          const md = navigator.mediaDevices;
          if (typeof md.removeEventListener === "function") {
            md.removeEventListener("devicechange", changeHandler as EventListener);
          }
        } catch {
          // ignore
        }
      }
    };
  }, [selectedDeviceId, setSelectedDeviceId]);

  return { audioInputDevices, setAudioInputDevices } as const;
}
