import type { ScenarioResult } from "./calc";

/**
 * Berekent de terugverdientijd op basis van cumulatieve jaarbesparingen.
 * Retourneert het aantal jaren (met fractie) tot de investering is terugverdiend.
 * Geeft 99 terug als het niet binnen de horizon valt.
 */
export function berekenCumulatieveTvt(
  sc: ScenarioResult,
  investering: number,
): number {
  let cumulatief = 0;
  for (let j = 0; j < sc.perJaar.length; j++) {
    const vorig = cumulatief;
    cumulatief += sc.perJaar[j].totaal;
    if (cumulatief >= investering) {
      const fractie =
        sc.perJaar[j].totaal > 0
          ? (investering - vorig) / sc.perJaar[j].totaal
          : 0;
      return Math.round((j + fractie) * 10) / 10;
    }
  }
  return 99;
}

/**
 * Formatteert TVT als "X jaar, Y maanden" of "> 25 jaar".
 */
export function formatTvt(tvt: number): string {
  if (tvt >= 30) return "> 25 jaar";
  const jaren = Math.floor(tvt);
  const maanden = Math.round((tvt - jaren) * 12);
  if (maanden === 0) return `${jaren} jaar`;
  return `${jaren} jaar, ${maanden} mnd`;
}
