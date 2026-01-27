import { AttendanceRecord } from '@/types';

export const mockData: AttendanceRecord[] = [
  {
    date: '27. 01. 2024',
    store: 'Praha 1',
    user: 'Petr Novák',
    in: '08:00',
    out: '10:30',
    abs: 'Lékař',
    hrs: '2:30',
    absNote: 'Pravidelná kontrola u zubaře - ranní termín',
    cash: 4200,
    card: 3100,
    partner: 1500,
    flows: '+500',
    saleNote: 'Ranní doprodej skladových zásob',
    collected: false,
  },
  {
    date: '27. 01. 2024',
    store: 'Praha 1',
    user: 'Jana Malá',
    in: '10:30',
    out: '18:00',
    abs: '-',
    hrs: '7:30',
    absNote: '',
    cash: 6500,
    card: 4200,
    partner: 2100,
    flows: '-150',
    saleNote: 'Zástup za kolegu, terminál OK',
    collected: false,
  },
  {
    date: '26. 01. 2024',
    store: 'Brno',
    user: 'Michal H.',
    in: '09:00',
    out: '17:30',
    abs: '-',
    hrs: '8:30',
    absNote: '',
    cash: 12400,
    card: 8000,
    partner: 0,
    flows: '0',
    saleNote: 'Běžný provoz',
    collected: 'Karel',
  },
  {
    date: '25. 01. 2024',
    store: 'Ostrava',
    user: 'Lucie P.',
    in: '08:00',
    out: '18:00',
    abs: '-',
    hrs: '10:00',
    absNote: '',
    cash: 11000,
    card: 9500,
    partner: 3000,
    flows: '+200',
    saleNote: 'Inventura OK',
    collected: false,
  },
];

export const stores = [
  { value: 'praha 1', label: 'Prodejna Praha 1' },
  { value: 'brno', label: 'Prodejna Brno' },
  { value: 'ostrava', label: 'Prodejna Ostrava' },
  { value: 'sklad', label: 'Sklad Hostivice' },
];

export const adminStores = [
  { value: 'all', label: 'VŠECHNY PRODEJNY' },
  { value: 'praha 1', label: 'PRAHA 1' },
  { value: 'brno', label: 'BRNO' },
  { value: 'ostrava', label: 'OSTRAVA' },
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

export const years = [
  { value: 'all', label: 'Rok: Vše' },
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
];

export const absenceTypes = [
  { value: 'Dovolená', label: 'Dovolená' },
  { value: 'Nemoc / Neschopenka', label: 'Nemoc / Neschopenka' },
  { value: 'Lékař', label: 'Lékař (v hodinách)' },
  { value: 'Neplacené volno', label: 'Neplacené volno' },
];
