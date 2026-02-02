# SYSTEM.PRO

Interní systém pro správu tržeb, docházky a absencí zaměstnanců v maloobchodní síti.
Aplikace podporuje **8 různých rolí** s multi-role systémem - uživatel může mít přiřazeno více rolí a přepínat mezi nimi.

**Verze:** Enterprise v5.5
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
- Konfigurovat pozici modulů (top, left, right, sidebar, full, header)
- Zapínat/vypínat moduly pro jednotlivé role
- Nastavovat hierarchie: schvalování absencí, viditelnost úkolů, přítomnost

```
┌─────────────────────────────────────────────────────────────────┐
│                     ModuleDefinition                            │
│  (id, name, description, component, icon)                       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ModuleConfig                               │
│  (moduleId, roleIds[], order, column, enabled,                  │
│   approvalMappings, viewMappings)                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ModuleRenderer                              │
│  Renderuje moduly podle aktivní role a konfigurace              │
└─────────────────────────────────────────────────────────────────┘
```

### Dostupné moduly (13)

| ID modulu | Název | Komponenta | Popis |
|-----------|-------|------------|-------|
| `cash-info` | Stav pokladny | CashInfoModule | Přehled hotovosti k odevzdání |
| `sales` | Tržby | SalesModule | Evidence denních tržeb |
| `collect` | Odvody | CollectModule | Evidence odvodů hotovosti |
| `absence-report` | Absence | AbsenceReportModule | Hlášení nepřítomnosti s notifikacemi |
| `absence-approval` | Schvalování | AbsenceApprovalModule | Schvalování žádostí o absenci |
| `tasks` | Úkoly | TasksModule | Seznam úkolů s hierarchickým zobrazením |
| `kpi-dashboard` | KPI Dashboard | KpiDashboardModule | Přehled klíčových ukazatelů |
| `reports` | Tržba a Docházka | ReportsModule | Reporty tržeb a docházky |
| `attendance` | Docházka | HeaderAttendance | Evidence příchodů/odchodů (v header) |
| `shifts` | Směny | ShiftsModule | Plánování a přehled směn |
| `presence` | Přítomnost | PresenceModule | Přehled přítomnosti zaměstnanců |
| `chat` | Chat | ChatModule | Skupinové konverzace s reakcemi |
| `manual` | Nápověda | ManualModule | Kontextová nápověda podle role |

---

## Struktura projektu

