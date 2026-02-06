/**
 * Static UI constants for dropdowns and form options.
 * All entity data (users, roles, stores, etc.) is now loaded from Supabase.
 */

// Admin stores dropdown filter
export const adminStores = [
  { value: 'all', label: 'VŠECHNY PRODEJNY' },
  { value: 'bohnice', label: 'BOHNICE' },
  { value: 'butovice', label: 'BUTOVICE' },
  { value: 'brno', label: 'BRNO' },
  { value: 'č most', label: 'Č MOST' },
  { value: 'oc šestka', label: 'OC ŠESTKA' },
  { value: 'prosek', label: 'PROSEK' },
  { value: 'ústí', label: 'ÚSTÍ' },
  { value: 'chodov', label: 'CHODOV' },
  { value: 'vysočany', label: 'VYSOČANY' },
  { value: 'zličín', label: 'ZLIČÍN' },
];

export const months = [
  { value: 'all', label: 'Měsíc: Vše' },
  { value: '01', label: 'Leden' },
  { value: '02', label: 'Únor' },
  { value: '03', label: 'Březen' },
  { value: '04', label: 'Duben' },
  { value: '05', label: 'Květen' },
  { value: '06', label: 'Červen' },
  { value: '07', label: 'Červenec' },
  { value: '08', label: 'Srpen' },
  { value: '09', label: 'Září' },
  { value: '10', label: 'Říjen' },
  { value: '11', label: 'Listopad' },
  { value: '12', label: 'Prosinec' },
];

function generateYears() {
  const currentYear = new Date().getFullYear();
  const years = [{ value: 'all', label: 'Rok: Vše' }];

  // Přidat aktuální rok a 2 roky zpět
  for (let year = currentYear; year >= currentYear - 2; year--) {
    years.push({ value: String(year), label: String(year) });
  }

  return years;
}

export const years = generateYears();

export const absenceTypes = [
  { value: 'Dovolená', label: 'Dovolená' },
  { value: 'Nemoc / Neschopenka', label: 'Nemoc / Neschopenka' },
  { value: 'Lékař', label: 'Lékař (v hodinách)' },
  { value: 'Neplacené volno', label: 'Neplacené volno' },
];
