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
  if (tvt >= 99) return "> 15 jaar";
  const jr = Math.floor(tvt);
  const mnd = Math.round((tvt - jr) * 12);
  if (mnd === 0) return `${jr} jaar`;
  if (mnd === 12) return `${jr + 1} jaar`;
  return `${jr} jaar, ${mnd} mnd`;
}