```
systempro/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Inter font, metadata)
│   ├── page.tsx                  # Home - renderuje view podle role
│   └── globals.css               # Tailwind + custom animace
│
├── components/
│   ├── admin-dashboard/          # Komponenty pro dashboard
│   │   ├── kpi-cards.tsx
│   │   ├── attendance-table.tsx
│   │   ├── sales-table.tsx
│   │   ├── last-pickups.tsx
│   │   ├── absence-requests.tsx
│   │   │
│   │   └── settings/             # Nastavení systému
│   │       ├── AdminSettingsView.tsx
│   │       ├── EmployeesSettings.tsx
│   │       ├── EmployeeFormModal.tsx
│   │       ├── RolesSettings.tsx
│   │       ├── RoleFormModal.tsx
│   │       ├── StoresSettings.tsx
│   │       ├── StoreFormModal.tsx
│   │       ├── ModulesSettings.tsx
│   │       ├── ModuleSettingsCard.tsx
│   │       ├── ModuleSettingsDetail.tsx
│   │       ├── ChatGroupsSettings.tsx    # Správa chat skupin
│   │       ├── ChatGroupFormModal.tsx
│   │       └── DeleteConfirmModal.tsx
│   │
│   ├── chat/                     # Chat komponenty
│   │   ├── ChatGroupList.tsx
│   │   ├── ChatGroupItem.tsx
│   │   ├── ChatConversation.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatMessageInput.tsx
│   │   ├── ChatReactionPicker.tsx
│   │   ├── ChatAttachmentPreview.tsx
│   │   └── index.ts
│   │
│   ├── modals/
│   │   ├── sales-modal.tsx
│   │   ├── collect-modal.tsx
│   │   └── absence-modal.tsx
│   │
│   ├── shared/                   # Sdílené komponenty
│   │   ├── absence-card.tsx
│   │   ├── absence-request-form.tsx
│   │   ├── absence-requests-list.tsx
│   │   └── absence-approval-box.tsx
│   │
│   ├── ui/                       # Základní UI komponenty
│   │   ├── button.tsx, dialog.tsx, input.tsx, select.tsx
│   │   ├── checkbox.tsx, table.tsx, card.tsx
│   │   └── currency-input.tsx
│   │
│   ├── views/                    # Views pro jednotlivé role
│   │   ├── RoleView.tsx              # Dynamický view renderer
│   │   ├── prodavac-view.tsx
│   │   ├── skladnik-view.tsx
│   │   ├── obchodnik-view.tsx
│   │   ├── vedouci-sklad-view.tsx
│   │   ├── vedouci-velkoobchod-view.tsx
│   │   ├── obsluha-eshop-view.tsx
│   │   ├── admin-view.tsx
│   │   ├── majitel-view.tsx
│   │   ├── absence-full-view.tsx
│   │   ├── approval-full-view.tsx
│   │   ├── tasks-full-view.tsx
│   │   ├── shifts-full-view.tsx
│   │   ├── chat-full-view.tsx
│   │   └── manual-full-view.tsx
│   │
│   ├── ModuleRenderer.tsx
│   ├── header.tsx
│   ├── attendance-module.tsx
│   ├── live-clock.tsx
│   └── cash-monitor.tsx
│
├── modules/                      # Modulové komponenty (13)
│   ├── index.ts
│   ├── registry.ts
│   ├── CashInfoModule.tsx
│   ├── SalesModule.tsx
│   ├── CollectModule.tsx
│   ├── AbsenceReportModule.tsx
│   ├── AbsenceApprovalModule.tsx
│   ├── TasksModule.tsx
│   ├── KpiDashboardModule.tsx
│   ├── ReportsModule.tsx
│   ├── ShiftsModule.tsx
│   ├── PresenceModule.tsx
│   ├── ChatModule.tsx
│   └── PlaceholderModule.tsx
│
├── config/
│   └── default-modules.ts        # Výchozí konfigurace modulů a rolí
│
├── specs/                        # Living Specification systém
│   ├── MASTER-SPEC.md            # Přehled systému
│   ├── TEST-RUNNER.md            # Instrukce pro testování
│   ├── CHANGELOG.md              # Historie změn
│   ├── modules/                  # Specifikace modulů (13 souborů)
│   │   ├── cash-info.spec.yaml
│   │   ├── sales.spec.yaml
│   │   ├── collect.spec.yaml
│   │   ├── absence-report.spec.yaml
│   │   ├── absence-approval.spec.yaml
│   │   ├── tasks.spec.yaml
│   │   ├── kpi-dashboard.spec.yaml
│   │   ├── reports.spec.yaml
│   │   ├── attendance.spec.yaml
│   │   ├── shifts.spec.yaml
│   │   ├── presence.spec.yaml
│   │   ├── chat.spec.yaml
│   │   └── manual.spec.yaml
│   └── shared/
│       ├── roles.yaml            # Definice rolí
│       ├── notifications.yaml    # Badge logika
│       └── ui-patterns.yaml      # UI vzory
│
├── src/                          # Feature-based architektura
│   ├── core/
│   │   └── stores/               # Hlavní Zustand stores
│   │       ├── index.ts
│   │       ├── store-helpers.ts
│   │       ├── auth-store.ts
│   │       ├── users-store.ts
│   │       ├── roles-store.ts
│   │       ├── stores-store.ts
│   │       ├── modules-store.ts
│   │       └── ui-store.ts
│   │
│   ├── features/                 # Feature moduly s vlastními stores
│   │   ├── absence/
│   │   │   ├── absence-store.ts
│   │   │   ├── absence-helpers.ts
│   │   │   └── index.ts
│   │   ├── attendance/
│   │   │   ├── attendance-store.ts
│   │   │   └── index.ts
│   │   ├── sales/
│   │   │   ├── sales-store.ts
│   │   │   └── index.ts
│   │   ├── collect/
│   │   │   ├── collect-store.ts
│   │   │   └── index.ts
│   │   ├── tasks/
│   │   │   ├── tasks-store.ts
│   │   │   ├── tasks-helpers.ts
│   │   │   └── index.ts
│   │   ├── shifts/
│   │   │   ├── shifts-store.ts
│   │   │   └── index.ts
│   │   ├── presence/
│   │   │   ├── presence-store.ts
│   │   │   └── index.ts
│   │   ├── chat/
│   │   │   ├── chat-store.ts
│   │   │   ├── chat-helpers.ts
│   │   │   └── index.ts
│   │   ├── manual/
│   │   │   ├── manual-store.ts
│   │   │   ├── manual-content.ts
│   │   │   └── index.ts
│   │   └── reports/
│   │       └── (budoucí implementace)
│   │
│   ├── admin/
│   │   ├── admin-store.ts
│   │   ├── employee-form-store.ts
│   │   └── index.ts
│   │
│   └── shared/
│       ├── types/                # Distribuované typy
│       │   ├── index.ts
│       │   ├── base.types.ts     # User, Role, Store
│       │   ├── module.types.ts   # ModuleDefinition, ModuleConfig
│       │   ├── absence.types.ts
│       │   ├── attendance.types.ts
│       │   ├── sales.types.ts
│       │   ├── presence.types.ts
│       │   ├── task.types.ts
│       │   └── chat.types.ts
│       ├── utils/
│       │   ├── cn.ts
│       │   └── index.ts
│       ├── hooks/
│       │   ├── use-sortable-table.ts
│       │   └── index.ts
│       └── components/
│           └── index.ts
│
├── stores/                       # Legacy stores (re-exporty z src/)
│   ├── auth-store.ts
│   ├── users-store.ts
│   ├── roles-store.ts
│   ├── stores-store.ts
│   ├── modules-store.ts
│   ├── ui-store.ts
│   ├── absence-store.ts
│   ├── attendance-store.ts
│   ├── sales-store.ts
│   ├── collect-store.ts
│   ├── tasks-store.ts
│   ├── shifts-store.ts
│   ├── presence-store.ts
│   ├── chat-store.ts
│   ├── manual-store.ts
│   ├── admin-store.ts
│   ├── employee-form-store.ts
│   └── store-helpers.ts
│
├── types/
│   └── index.ts                  # Re-export z src/shared/types
│
├── lib/
│   ├── mock-data.ts              # Testovací data + select options
│   └── utils.ts                  # cn() pro Tailwind třídy
│
├── testy.md                      # Čitelný přehled testovacích scénářů
└── CLAUDE.md                     # Pravidla pro vývoj + design system
```

