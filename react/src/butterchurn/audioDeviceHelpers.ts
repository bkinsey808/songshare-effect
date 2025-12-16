import stringifyUnknown from "@/react/utils/stringifyUnknown";
import { clientDebug } from "@/react/utils/clientLogger";

const FIRST_INDEX = 0;

export default async function testDevice(
  selectedDeviceId: string | undefined,
  setAudioInputDevices?: (devices: MediaDeviceInfo[]) => void,
  recordError?: (msg?: string) => void,
): Promise<boolean> {
  if (
    !(typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices === "object" &&
    typeof navigator.mediaDevices.getUserMedia === "function")
  ) {
    recordError?.("Microphone capture is not supported by this browser.");
    return false;
  }

  const constraints = selectedDeviceId === undefined
    ? { audio: true }
    : { audio: { deviceId: { exact: selectedDeviceId } } };

  let tracks: MediaStreamTrack[] = [];
  let succeeded = false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia(
      constraints as MediaStreamConstraints,
    );
    tracks = stream.getTracks();
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((device) => device.kind === "audioinput");
      setAudioInputDevices?.(inputs);
    } catch {
      // ignore
    }
    recordError?.(undefined);
    succeeded = true;
  } catch (error) {
    clientDebug("testDevice: getUserMedia error", error);
    let errName: string | undefined = undefined;
    if (error !== undefined && error !== null && typeof error === "object" && "name" in error) {
      const nameVal = (error as Record<string, unknown>)["name"];
      if (typeof nameVal === "string") {
        errName = nameVal;
      }
    }
    if (errName === "NotAllowedError" || errName === "SecurityError") {
      recordError?.("Microphone permission denied. Please allow microphone access for this page.");
    } else if (errName === "NotFoundError") {
      recordError?.("Selected device not found. Check the device is connected and not being used elsewhere.");
    } else if (errName === "NotReadableError" || errName === "TrackStartError") {
      recordError?.("Selected device is not readable or is already in use.");
    } else if (errName === "OverconstrainedError") {
      recordError?.("Selected device doesn't satisfy constraints.");
    } else {
      recordError?.(String(stringifyUnknown(error ?? "Failed to access device")));
    }
  }

  if (tracks.length > FIRST_INDEX) {
    for (const t of tracks) {
      try {
        t?.stop();
      } catch {
        // ignore
      }
    }
  }

  return succeeded;
}
