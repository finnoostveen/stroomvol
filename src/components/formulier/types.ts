export type ContractType = "vast" | "variabel" | "dynamisch";
export type ZonStatus = "ja" | "nee" | "gepland";
export type Profiel = "standaard" | "avond-zwaar" | "overdag" | "ev-nacht";
export type OmvormerType = "hybride" | "standaard" | "micro";
export type NetAansluiting = "1x25" | "1x35" | "3x25" | "3x63";
export type Locatie = "binnen" | "buiten";
export type Eigendom = "koop" | "huur";
export type Afstand = "<10m" | ">10m";
export type Muur = "0-2" | "3+";
export type Grootverbruiker = "ev" | "wp" | "hwp" | "ac";
export type Doel = "zelf" | "handel" | "peak" | "nood";

export interface FormState {
  // Klant & adviseur
  klantNaam: string;
  klantAdres: string;
  klantPlaats: string;
  datum: string;
  adviseur: string;
  bedrijf: string;
  notities: string;

  // Energiecontract
  contract: ContractType | null;
  tariefVast: number;
  terugVast: number;
  varStijg: number;
  dynDal: number;
  dynPiek: number;
  dynGem: number;

  // Verbruik
  verbruik: string;
  profiel: Profiel;

  // Zonnepanelen
  zon: ZonStatus | null;
  panelen: number;
  wpPerPaneel: number;

  // Omvormer & Net
  omv: OmvormerType | null;
  net: NetAansluiting | null;

  // Grootverbruikers & doelen
  gv: Set<Grootverbruiker>;
  doel: Set<Doel>;

  // Installatie
  loc: Locatie | null;
  eig: Eigendom | null;
  afst: Afstand | null;
  muur: Muur | null;
}

export const initialFormState: FormState = {
  klantNaam: "",
  klantAdres: "",
  klantPlaats: "",
  datum: new Date().toISOString().split("T")[0],
  adviseur: "",
  bedrijf: "Stroomvol",
  notities: "",

  contract: null,
  tariefVast: 0.28,
  terugVast: 0.07,
  varStijg: 4,
  dynDal: 0.05,
  dynPiek: 0.35,
  dynGem: 0.15,

  verbruik: "",
  profiel: "standaard",

  zon: null,
  panelen: 10,
  wpPerPaneel: 400,

  omv: null,
  net: null,

  gv: new Set(),
  doel: new Set(),

  loc: null,
  eig: null,
  afst: null,
  muur: null,
};

export type Stap = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface StapProps {
  form: FormState;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}