---

## Living Specification

Projekt používá "Living Specification" systém - živou dokumentaci všech modulů s testovacími scénáři.

### Struktura

```
/specs/
├── MASTER-SPEC.md           # Přehled celého systému
├── TEST-RUNNER.md           # Instrukce pro testování
├── CHANGELOG.md             # Historie změn specifikací
├── modules/                 # Spec soubor pro každý modul
│   └── {module-id}.spec.yaml
└── shared/
    ├── roles.yaml           # Definice rolí a hierarchie
    ├── notifications.yaml   # Badge logika a notifikace
    └── ui-patterns.yaml     # Společné UI vzory
```

### Pravidla aktualizace

Při změně modulu **VŽDY** aktualizovat:
1. `/specs/modules/{module-id}.spec.yaml` - specifikaci modulu
2. `/testy.md` - příslušnou sekci testů
3. `/specs/CHANGELOG.md` - záznam o změně

Viz `CLAUDE.md` pro detailní pravidla.

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
- **Směny**: Přehled vlastních směn
- **Chat**: Skupinové konverzace
- **Nápověda**: Kontextová nápověda pro roli prodavače

#### Skladník, Obsluha e-shop, Obchodník
- **Docházka**: Příchod/Odchod na pracovišti role
- **Absence**: Žádosti s notifikacemi o zpracování
- **Úkoly**: Seznam přiřazených úkolů
- **Směny**: Přehled vlastních směn
- **Chat**: Skupinové konverzace

