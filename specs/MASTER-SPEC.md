# SYSTEM.PRO - Master Specification

> Living documentation systému SYSTEM.PRO

## Přehled systému

SYSTEM.PRO je modulární aplikace pro řízení maloobchodních operací. Systém poskytuje:
- Evidenci tržeb a hotovosti
- Správu docházky a směn
- Workflow pro schvalování absencí
- Systém úkolů s delegací
- Skupinový chat
- KPI dashboard a reporty

## Architektura

### Tech Stack
- **Frontend**: Next.js 16, React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **State**: Zustand
- **Data**: Supabase (PostgreSQL), Realtime subscriptions

### Struktura modulů

```
/modules/              # React komponenty modulů
/src/features/         # Feature-based architektura
  /{feature}/
    {feature}-store.ts # Zustand store
    {feature}-helpers.ts
/config/
  default-modules.ts   # Konfigurace modulů a oprávnění
```

## Role

| ID | Název | Typ | Popis |
|----|-------|-----|-------|
| role-1 | Prodavač | prodavac | Základní role pro obsluhu prodejen |
| role-2 | Administrátor | administrator | Správa systému a reporty |
| role-3 | Skladník | skladnik | Práce ve skladu |
| role-4 | Vedoucí skladu | vedouci-sklad | Řízení skladu, schvalování |
| role-5 | Obsluha e-shopu | obsluha-eshop | Správa online objednávek |
| role-6 | Obchodník | obchodnik | Obchodní činnost |
| role-7 | Vedoucí velkoobchodu | vedouci-velkoobchod | Řízení velkoobchodu |
| role-8 | Majitel | majitel | Plný přístup ke všem funkcím |

## Hierarchie schvalování

```
Majitel (role-8)
├── Administrátor (role-2)
│   ├── Vedoucí skladu (role-4)
│   │   ├── Skladník (role-3)
│   │   └── Obsluha e-shopu (role-5)
│   └── Vedoucí velkoobchodu (role-7)
│       ├── Prodavač (role-1)
│       └── Obchodník (role-6)
```

## Moduly

| ID | Název | Komponenta | Store | Badge |
|----|-------|------------|-------|-------|
| cash-info | Stav pokladny | CashInfoModule | useSalesStore | - |
| sales | Tržby | SalesModule | useSalesStore | - |
| collect | Odvody | CollectModule | useCollectStore | - |
| absence-report | Absence | AbsenceReportModule | useAbsenceStore | Nepřečtené zpracované |
| absence-approval | Schvalování | AbsenceApprovalModule | useAbsenceStore | Pending žádosti |
| tasks | Úkoly | TasksModule | useTasksStore | Nevyřešené úkoly |
| kpi-dashboard | KPI Dashboard | KpiDashboardModule | - | - |
| reports | Tržba a Docházka | ReportsModule | - | - |
| attendance | Docházka | HeaderAttendance | useAttendanceStore | - |
| shifts | Směny | ShiftsModule | useShiftsStore | - |
| presence | Přítomnost | PresenceModule | usePresenceStore | - |
| chat | Chat | ChatModule | useChatStore | Nepřečtené zprávy |

## Přístupová práva

### Přehled přístupu k modulům

| Modul | role-1 | role-2 | role-3 | role-4 | role-5 | role-6 | role-7 | role-8 |
|-------|--------|--------|--------|--------|--------|--------|--------|--------|
| cash-info | X | - | - | - | - | - | - | - |
| sales | X | - | - | - | - | - | - | - |
| collect | X | - | - | - | - | - | - | - |
| absence-report | X | - | X | X | X | X | X | - |
| absence-approval | - | X | - | X | - | - | X | X |
| tasks | X | X | X | X | X | X | X | X |
| kpi-dashboard | - | X | - | - | - | - | - | X |
| reports | - | X | - | - | - | - | - | - |
| attendance | X | - | X | X | X | X | X | - |
| shifts | X | - | X | - | X | X | - | - |
| presence | - | X | - | X | - | - | X | X |
| chat | X | X | X | X | X | X | X | X |

## Notifikační systém

### Badge logika

| Modul | Badge podmínka | Zdroj dat |
|-------|----------------|-----------|
| absence-report | Počet nepřečtených zpracovaných žádostí | `getUnseenProcessedRequestsCount(userId)` |
| absence-approval | Počet pending žádostí pro schválení | `getPendingRequestsForApproval(approverId, roleType).length` |
| tasks | Počet nevyřešených úkolů | `getUnresolvedTasksCount(userId)` |
| chat | Počet nepřečtených zpráv | `getUnreadCountForUser(userId)` |

## Soubory specifikací

### Moduly
- `/specs/modules/cash-info.spec.yaml`
- `/specs/modules/sales.spec.yaml`
- `/specs/modules/collect.spec.yaml`
- `/specs/modules/absence-report.spec.yaml`
- `/specs/modules/absence-approval.spec.yaml`
- `/specs/modules/tasks.spec.yaml`
- `/specs/modules/kpi-dashboard.spec.yaml`
- `/specs/modules/reports.spec.yaml`
- `/specs/modules/attendance.spec.yaml`
- `/specs/modules/shifts.spec.yaml`
- `/specs/modules/presence.spec.yaml`
- `/specs/modules/chat.spec.yaml`

### Sdílené
- `/specs/shared/roles.yaml`
- `/specs/shared/notifications.yaml`
- `/specs/shared/ui-patterns.yaml`

### Dokumentace
- `/specs/TEST-RUNNER.md`
- `/specs/CHANGELOG.md`
- `/testy.md`

## Verze

- **Aktuální verze**: 1.0.0
- **Datum**: 2026-01-31
- **Autor**: SYSTEM.PRO Team
