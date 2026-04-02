import { EPEX_SHAPE } from "./constants";

export interface ScheduleEntry {
  uur: number;
  prijs: number;
  actie: "laden" | "ontladen" | "idle";
  vermogenKw: number;
  soc: number;
}

/**
 * Simuleer een 24-uur laad/ontlaadschema op basis van het EPEX-prijsprofiel.
 */
export function batterySchedule(
  dynDal: number,
  dynPiek: number,
  usableKwh: number,
  maxKw: number,
  seizoen: "zomer" | "winter" = "zomer",
): ScheduleEntry[] {
  const shape = EPEX_SHAPE[seizoen];
  const prices = shape.map((s) => dynDal + s * (dynPiek - dynDal));
  const sorted = [...prices].sort((a, b) => a - b);
  const mediaan = sorted[12];

  let soc = 0.2;
  const schedule: ScheduleEntry[] = [];

  for (let h = 0; h < 24; h++) {
    let actie: "laden" | "ontladen" | "idle" = "idle";
    let vermogenKw = 0;

    if (prices[h] < mediaan * 0.85 && soc < 0.95) {
      actie = "laden";
      vermogenKw = Math.min(maxKw, (0.95 - soc) * usableKwh);
      soc += vermogenKw / usableKwh;
    } else if (prices[h] > mediaan * 1.15 && soc > 0.15) {
      actie = "ontladen";
      vermogenKw = Math.min(maxKw, (soc - 0.15) * usableKwh);
      soc -= vermogenKw / usableKwh;
    }

    schedule.push({ uur: h, prijs: prices[h], actie, vermogenKw, soc });
  }

  return schedule;
}