#### Vedoucí skladu / Vedoucí velkoobchodu
- **Docházka**: Vlastní docházka
- **Absence**: Vlastní žádosti + notifikace
- **Schvalování**: Schvaluje podřízené dle hierarchie
- **Úkoly**: Seznam úkolů + přehled úkolů podřízených
- **Přítomnost**: Sledování přítomnosti podřízených
- **Chat**: Skupinové konverzace

#### Administrator
- **KPI Dashboard**: Přehled klíčových ukazatelů
- **Reporty**: Filtrovatelné tabulky tržeb a docházky
- **Schvalování**: Schvaluje vedoucí skladu a velkoobchodu
- **Úkoly**: Přehled všech úkolů
- **Přítomnost**: Přehled přítomnosti vedoucích
- **Chat**: Přístup ke všem skupinám + správa skupin
- **Nastavení systému**:
  - Správa zaměstnanců (CRUD)
  - Správa rolí (aktivace/deaktivace)
  - Správa prodejen (CRUD)
  - Správa modulů (přiřazení k rolím, hierarchie)
  - Správa chat skupin

#### Majitel
- **KPI Dashboard**: Kompletní přehled všech ukazatelů
- **Schvalování**: Může schvalovat žádosti všech zaměstnanců
- **Úkoly**: Přehled všech úkolů
- **Přítomnost**: Přehled přítomnosti všech zaměstnanců
- **Chat**: Přístup ke všem skupinám

---

## Zustand Stores

### Architektura stores

Projekt používá dual-store systém:
- **Core stores** (`src/core/stores/`) - základní entity (auth, users, roles, stores, modules, ui)
- **Feature stores** (`src/features/*/`) - business logika pro jednotlivé moduly
- **Legacy stores** (`stores/`) - re-exporty pro zpětnou kompatibilitu

### Core Stores

#### useAuthStore
```typescript
State:
  currentUser: User | null
  activeRoleId: string | null
  activeStoreId: string | null
  _hydrated: boolean

Actions:
  setCurrentUser(user)
  setActiveRole(roleId)
  setActiveStore(storeId)
  switchToUser(userId)

Computed:
  getActiveRole(), getAvailableRoles(), getAvailableStores()
  getActiveRoleType(), canReportAbsence(), needsStoreSelection()
```

#### useModulesStore
```typescript
State:
  definitions: ModuleDefinition[]
  configs: ModuleConfig[]

Actions:
  updateModuleConfig(moduleId, config)
  toggleRoleAccess(moduleId, roleId)
  setModuleColumn(moduleId, column)
  toggleModuleEnabled(moduleId)
  toggleSubordinateRole(...)

Computed:
  getModulesForRole(roleId)
  getModuleDefinition(moduleId)
  getModuleConfig(moduleId)
  getSubordinatesForApprover(...)
```

### Feature Stores

#### useAbsenceStore
- Evidence žádostí o absenci
- Notifikační systém (seenByUser)
- Filtry a view módy

#### useAttendanceStore
- Příchod/Odchod
- Potvrzení kasy
- Volba pracoviště

#### useSalesStore
- Evidence tržeb (hotovost, karty, partner)
- Příjmy/výdaje
- Validace formuláře

#### useCollectStore
- Odvody hotovosti
- Jméno řidiče, číslo vaku

