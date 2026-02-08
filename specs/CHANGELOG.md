# SYSTEM.PRO - Specification Changelog

Všechny změny ve specifikacích jsou zaznamenány v tomto souboru.

## [1.2.0] - 2026-02-08

### Přidáno

#### Nový modul
- `/specs/modules/email.spec.yaml` - E-mailový klient (IMAP/SMTP)

#### Popis
Modul E-mail poskytuje plnohodnotný e-mailový klient s IMAP/SMTP integrací.
Obsahuje:
- Dashboard kartu s počtem nepřečtených zpráv
- Full-page tří-panelové zobrazení (sidebar, seznam, detail)
- Čtení e-mailů s HTML sanitizací (DOMPurify)
- Odesílání (odpověď, přeposlat, nový) s přílohami
- Inkrementální IMAP synchronizaci
- E-mailová pravidla pro automatické třídění
- Admin nastavení: správa účtů, přístupů, sync log
- AES-256-GCM šifrování hesel
- On-demand stahování příloh z IMAP

#### Databáze
- 6 nových tabulek: `emailove_ucty`, `emailovy_pristup`, `emailove_slozky`,
  `emailove_zpravy`, `emailova_pravidla`, `emailovy_log`
- Všechny s RLS enabled

#### API Routes
- `POST /api/email/sync` - IMAP synchronizace
- `POST /api/email/send` - SMTP odesílání
- `POST /api/email/test-connection` - Test IMAP/SMTP
- `GET /api/email/attachment` - Download přílohy z IMAP
- `POST|PUT /api/email/accounts` - CRUD e-mailových účtů

### Změněno
- Header: přidáno zavírání email view při kliknutí na logo
- AdminView: přidána podpora pro email full view
- RoleView: přidán prop `showEmailFullView`
- Všechny role views: přidán `showEmailFullView`
- AdminSettingsView: přidán tab "E-mail"
- admin-store: rozšířen SettingsTab o 'email'
- lib/supabase/init.ts: přidán fetchEmailData do Phase 3

---

## [1.1.0] - 2026-01-31

### Přidáno

#### Nový modul
- `/specs/modules/manual.spec.yaml` - Kontextová nápověda pro zaměstnance

#### Popis
Modul Nápověda (Manual) poskytuje kontextovou nápovědu přizpůsobenou roli uživatele.
Každá role vidí pouze návody k modulům, které má přiřazené. Obsahuje:
- Úvod pro roli s popisem typického pracovního dne
- Důležité zásady a kontakt na nadřízeného
- Rozbalovací sekce s návody k jednotlivým modulům
- Vyhledávání v obsahu nápovědy

### Změněno
- Přidána ikona HelpCircle do hlavičky aplikace (dostupná pro všechny role)

---

## [1.0.0] - 2026-01-31

### Přidáno

#### Struktura
- `/specs/MASTER-SPEC.md` - Hlavní přehled systému
- `/specs/TEST-RUNNER.md` - Instrukce pro testování
- `/specs/CHANGELOG.md` - Historie změn
- `/specs/shared/roles.yaml` - Definice rolí a hierarchie
- `/specs/shared/notifications.yaml` - Badge/notifikační logika
- `/specs/shared/ui-patterns.yaml` - Sdílené UI vzory
- `/testy.md` - Čitelný přehled testů

#### Moduly s notifikacemi
- `/specs/modules/tasks.spec.yaml` - Úkoly s workflow a delegací
- `/specs/modules/chat.spec.yaml` - Skupinové konverzace
- `/specs/modules/absence-report.spec.yaml` - Hlášení absence
- `/specs/modules/absence-approval.spec.yaml` - Schvalování absencí

#### Finance moduly
- `/specs/modules/sales.spec.yaml` - Evidence tržeb
- `/specs/modules/collect.spec.yaml` - Odvody hotovosti
- `/specs/modules/cash-info.spec.yaml` - Stav pokladny

#### Docházka moduly
- `/specs/modules/attendance.spec.yaml` - Příchod/odchod
- `/specs/modules/shifts.spec.yaml` - Plánování směn
- `/specs/modules/presence.spec.yaml` - Přehled přítomnosti

#### Dashboard moduly
- `/specs/modules/kpi-dashboard.spec.yaml` - KPI přehled
- `/specs/modules/reports.spec.yaml` - Reporty tržeb a docházky

### Celkem
- 13 modulových specifikací
- 3 sdílené specifikace
- 55+ testovacích scénářů
- 40+ edge cases

---

## Formát záznamu

```markdown
## [verze] - YYYY-MM-DD

### Přidáno
- Nové funkce a specifikace

### Změněno
- Změny v existujících specifikacích

### Opraveno
- Opravy chyb ve specifikacích

### Odstraněno
- Odstraněné funkce
```

---

## Budoucí verze

### Plánované změny

- [ ] Integrace s backendem (API specifikace)
- [ ] E2E testy podle scénářů
- [ ] Performance benchmarky
- [ ] Accessibility audit specifikace
