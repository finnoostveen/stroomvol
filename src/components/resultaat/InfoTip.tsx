"use client";

import { useState } from "react";

interface Props {
  tekst: string;
}

export default function InfoTip({ tekst }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span className="info-tip-wrap">
      <button
        type="button"
        className="info-tip-btn"
        aria-label="Meer informatie"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        i
      </button>
      {open && (
        <span className="info-tip-bubble" role="tooltip">
          {tekst}
        </span>
      )}
    </span>
  );
}
