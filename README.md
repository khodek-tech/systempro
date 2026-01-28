# SYSTEM.PRO

Interní systém pro správu tržeb a docházky zaměstnanců v maloobchodní síti.
Aplikace podporuje dvě role: **Prodavač** (evidence tržeb, docházky, absencí)
a **Vedoucí** (reporty, KPI, správa dat).

**Verze:** Enterprise v5.2
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
│   ├── admin/          # Komponenty pro Vedoucí
│   │   ├── kpi-cards.tsx        # 4 KPI karty (tržby, hotovost, absence, svozy)
│   │   ├── attendance-table.tsx # Tabulka docházky
│   │   ├── sales-table.tsx      # Tabulka tržeb
│   │   ├── last-pickups.tsx     # Panel posledních svozů
│   │   └── absence-requests.tsx # Panel žádostí o volno
│   │
│   ├── modals/
│   │   ├── sales-modal.tsx      # Formulář denních tržeb
│   │   ├── collect-modal.tsx    # Formulář odevzdání hotovosti
│   │   └── absence-modal.tsx    # Formulář nahlášení absence
│   │
│   ├── ui/             # Základní UI komponenty
│   │   ├── button.tsx, dialog.tsx, input.tsx, select.tsx
│   │   ├── checkbox.tsx, table.tsx, card.tsx
│   │   └── currency-input.tsx   # Custom input pro Kč
│   │
│   ├── views/
│   │   ├── prodavac-view.tsx    # Hlavní view prodavače
│   │   └── vedouci-view.tsx     # Dashboard vedoucího
│   │
│   ├── header.tsx               # Hlavička s logo, role, docházka, hodiny
│   ├── role-switcher.tsx        # Přepínač Prodavač/Vedoucí
│   ├── attendance-module.tsx    # Modul docházky (příchod/odchod)
│   ├── live-clock.tsx           # Živé hodiny
│   └── cash-monitor.tsx         # Banner s hotovostí k odevzdání
│
├── stores/             # Zustand state management
│   ├── role-store.ts
│   ├── attendance-store.ts
│   ├── sales-store.ts
│   ├── absence-store.ts
│   ├── collect-store.ts
│   ├── ui-store.ts
│   └── vedouci-store.ts
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

### Prodavač

- **Docházka**: Příchod/Odchod, volba pracoviště, potvrzení kasy
- **Tržby**: Zadání hotovosti, karet, partnera + příjmy/výdaje
- **Odvody**: Odevzdání hotovosti řidiči (jméno, číslo vaku)
- **Absence**: Dovolená, Nemoc, Lékař, Neplacené volno
- **Úkoly**: (TODO - placeholder)

### Vedoucí

- **Main view**: Navigace na Tržba a Docházka, Práva, Prodejny
- **Reports**:
  - Filtry (prodejna, měsíc, rok)
  - KPI karty (měsíční tržba, hotovost v trezorech, čekající absence, svozový status)
  - Tabulka docházky (datum, prodejna, zaměstnanec, příchod, odchod, absence, hodiny)
  - Tabulka tržeb (datum, prodavač, hotovost, karty, partner, pohyby, odvod)
  - Poslední svozy, Žádosti o volno

---

## Zustand Stores

### useRoleStore

```typescript
State: role: 'prodavac' | 'vedouci'
Actions: switchRole(), isProdavac(), isVedouci()
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

### useCollectStore

```typescript
State: driverName
Actions: setDriverName(), resetForm()
```

### useUIStore

```typescript
State: salesModalOpen, collectModalOpen, absenceModalOpen,
       subView, storeFilter, monthFilter, yearFilter
Actions: open/close/set modály, setSubView(), setFilters(), resetFilters()
```

### useVedouciStore

```typescript
State: subView, storeFilter, monthFilter, yearFilter
Actions: navigation (goToMain, goToReports), filtry,
         getFilteredData(), getKpiData(), getVisibleStores()
```

---

## Datové typy

```typescript
// Základní typy
type Role = 'prodavac' | 'vedouci'
type WorkplaceType = 'praha 1' | 'brno' | 'ostrava' | 'sklad'
type AbsenceType = 'Dovolená' | 'Nemoc / Neschopenka' | 'Lékař' | 'Neplacené volno'

// Hlavní datová struktura
interface AttendanceRecord {
  date: string           // "27. 01. 2024"
  store: string          // Prodejna
  user: string           // Zaměstnanec
  in: string             // Příchod (HH:MM)
  out: string            // Odchod (HH:MM)
  abs: string            // Absence nebo "-"
  hrs: string            // Odpracované hodiny
  absNote: string        // Poznámka k absenci
  cash: number           // Hotovost
  card: number           // Karty
  partner: number        // Partner T-L
  flows: string          // Pohyby (+/-)
  saleNote: string       // Poznámka k tržbě
  collected: string | false  // Kdo sbíral
}

// Formuláře
interface ExtraRow { id: string, amount: number, note: string }
interface SalesFormData { cash, card, partner, incomes[], expenses[] }
interface AbsenceFormData { type, dateFrom, dateTo, timeFrom?, timeTo?, note }
interface CollectionFormData { driverName, amount, period }
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
- [ ] Tlačítka "Práva" a "Prodejny" ve Vedoucí view - disabled
- [ ] Backend integrace - aktuálně mock data
- [ ] Export XLS - připravené tlačítko
