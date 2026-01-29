# SYSTEM.PRO

Interní systém pro správu tržeb, docházky a absencí zaměstnanců v maloobchodní síti.
Aplikace podporuje **8 různých rolí** s multi-role systémem - uživatel může mít přiřazeno více rolí a přepínat mezi nimi.

**Verze:** Enterprise v5.4
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

## Architektura

### Modulový systém

Aplikace používá dynamický modulový systém, který umožňuje:
- Definovat moduly nezávisle na rolích
- Přiřazovat moduly k rolím v administraci
- Konfigurovat pozici modulů (top, left, right, full)
- Zapínat/vypínat moduly pro jednotlivé role
- Nastavovat hierarchii schvalování absencí

```
┌─────────────────────────────────────────────────────────────────┐
│                     ModuleDefinition                            │
│  (id, name, description, component, icon)                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ModuleConfig                               │
│  (moduleId, roleIds[], order, column, enabled, approvalMappings)│
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ModuleRenderer                              │
│  Renderuje moduly podle aktivní role a konfigurace              │
└─────────────────────────────────────────────────────────────────┘
```

### Dostupné moduly

| ID modulu | Název | Komponenta | Popis |
|-----------|-------|------------|-------|
| `cash-info` | Stav pokladny | CashInfoModule | Přehled hotovosti k odevzdání |
| `sales` | Tržby | SalesModule | Evidence denních tržeb |
| `collect` | Odvody | CollectModule | Evidence odvodů hotovosti |
| `absence-report` | Absence | AbsenceReportModule | Hlášení nepřítomnosti s notifikacemi |
| `absence-approval` | Schvalování | AbsenceApprovalModule | Schvalování žádostí o absenci |
| `tasks` | Úkoly | TasksModule | Seznam úkolů |
| `kpi-dashboard` | KPI Dashboard | KpiDashboardModule | Přehled klíčových ukazatelů |
| `reports` | Tržba a Docházka | ReportsModule | Reporty tržeb a docházky |
| `attendance` | Docházka | HeaderAttendance | Evidence příchodů/odchodů (v header) |

---

## Struktura projektu

