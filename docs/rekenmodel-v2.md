# Stroomvol Adviseurstool — Rekenmodel Referentie v2

Versie: maart 2026 (update 2)
Dit document is de enige bron van waarheid voor het rekenmodel. Claude Code implementeert wat hier staat.

-----

## 1. Architectuur

Het rekenmodel is een pure functie: `calc(input) → output`. Geen side effects, geen DOM. De UI leest input uit het formulier, roept `calc()` aan, en rendert de output.

```
Input (formulier) → calc() → Output (object) → render(output) → UI + PDF
```

Het model rekent per maand (12 iteraties) in plaats van als daggemiddelde.

-----

## 2. Constanten

Alle harde waardes op één plek. Adviseur past deze niet aan — ze zijn de fysica/markt-aannames onder de motorkap.

### 2.1 Zonne-energie (Nederland)

```javascript
const SOLAR = {
  deratingFactor: 0.90,
  effectieveZonuren: 900,
  maandFractie: [0.03, 0.05, 0.08, 0.10, 0.13, 0.14, 0.13, 0.12, 0.09, 0.06, 0.04, 0.03]
};
```

### 2.2 Verbruiksprofiel — maandverdeling

```javascript
const VERBRUIK_MAAND = {
  basis: [0.10, 0.095, 0.09, 0.08, 0.07, 0.065, 0.06, 0.065, 0.07, 0.085, 0.095, 0.105],
  warmtepomp: [0.17, 0.15, 0.12, 0.08, 0.03, 0.01, 0.01, 0.01, 0.03, 0.08, 0.13, 0.18],
  airco: [0.0, 0.0, 0.0, 0.02, 0.08, 0.20, 0.28, 0.24, 0.12, 0.04, 0.02, 0.0],
  ev: [0.09, 0.09, 0.085, 0.08, 0.08, 0.075, 0.075, 0.075, 0.08, 0.085, 0.09, 0.095],
};
```

### 2.3 Zelfconsumptie-factor per profiel

```javascript
const ZELFCONSUMPTIE_FACTOR = {
  'standaard':   [0.55, 0.45, 0.35, 0.30, 0.22, 0.20, 0.20, 0.22, 0.30, 0.40, 0.50, 0.55],
  'avond-zwaar': [0.45, 0.35, 0.27, 0.22, 0.17, 0.15, 0.15, 0.17, 0.22, 0.32, 0.40, 0.45],
  'overdag':     [0.70, 0.65, 0.55, 0.50, 0.42, 0.38, 0.38, 0.40, 0.48, 0.58, 0.65, 0.70],
  'ev-nacht':    [0.50, 0.40, 0.30, 0.25, 0.20, 0.18, 0.18, 0.20, 0.28, 0.38, 0.45, 0.50],
};
```

### 2.4 Saldering

```javascript
const SALDERING = {
  // Saldering volledig afgeschaft per 1/1/2027
  // Teruglevertarief is het vaste lage tarief (geen saldering meer)
  terugFractieNaSaldering: 0.25,
};
```

### 2.5 Batterij levenscyclus

```javascript
const BATTERIJ_LIFECYCLE = {
  lfp: {
    cycliTot80Pct: 5000,        // LFP: ~5000 cycli tot 80% capaciteit
    degradatiePerCyclus: 0.004, // 0.004% capaciteitsverlies per cyclus
  }
};
```

### 2.6 Netaansluiting

```javascript
const NET_VERMOGEN = {
  '1x25': { maxKw: 5.75, fase: 1 },
  '1x35': { maxKw: 8.05, fase: 1 },
  '3x25': { maxKw: 17.25, fase: 3 },
  '3x63': { maxKw: 43.47, fase: 3 },
};
```

### 2.7 Grootverbruikers

```javascript
const GROOTVERBRUIK = {
  ev:  { defaultKwhJaar: 2500, dagKwhGem: 6.8, verschuifbaarPct: 0.70, capaciteitPlus: 3 },
  wp:  { defaultKwhJaar: 3500, winterDagKwh: 12, verschuifbaarPct: 0.50, winterDagen: 150, capaciteitPlus: 2 },
  hwp: { defaultKwhJaar: 1200, winterDagKwh: 5, verschuifbaarPct: 0.50, winterDagen: 150, capaciteitPlus: 1 },
  ac:  { defaultKwhJaar: 600, capaciteitPlus: 1 },
};
```

### 2.8 EPEX Shape

