"use client";

import { useTransition } from "react";

export default function Stepper({
  value,
  step,
  unit,
  onAdjust,
}: {
  value: number;
  step: number;
  unit?: string;
  onAdjust: (delta: number) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  const adjust = (sign: 1 | -1) => start(() => onAdjust(sign * step));

  return (
    <div className={`stepper ${pending ? "pending" : ""}`}>
      <button onClick={() => adjust(-1)} aria-label="decrease" disabled={pending}>◀</button>
      <span className="stepper-value">{value}{unit ? ` ${unit}` : ""}</span>
      <button onClick={() => adjust(1)} aria-label="increase" disabled={pending}>▶</button>
    </div>
  );
}
