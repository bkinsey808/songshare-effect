import { useEffect, useRef, useState, type ReactElement } from "react";
import { useTranslation } from "react-i18next";

import DemoNavigation from "@/react/demo/DemoNavigation";
import ButterchurnVisualizer from "@/react/butterchurn/ButterchurnVisualizer";
import ButterchurnLiveVisualizer from "@/react/butterchurn/ButterchurnLiveVisualizer";

export default function ButterchurnDemoPage(): ReactElement {
  const { t } = useTranslation();

  // Container for the visualizer section so we can request fullscreen on it
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [_isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onFullChange(): void {
      const fsElem = document.fullscreenElement;
      setIsFullscreen(!!fsElem);
    }

    async function maybeExit(): Promise<void> {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.warn(error);
      }
      setIsFullscreen(false);
    }

    function onKey(event: KeyboardEvent): void {
      // Ensure Escape exits fullscreen. Browsers do this by default, but
      // having an explicit listener keeps our UI in sync.
      if (event.key === "Escape" && document.fullscreenElement) {
        void maybeExit();
      }
    }

    document.addEventListener("fullscreenchange", onFullChange);
    document.addEventListener("keydown", onKey);
    return (): void => {
      document.removeEventListener("fullscreenchange", onFullChange);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function enterFullscreen(): Promise<void> {
    if (!containerRef.current) {
      return;
    }
    try {
      await containerRef.current.requestFullscreen({ navigationUI: "hide" });
      setIsFullscreen(true);
    } catch (error) {
      console.warn(error);
    }
  }

  async function exitFullscreen(): Promise<void> {
    if (!document.fullscreenElement) {
      return;
    }
    try {
      await document.exitFullscreen();
      setIsFullscreen(false);
    } catch (error) {
      console.warn(error);
    }
  }

  return (
    <div>
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-4xl font-bold">🧈 Butterchurn Visualizer</h1>
        <p className="text-gray-400">
          {t(
            "pages.butterchurnDemo.subtitle",
            "Try sample visualizations from the Butterchurn demo. Use the controls below to load a demo URL, enter fullscreen and press Escape to exit.",
          )}
        </p>
      </div>

      <DemoNavigation />

      <div className="space-y-6">
        <section className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-2xl font-bold">🎛️ Demo Controls</h2>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                void enterFullscreen();
              }}
              className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:opacity-90"
            >
              Enter fullscreen
            </button>
            <button
              type="button"
              onClick={() => {
                void exitFullscreen();
              }}
              className="rounded border border-gray-700 px-4 py-2 text-sm text-white hover:opacity-90"
            >
              Exit fullscreen
            </button>
          </div>
        </section>

        <section
          ref={containerRef}
          className="rounded-lg border border-white/10 bg-black p-6"
        >
          <div className="mb-4 text-sm text-gray-300">
            Native Butterchurn visualizer (native)
          </div>
          <ButterchurnVisualizer />
        </section>

        <section className="rounded-lg border border-white/10 bg-black p-6">
          <div className="mb-4 text-sm text-gray-300">
            Live capture visualizer (system / tab audio)
          </div>
          <ButterchurnLiveVisualizer />
        </section>

        <section className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="mb-2 text-lg font-semibold">Notes</h3>
          <ul className="text-sm text-gray-300">
            <li>
              • Use file upload or microphone controls below to feed audio into
              the visualizer.
            </li>
            <li>• Use presets to change the visualizer look and feel.</li>
            <li>
              • Fullscreen uses the browser Fullscreen API — Escape will exit
              fullscreen.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
