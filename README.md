# SYSTEM.PRO

Interní systém pro správu tržeb a docházky zaměstnanců v maloobchodní síti.
Aplikace podporuje **8 různých rolí** s multi-role systémem - uživatel může mít přiřazeno více rolí a přepínat mezi nimi.

**Verze:** Enterprise v5.3
**Stav:** Frontend only (bez backendu, mock data)

---

## Technologie

| Technologie | Verze | Účel |
|-------------|-------|------|
| Next.js | 16.1.5 | Framework (App Router) |
| React | 19.2.3 | UI knihovna |
| TypeScript | 5.x | Typování |
| Zustand | 5.0.10 | State management |
| Tailwind CSS | 4.x | Styling |
| Radix UI | - | Dialog, Checkbox, Select |
| Lucide React | 0.563.0 | Ikony |

---

## Struktura projektu

```
systempro/
├── app/
│   ├── layout.tsx      # Root layout (Inter font, metadata)
│   ├── page.tsx        # Home - renderuje view podle role
│   └── globals.css     # Tailwind + custom animace
│
├── components/
│   ├── admin/          # Komponenty pro Vedoucí/Admin
│   │   ├── kpi-cards.tsx        # 4 KPI karty (tržby, hotovost, absence, svozy)
│   │   ├── attendance-table.tsx # Tabulka docházky
│   │   ├── sales-table.tsx      # Tabulka tržeb
│   │   ├── last-pickups.tsx     # Panel posledních svozů
│   │   └── absence-requests.tsx # Panel žádostí o volno
│   │
│   ├── admin-dashboard/         # Nastavení pro Administrator
│   │   └── settings/
│   │       ├── EmployeesSettings.tsx  # Správa zaměstnanců
│   │       ├── RolesSettings.tsx      # Správa rolí
│   │       └── StoresSettings.tsx     # Správa prodejen
│   │
│   ├── modals/
│   │   ├── sales-modal.tsx      # Formulář denních tržeb
│   │   ├── collect-modal.tsx    # Formulář odevzdání hotovosti
│   │   └── absence-modal.tsx    # Formulář nahlášení absence
│   │
│   ├── shared/          # Sdílené komponenty napříč views
│   │   └── absence-card.tsx     # Karta pro hlášení absence
│   │
│   ├── ui/             # Základní UI komponenty
│   │   ├── button.tsx, dialog.tsx, input.tsx, select.tsx
│   │   ├── checkbox.tsx, table.tsx, card.tsx
│   │   └── currency-input.tsx   # Custom input pro Kč
│   │
│   ├── views/          # Views pro jednotlivé role
│   │   ├── prodavac-view.tsx           # Prodavač
│   │   ├── skladnik-view.tsx           # Skladník
│   │   ├── vedouci-sklad-view.tsx      # Vedoucí skladu
│   │   ├── obsluha-eshop-view.tsx      # Obsluha e-shopu
│   │   ├── obchodnik-view.tsx          # Obchodník
│   │   ├── vedouci-velkoobchod-view.tsx # Vedoucí velkoobchodu
│   │   ├── admin-view.tsx              # Administrator
│   │   └── majitel-view.tsx            # Majitel
│   │
│   ├── header.tsx               # Hlavička s logo, role, docházka, hodiny
│   ├── role-switcher.tsx        # Přepínač rolí (multi-role)
│   ├── attendance-module.tsx    # Modul docházky (příchod/odchod)
│   ├── live-clock.tsx           # Živé hodiny
│   └── cash-monitor.tsx         # Banner s hotovostí k odevzdání
│
├── stores/             # Zustand state management
│   ├── auth-store.ts            # Autentizace, aktivní role/prodejna
│   ├── users-store.ts           # Správa uživatelů
│   ├── roles-store.ts           # Správa rolí
│   ├── stores-store.ts          # Správa prodejen
│   ├── attendance-store.ts      # Docházka
│   ├── sales-store.ts           # Tržby
│   ├── absence-store.ts         # Absence
│   ├── collect-store.ts         # Odvody
│   ├── ui-store.ts              # UI stav (modály, filtry)
│   └── vedouci-store.ts         # Dashboard vedoucího
│
├── lib/
│   ├── mock-data.ts    # Testovací data + select options
│   └── utils.ts        # cn() pro Tailwind třídy
│
├── types/
│   └── index.ts        # TypeScript typy a interfaces
│
└── CLAUDE.md           # Pravidla pro vývoj
```

---

## Role a funkcionalita

### Přehled rolí

| Role | Typ | Docházka | Absence | Popis |
|------|-----|----------|---------|-------|
| Prodavač | prodavac | ✅ | ✅ | Evidence tržeb, docházky, absencí |
| Skladník | skladnik | ✅ | ✅ | Práce ve skladu |
| Vedoucí skladu | vedouci_sklad | ✅ | ✅ | Správa skladu |
| Obsluha e-shop | obsluha_eshop | ✅ | ✅ | Zpracování online objednávek |
| Obchodník | obchodnik | ✅ | ✅ | Obchodní činnost |
| Vedoucí velkoobchod | vedouci_velkoobchod | ✅ | ✅ | Správa velkoobchodu |
| Administrator | administrator | ❌ | ❌ | Správa systému, uživatelů, rolí |
| Majitel | majitel | ❌ | ❌ | Přehled a reporting |

