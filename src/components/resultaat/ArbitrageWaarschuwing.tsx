"use client";

import { useState } from "react";

interface Props {
  show: boolean;
}

export default function ArbitrageWaarschuwing({ show }: Props) {
  const [hidden, setHidden] = useState(false);

  if (!show || hidden) return null;

  return (
    <div className="arb-warn">
      <button type="button" className="arb-warn-close" onClick={() => setHidden(true)} aria-label="Sluiten">&times;</button>
      <div className="arb-warn-header">&#9888;&#65039; Let op: puur arbitrage-profiel</div>
      <p className="arb-warn-text">
        Zonder zonnepanelen is de besparing volledig afhankelijk van prijsverschillen op de energiemarkt.
        Deze spreads fluctueren dagelijks en kunnen op termijn dalen naarmate meer huishoudens een thuisbatterij plaatsen.
        De berekening houdt rekening met een capture rate van 80% — niet elke cyclus vangt de volle spread.
        Met zonnepanelen erbij wordt de business case stabieler door de gegarandeerde zelfconsumptie-besparing.
      </p>
    </div>
  );
}
