"use client";

import { useEffect, useRef, useState } from "react";

export type Track = { title?: string; src: string };

export default function MusicPlayer({ tracks }: { tracks: Track[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const current = tracks[idx];

  if (tracks.length === 0) {
    return (
      <div className="player-empty">
        Add tracks in <code>vault/config.md</code> under <code>music.tracks</code>.
      </div>
    );
  }

  const toggle = async () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setPlaying(true);
      } catch {
        /* autoplay blocked, ignore */
      }
    }
  };

  const next = () => setIdx((i) => (i + 1) % tracks.length);
  const prev = () => setIdx((i) => (i - 1 + tracks.length) % tracks.length);

  return (
    <div className="player">
      <audio
        ref={audioRef}
        src={current.src}
        onEnded={next}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="player-title" title={current.title || current.src}>
        {playing ? "♪ " : ""}
        {current.title || current.src.split("/").pop()}
      </div>
      <div className="player-controls">
        <button onClick={prev} aria-label="previous">⏮</button>
        <button onClick={toggle} aria-label="play/pause">{playing ? "⏸" : "▶"}</button>
        <button onClick={next} aria-label="next">⏭</button>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        aria-label="volume"
      />
    </div>
  );
}