### Prodavač

- **Docházka**: Příchod/Odchod, volba pracoviště, potvrzení kasy
- **Tržby**: Zadání hotovosti, karet, partnera + příjmy/výdaje
- **Odvody**: Odevzdání hotovosti řidiči (jméno, číslo vaku)
- **Absence**: Dovolená, Nemoc, Lékař, Neplacené volno
- **Úkoly**: (TODO - placeholder)

### Skladník, Vedoucí skladu, Obsluha e-shop, Obchodník, Vedoucí velkoobchod

- **Absence**: Dovolená, Nemoc, Lékař, Neplacené volno
- Další funkce ve vývoji

### Administrator

- **Nastavení systému**:
  - Správa zaměstnanců (přidávání, úprava, mazání)
  - Správa rolí (aktivace/deaktivace)
  - Správa prodejen (aktivace/deaktivace)
- **Reports**: Přístup k reportům tržeb a docházky

### Majitel

- **Dashboard**: Přehled KPI a reportů
- **Reports**:
  - Filtry (prodejna, měsíc, rok)
  - KPI karty (měsíční tržba, hotovost v trezorech, čekající absence, svozový status)
  - Tabulka docházky
  - Tabulka tržeb
  - Poslední svozy, Žádosti o volno

---

## Zustand Stores

### useAuthStore

```typescript
State: currentUser, activeRoleId, activeStoreId, _hydrated
Actions: setCurrentUser(), setActiveRole(), setActiveStore()
Computed: getActiveRole(), getAvailableRoles(), getAvailableStores(),
          needsStoreSelection(), getActiveRoleType(),
          hasAttendance(), canReportAbsence()
```

### useUsersStore

```typescript
State: users[]
Actions: addUser(), updateUser(), deleteUser(), getUserById()
```

### useRolesStore

```typescript
State: roles[]
Actions: updateRole(), getRoleById(), getActiveRoles()
```

### useStoresStore

```typescript
State: stores[]
Actions: updateStore(), getStoreById(), getActiveStores()
```

### useAttendanceStore

```typescript
State: isInWork, kasaConfirmed, workplace
Actions: toggleAttendance(), confirmKasa(), changeWorkplace(), isWarehouse()
Validace: Odchod vyžaduje potvrzenou kasu
```

### useSalesStore

```typescript
State: cashToCollect (default: 28500), formData (cash, card, partner, incomes[], expenses[])
Actions: calculateTotal(), getCollectionPeriod(), updateField(),
         add/update/removeIncomeRow(), add/update/removeExpenseRow(),
         validateForm(), submitSales(), submitCollection()
Validace: Každý řádek s částkou musí mít poznámku
```

### useAbsenceStore

```typescript
State: formData (type, dateFrom, dateTo, timeFrom?, timeTo?, note)
Actions: setAbsenceType(), setDateFrom/To(), setTimeFrom/To(), setNote(),
         showTimeSection(), submitAbsence()
Logika: Čas pouze pro typ "Lékař"
```

### useUIStore

```typescript
State: salesModalOpen, collectModalOpen, absenceModalOpen,
       subView, storeFilter, monthFilter, yearFilter
Actions: open/close/set modály, setSubView(), setFilters(), resetFilters()
```

---

## Datové typy

```typescript
// Role typy
type RoleType =
  | 'prodavac'
  | 'skladnik'
  | 'vedouci_sklad'
  | 'obsluha_eshop'
  | 'obchodnik'
  | 'vedouci_velkoobchod'
  | 'administrator'
  | 'majitel'

// Hlavní entity
interface User {
  id: string
  name: string
  email: string
  roleIds: string[]      // Multi-role podpora
  storeIds: string[]
  defaultRoleId?: string
  defaultStoreId?: string
  active: boolean
}

interface Role {
  id: string
  name: string
  type: RoleType
  active: boolean
}

interface Store {
  id: string
  name: string
  address: string
  active: boolean
}

// Absence typy
type AbsenceType = 'Dovolená' | 'Nemoc / Neschopenka' | 'Lékař' | 'Neplacené volno'

// Formuláře
interface ExtraRow { id: string, amount: number, note: string }
interface SalesFormData { cash, card, partner, incomes[], expenses[] }
interface AbsenceFormData { type, dateFrom, dateTo, timeFrom?, timeTo?, note }
```

---

## Pravidla vývoje

**Z CLAUDE.md:**

- **ESLint**: Zero tolerance - `npm run lint` musí projít bez chyb i varování
- **State**: Veškerá data pouze v Zustand stores
- **Komponenty**: Bez business logiky, pouze prezentace a volání akcí
- **Design**: Dodržovat design pattern z CLAUDE.md (barvy, spacing, typography)

---

## Spuštění

```bash
# Instalace
npm install

# Vývoj
npm run dev          # http://localhost:3000

# Kontrola
npm run lint         # ESLint (--max-warnings 0)
npm run build        # Produkční build
```

---

## TODO / Rozpracované funkce

- [ ] Tlačítko "Úkoly" - zatím placeholder
- [ ] Views pro role Skladník, Vedoucí skladu, Obsluha e-shop, Obchodník, Vedoucí velkoobchod - základní funkčnost (absence), další ve vývoji
- [ ] Backend integrace - aktuálně mock data
- [ ] Export XLS - připravené tlačítko
