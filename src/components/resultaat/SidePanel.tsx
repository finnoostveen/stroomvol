"use client";

import { useEffect, useState } from "react";
import type { CalcResult } from "@/lib/calc";
import { fmt } from "@/lib/calc";
import { berekenCumulatieveTvt, formatTvt } from "@/lib/helpers";

function formatDatum(d: string): string {
  if (!d) return new Date().toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
}

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

interface Props {
  result: CalcResult;
  klantNaam: string;
  datum: string;
  onTerug: () => void;
  onAanpassen: () => void;
  onDownloadPdf: () => void;
  pdfLoading?: boolean;
}

export default function SidePanel({ result: c, klantNaam, datum, onTerug, onAanpassen, onDownloadPdf, pdfLoading }: Props) {
  const tvt = berekenCumulatieveTvt(c.real, c.investering);
  const gemBesparing = Math.round(c.real.total15 / 15);

  const animBesparing = useCountUp(gemBesparing);
  const animTotal15 = useCountUp(c.real.total15);
  const animInvestering = useCountUp(c.investering);
  const animZelf = useCountUp(c.hasSolar ? c.zelfPctMet : 0, 800);

  const badges: string[] = [];
  badges.push(c.contract === "dynamisch" ? "Dynamisch" : c.contract === "variabel" ? "Variabel" : "Vast");
  if (c.hasSolar) badges.push(`${c.nPanelen} panelen`);
  if (c.heeftEv) badges.push("EV");
  if (c.heeftWp || c.heeftHwp) badges.push("Warmtepomp");
  if (c.omvormerMerk) {
    const omvLabel = c.omv === "hybride" ? "hybride" : c.omv === "micro" ? "micro" : "standaard";
    badges.push(`${c.omvormerMerk} ${omvLabel}`);
  }
  if (c.doel.has("nood")) badges.push("Noodstroom");

  return (
    <aside className="side-panel">
      {/* Brand */}
      <div className="side-brand">
        <p className="side-logo">STROOM<span>VOL</span></p>
        <p className="side-tagline">Batterijadvies op maat</p>
      </div>

      {/* Klant */}
      <div className="side-klant">
        <p className="side-label">Advies voor</p>
        <p className="side-naam">{klantNaam || "Klant"}</p>
        <p className="side-datum">{formatDatum(datum)}</p>
      </div>

      {/* Capaciteit */}
      <div className="side-capaciteit">
        <p className="side-kwh">{c.aanbevolenKwh}</p>
        <p className="side-kwh-label">kWh aanbevolen</p>
        <p className="side-tier">{c.tier}</p>
      </div>

      {/* Badges */}
      <div className="side-badges">
        {badges.map((b) => (
          <span key={b} className="side-badge">{b}</span>
        ))}
      </div>

      <div className="side-divider" />

      {/* Metrics */}
      <div className="side-metric">
        <p className="side-metric-label">TERUGVERDIENTIJD</p>
        <p className="side-metric-value accent">{formatTvt(tvt)}</p>
      </div>

      <div className="side-metric">
        <p className="side-metric-label">BESPARING / JAAR</p>
        <p className="side-metric-value">&euro;{fmt(animBesparing)}</p>
      </div>

      <div className="side-metric">
        <p className="side-metric-label">TOTAAL 15 JAAR</p>
        <p className="side-metric-value">&euro;{fmt(animTotal15)}</p>
      </div>

      {c.hasSolar && (
        <div className="side-metric">
          <p className="side-metric-label">ONAFHANKELIJKHEID</p>
          <p className="side-metric-value groen">{animZelf}%</p>
        </div>
      )}

      <div className="side-metric">
        <p className="side-metric-label">INVESTERING</p>
        <p className="side-metric-value muted">&euro;{fmt(animInvestering)}</p>
      </div>

      <div className="side-divider" />

      {/* Acties */}
      <button
        type="button"
        className="side-btn primary"
        onClick={onDownloadPdf}
        disabled={pdfLoading}
      >
        {pdfLoading ? "PDF genereren..." : "PDF downloaden"}
      </button>
      <button type="button" className="side-btn side-btn-link" onClick={onAanpassen}>
        Aannames &rarr;
      </button>
      <button type="button" className="side-btn secondary" onClick={onTerug}>
        &larr; Terug naar formulier
      </button>
    </aside>
  );
}
