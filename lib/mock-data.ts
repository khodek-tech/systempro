import { AttendanceRecord, Store, Role, User } from '@/types';

// Mock stores
export const MOCK_STORES: Store[] = [
  { id: 'store-1', name: 'Praha 1', address: 'Václavské náměstí 1, Praha 1', active: true },
  { id: 'store-2', name: 'Brno', address: 'Masarykova 5, Brno', active: true },
  { id: 'store-3', name: 'Ostrava', address: 'Stodolní 10, Ostrava', active: true },
  { id: 'store-4', name: 'Plzeň', address: 'Americká 15, Plzeň', active: false },
];

// Mock roles (8 roles)
export const MOCK_ROLES: Role[] = [
  { id: 'role-1', name: 'Prodavač', type: 'prodavac', active: true },
  { id: 'role-2', name: 'Administrátor', type: 'administrator', active: true },
  { id: 'role-3', name: 'Skladník', type: 'skladnik', active: true },
  { id: 'role-4', name: 'Vedoucí skladu', type: 'vedouci-sklad', active: true },
  { id: 'role-5', name: 'Obsluha e-shopu', type: 'obsluha-eshop', active: true },
  { id: 'role-6', name: 'Obchodník', type: 'obchodnik', active: true },
  { id: 'role-7', name: 'Vedoucí velkoobchodu', type: 'vedouci-velkoobchod', active: true },
  { id: 'role-8', name: 'Majitel', type: 'majitel', active: true },
];

// Mock users
export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    username: 'admin',
    fullName: 'Jan Administrátor',
    roleIds: ['role-2'],
    storeIds: [],
    active: true,
  },
  {
    id: 'user-2',
    username: 'prodavac1',
    fullName: 'Petr Novák',
    roleIds: ['role-1'],
    storeIds: ['store-1', 'store-2'],
    active: true,
  },
  {
    id: 'user-3',
    username: 'skladnik1',
    fullName: 'Marie Skladová',
    roleIds: ['role-3', 'role-1'],
    storeIds: ['store-3'],
    active: true,
  },
  {
    id: 'user-4',
    username: 'majitel',
    fullName: 'Karel Vlastník',
    roleIds: ['role-8'],
    storeIds: [],
    active: true,
  },
  {
    id: 'user-5',
    username: 'multi',
    fullName: 'Eva Multifunkční',
    roleIds: ['role-1', 'role-5', 'role-6'],
    storeIds: ['store-1', 'store-2', 'store-3'],
    active: true,
  },
];

// Mock attendance data (updated structure)
export const mockData: AttendanceRecord[] = [
  {
    date: '27. 01. 2024',
    store: 'Praha 1',
    workplaceType: 'store',
    workplaceId: 'store-1',
    workplaceName: 'Praha 1',
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
    workplaceType: 'store',
    workplaceId: 'store-1',
    workplaceName: 'Praha 1',
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
    workplaceType: 'store',
    workplaceId: 'store-2',
    workplaceName: 'Brno',
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
    workplaceType: 'store',
    workplaceId: 'store-3',
    workplaceName: 'Ostrava',
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

// Legacy stores dropdown (for backwards compatibility)
export const stores = [
  { value: 'store-1', label: 'Prodejna Praha 1' },
  { value: 'store-2', label: 'Prodejna Brno' },
  { value: 'store-3', label: 'Prodejna Ostrava' },
];

// Admin stores dropdown
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