```
systempro/
├── app/
│   ├── layout.tsx          # Root layout (Inter font, metadata)
│   ├── page.tsx            # Home - renderuje view podle role
│   └── globals.css         # Tailwind + custom animace
│
├── components/
│   ├── admin-dashboard/    # Komponenty pro dashboard
│   │   ├── kpi-cards.tsx           # 4 KPI karty
│   │   ├── attendance-table.tsx    # Tabulka docházky
│   │   ├── sales-table.tsx         # Tabulka tržeb
│   │   ├── last-pickups.tsx        # Panel posledních svozů
│   │   ├── absence-requests.tsx    # Panel žádostí o volno
│   │   │
│   │   └── settings/               # Nastavení systému
│   │       ├── AdminSettingsView.tsx    # Hlavní view nastavení
│   │       ├── EmployeesSettings.tsx    # Správa zaměstnanců
│   │       ├── EmployeeFormModal.tsx    # Modal formulář zaměstnance
│   │       ├── RolesSettings.tsx        # Správa rolí
│   │       ├── RoleFormModal.tsx        # Modal formulář role
│   │       ├── StoresSettings.tsx       # Správa prodejen
│   │       ├── StoreFormModal.tsx       # Modal formulář prodejny
│   │       ├── ModulesSettings.tsx      # Správa modulů a přístupů
│   │       └── DeleteConfirmModal.tsx   # Potvrzení mazání
│   │
│   ├── modals/
│   │   ├── sales-modal.tsx         # Formulář denních tržeb
│   │   ├── collect-modal.tsx       # Formulář odevzdání hotovosti
│   │   └── absence-modal.tsx       # Formulář nahlášení absence
│   │
│   ├── shared/             # Sdílené komponenty
│   │   ├── absence-card.tsx        # Karta absence s badge notifikací
│   │   ├── absence-request-form.tsx # Formulář žádosti o absenci
│   │   ├── absence-requests-list.tsx # Seznam žádostí o absenci
│   │   └── absence-approval-box.tsx  # Box schvalování absencí
│   │
│   ├── ui/                 # Základní UI komponenty
│   │   ├── button.tsx, dialog.tsx, input.tsx, select.tsx
│   │   ├── checkbox.tsx, table.tsx, card.tsx
│   │   └── currency-input.tsx      # Custom input pro Kč
│   │
│   ├── views/              # Views pro jednotlivé role
│   │   ├── prodavac-view.tsx           # Prodavač
│   │   ├── skladnik-view.tsx           # Skladník
│   │   ├── vedouci-sklad-view.tsx      # Vedoucí skladu
│   │   ├── obsluha-eshop-view.tsx      # Obsluha e-shopu
│   │   ├── obchodnik-view.tsx          # Obchodník
│   │   ├── vedouci-velkoobchod-view.tsx # Vedoucí velkoobchodu
│   │   ├── admin-view.tsx              # Administrator
│   │   ├── majitel-view.tsx            # Majitel
│   │   ├── absence-full-view.tsx       # Fullscreen view absencí
│   │   └── approval-full-view.tsx      # Fullscreen view schvalování
│   │
│   ├── ModuleRenderer.tsx          # Dynamický renderer modulů
│   ├── header.tsx                  # Hlavička s logo, role, docházka
│   ├── attendance-module.tsx       # Modul docházky (příchod/odchod)
│   ├── live-clock.tsx              # Živé hodiny
│   └── cash-monitor.tsx            # Banner s hotovostí k odevzdání
│
├── modules/                # Modulové komponenty
│   ├── index.ts                    # Export všech modulů
│   ├── registry.ts                 # Registry mapující komponenty
│   ├── CashInfoModule.tsx          # Modul stavu pokladny
│   ├── SalesModule.tsx             # Modul tržeb
│   ├── CollectModule.tsx           # Modul odvodů
│   ├── AbsenceReportModule.tsx     # Modul hlášení absencí
│   ├── AbsenceApprovalModule.tsx   # Modul schvalování
│   ├── TasksModule.tsx             # Modul úkolů
│   ├── KpiDashboardModule.tsx      # KPI dashboard
│   ├── ReportsModule.tsx           # Modul reportů
│   └── PlaceholderModule.tsx       # Placeholder pro nové moduly
│
├── config/
│   └── default-modules.ts  # Výchozí konfigurace modulů a rolí
│
├── stores/                 # Zustand state management
│   ├── auth-store.ts               # Autentizace, aktivní role/prodejna
│   ├── users-store.ts              # Správa uživatelů
│   ├── roles-store.ts              # Správa rolí
│   ├── stores-store.ts             # Správa prodejen
│   ├── modules-store.ts            # Konfigurace modulů
│   ├── attendance-store.ts         # Docházka
│   ├── sales-store.ts              # Tržby
│   ├── absence-store.ts            # Absence a notifikace
│   ├── collect-store.ts            # Odvody
│   ├── admin-store.ts              # Admin nastavení
│   └── ui-store.ts                 # UI stav (modály, filtry)
│
├── lib/
│   ├── mock-data.ts        # Testovací data + select options
│   └── utils.ts            # cn() pro Tailwind třídy
│
├── types/
│   └── index.ts            # TypeScript typy a interfaces
│
└── CLAUDE.md               # Pravidla pro vývoj + design system
```

---

## Role a funkcionalita

### Přehled rolí

| Role | Typ | Docházka | Absence | Schvalování | Popis |
|------|-----|----------|---------|-------------|-------|
| Prodavač | prodavac | ✅ | ✅ | ❌ | Evidence tržeb, docházky, absencí |
| Skladník | skladnik | ✅ | ✅ | ❌ | Práce ve skladu |
| Vedoucí skladu | vedouci-sklad | ✅ | ✅ | ✅ | Správa skladu, schvaluje skladníky a e-shop |
| Obsluha e-shop | obsluha-eshop | ✅ | ✅ | ❌ | Zpracování online objednávek |
| Obchodník | obchodnik | ✅ | ✅ | ❌ | Obchodní činnost |
| Vedoucí velkoobchod | vedouci-velkoobchod | ✅ | ✅ | ✅ | Správa velkoobchodu, schvaluje prodavače a obchodníky |
| Administrator | administrator | ❌ | ❌ | ✅ | Správa systému, schvaluje vedoucí |
| Majitel | majitel | ❌ | ❌ | ✅ | Přehled a reporting, schvaluje všechny |