#### useTasksStore
- Seznam úkolů
- Filtry podle stavu a role
- Hierarchické zobrazení

#### useShiftsStore
- Plánování směn
- Přehled směn podle zaměstnance/prodejny
- Týdenní/měsíční zobrazení

#### usePresenceStore
- Real-time přítomnost zaměstnanců
- Filtrování podle role a prodejny

#### useChatStore
- Chat skupiny a zprávy
- Reakce na zprávy
- Nepřečtené zprávy

#### useManualStore
- Kontextová nápověda
- Obsah podle aktivní role

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

// Main entities
interface User {
  id: string;
  username: string;
  fullName: string;
  roleIds: string[];
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
  managerId?: string;
}

// Absence system
interface AbsenceRequest {
  id: string;
  userId: string;
  type: AbsenceType;
  dateFrom: string;
  dateTo: string;
  timeFrom?: string;
  timeTo?: string;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  seenByUser?: boolean;
}

// Chat system
interface ChatGroup {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  createdAt: string;
  createdBy: string;
}

interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  createdAt: string;
  reactions: ChatReaction[];
  attachments?: ChatAttachment[];
}

// Shifts
interface Shift {
  id: string;
  userId: string;
  storeId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'morning' | 'afternoon' | 'night' | 'full';
}

// Presence
interface PresenceRecord {
  id: string;
  oderId: string;
  storeId: string;
  status: 'present' | 'absent' | 'late' | 'left-early';
  checkInTime?: string;
  checkOutTime?: string;
}

// Module system
interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  component: string;
  icon: string;
}

interface ModuleConfig {
  moduleId: string;
  roleIds: string[];
  order: number;
  column: 'left' | 'right' | 'full' | 'top' | 'header' | 'sidebar';
  enabled: boolean;
  approvalMappings?: ApprovalRoleMapping[];
  viewMappings?: ViewRoleMapping[];
}
```

---

## Notifikační systém

### Absence notifikace

1. **Při schválení/zamítnutí** žádosti se nastaví `seenByUser: false`
2. **AbsenceCard** zobrazuje badge s počtem neviděných zpracovaných žádostí
3. **Po kliknutí** na modul Absence se všechny žádosti označí jako viděné

### Chat notifikace

1. Počet nepřečtených zpráv na kartě Chat
2. Badge na jednotlivých skupinách
3. Označení jako přečtené při otevření konverzace

---

## Pravidla vývoje

**Z CLAUDE.md:**

- **ESLint**: Zero tolerance - `npm run lint` musí projít bez chyb i varování
- **State**: Veškerá data pouze v Zustand stores
- **Komponenty**: Bez business logiky, pouze prezentace a volání akcí
- **Design**: Dodržovat design pattern z CLAUDE.md (barvy, spacing, typography)
- **Specifikace**: Při změně modulu aktualizovat `/specs/` a `/testy.md`

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
- **Chat skupiny** s testovacími zprávami

Přepínání mezi uživateli je možné přes dropdown v headeru.

---

## Testovací scénáře

Kompletní testovací scénáře jsou v `/testy.md`.

### Rychlý start

1. **Absence workflow**
   - Přihlásit jako prodavač → vytvořit žádost
   - Přepnout na schvalovatele → schválit/zamítnout
   - Ověřit notifikace

2. **Chat workflow**
   - Přihlásit jako uživatel s přístupem k chatu
   - Otevřít skupinu → poslat zprávu
   - Přidat reakci na zprávu

3. **Admin workflow**
   - Přihlásit jako Administrator
   - Správa zaměstnanců, rolí, prodejen
   - Konfigurace modulů a chat skupin

---

## TODO / Roadmap

- [ ] Backend integrace - aktuálně mock data
- [ ] Export XLS - připravené tlačítko
- [ ] Push notifikace - email/SMS při změně stavu
- [ ] Kalendářní přehled absencí
- [ ] Reporting a statistiky
- [ ] Real-time WebSocket pro chat a přítomnost
