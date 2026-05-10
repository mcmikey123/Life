"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function DoneTick({
  slug,
  date,
  initialDone,
}: {
  slug: string;
  date: string;
  initialDone: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(initialDone);
  const [pending, startTransition] = useTransition();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (done || pending) return;
    setDone(true);
    startTransition(async () => {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ daily: slug, status: "done", date }),
      });
      if (!res.ok) {
        setDone(false);
        return;
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`daily-tick${done ? " done" : ""}${pending ? " pending" : ""}`}
      aria-label={done ? "Done today" : "Mark done today"}
      title={done ? "Done today" : "Mark done today"}
      disabled={done || pending}
    >
      {done ? "✓" : ""}
    </button>
  );
}
