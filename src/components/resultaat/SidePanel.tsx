"use client";

import { useEffect, useState } from "react";
import type { CalcResult } from "@/lib/calc";
import { fmt } from "@/lib/calc";
import type { Optimalisatie } from "@/lib/optimalisaties";
import InfoTip from "./InfoTip";
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
  onScrollToSection: (id: string, tab: string) => void;
  optimalisaties: Optimalisatie[];
  pdfLoading?: boolean;
}

export default function SidePanel({ result: c, klantNaam, datum, onTerug, onAanpassen, onDownloadPdf, onScrollToSection, optimalisaties, pdfLoading }: Props) {
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
  const netLabels: Record<string, string> = { "1x25": "1-fase 25A", "1x35": "1-fase 35A", "3x25": "3-fase 25A", "3x63": "3-fase 63A" };
  badges.push(netLabels[c.net] || c.net);
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
      <div className="side-capaciteit clickable" onClick={() => onScrollToSection("sectie-doelen", "advies")} role="button" tabIndex={0}>
        <p className="side-kwh">{c.aanbevolenKwh}</p>
        <p className="side-kwh-label">kWh aanbevolen <span className="side-arrow">&rsaquo;</span></p>
        <p className="side-tier">{c.tier}</p>
        {c.netBeperkt && (
          <p className="side-net-info">
            <InfoTip tekst={`Je ${netLabels[c.net] || c.net} aansluiting (${c.maxKwNet} kW) beperkt de maximale batterijgrootte. Overweeg een upgrade naar een zwaardere aansluiting voor een grotere batterij.`} />
            <span>Beperkt door netaansluiting</span>
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="side-badges">
        {badges.map((b) => (
          <span key={b} className="side-badge">{b}</span>
        ))}
      </div>

      <div className="side-divider" />

      {/* Metrics */}
      <div className="side-metric clickable" onClick={() => onScrollToSection("sectie-scenario", "advies")} role="button" tabIndex={0}>
        <p className="side-metric-label">TERUGVERDIENTIJD <span className="side-arrow">&rsaquo;</span></p>
        <p className="side-metric-value accent">{formatTvt(tvt)}</p>
      </div>

      <div className="side-metric clickable" onClick={() => onScrollToSection("sectie-financieel", "advies")} role="button" tabIndex={0}>
        <p className="side-metric-label">BESPARING / JAAR <span className="side-arrow">&rsaquo;</span></p>
        <p className="side-metric-value">&euro;{fmt(animBesparing)}</p>
      </div>

      <div className="side-metric clickable" onClick={() => onScrollToSection("sectie-financieel", "advies")} role="button" tabIndex={0}>
        <p className="side-metric-label">TOTAAL 15 JAAR <span className="side-arrow">&rsaquo;</span></p>
        <p className="side-metric-value">&euro;{fmt(animTotal15)}</p>
      </div>

      {c.hasSolar && (
        <div className="side-metric clickable" onClick={() => onScrollToSection("sectie-onafhankelijkheid", "advies")} role="button" tabIndex={0}>
          <p className="side-metric-label">ONAFHANKELIJKHEID <span className="side-arrow">&rsaquo;</span></p>
          <p className="side-metric-value groen">{animZelf}%</p>
        </div>
      )}

      <div className="side-metric clickable" onClick={() => onScrollToSection("sectie-spaarrekening", "advies")} role="button" tabIndex={0}>
        <p className="side-metric-label">INVESTERING <span className="side-arrow">&rsaquo;</span></p>
        <p className="side-metric-value muted">&euro;{fmt(animInvestering)}</p>
      </div>

      <div className="side-divider" />

      {/* Optimalisaties */}
      {optimalisaties.length > 0 && (
        <>
          <div className="opti-header">
            <span className="opti-header-label">OPTIMALISATIES</span>
            <span className="opti-badge">{optimalisaties.length}</span>
          </div>
          {optimalisaties.map((o) => (
            <div
              key={o.id}
              className="opti-item"
              role="button"
              tabIndex={0}
              title={o.reden}
              onClick={() => {
                onScrollToSection(o.sectieId, o.tab);
                setTimeout(() => {
                  const el = document.getElementById(o.sectieId);
                  if (el) {
                    el.classList.add("highlighted");
                    setTimeout(() => el.classList.remove("highlighted"), 1500);
                  }
                }, 150);
              }}
            >
              <span className="opti-dot" />
              <span className="opti-label">{o.label}</span>
              <span className="opti-arrow">&rsaquo;</span>
            </div>
          ))}
          <div className="side-divider" />
        </>
      )}

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
