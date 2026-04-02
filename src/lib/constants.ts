/**
 * EPEX day-ahead prijsprofiel — genormaliseerd 0..1 per uur.
 * 0 = dalprijs, 1 = piekprijs.
 * Bron: typische EPEX NL patronen 2023-2024.
 */
export const EPEX_SHAPE = {
  zomer: [
    0.15, 0.08, 0.05, 0.05, 0.08, 0.20, // 0-5: nacht
    0.45, 0.70, 0.85, 0.65, 0.40, 0.20, // 6-11: ochtend → middag-dip
    0.10, 0.08, 0.12, 0.25, 0.50, 0.80, // 12-17: solar-dip → avondpiek
    1.00, 0.95, 0.75, 0.55, 0.35, 0.22, // 18-23: avondpiek → nacht
  ],
  winter: [
    0.18, 0.10, 0.05, 0.05, 0.08, 0.22, // 0-5
    0.55, 0.85, 1.00, 0.90, 0.70, 0.55, // 6-11: hoge ochtendpiek
    0.45, 0.40, 0.42, 0.50, 0.65, 0.90, // 12-17: geen solar-dip
    0.95, 0.85, 0.70, 0.50, 0.35, 0.22, // 18-23
  ],
} as const;