### Hierarchie schvalování absencí

```
                    ┌─────────────┐
                    │   Majitel   │ schvaluje všechny
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
     ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
     │Administrator│ │Vedoucí sklad │ │Vedoucí velko.│
     └──────┬──────┘ └──────┬───────┘ └──────┬───────┘
            │               │                │
            │         ┌─────┴─────┐    ┌─────┴─────┐
            │         ▼           ▼    ▼           ▼
            │   ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
            │   │ Skladník │ │E-shop  │ │Prodavač│ │Obchodník │
            │   └──────────┘ └────────┘ └────────┘ └──────────┘
            │
      ┌─────┴─────┐
      ▼           ▼
┌──────────────┐ ┌──────────────┐
│Vedoucí sklad │ │Vedoucí velko.│
└──────────────┘ └──────────────┘
```

### Detaily funkcí podle role

#### Prodavač
- **Docházka**: Příchod/Odchod, volba pracoviště (prodejna/sklad), potvrzení kasy
- **Tržby**: Zadání hotovosti, karet, partnera + příjmy/výdaje
- **Odvody**: Odevzdání hotovosti řidiči (jméno, číslo vaku)
- **Absence**: Žádosti o dovolenou, nemoc, lékaře, neplacené volno
- **Notifikace**: Badge na kartě Absence ukazující počet nových schválených/zamítnutých žádostí

#### Skladník, Obsluha e-shop, Obchodník
- **Docházka**: Příchod/Odchod na pracovišti role
- **Absence**: Žádosti s notifikacemi o zpracování
- **Úkoly**: Seznam přiřazených úkolů

#### Vedoucí skladu
- **Docházka**: Vlastní docházka
- **Absence**: Vlastní žádosti + notifikace
- **Schvalování**: Schvaluje skladníky a obsluhu e-shopu
- **Úkoly**: Seznam úkolů

#### Vedoucí velkoobchodu
- **Docházka**: Vlastní docházka
- **Absence**: Vlastní žádosti + notifikace
- **Schvalování**: Schvaluje prodavače a obchodníky
- **Úkoly**: Seznam úkolů

#### Administrator
- **KPI Dashboard**: Přehled klíčových ukazatelů
- **Reporty**: Filtrovatelné tabulky tržeb a docházky
- **Schvalování**: Schvaluje vedoucí skladu a velkoobchodu
- **Nastavení systému**:
  - Správa zaměstnanců (CRUD)
  - Správa rolí (aktivace/deaktivace)
  - Správa prodejen (CRUD)
  - Správa modulů (přiřazení k rolím, hierarchie schvalování)

#### Majitel
- **KPI Dashboard**: Kompletní přehled všech ukazatelů
- **Schvalování**: Může schvalovat žádosti všech zaměstnanců

---

## Zustand Stores

### useAuthStore
```typescript
State:
  currentUser: User | null
  activeRoleId: string | null
  activeStoreId: string | null
  _hydrated: boolean

Actions:
  setCurrentUser(user)     // Nastaví uživatele s defaultními hodnotami
  setActiveRole(roleId)    // Přepne aktivní roli
  setActiveStore(storeId)  // Přepne aktivní prodejnu
  switchToUser(userId)     // Přepne na jiného uživatele

Computed:
  getActiveRole()          // Vrátí aktivní roli
  getAvailableRoles()      // Role dostupné pro uživatele
  getAvailableStores()     // Prodejny dostupné pro uživatele
  getAllActiveUsers()      // Všichni aktivní uživatelé
  needsStoreSelection()    // Potřebuje vybrat prodejnu?
  getActiveRoleType()      // Typ aktivní role
  canReportAbsence()       // Může hlásit absenci?
```

