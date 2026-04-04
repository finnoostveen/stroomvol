"use client";

import type { CalcResult } from "@/lib/calc";
import { fmt, GROOTVERBRUIK } from "@/lib/calc";
import InfoTip from "./InfoTip";

interface GoalItemProps {
  icon: string;
  naam: string;
  badgeText: string;
  badgeClass: string;
  value: string;
  barPct: number;
  barClass: string;
  children: React.ReactNode;
  compare?: React.ReactNode;
}

function GoalItem({ icon, naam, badgeText, badgeClass, value, barPct, barClass, children, compare }: GoalItemProps) {
  return (
    <div className="goal-item">
      <div className="goal-head">
        <div className="goal-name">
          <span className="goal-icon">{icon}</span>
          {naam}
          <span className={`goal-badge ${badgeClass}`}>{badgeText}</span>
        </div>
        <div className="goal-val">{value}</div>
      </div>
      <div className="goal-bar-wrap">
        <div
          className={`goal-bar ${barClass}`}
          style={{ width: `${Math.min(barPct, 100)}%` }}
        />
      </div>
      {compare}
      <div className="goal-detail">{children}</div>
    </div>
  );
}

interface Props {
  result: CalcResult;
}

export default function DoelMetrics({ result: c }: Props) {
  const y1 = c.real.perJaar[0];

  return (
    <div className="goals-card">
      <div className="goals-title">Jouw doelen &mdash; wat de batterij bereikt</div>
      <div className="goals-sub">
        Per doel laten we zien hoeveel dichter je komt met deze
        batterijconfiguratie.
      </div>

      {/* Zelfconsumptie */}
      {c.doel.has("zelf") && c.hasSolar && (
        <GoalItem
          icon={"\u2600\uFE0F"}
          naam="Zelfconsumptie verhogen"
          badgeText={c.zelfPctMet >= 70 ? "Sterk" : "Verbeterd"}
          badgeClass={c.zelfPctMet >= 70 ? "goal-badge-green" : c.zelfPctMet >= 45 ? "goal-badge-yellow" : "goal-badge-gray"}
          value={`${c.zelfPctMet}%`}
          barPct={c.zelfPctMet}
          barClass="goal-bar-green"
          compare={
            <div className="goal-compare">
              <span className="goal-compare-before">Zonder batterij: {c.zelfPctZonder}%</span>
              <span className="goal-compare-arrow">&rarr;</span>
              <span className="goal-compare-after">Met batterij: {c.zelfPctMet}%</span>
            </div>
          }
        >
          Je verbruikt <strong>{c.zelfPctMet - c.zelfPctZonder} procentpunt meer</strong> van je
          eigen zonnestroom. Dat bespaart <strong>&euro;{fmt(y1.zelf)}/jaar</strong>.
          <InfoTip tekst="Zonder batterij lever je overtollige zonnestroom terug tegen een laag teruglevertarief. De batterij slaat die stroom op zodat je die 's avonds zelf verbruikt tegen het hogere leveringstarief." />
        </GoalItem>
      )}

      {/* Slim handelen / dal-piek */}
      {(c.doel.has("handel") || (c.contract !== "dynamisch" && y1.arb > 0)) && (() => {
        const isDalPiek = c.contract !== "dynamisch" && y1.arb > 0;
        const actief = c.contract === "dynamisch" || isDalPiek;
        const arbVal = actief ? y1.arb : 0;
        return (
          <GoalItem
            icon={"\u26A1"}
            naam={isDalPiek ? "Slim laden (dal/piek)" : "Slim handelen (arbitrage)"}
            badgeText={actief ? "Actief" : "Niet mogelijk"}
            badgeClass={actief ? "goal-badge-green" : "goal-badge-gray"}
            value={actief ? `\u20AC${fmt(arbVal)}/jr` : "\u2014"}
            barPct={actief ? Math.min(Math.round((arbVal / 500) * 100), 100) : 0}
            barClass={actief ? "goal-bar-green" : "goal-bar-yellow"}
          >
            {isDalPiek ? (
              <>De batterij laadt &apos;s nachts op bij je goedkopere daltarief en ontlaadt overdag bij piektarief. De besparing is beperkt door de kleine spread tussen dal en piek (&euro;{c.spread.toFixed(2)}/kWh).
              <InfoTip tekst={`De batterij laadt 's nachts op bij je goedkopere daltarief en ontlaadt overdag bij piektarief. De besparing is beperkt door de kleine spread tussen dal en piek (€${c.spread.toFixed(2)}/kWh). Met een dynamisch contract is deze spread groter en de opbrengst hoger.`} /></>
            ) : actief ? (
              <>Bij een dynamisch contract met een spread van <strong>&euro;{c.spread.toFixed(2)}/kWh</strong> verdient de batterij extra door actief te laden bij dalprijs en te ontladen bij piekprijs.
              <InfoTip tekst="De spread is het verschil tussen piek- en daltarief op de EPEX-markt. De batterij laadt 's nachts goedkoop en ontlaadt overdag duur. Het aantal arbitragecycli varieert per seizoen." /></>
            ) : (
              <>Arbitrage vereist een <strong>dynamisch energiecontract</strong>. Overweeg een overstap om dit doel te activeren.</>
            )}
          </GoalItem>
        );
      })()}

      {/* Piekverbruik */}
      {c.doel.has("peak") && (
        <GoalItem
          icon={"\uD83D\uDCC9"}
          naam="Piekverbruik beperken"
          badgeText={`\u2212${c.peakReductieKw.toFixed(1)} kW`}
          badgeClass={c.peakReductieKw >= 3 ? "goal-badge-green" : "goal-badge-yellow"}
          value={`\u20AC${fmt(y1.peak)}/jr`}
          barPct={Math.round((c.peakReductieKw / 5) * 100)}
          barClass="goal-bar-green"
        >
          De batterij kan piekmomenten opvangen door tot <strong>{c.peakReductieKw.toFixed(1)} kW</strong> te
          ontladen. Bespaart <strong>&euro;{fmt(y1.peak)}/jaar</strong> aan capaciteitstarieven.
          <InfoTip tekst="Peak shaving beperkt je maximale netafname. Dit is relevant bij capaciteitstarief en voorkomt overbelasting van je aansluiting." />
        </GoalItem>
      )}

      {/* Noodstroom */}
      {c.doel.has("nood") && (
        <GoalItem
          icon={"\uD83D\uDD0B"}
          naam="Noodstroom bij stroomuitval"
          badgeText={`${c.noodstroomUren} uur`}
          badgeClass={c.noodstroomUren >= 8 ? "goal-badge-green" : c.noodstroomUren >= 4 ? "goal-badge-yellow" : "goal-badge-gray"}
          value={`${c.noodstroomUren}u backup`}
          barPct={Math.round((c.noodstroomUren / 24) * 100)}
          barClass="goal-bar-yellow"
        >
          Bij stroomuitval levert de {c.aanbevolenKwh} kWh batterij tot{" "}
          <strong>{c.noodstroomUren} uur</strong> stroom voor essenti&euml;le apparaten (~1,2 kW).
          <InfoTip tekst="Berekend op basis van usable capaciteit (DoD) gedeeld door een gemiddeld noodverbruik van 1,2 kW (koelkast, verlichting, wifi, telefoon opladen)." />
        </GoalItem>
      )}

      {/* EV */}
      {c.heeftEv && (() => {
        const evActief = y1.ev > 0;
        return (
          <GoalItem
            icon={"\uD83D\uDE97"}
            naam="Elektrische auto \u2014 slim laden"
            badgeText={evActief ? "Geoptimaliseerd" : "Basis"}
            badgeClass={evActief ? "goal-badge-green" : "goal-badge-yellow"}
            value={evActief ? `\u20AC${fmt(y1.ev)}/jr` : "+3 kWh"}
            barPct={0}
            barClass="goal-bar-green"
          >
            {evActief ? (
              <>De batterij buffert goedkope dalstroom voor het laden van de EV. Bespaart <strong>&euro;{fmt(y1.ev)}/jaar</strong>.</>
            ) : (
              <>De EV verhoogt je jaarverbruik met ~{fmt(GROOTVERBRUIK.ev.defaultKwhJaar)} kWh. De batterij is +3 kWh groter gedimensioneerd.</>
            )}
            {" "}Geschat extra verbruik: <strong>{fmt(GROOTVERBRUIK.ev.defaultKwhJaar)} kWh/jaar</strong>.
            <InfoTip tekst="Bij een dynamisch contract laadt de batterij 's nachts bij dalprijs en buffert stroom voor de EV. Bij een vast/variabel contract wordt de batterij groter gedimensioneerd." />
          </GoalItem>
        );
      })()}

      {/* Warmtepomp */}
      {(c.heeftWp || c.heeftHwp) && (() => {
        const wpType = c.heeftWp ? "volledig elektrisch" : "hybride";
        const wpBuf = y1.wp > 0;
        const gv = c.heeftWp ? GROOTVERBRUIK.wp : GROOTVERBRUIK.hwp;
        return (
          <GoalItem
            icon={"\uD83C\uDF21\uFE0F"}
            naam={`Warmtepomp (${wpType})`}
            badgeText={wpBuf ? "Geoptimaliseerd" : "Meegenomen"}
            badgeClass={wpBuf ? "goal-badge-green" : "goal-badge-yellow"}
            value={wpBuf ? `\u20AC${fmt(y1.wp)}/jr` : `+${c.heeftWp ? 2 : 1} kWh`}
            barPct={0}
            barClass="goal-bar-green"
          >
            De warmtepomp voegt ~<strong>{fmt(gv.defaultKwhJaar)} kWh/jaar</strong> toe.{" "}
            {wpBuf ? (
              <>De batterij buffert goedkope nachtstroom voor de ochtend-opstart. Bespaart <strong>&euro;{fmt(y1.wp)}/jaar</strong>.
              <InfoTip tekst="De warmtepomp verbruikt de meeste stroom 's ochtends vroeg. De batterij laadt 's nachts bij dalprijs en ontlaadt tijdens de opstart." /></>
            ) : (
              <>De batterij is groter gedimensioneerd.</>
            )}
          </GoalItem>
        );
      })()}

      {/* Airco */}
      {c.gv.has("ac") && (
        <GoalItem
          icon={"\u2744\uFE0F"}
          naam="Airconditioning"
          badgeText="Meegenomen"
          badgeClass="goal-badge-yellow"
          value="+1 kWh"
          barPct={0}
          barClass="goal-bar-yellow"
        >
          De airco voegt ~<strong>{fmt(GROOTVERBRUIK.ac.defaultKwhJaar)} kWh/jaar</strong> toe,
          voornamelijk in de zomer. De batterij is +1 kWh groter gedimensioneerd.
        </GoalItem>
      )}

      {/* Batterijlevensduur (altijd) */}
      <GoalItem
        icon={"\uD83D\uDD0B"}
        naam="Batterijlevensduur"
        badgeText={c.jarenTot80Pct >= 20 ? "Uitstekend" : c.jarenTot80Pct >= 12 ? "Goed" : "Intensief"}
        badgeClass={c.jarenTot80Pct >= 20 ? "goal-badge-green" : c.jarenTot80Pct >= 12 ? "goal-badge-yellow" : "goal-badge-gray"}
        value={`~${c.jarenTot80Pct} jr`}
        barPct={Math.round((c.jarenTot80Pct / 25) * 100)}
        barClass={c.jarenTot80Pct >= 12 ? "goal-bar-green" : "goal-bar-yellow"}
      >
        Geschatte <strong>{c.cycliPerJaar} cycli/jaar</strong> &rarr; degradatie ~
        <strong>{c.degradatiePerJaarPct}%/jaar</strong>. Na ~{c.jarenTot80Pct} jaar is de batterij op
        80% van de oorspronkelijke capaciteit.
        <InfoTip tekst="LFP-batterijen gaan gemiddeld 5.000 cycli mee tot 80% capaciteit. Het aantal cycli per jaar hangt af van je verbruik, zonopbrengst en contracttype." />
      </GoalItem>

      {/* Curtailment */}
      {c.hasSolar && c.curtailmentJaar > 0 && (
        <GoalItem
          icon={"\u2600\uFE0F"}
          naam="Curtailment (verlies)"
          badgeText={c.curtailmentPct <= 5 ? "Minimaal" : c.curtailmentPct <= 15 ? "Matig" : "Hoog"}
          badgeClass={c.curtailmentPct <= 5 ? "goal-badge-green" : c.curtailmentPct <= 15 ? "goal-badge-yellow" : "goal-badge-gray"}
          value={`${c.curtailmentPct}%`}
          barPct={c.curtailmentPct}
          barClass={c.curtailmentPct <= 10 ? "goal-bar-green" : "goal-bar-yellow"}
        >
          Jaarlijks ~<strong>{fmt(c.curtailmentJaar)} kWh</strong> ({c.curtailmentPct}% van
          zonneopbrengst) gaat verloren door curtailment &mdash; surplus dat niet in de batterij past.
          <InfoTip tekst="Curtailment is zonnestroom die verloren gaat omdat de batterij vol is en het verbruik lager is dan de opbrengst. Bij een grotere batterij of hoger verbruik neemt dit af." />
        </GoalItem>
      )}
    </div>
  );
}
