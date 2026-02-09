# SYSTEM.PRO - Specification Changelog

Všechny změny ve specifikacích jsou zaznamenány v tomto souboru.

## [1.5.0] - 2026-02-09

### Opraveno

#### Produkční audit — kritické opravy
- **K1**: Tlačítko "Schválit" v admin dashboard nyní propojeno s `useAbsenceStore().approveAbsence()` — zobrazuje skutečné pending žádosti z DB
- **K2**: Tlačítko "Export .XLS" nyní generuje Excel soubor s docházkovými daty (exceljs)
- **K3**: Odhlášení nyní volá `cleanupSubscriptions()` — Realtime kanály a auto-sync intervaly se správně ukončí
- **K4+K5**: Skryty stub komponenty LastPickups (hardcoded text) a KPI "Svozový status" (statická hodnota)

#### Robustnost
- **S1**: TLS `rejectUnauthorized` v 7 email souborech řízeno env proměnnou `EMAIL_REJECT_UNAUTHORIZED`
- **S2**: Toast notifikace (sonner) přidány ke klíčovým chybám v chat-store, tasks-store, email-store, roles-store, stores-store, modules-store, users-store
- **S3**: CRUD metody v roles-store, stores-store refaktorovány na návratový typ `{ success, error? }`
- **S4**: IMAP silent failures (`.catch(() => {})`) nahrazeny `console.warn` s kontextem
- **S5**: Auth rehydrace z localStorage nyní kontroluje `freshUser.active` — deaktivovaný uživatel je odhlášen

### Přidáno
- **N5**: React ErrorBoundary kolem hlavní komponenty — při crashe se zobrazí tlačítko "Obnovit stránku"
- `lib/export-attendance.ts` — utilita pro export docházky do XLSX
- `components/error-boundary.tsx` — ErrorBoundary komponenta

---

## [1.4.1] - 2026-02-08

### Opraveno

#### Reconnect-refresh pro Realtime subscriptions
- Všechny tři Realtime kanály (chat, email, tasks) nyní automaticky re-fetchují data po reconnectu
- Řeší ztrátu zpráv při dočasném výpadku WebSocket spojení (CHANNEL_ERROR → SUBSCRIBED)
- `chat-store.ts`: merge nových zpráv + refresh read statusů po reconnectu
- `email-store.ts`: refresh zpráv a složek po reconnectu
- `tasks-store.ts`: re-fetch úkolů po reconnectu

---

## [1.4.0] - 2026-02-08

### Přidáno

#### Realtime synchronizace pro Úkoly
- Tabulky `ukoly` a `komentare_ukolu` přidány do `supabase_realtime` publikace
- `tasks-store.ts`: nové metody `subscribeRealtime()` a `unsubscribeRealtime()`
- Poslouchá INSERT/UPDATE/DELETE na `ukoly` a INSERT na `komentare_ukolu`
- `lib/supabase/init.ts`: registrace tasks Realtime subscriptions a cleanup

#### Vylepšení Realtime pro Email a Chat
- `emailove_zpravy` a `emailove_slozky`: REPLICA IDENTITY FULL pro spolehlivé filtrované subscriptions
- `chat-store.ts`: přidán UPDATE listener pro `chat_zpravy` (editace zpráv)
- `chat-store.ts` a `email-store.ts`: status logging callbacky na `.subscribe()`

### Změněno
- `/specs/modules/tasks.spec.yaml`: přidána feature `task_realtime`; scénáře TASK-006 až TASK-008
- `/testy.md`: aktualizována sekce Úkoly o realtime testy

---

## [1.3.0] - 2026-02-08

### Přidáno

#### Obousměrná IMAP synchronizace
- `lib/email/imap-client.ts` - Sdílená IMAP connection utility (`withImapConnection`)
- `POST /api/email/imap-action` - API endpoint pro IMAP operace (move, setRead, setUnread, setFlagged, unsetFlagged, delete)
- IMAP APPEND po SMTP send - odeslaný e-mail se uloží do Sent složky na serveru
- Automatická IMAP synchronizace každých 60 sekund (při aktivní záložce)

#### Supabase Realtime
- Email: Realtime subscription na `emailove_zpravy` a `emailove_slozky`
- Chat: Realtime subscription na `chat_zpravy` a `chat_stav_precteni`
- Migrace: `ALTER PUBLICATION supabase_realtime ADD TABLE` pro 4 tabulky
- Změny jednoho uživatele se okamžitě propagují všem připojeným klientům

### Změněno
- `email-store.ts`: moveToFolder, markAsRead, markAsUnread, toggleFlagged, deleteMessage nyní volají IMAP server
- `email-store.ts`: přidány metody subscribeRealtime, unsubscribeRealtime, startAutoSync, stopAutoSync
- `chat-store.ts`: přidány metody subscribeRealtime, unsubscribeRealtime
- `lib/supabase/init.ts`: po inicializaci spustí Realtime subscriptions a auto-sync, cleanup při unmount
- `app/api/email/send/route.ts`: IMAP APPEND do Sent složky po odeslání
- `/specs/modules/email.spec.yaml`: přidány features email-imap-writeback, email-realtime; scénáře SC-EMAIL-08 až SC-EMAIL-12
- `/specs/modules/chat.spec.yaml`: přidána feature realtime; scénář CHAT-006; aktualizován CHAT-E004

---

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
