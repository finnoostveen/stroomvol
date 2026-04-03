import type { CalcResult } from "./calc";
import { calc, fmt } from "./calc";
import type { CalcParams } from "./calc";
import type { FormState } from "@/components/formulier/types";

export interface Optimalisatie {
  id: string;
  label: string;
  reden: string;
  tab: string;
  sectieId: string;
}

export function bepaalOptimalisaties(
  r: CalcResult,
  form: FormState,
  params: CalcParams,
): Optimalisatie[] {
  const items: Optimalisatie[] = [];

  // 1. Omvormer upgrade
  if (r.omv !== "hybride") {
    const hyb = calc({ ...form, omv: "hybride", omvormerMerk: "" }, params);
    const verschil = hyb.real.savingY1 - r.real.savingY1;
    if (verschil > 0) {
      items.push({
        id: "omvormer",
        label: "Omvormer upgraden",
        reden: `Je ${r.omv === "micro" ? "micro" : "standaard"} omvormer kost je ${Math.round((1 - r.effectieveEff / r.eff) * 100)}% efficiency. Een hybride omvormer bespaart ~\u20AC${fmt(verschil)}/jaar extra.`,
        tab: "verdieping",
        sectieId: "sectie-omvormer-analyse",
      });
    }
  }

  // 2. Dynamisch contract
  if (r.contract !== "dynamisch") {
    const dyn = calc({ ...form, contract: "dynamisch" }, params);
    const verschil = Math.round(dyn.real.total15 / 15) - Math.round(r.real.total15 / 15);
    if (verschil > 100) {
      items.push({
        id: "contract",
        label: "Dynamisch contract",
        reden: `Met een dynamisch contract kan de batterij actief handelen. Geschatte extra besparing: ~\u20AC${fmt(verschil)}/jaar.`,
        tab: "verdieping",
        sectieId: "sectie-contract-switch",
      });
    }
  }

  // 3. Net upgrade
  if (r.netBeperkt) {
    items.push({
      id: "netupgrade",
      label: "Netaansluiting upgraden",
      reden: `Je ${r.net} aansluiting (${r.maxKwNet} kW) beperkt de maximale batterijgrootte en het laad/ontlaadvermogen.`,
      tab: "advies",
      sectieId: "sectie-doelen",
    });
  }

  // 5. Zonnepanelen
  if (!r.hasSolar) {
    items.push({
      id: "zonnepanelen",
      label: "Zonnepanelen plaatsen",
      reden: "Zonder zonnepanelen mist de batterij de belangrijkste besparingsbron: zelfconsumptie van eigen opwek.",
      tab: "advies",
      sectieId: "sectie-doelen",
    });
  }

  // 6. EV + dynamisch
  if (r.heeftEv && r.contract !== "dynamisch") {
    items.push({
      id: "ev-dynamisch",
      label: "Dynamisch voor EV slim laden",
      reden: "Je hebt een EV maar geen dynamisch contract. Met dynamische prijzen kan de batterij je auto slim laden bij lage tarieven.",
      tab: "verdieping",
      sectieId: "sectie-contract-switch",
    });
  }

  return items;
}