### useModulesStore
```typescript
State:
  definitions: ModuleDefinition[]  // Definice všech modulů
  configs: ModuleConfig[]          // Konfigurace pro role

Actions:
  updateModuleConfig(moduleId, config)      // Aktualizuje konfiguraci
  toggleRoleAccess(moduleId, roleId)        // Přepne přístup role
  setModuleColumn(moduleId, column)         // Nastaví pozici
  toggleModuleEnabled(moduleId)             // Zapne/vypne modul
  toggleSubordinateRole(...)                // Nastaví podřízenou roli

Computed:
  getModulesForRole(roleId)                 // Moduly pro roli
  getModuleDefinition(moduleId)             // Definice modulu
  getModuleConfig(moduleId)                 // Konfigurace modulu
  getSubordinatesForApprover(...)           // Podřízení pro schvalovatele
```

### useAbsenceStore
```typescript
State:
  formData: AbsenceFormData
  absenceRequests: AbsenceRequest[]
  absenceViewMode: 'card' | 'view'
  approvalViewMode: 'card' | 'view'
  // Filtry pro žádosti

Actions:
  setAbsenceType(type), setDateFrom(date), setDateTo(date)
  setTimeFrom(time), setTimeTo(time), setNote(note)
  submitAbsenceRequest(userId)
  approveAbsence(requestId, approverId)
  rejectAbsence(requestId, approverId)
  openAbsenceView(), closeAbsenceView()
  openApprovalView(), closeApprovalView()
  markMyRequestsAsSeen(userId)    // Označí jako viděné

Computed:
  showTimeSection()               // Zobrazit časovou sekci?
  getMyRequests(userId)           // Moje žádosti
  getFilteredMyRequests(userId)   // Filtrované žádosti
  getPendingRequestsForApproval(approverId, roleType)
  getFilteredRequestsForApproval(approverId, roleType)
  getUnseenProcessedRequestsCount(userId)  // Počet notifikací
```

### useAttendanceStore
```typescript
State:
  isInWork: boolean
  kasaConfirmed: boolean
  workplace: { type, id, name }

Actions:
  toggleAttendance()              // Příchod/Odchod
  confirmKasa()                   // Potvrzení kasy
  changeWorkplace(type, id, name) // Změna pracoviště

Computed:
  isWarehouse()                   // Je na skladu?
```

### useSalesStore
```typescript
State:
  cashToCollect: number           // Default: 28500
  formData: SalesFormData

Actions:
  calculateTotal()                // Výpočet celkové tržby
  getCollectionPeriod()           // Období svozu
  updateField(field, value)
  add/update/removeIncomeRow()
  add/update/removeExpenseRow()
  validateForm()
  submitSales()
  submitCollection(driverName, bagNumber)

Validace: Každý řádek s částkou musí mít poznámku
```

### useCollectStore
```typescript
State:
  formData: CollectionFormData

Actions:
  setDriverName(name)
  setAmount(amount)
  setPeriod(period)
  submitCollection()
  resetForm()
```

### useUsersStore, useRolesStore, useStoresStore
```typescript
// CRUD operace pro entity
State: users[] / roles[] / stores[]
Actions: add, update, delete, getById, getActive
```

### useUIStore
```typescript
State:
  salesModalOpen, collectModalOpen, absenceModalOpen
  subView, storeFilter, monthFilter, yearFilter

Actions:
  open/close/set modály
  setSubView(), setFilters(), resetFilters()
```

---

## Datové typy