```javascript
const EPEX_SHAPE = {
  zomer:  [0.05,0.03,0.02,0.01,0.02,0.05,0.15, 0.70,0.85,0.75, 0.35,0.18,0.08,0.12,0.25, 0.45,0.60,0.82,1.0,0.95,0.78, 0.50,0.28,0.10],
  winter: [0.08,0.05,0.03,0.02,0.03,0.08,0.25, 0.80,0.95,0.90, 0.55,0.45,0.40,0.42,0.48, 0.58,0.72,0.90,1.0,0.95,0.82, 0.58,0.32,0.15],
};
```

-----

## 3. Berekening stap voor stap

### Stap 1: Zonne-opbrengst per maand
KNMI-verdeling × totaal Wp × derating × zonuren.

### Stap 2: Totaalverbruik per maand
Basisverbruik × maandprofiel + gewogen grootverbruikers per seizoen.

### Stap 3: Zelfconsumptie zonder batterij
Per maand: `min(dagSolar × zcFactor, dagVerbruik)`. Surplus = rest.

### Stap 4: Batterij sizing
Op basis van surplus, doelen, grootverbruikers, netbegrenzing. Afgerond op 5 kWh, min 5, max 30.

### Stap 5: Zelfconsumptie met batterij
Per maand: `min(zelfZonder + min(usableKwh × eff, surplus), verbruik)`.

### Stap 5b: Curtailment tracking
Per maand: `max(0, dagSurplus - min(usableKwh × eff, dagSurplus))` × dagen.
Totaal curtailment als kWh/jaar en als % van zonneopbrengst.

### Stap 5c: Cycle-based degradatie
```
battKwhPerJaar = (zelfMet - zelfZonder) + arbitrageCycli × usableKwh × eff
cycliPerJaar = battKwhPerJaar / usableKwh
degradatiePerJaarPct = cycliPerJaar × 0.004  (per cyclus)
jarenTot80Pct = 5000 / cycliPerJaar
```

### Stap 6: Besparingsberekening per jaar (15 jaar)
Per component: zelfconsumptie, arbitrage, EV slim laden, WP buffering, peak shaving.

**Degradatie per jaar** (cycle-based met scenarioFactor):
```
effectiefDegPerJaar = degradatiePerJaarPct × scenarioFactor / 100
effectiefKwh = usableKwh × (1 - effectiefDegPerJaar)^(jaar-1)
```

**Saldering**: volledig afgeschaft. Teruglevertarief = vast laag tarief × prijsfactor.

### Stap 7: Scenario's

| Scenario | prijsStijging | scenarioFactor |
|----------|--------------|----------------|
| Conservatief | laag (25% van opgegeven stijging) | 1.25 (25% snellere degradatie) |
| Realistisch | opgegeven stijging | 1.00 (standaard) |
| Optimistisch | hoog (+2% bovenop) | 0.80 (20% tragere degradatie) |

-----

## 4. Output velden (nieuw/gewijzigd)

```javascript
{
  // Bestaand...
  curtailmentMaand: [],    // kWh curtailment per maand
  curtailmentJaar: 0,      // totaal kWh/jaar
  curtailmentPct: 0,       // % van zonneopbrengst

  cycliPerJaar: 0,         // geschatte cycli/jaar
  jarenTot80Pct: 0,        // jaren tot 80% capaciteit
  degradatiePerJaarPct: 0, // %/jaar op basis van cycli

  // Verwijderd: degPct (was handmatig instelbare degradatie)
}
```

-----

## 5. Doelmetrics

- Zelfconsumptie: badge groen ≥70%, geel 45-70%, grijs <45%
- Noodstroom: badge groen ≥8u, geel 4-8u, grijs <4u
- Slim handelen: alleen actief bij dynamisch contract
- Peak shaving: op basis van capaciteitstarief × kW-reductie
- **Batterijlevensduur** (altijd): badge groen ≥20jr, geel 12-20jr, grijs <12jr
- **Curtailment** (bij zonnepanelen): badge groen ≤5%, geel 5-15%, grijs >15%

-----

## 6. PDF Positieve framing

Hero-tekst prioriteit:
1. `hasSolar && zelfPctMet >= 60` → zelfconsumptie
2. `contract === 'dynamisch'` → arbitrage
3. `doelen.has('nood')` → noodstroom
4. fallback → "slimmere manier om energie te gebruiken"

-----

## 7. Info Tooltips

Tooltips met (i) knoppen naast labels en conclusies. Plaatsing:
- Invoerfase: contracttype, verbruiksprofiel, zonnepanelen, netaansluiting, grootverbruikers, doelen
- Resultaatfase: terugverdientijd, zelfconsumptie, scenario's, levensduur, curtailment
