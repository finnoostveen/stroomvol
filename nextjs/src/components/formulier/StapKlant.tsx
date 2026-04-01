"use client";

import type { StapProps } from "./types";

export default function StapKlant({ form, onChange }: StapProps) {
  return (
    <div>
      <h2>Klant &amp; Adviseur</h2>
      <p>Gegevens voor het adviesrapport</p>

      <div>
        <label htmlFor="in-klant-naam">
          Klantnaam <span>*</span>
        </label>
        <input
          id="in-klant-naam"
          type="text"
          placeholder="Volledige naam"
          value={form.klantNaam}
          onChange={(e) => onChange("klantNaam", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="in-klant-adres">Adres</label>
        <input
          id="in-klant-adres"
          type="text"
          placeholder="Straat + huisnummer"
          value={form.klantAdres}
          onChange={(e) => onChange("klantAdres", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="in-klant-plaats">Postcode + Plaats</label>
        <input
          id="in-klant-plaats"
          type="text"
          placeholder="1234 AB Amsterdam"
          value={form.klantPlaats}
          onChange={(e) => onChange("klantPlaats", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="in-datum">Datum</label>
        <input
          id="in-datum"
          type="date"
          value={form.datum}
          onChange={(e) => onChange("datum", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="in-adviseur">Naam adviseur</label>
        <input
          id="in-adviseur"
          type="text"
          placeholder="Uw naam"
          value={form.adviseur}
          onChange={(e) => onChange("adviseur", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="in-bedrijf">Bedrijfsnaam</label>
        <input
          id="in-bedrijf"
          type="text"
          placeholder="Stroomvol"
          value={form.bedrijf}
          onChange={(e) => onChange("bedrijf", e.target.value)}
        />
      </div>
    </div>
  );
}
