'use server';

import { writeFile } from 'fs/promises';
import path from 'path';
import type { User, Store, Role, AbsenceRequest } from '@/types';

interface SaveDataParams {
  users: User[];
  stores: Store[];
  roles: Role[];
  absenceRequests: AbsenceRequest[];
}

function formatOpeningHours(hours: User['workingHours'] | Store['openingHours'], indent: string = '  '): string {
  if (!hours) return 'undefined';

  const lines: string[] = ['{'];
  lines.push(`${indent}  sameAllWeek: ${hours.sameAllWeek},`);

  if (hours.default) {
    lines.push(`${indent}  default: { open: '${hours.default.open}', close: '${hours.default.close}', closed: ${hours.default.closed} },`);
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  for (const day of days) {
    const dayHours = hours[day];
    if (dayHours) {
      lines.push(`${indent}  ${day}: { open: '${dayHours.open}', close: '${dayHours.close}', closed: ${dayHours.closed} },`);
    }
  }

  lines.push(`${indent}}`);
  return lines.join('\n');
}

function formatUser(user: User): string {
  const parts: string[] = [];
  parts.push(`id: '${user.id}'`);
  parts.push(`username: '${user.username}'`);
  parts.push(`fullName: '${user.fullName}'`);
  parts.push(`roleIds: [${user.roleIds.map(r => `'${r}'`).join(', ')}]`);
  parts.push(`storeIds: [${user.storeIds.map(s => `'${s}'`).join(', ')}]`);

  if (user.defaultRoleId) {
    parts.push(`defaultRoleId: '${user.defaultRoleId}'`);
  }
  if (user.defaultStoreId) {
    parts.push(`defaultStoreId: '${user.defaultStoreId}'`);
  }

  parts.push(`active: ${user.active}`);

  if (user.startsWithShortWeek !== undefined) {
    parts.push(`startsWithShortWeek: ${user.startsWithShortWeek}`);
  }

  if (user.workingHours) {
    parts.push(`workingHours: ${formatOpeningHours(user.workingHours, '    ')}`);
  }

  return `  { ${parts.join(', ')} }`;
}

function formatStore(store: Store): string {
  const parts: string[] = [];
  parts.push(`id: '${store.id}'`);
  parts.push(`name: '${store.name}'`);
  parts.push(`address: '${store.address}'`);
  parts.push(`active: ${store.active}`);

  if (store.openingHours) {
    return `  {\n    id: '${store.id}',\n    name: '${store.name}',\n    address: '${store.address}',\n    active: ${store.active},\n    openingHours: ${formatOpeningHours(store.openingHours, '    ')},\n  }`;
  }

  return `  { ${parts.join(', ')} }`;
}

function formatRole(role: Role): string {
  return `  { id: '${role.id}', name: '${role.name}', type: '${role.type}', active: ${role.active} }`;
}

function formatAbsenceRequest(req: AbsenceRequest): string {
  const lines: string[] = [];
  lines.push(`    id: '${req.id}',`);
  lines.push(`    userId: '${req.userId}',`);
  lines.push(`    type: '${req.type}',`);
  lines.push(`    dateFrom: '${req.dateFrom}',`);
  lines.push(`    dateTo: '${req.dateTo}',`);

  if (req.timeFrom) {
    lines.push(`    timeFrom: '${req.timeFrom}',`);
  }
  if (req.timeTo) {
    lines.push(`    timeTo: '${req.timeTo}',`);
  }

  lines.push(`    note: '${req.note.replace(/'/g, "\\'")}',`);
  lines.push(`    status: '${req.status}',`);
  lines.push(`    createdAt: '${req.createdAt}',`);

  if (req.approvedBy) {
    lines.push(`    approvedBy: '${req.approvedBy}',`);
  }
  if (req.approvedAt) {
    lines.push(`    approvedAt: '${req.approvedAt}',`);
  }
  if (req.seenByUser !== undefined) {
    lines.push(`    seenByUser: ${req.seenByUser},`);
  }

  return `  {\n${lines.join('\n')}\n  }`;
}

export async function saveDataToFile(data: SaveDataParams): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = path.join(process.cwd(), 'lib/mock-data.ts');

    const timestamp = new Date().toISOString();

    const content = `// Auto-generated - ${timestamp}
// DO NOT EDIT MANUALLY - use admin interface to modify data

import { AttendanceRecord, Store, Role, User, AbsenceRequest, StoreOpeningHours } from '@/types';

// Mock stores
export const MOCK_STORES: Store[] = [
${data.stores.map(formatStore).join(',\n')},
];

// Mock roles (${data.roles.length} roles)
export const MOCK_ROLES: Role[] = [
${data.roles.map(formatRole).join(',\n')},
];

// Mock users (${data.users.length} employees)
export const MOCK_USERS: User[] = [
${data.users.map(formatUser).join(',\n')},
];

// Mock attendance data (updated structure)
export const mockData: AttendanceRecord[] = [
  {
    date: '27. 01. 2024',
    store: 'Bohnice',
    workplaceType: 'store',
    workplaceId: 'store-1',
    workplaceName: 'Bohnice',
    user: 'Bureš Pavel',
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
    store: 'Bohnice',
    workplaceType: 'store',
    workplaceId: 'store-1',
    workplaceName: 'Bohnice',
    user: 'Burianová Aneta',
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
    workplaceId: 'store-3',
    workplaceName: 'Brno',
    user: 'Čapek Michal',
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
    collected: 'user-6',
  },
  {
    date: '25. 01. 2024',
    store: 'Chodov',
    workplaceType: 'store',
    workplaceId: 'store-8',
    workplaceName: 'Chodov',
    user: 'Férová Lucie',
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
${data.stores.map(s => `  { value: '${s.id}', label: 'Prodejna ${s.name}' }`).join(',\n')},
];

// Admin stores dropdown
export const adminStores = [
  { value: 'all', label: 'VŠECHNY PRODEJNY' },
${data.stores.map(s => `  { value: '${s.name.toLowerCase()}', label: '${s.name.toUpperCase()}' }`).join(',\n')},
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

// Mock absence requests
export const MOCK_ABSENCE_REQUESTS: AbsenceRequest[] = [
${data.absenceRequests.map(formatAbsenceRequest).join(',\n')},
];
`;

    await writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Error saving data to file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