```typescript
// Role types - 8 available roles
type RoleType =
  | 'prodavac'
  | 'skladnik'
  | 'vedouci-sklad'
  | 'obsluha-eshop'
  | 'obchodnik'
  | 'vedouci-velkoobchod'
  | 'administrator'
  | 'majitel';

// Workplace types
type WorkplaceType = 'store' | 'role';

// Main entities
interface User {
  id: string;
  username: string;
  fullName: string;
  roleIds: string[];       // Multi-role podpora
  storeIds: string[];
  defaultRoleId?: string;
  defaultStoreId?: string;
  active: boolean;
}

interface Role {
  id: string;
  name: string;
  type: RoleType;
  active: boolean;
}

interface Store {
  id: string;
  name: string;
  address: string;
  active: boolean;
}

// Absence system
type AbsenceType = 'Dovolená' | 'Nemoc / Neschopenka' | 'Lékař' | 'Neplacené volno';
type AbsenceRequestStatus = 'pending' | 'approved' | 'rejected';

interface AbsenceRequest {
  id: string;
  userId: string;
  type: AbsenceType;
  dateFrom: string;
  dateTo: string;
  timeFrom?: string;         // Pouze pro typ "Lékař"
  timeTo?: string;
  note: string;
  status: AbsenceRequestStatus;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  seenByUser?: boolean;      // Notifikace - viděl uživatel změnu?
}

// Module system
interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  component: string;         // Název komponenty v registry
  icon: string;              // Lucide icon name
}

interface ApprovalRoleMapping {
  approverRoleId: string;
  subordinateRoleIds: string[];
}

interface ModuleConfig {
  moduleId: string;
  roleIds: string[];
  order: number;
  column: 'left' | 'right' | 'full' | 'top' | 'header';
  enabled: boolean;
  approvalMappings?: ApprovalRoleMapping[];
}

// Forms
interface SalesFormData {
  cash: number;
  card: number;
  partner: number;
  incomes: ExtraRow[];
  expenses: ExtraRow[];
}

interface ExtraRow {
  id: string;
  amount: number;
  note: string;
}

interface AbsenceFormData {
  type: AbsenceType;
  dateFrom: string;
  dateTo: string;
  timeFrom?: string;
  timeTo?: string;
  note: string;
}
```

---

## Notifikační systém

### Absence notifikace

Modul Absence zobrazuje badge s počtem nových zpracovaných žádostí:

1. **Při schválení/zamítnutí** žádosti se nastaví `seenByUser: false`
2. **AbsenceCard** zobrazuje badge s počtem neviděných zpracovaných žádostí
3. **Po kliknutí** na modul Absence se všechny žádosti označí jako viděné
4. Badge zmizí

```typescript
// Počet notifikací
getUnseenProcessedRequestsCount(userId) {
  return absenceRequests.filter(
    r => r.userId === userId &&
         r.status !== 'pending' &&
         r.seenByUser === false
  ).length;
}

// Označení jako viděné
markMyRequestsAsSeen(userId) {
  absenceRequests.map(r =>
    r.userId === userId && r.status !== 'pending'
      ? { ...r, seenByUser: true }
      : r
  );
}
```

---

## Pravidla vývoje

**Z CLAUDE.md:**

- **ESLint**: Zero tolerance - `npm run lint` musí projít bez chyb i varování
- **State**: Veškerá data pouze v Zustand stores
- **Komponenty**: Bez business logiky, pouze prezentace a volání akcí
- **Design**: Dodržovat design pattern z CLAUDE.md (barvy, spacing, typography)
- **Nepoužívat**: `// eslint-disable` komentáře bez schválení

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

## Mock data

Aplikace obsahuje mock data pro testování:
- **27 zaměstnanců** s různými rolemi
- **10 prodejen** (Bohnice, Butovice, Brno, ...)
- **8 rolí** s definovanými právy
- **21 žádostí o absenci** v různých stavech

Přepínání mezi uživateli je možné přes dropdown v headeru.

---

## Testovací scénáře

### Absence workflow

1. Přihlásit se jako prodavač (např. "Burianová Aneta")
2. Kliknout na modul Absence
3. Vytvořit novou žádost o dovolenou
4. Přepnout na schvalovatele (např. "Lhoták Jan - Vedoucí velkoobchodu")
5. V modulu Schvalování schválit/zamítnout žádost
6. Přepnout zpět na prodavače
7. Ověřit badge notifikaci na kartě Absence
8. Kliknout na Absence - badge zmizí

### Admin workflow

1. Přihlásit se jako Administrator ("Hodek Karel")
2. Kliknout na "Nastavení"
3. Testovat CRUD operace pro zaměstnance, role, prodejny
4. V záložce "Moduly" upravit přístupy a hierarchii schvalování

---

## TODO / Rozpracované funkce

- [ ] Tlačítko "Úkoly" - zatím placeholder
- [ ] Backend integrace - aktuálně mock data
- [ ] Export XLS - připravené tlačítko
- [ ] Push notifikace - email/SMS při změně stavu žádosti
- [ ] Kalendářní přehled absencí
- [ ] Reporting a statistiky absencí
