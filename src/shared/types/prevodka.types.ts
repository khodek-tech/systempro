/**
 * Prevodka (transfer order) module types
 */

export type PrevodkaStav = 'nova' | 'picking' | 'vychystano' | 'odeslano' | 'potvrzeno' | 'zrusena';

export interface PrevodkaPolozka {
  id: string;
  prevodkaId: string;
  kod: string;
  nazev: string;
  pozice: string | null;
  pozadovaneMnozstvi: number;
  skutecneMnozstvi: number | null;
  vychystano: boolean;
  casVychystani: string | null;
  poradi: number;
}

export interface Prevodka {
  id: string;
  cisloPrevodky: string;
  zdrojovySklad: string;
  cilovySklad: string;
  stav: PrevodkaStav;
  prirazenoKomu: string | null;
  vytvoreno: string;
  zahajeno: string | null;
  vychystano: string | null;
  odeslano: string | null;
  potvrzeno: string | null;
  zruseno: string | null;
  poznamka: string | null;
  vytvoril: string;
  pohodaOdeslano: boolean;
  pohodaCisloDokladu: string | null;
  pohodaChyba: string | null;
  ukolId: string | null;
  polozky: PrevodkaPolozka[];
}
