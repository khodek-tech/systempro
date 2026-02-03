# SYSTEM.PRO

Interní systém pro správu tržeb, docházky a absencí zaměstnanců v maloobchodní síti.
Aplikace podporuje **8 různých rolí** s multi-role systémem - uživatel může mít přiřazeno více rolí a přepínat mezi nimi.

**Verze:** Enterprise v5.5
**Stav:** Frontend + Supabase databáze (migrace z mock dat)
**Poslední aktualizace:** 2026-02-03

---

## Obsah

1. [Technologie](#technologie)
2. [Architektura](#architektura)
3. [Databáze Supabase](#databáze-supabase)
4. [Integrace třetích stran](#integrace-třetích-stran)
5. [Struktura projektu](#struktura-projektu)
6. [Konfigurace a Environment](#konfigurace-a-environment)
7. [Role a funkcionalita](#role-a-funkcionalita)
8. [Zustand Stores](#zustand-stores)
9. [API Endpoints](#api-endpoints)
10. [Spuštění](#spuštění)
11. [TODO / Roadmap](#todo--roadmap)
12. [Pravidla vývoje](#pravidla-vývoje)

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
| **Supabase** | - | **PostgreSQL databáze (NOVÉ)** |
| ExcelJS | - | Export do Excel |
| fast-xml-parser | - | Parsování XML (Pohoda) |

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

## Databáze Supabase

### Připojení

**Datum přidání:** 2026-02-03
**Důvod:** Migrace z mock dat na persistentní databázi pro produkční nasazení

**Project URL:** `https://hjywtaijrtrydecvwoof.supabase.co`

### Aktuální struktura tabulek

#### Tabulka: `stores` (Prodejny)

| Sloupec | Typ | Nullable | Default | Popis |
|---------|-----|----------|---------|-------|
| `id` | TEXT | NOT NULL | - | Primární klíč (např. "store-1") |
| `name` | TEXT | NOT NULL | - | Název prodejny |
| `address` | TEXT | NULL | '' | Adresa prodejny |
| `active` | BOOLEAN | NULL | true | Zda je prodejna aktivní |
| `cash_base` | INTEGER | NULL | 2000 | Základní stav pokladny |
| `opening_hours` | JSONB | NULL | - | Otevírací hodiny (struktura viz níže) |
| `created_at` | TIMESTAMPTZ | NULL | NOW() | Datum vytvoření |
| `updated_at` | TIMESTAMPTZ | NULL | NOW() | Datum poslední změny (auto-update) |

**Struktura `opening_hours` (JSONB):**
```json
{
  "sameAllWeek": true,
  "default": { "open": "09:00", "close": "21:00", "closed": false }
}
// nebo
{
  "sameAllWeek": false,
  "monday": { "open": "07:00", "close": "20:00", "closed": false },
  "tuesday": { "open": "07:00", "close": "20:00", "closed": false },
  // ... ostatní dny
}
```

**Aktuální data:** 10 prodejen (Bohnice, Butovice, Brno, Č Most, OC Šestka, Prosek, Ústí, Chodov, Vysočany, Zličín)

### Plánované tabulky

| Tabulka | Popis | Priorita |
|---------|-------|----------|
| `users` | Zaměstnanci | Vysoká |
| `roles` | Role v systému | Vysoká |
| `attendance_records` | Evidence docházky | Vysoká |
| `sales_records` | Evidence tržeb | Vysoká |
| `absence_requests` | Žádosti o absenci | Střední |
| `tasks` | Úkoly | Střední |
| `shifts` | Směny | Střední |
| `chat_groups` | Chat skupiny | Nízká |
| `chat_messages` | Chat zprávy | Nízká |

### Synchronizace s frontendem

**Aktuálně:** Data prodejen jsou v Supabase, ale frontend stále používá lokální Zustand store s mock daty.

**Plán:**
1. Přidat Supabase klienta do projektu
2. Vytvořit synchronizační vrstvu mezi Supabase a Zustand
3. Postupně migrovat jednotlivé entity

---

## Integrace třetích stran

### Pohoda mServer

**Stav:** ✅ Funkční (test připojení, export skladů)

Integrace s účetním systémem Pohoda přes mServer API.

#### API Endpoints

| Endpoint | Metoda | Popis |
|----------|--------|-------|
| `/api/pohoda/test` | POST | Test připojení k mServeru |
| `/api/pohoda/sklady/list` | POST | Seznam skladů |
| `/api/pohoda/sklady/export` | POST | Export skladových zásob do Excel |
| `/api/pohoda/vsechny-sklady` | POST | Všechny sklady |
| `/api/pohoda/generate-order` | POST | Generování objednávky |
| `/api/pohoda/upload` | POST | Upload dat do Pohody |

#### Konfigurace

Připojení se konfiguruje v administraci (PohodaSettings):
- **URL:** URL mServeru (např. `http://server:8080`)
- **Uživatel:** Přihlašovací jméno
- **Heslo:** Heslo
- **IČO:** IČO firmy

#### Technické detaily

- Autentizace: Basic Auth (STW-Authorization header)
- Formát: XML (Windows-1250)
- Timeout: 10s pro test, 5min pro export
- Parser: fast-xml-parser

### Shoptet

**Stav:** 📋 Plánováno

Plánovaná integrace pro:
- Synchronizace objednávek
- Synchronizace produktů
- Automatické aktualizace stavu skladu

### SyncAgent

**Stav:** 📋 Plánováno

Plánovaná služba pro:
- Automatická synchronizace dat mezi systémy
- Plánované úlohy
- Notifikace o změnách

---

## Struktura projektu

```
systempro/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Inter font, metadata)
│   ├── page.tsx                  # Home - renderuje view podle role
│   ├── globals.css               # Tailwind + custom animace
│   │
│   └── api/                      # API Routes
│       └── pohoda/               # Pohoda mServer integrace
│           ├── test/route.ts         # Test připojení
│           ├── sklady/
│           │   ├── list/route.ts     # Seznam skladů
│           │   └── export/route.ts   # Export do Excel
│           ├── vsechny-sklady/route.ts
│           ├── generate-order/route.ts
│           └── upload/route.ts
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
│   │       ├── ChatGroupsSettings.tsx
│   │       ├── ChatGroupFormModal.tsx
│   │       ├── PohodaSettings.tsx    # NOVÉ: Pohoda konfigurace
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
│   │   └── (button, dialog, input, select, ...)
│   │
│   ├── views/                    # Views pro jednotlivé role
│   │   ├── RoleView.tsx
│   │   ├── prodavac-view.tsx
│   │   ├── skladnik-view.tsx
│   │   └── ... (další role views)
│   │
│   ├── ModuleRenderer.tsx
│   ├── header.tsx
│   ├── cash-monitor.tsx
│   └── live-clock.tsx
│
├── modules/                      # Modulové komponenty (13)
│   ├── index.ts
│   ├── registry.ts
│   └── ... (13 module souborů)
│
├── config/
│   └── default-modules.ts        # Výchozí konfigurace modulů a rolí
│
├── specs/                        # Living Specification systém
│   ├── MASTER-SPEC.md
│   ├── TEST-RUNNER.md
│   ├── CHANGELOG.md
│   ├── modules/                  # Specifikace modulů (13 souborů)
│   └── shared/
│
├── src/                          # Feature-based architektura
│   ├── core/
│   │   └── stores/               # Hlavní Zustand stores
│   │
│   ├── features/                 # Feature moduly s vlastními stores
│   │   ├── absence/
│   │   ├── attendance/
│   │   ├── sales/
│   │   ├── collect/
│   │   ├── tasks/
│   │   ├── shifts/
│   │   ├── presence/
│   │   ├── chat/
│   │   ├── manual/
│   │   └── pohoda/               # NOVÉ: Pohoda integrace
│   │       ├── pohoda-store.ts
│   │       └── index.ts
│   │
│   ├── admin/
│   │   ├── admin-store.ts
│   │   └── employee-form-store.ts
│   │
│   └── shared/
│       ├── types/
│       ├── utils/
│       ├── hooks/
│       └── components/
│
├── stores/                       # Legacy stores (re-exporty z src/)
│   ├── pohoda-store.ts           # NOVÉ
│   └── ... (ostatní stores)
│
├── lib/
│   ├── mock-data.ts              # Testovací data + select options
│   ├── constants.ts
│   └── utils.ts
│
├── .env                          # Environment proměnné (NOVÉ)
├── .mcp.json                     # MCP konfigurace (NOVÉ)
├── testy.md
├── CLAUDE.md                     # Pravidla pro vývoj
└── README.md                     # Tato dokumentace
```

---

## Konfigurace a Environment

### Požadované ENV proměnné

Vytvořte soubor `.env` v kořenu projektu:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...
SUPABASE_DB_PASSWORD=your-db-password

# Pohoda mServer (volitelné - konfigurace v administraci)
# POHODA_MSERVER_URL=http://server:8080
# POHODA_USERNAME=admin
# POHODA_PASSWORD=password
# POHODA_ICO=12345678
```

### Lokální vývoj

```bash
# 1. Klonování
git clone <repo>
cd systempro

# 2. Instalace závislostí
npm install

# 3. Konfigurace
cp .env.example .env
# Upravte .env s vašimi hodnotami

# 4. Spuštění
npm run dev
```

---

## Role a funkcionalita

### Přehled rolí (8)

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

---

## Zustand Stores

### Architektura

- **Core stores** (`src/core/stores/`) - základní entity
- **Feature stores** (`src/features/*/`) - business logika
- **Legacy stores** (`stores/`) - re-exporty pro zpětnou kompatibilitu

### Seznam stores

| Store | Umístění | Popis |
|-------|----------|-------|
| useAuthStore | core | Přihlášený uživatel, aktivní role/prodejna |
| useUsersStore | core | Seznam zaměstnanců (CRUD) |
| useRolesStore | core | Seznam rolí |
| useStoresStore | core | Seznam prodejen |
| useModulesStore | core | Definice a konfigurace modulů |
| useUiStore | core | UI stav (sidebary, modály) |
| useAbsenceStore | features | Žádosti o absenci |
| useAttendanceStore | features | Evidence docházky |
| useSalesStore | features | Evidence tržeb |
| useCollectStore | features | Odvody hotovosti |
| useTasksStore | features | Úkoly |
| useShiftsStore | features | Směny |
| usePresenceStore | features | Přítomnost zaměstnanců |
| useChatStore | features | Chat skupiny a zprávy |
| useManualStore | features | Kontextová nápověda |
| usePohodaStore | features | **NOVÉ:** Pohoda konfigurace |
| useAdminStore | admin | Administrátorský stav |
| useEmployeeFormStore | admin | Formulář zaměstnance |

---

## API Endpoints

### Pohoda API

| Endpoint | Metoda | Tělo požadavku | Odpověď |
|----------|--------|----------------|---------|
| `/api/pohoda/test` | POST | `{ url, username, password, ico }` | `{ success, companyName?, error? }` |
| `/api/pohoda/sklady/list` | POST | `{ url, username, password, ico }` | `{ success, data: Storage[] }` |
| `/api/pohoda/sklady/export` | POST | `{ url, username, password, ico, skladId? }` | Excel soubor (.xlsx) |
| `/api/pohoda/generate-order` | POST | `{ url, username, password, ico, items }` | `{ success, orderId? }` |

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

## TODO / Roadmap

### Hotovo ✅

- [x] Modulový systém s 13 moduly
- [x] Role systém s 8 rolemi
- [x] Zustand state management
- [x] Living Specification systém
- [x] Chat modul s reakcemi
- [x] Notifikační systém (absence, chat)
- [x] Pohoda mServer integrace (test, export skladů)
- [x] **Supabase databáze - tabulka `stores`**

### Rozpracované 🔄

- [ ] Migrace dalších entit do Supabase (users, roles, attendance)
- [ ] Synchronizace Zustand ↔ Supabase
- [ ] Pohoda - import objednávek

### Plánované 📋

- [ ] Shoptet integrace
- [ ] SyncAgent služba
- [ ] Real-time WebSocket (chat, přítomnost)
- [ ] Push notifikace (email/SMS)
- [ ] Kalendářní přehled absencí
- [ ] Export XLS (reporty)
- [ ] Autentizace uživatelů (Supabase Auth)

---

## Pravidla vývoje

**Z CLAUDE.md:**

- **ESLint**: Zero tolerance - `npm run lint` musí projít bez chyb i varování
- **State**: Veškerá data pouze v Zustand stores
- **Komponenty**: Bez business logiky, pouze prezentace a volání akcí
- **Design**: Dodržovat design pattern z CLAUDE.md (barvy, spacing, typography)
- **Specifikace**: Při změně modulu aktualizovat `/specs/` a `/testy.md`

### Known Issues

- Frontend stále používá mock data, Supabase zatím není propojen
- Pohoda export může trvat dlouho pro velké sklady (timeout 5min)

### Bezpečnostní upozornění

- **Nikdy** nekomitovat `.env` soubor s hesly
- Supabase klíče s prefixem `NEXT_PUBLIC_` jsou veřejné (publishable)
- Pro serverové operace používat service role key (nikdy na frontendu)

---

## Mock data

Aplikace obsahuje mock data pro testování:
- **28 zaměstnanců** s různými rolemi
- **10 prodejen** (nyní i v Supabase)
- **8 rolí** s definovanými právy
- **21 žádostí o absenci** v různých stavech
- **8 úkolů** v různých stavech
- **Chat skupiny** s testovacími zprávami

Přepínání mezi uživateli je možné přes dropdown v headeru.

---

## Living Specification

Projekt používá "Living Specification" systém - živou dokumentaci všech modulů.

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

Kompletní testovací scénáře jsou v `/testy.md`.
