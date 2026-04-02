"use client";

import type { CalcResult } from "@/lib/calc";

interface Props {
  result: CalcResult;
}

function berekenNietsDoen(calc: CalcResult) {
  let stijging: number;
  if (calc.contract === "vast") {
    stijging = 0.03;
  } else if (calc.contract === "variabel") {
    stijging = calc.stijgPct / 100;
  } else {
    stijging = 0.03;
  }

  const huidigJaarkosten = calc.totaalVerbruik * calc.tarief;
  const periodes = [
    { label: "Vandaag", jaar: 0 },
    { label: "2030", jaar: 4 },
    { label: "2035", jaar: 9 },
  ];

  const projecties = periodes.map((p) => {
    const toekomstigTarief = calc.tarief * Math.pow(1 + stijging, p.jaar);
    const jaarkosten = Math.round(calc.totaalVerbruik * toekomstigTarief);
    return {
      label: p.label,
      tarief: Math.round(toekomstigTarief * 100) / 100,
      jaarkosten,
    };
  });

  let cumulatiefExtra = 0;
  for (let j = 1; j <= 10; j++) {
    const toekomstigKosten = calc.totaalVerbruik * calc.tarief * Math.pow(1 + stijging, j);
    cumulatiefExtra += toekomstigKosten - huidigJaarkosten;
  }

  return {
    projecties,
    stijgingPct: Math.round(stijging * 100),
    cumulatiefExtra10Jaar: Math.round(cumulatiefExtra),
    huidigJaarkosten: Math.round(huidigJaarkosten),
  };
}

const nlEuro = (n: number) => n.toLocaleString("nl-NL", { maximumFractionDigits: 0 });

export default function NietsDoen({ result }: Props) {
  const data = berekenNietsDoen(result);

  const subtitel =
    result.contract === "vast"
      ? "Ook bij een vast contract stijgen de tarieven bij verlenging. Een batterij beschermt je structureel."
      : "Energieprijzen stijgen structureel. Hoe hoger de prijzen, hoe meer je batterij verdient. Dit is geen 'als' maar 'wanneer'.";

  return (
    <div className="nd-section">
      <div className="nd-inner">
        <div className="card-header" style={{ marginBottom: 20 }}>
          <div className="card-icon" style={{ background: "rgba(255, 220, 60, 0.12)" }}>📈</div>
          <div>
            <div className="nd-title">Toekomstbestendig investeren</div>
            <div className="nd-subtitle">{subtitel}</div>
          </div>
        </div>

        {/* Drie projectie kaarten */}
        <div className="nd-grid">
          {data.projecties.map((p) => (
            <div key={p.label} className="nd-card">
              <div className="nd-card-icon">📅</div>
              <div className="nd-card-label">{p.label}</div>
              <div className="nd-card-tarief">&euro;{p.tarief.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="nd-card-sub">per kWh</div>
              <div className="nd-card-kosten">
                Jaarlijkse kosten &euro;{nlEuro(p.jaarkosten)}
              </div>
            </div>
          ))}
        </div>

        {/* Info blokken */}
        <div className="nd-info-grid">
          <div className="nd-info">
            <span className="nd-info-icon">⚡</span>
            <div>
              <strong>Elektrificatie neemt toe</strong>
              <p>Warmtepompen, EV&apos;s en inductie koken verhogen de vraag naar stroom. Dit drijft prijzen verder omhoog.</p>
            </div>
          </div>
          <div className="nd-info">
            <span className="nd-info-icon">⚠️</span>
            <div>
              <strong>Netcongestie wordt erger</strong>
              <p>Stroomnet zit vol. Thuisbatterijen worden essentieel — en mogelijk verplicht. Early adopters profiteren het meest.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="nd-footer">
          Prijsprojecties gebaseerd op {data.stijgingPct}% jaarlijkse stijging. Werkelijke prijzen kunnen hoger of lager uitvallen.
        </p>
      </div>
    </div>
  );
}
