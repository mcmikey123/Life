"use client";

import { useEffect, useState } from "react";
import MusicPlayer, { type Track } from "./MusicPlayer";

const STORAGE_KEY = "life-dashboard:music-open";

export default function ChromeControls({ tracks }: { tracks: Track[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOpen(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      try { window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  };

  return (
    <>
      <button
        className={`settings${open ? " active" : ""}`}
        title={open ? "Hide music player" : "Show music player"}
        aria-pressed={open}
        onClick={toggle}
      >
        ⚙
      </button>
      {open && (
        <div className="player-float" role="region" aria-label="Music player">
          <MusicPlayer tracks={tracks} />
        </div>
      )}
    </>
  );
}
