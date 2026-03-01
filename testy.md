# SYSTEM.PRO - Přehled testovacích scénářů

> Tento dokument obsahuje čitelný přehled všech testovacích scénářů pro systém SYSTEM.PRO.
> Detailní specifikace najdete v `/specs/modules/*.spec.yaml`.

---

## Obsah

1. [Úkoly (Tasks)](#1-úkoly-tasks)
2. [Chat](#2-chat)
3. [Hlášení absence](#3-hlášení-absence)
4. [Schvalování absencí](#4-schvalování-absencí)
5. [Tržby (Sales)](#5-tržby-sales)
6. [Odvody (Collect)](#6-odvody-collect)
7. [Stav pokladny](#7-stav-pokladny)
8. [Docházka (Attendance)](#8-docházka-attendance)
9. [Směny (Shifts)](#9-směny-shifts)
10. [Přítomnost (Presence)](#10-přítomnost-presence)
11. [KPI Dashboard](#11-kpi-dashboard)
12. [Reporty](#12-reporty)
13. [Nápověda (Manual)](#13-nápověda-manual)
14. [E-mail](#14-e-mail)
15. [Produkční audit](#15-produkční-audit-v150)
16. [DB Persistence audit](#16-db-persistence-audit-v160)
17. [Produkční hardening audit](#17-produkční-hardening-audit-v180)
18. [Centralizace synchronizace — Cron Jobs](#18-centralizace-synchronizace--cron-jobs-v200--v210)
19. [Motivace prodejny](#19-motivace-prodejny)
20. [Převodky (picking + EAN)](#20-převodky-picking--ean)
21. [Produkty v motivaci](#21-produkty-v-motivaci)

---

## Přístupové role

| Role | ID | Přístup k modulům |
|------|-----|-------------------|
| Prodavač | role-1 | cash-info, sales, collect, absence-report, tasks, attendance, shifts, chat, email, motivation-products |
| Administrátor | role-2 | absence-approval, tasks, kpi-dashboard, reports, presence, chat, email, motivation |
| Skladník | role-3 | absence-report, tasks, attendance, shifts, chat, email |
| Vedoucí skladu | role-4 | absence-report, absence-approval, tasks, attendance, presence, chat, email |
| Obsluha e-shopu | role-5 | absence-report, tasks, attendance, shifts, chat, email |
| Obchodník | role-6 | absence-report, tasks, attendance, shifts, chat, email |
| Vedoucí velkoobchodu | role-7 | absence-report, absence-approval, tasks, attendance, presence, chat, email |
| Majitel | role-8 | absence-approval, tasks, kpi-dashboard, presence, chat, email, motivation |

---

## 1. Úkoly (Tasks)

**Modul:** TasksModule
**Store:** useTasksStore
**Badge:** Počet nevyřešených úkolů

### Testovací scénáře

#### TASK-001: Vytvoření a dokončení jednoduchého úkolu

**Přístup:** Vedoucí skladu (role-4), Skladník (role-3)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Přihlásit se jako Vedoucí skladu | Dashboard s modulem Úkoly |
| 2 | Kliknout na modul Úkoly | Otevře se seznam úkolů |
| 3 | Kliknout "Nový úkol" | Otevře se formulář |
| 4 | Vyplnit: Název, Popis, Priorita Vysoká, Termín zítra | Formulář je validní |
| 5 | Vybrat příjemce: Skladník | Příjemce vybrán |
| 6 | Kliknout Vytvořit | Úkol vytvořen, formulář zavřen |
| 7 | Přepnout na účet Skladníka | Přihlášen jako Skladník |
| 8 | Zkontrolovat badge na modulu Úkoly | Badge ukazuje 1 |
| 9 | Otevřít modul Úkoly | Nový úkol v "Moje úkoly" |
| 10 | Kliknout "Začít práci" | Stav: Rozpracovaný |
| 11 | Kliknout "Odeslat ke schválení" | Stav: Čeká na schválení |
| 12 | Přepnout zpět na Vedoucího | Přihlášen jako Vedoucí |
| 13 | Zkontrolovat badge | Badge ukazuje úkol ke schválení |
| 14 | Kliknout "Schválit" | Stav: Schváleno |

#### TASK-002: Delegace úkolu

**Přístup:** Prodavač (role-1)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Přihlásit se jako Prodavač s úkolem | Vidím úkol v "Moje úkoly" |
| 2 | Otevřít detail úkolu | Detail zobrazen |
| 3 | Kliknout "Delegovat" | Otevře se výběr osoby |
| 4 | Vybrat jiného Prodavače | Osoba vybrána |
| 5 | Potvrdit delegaci | Úkol delegován |
| 6 | Přepnout na delegovaného | Přihlášen jako delegovaný |
| 7 | Vidět delegovaný úkol | Úkol v "Moje úkoly" |
| 8 | Zpracovat a "Odeslat delegujícímu" | Stav: Čeká na kontrolu |
| 9 | Přepnout zpět na delegátora | Vidím úkol ke kontrole |
| 10 | Schválit práci delegovaného | Úkol jde ke schválení autorovi |

#### TASK-003: Vrácení úkolu s důvodem

**Přístup:** Autor úkolu

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Najít úkol ve stavu "Čeká na schválení" | Úkol nalezen |
| 2 | Otevřít detail úkolu | Detail zobrazen |
| 3 | Kliknout "Vrátit" | Otevře se dialog |
| 4 | Zadat důvod: "Chybí příloha" | Důvod zadán |
| 5 | Potvrdit vrácení | Úkol vrácen |
| 6 | Přepnout na assignee | Přihlášen jako assignee |
| 7 | Zkontrolovat stav | Stav: Vráceno |
| 8 | Vidět důvod v komentářích | Důvod zobrazen |

#### TASK-010: Pozastavení a obnovení pravidelného úkolu

**Přístup:** Uživatel s opakujícím se úkolem

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít modul Úkoly | Seznam úkolů zobrazen |
| 2 | Přepnout na záložku "Pravidelné úkoly" | Seznam opakujících se úkolů |
| 3 | U aktivního úkolu kliknout "Pozastavit" | Tlačítko se změní na zelené "Obnovit" |
| 4 | Schválit instanci pozastaveného úkolu | Nová instance se NEVYTVOŘÍ |
| 5 | Kliknout "Obnovit" u pozastaveného úkolu | Tlačítko se změní na oranžové "Pozastavit" |
| 6 | Schválit další instanci | Nová instance se vytvoří |

### Hraniční případy

| ID | Situace | Očekávané chování |
|----|---------|-------------------|
| TASK-E001 | Samopřiřazení úkolu | Badge počítá úkol pouze jednou |
| TASK-E002 | Delegace na sebe | Systém by měl zakázat |
| TASK-E003 | Úkol bez assignee | Zobrazí se ve "Všechny" |
| TASK-E004 | Dvojí delegace | Chyba: "Úkol je již delegován" |

#### TASK-009: Klikatelné URL v popisu a komentáři úkolu

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít detail úkolu s URL v popisu | URL v popisu je modrý podtržený odkaz |
| 2 | Kliknout na odkaz v popisu | Otevře se nový tab s URL |
| 3 | Přidat komentář s URL (např. "Viz https://example.com/result") | Komentář zobrazen |
| 4 | Zkontrolovat URL v komentáři | URL je modrý podtržený odkaz |
| 5 | Kliknout na odkaz v komentáři | Otevře se nový tab s URL |

### Realtime synchronizace

#### TASK-006: Realtime — nový úkol

**Přístup:** Dva uživatelé ve dvou oknech prohlížeče

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít dvě okna se dvěma různými uživateli | Oba přihlášeni |
| 2 | Uživatel A: vytvořit úkol přiřazený uživateli B | Úkol vytvořen |
| 3 | Uživatel B: zkontrolovat seznam úkolů | Nový úkol se zobrazí bez reloadu |
| 4 | Zkontrolovat konzoli | `[tasks-realtime] SUBSCRIBED` log |

#### TASK-007: Realtime — změna stavu

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Uživatel B: kliknout "Začít práci" na úkolu | Stav se změní |
| 2 | Uživatel A: zkontrolovat stav úkolu | Stav aktualizován okamžitě |

#### TASK-008: Realtime — nový komentář

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Uživatel A: přidat komentář k úkolu | Komentář odeslán |
| 2 | Uživatel B: zkontrolovat detail úkolu | Komentář se zobrazí bez reloadu |

---

## 2. Chat

**Modul:** ChatModule
**Store:** useChatStore
**Badge:** Počet nepřečtených zpráv

### Testovací scénáře

#### CHAT-001: Základní konverzace

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít modul Chat | Seznam skupin |
| 2 | Kliknout na skupinu "Všichni" | Otevře se konverzace |
| 3 | Napsat zprávu "Ahoj všem" | Text v inputu |
| 4 | Kliknout Odeslat | Zpráva zobrazena |
| 5 | Přepnout na jiného uživatele | Přihlášen |
| 6 | Zkontrolovat badge | Badge ukazuje 1 |
| 7 | Otevřít skupinu | Nepřečtená zpráva viditelná |

#### CHAT-002: Reakce na zprávu

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Najít zprávu od jiného uživatele | Zpráva nalezena |
| 2 | Najet myší na zprávu | Menu reakcí viditelné |
| 3 | Kliknout na "thumbsUp" | Reakce přidána |
| 4 | Kliknout znovu na "thumbsUp" | Reakce odebrána |

#### CHAT-003: Správa skupin (admin)

**Přístup:** Administrátor (role-2)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít nastavení modulu Chat | Nastavení skupin |
| 2 | Kliknout "Nová skupina" | Formulář otevřen |
| 3 | Zadat název "Test skupina" | Název vyplněn |
| 4 | Vybrat členy | Členové vybráni |
| 5 | Kliknout Uložit | Skupina vytvořena |
| 6 | Editovat existující skupinu | Formulář s daty |
| 7 | Změnit název a členy | Změny uloženy |
| 8 | Smazat skupinu | Skupina smazána |

#### CHAT-004: Fulltext vyhledávání přes DB

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít skupinu | Konverzace zobrazena |
| 2 | Do pole "Hledat ve zprávách..." zadat text | Text v inputu, debounce 300ms |
| 3 | Počkat na výsledky | Overlay panel s výsledky pod headerem |
| 4 | Zkontrolovat výsledky | Jméno odesílatele, čas, preview textu |
| 5 | Kliknout na výsledek z jiné skupiny | Navigace do skupiny, scroll na zprávu |
| 6 | Kliknout X pro vymazání | Overlay zmizí |
| 7 | Hledat text starší než 50 zpráv | Nalezeno (hledá v celé DB, ne jen v načtených) |

#### CHAT-012: Paginace — infinite scroll

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít skupinu s 70+ zprávami | Posledních 50 zpráv se načte, scrollnuto na konec |
| 2 | Scrollnout rychle nahoru | Spinner nahoře, starší zprávy se načítají |
| 3 | Starší zprávy se načtou | Scroll pozice se zachová (nepřeskočí) |
| 4 | Otevřít skupinu s <50 zprávami | Všechny zprávy najednou, žádný spinner |
| 5 | Zkontrolovat sidebar | Zobrazuje souhrny (preview, čas, unread) bez načítání zpráv |

#### CHAT-013: Oddělovač nepřečtených zpráv

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Nechat jiného uživatele poslat zprávy | Zprávy odeslány |
| 2 | Otevřít skupinu s nepřečtenými | Červený oddělovač "Nové zprávy" viditelný |
| 3 | Zkontrolovat scroll pozici | Automaticky scrollnuto na oddělovač (instant) |
| 4 | Zkontrolovat oddělovač | Zobrazuje se jen před zprávami od jiných |
| 5 | Přepnout na jinou skupinu a zpět | Oddělovač zmizí (vše přečtené) |

#### CHAT-006: Realtime multi-klient

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít chat ve dvou prohlížečích | Oba připojeni přes Realtime |
| 2 | Uživatel A pošle zprávu | Zpráva se okamžitě objeví u B |
| 3 | Zkontrolovat badge u B | Badge se aktualizuje bez refreshe |

#### CHAT-007: Klikatelné URL v chatové zprávě

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít skupinu v chatu | Konverzace zobrazena |
| 2 | Napsat zprávu s URL (např. "Podívej https://example.com") | Text v inputu |
| 3 | Odeslat zprávu | Zpráva zobrazena |
| 4 | Zkontrolovat URL ve zprávě | URL je modrý podtržený odkaz (cizí) / bílý podtržený (vlastní) |
| 5 | Kliknout na odkaz | Otevře se nový tab s URL |

#### CHAT-008: Mazání vlastní zprávy

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít skupinu s vlastními zprávami | Konverzace zobrazena |
| 2 | Najet na vlastní zprávu | Zobrazí se ikona koše vedle reakcí |
| 3 | Najet na cizí zprávu | Ikona koše se NEzobrazí |
| 4 | Kliknout na ikonu koše u vlastní zprávy | Dialog "Opravdu chcete smazat?" |
| 5 | Potvrdit smazání | Zpráva zmizí |
| 6 | Zkontrolovat u druhého uživatele | Zpráva zmizí i tam (realtime) |

#### CHAT-009: Přímá zpráva (1:1)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít modul Chat | Zobrazí se seznam skupin s tlačítkem "Nová zpráva" |
| 2 | Kliknout "Nová zpráva" | Modal se seznamem zaměstnanců |
| 3 | Vyhledat zaměstnance | Filtrování seznamu |
| 4 | Kliknout na zaměstnance | Otevře se nová DM konverzace |
| 5 | Odeslat zprávu | Zpráva se zobrazí |
| 6 | Zkontrolovat header | Jméno druhé osoby + "Přímá zpráva" |
| 7 | Zkontrolovat řazení v seznamu | Admin skupiny nahoře, DM abecedně pod nimi |
| 8 | Znovu kliknout "Nová zpráva" → stejný zaměstnanec | Otevře existující DM |
| 9 | Zkontrolovat admin nastavení | DM se nezobrazují v tabulce skupin |

#### CHAT-010: Emoji picker

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít konverzaci | Input bar s ikonou smajlíka |
| 2 | Kliknout na ikonu smajlíka | Emoji picker se otevře nad inputem |
| 3 | Vybrat emoji | Emoji vložen do textu na pozici kurzoru |
| 4 | Kliknout mimo picker | Picker se zavře |
| 5 | Odeslat zprávu s emoji | Zpráva zobrazena s emoji |

#### CHAT-011: Stav doručení v DM (fajfky)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Přihlásit se jako Uživatel A | Přihlášen |
| 2 | Otevřít DM s Uživatelem B | Konverzace zobrazena |
| 3 | Odeslat zprávu "Test doručení" | Zpráva zobrazena |
| 4 | Zkontrolovat ikonu vedle času | Jedna šedá fajfka (✓) |
| 5 | Přihlásit se jako Uživatel B | Přihlášen |
| 6 | Otevřít DM s Uživatelem A | Konverzace zobrazena, zprávy přečteny |
| 7 | Přihlásit se zpět jako Uživatel A | Přihlášen |
| 8 | Zkontrolovat ikonu vedle času | Dvě modré fajfky (✓✓) |
| 9 | Otevřít skupinový chat | Konverzace zobrazena |
| 10 | Zkontrolovat vlastní zprávy ve skupině | Žádné fajfky se nezobrazují |

### Hraniční případy

| ID | Situace | Očekávané chování |
|----|---------|-------------------|
| CHAT-E001 | Prázdná skupina | Text "Zatím žádné zprávy" |
| CHAT-E002 | Odebrání ze skupiny | Skupina zmizí ze seznamu |
| CHAT-E003 | Smazání skupiny s nepřečtenými | Badge se přepočítá |
| CHAT-E005 | DM se sebou samým | Aktuální uživatel se nezobrazuje v modalu |
| CHAT-E006 | Duplicitní DM | Otevře existující DM místo vytvoření nové |
| CHAT-E007 | Admin nastavení nevidí DM | Pouze skupiny typu "group" v tabulce |
| CHAT-E008 | Skupina s <50 zprávami | Všechny zprávy načteny, hasMore=false, žádný spinner |
| CHAT-E009 | Přepnutí skupiny při vyhledávání | Výsledky zůstanou, klik naviguje správně |

---

## 3. Hlášení absence

**Modul:** AbsenceReportModule
**Store:** useAbsenceStore
**Badge:** Počet nepřečtených zpracovaných žádostí

### Testovací scénáře

#### ABS-R-001: Podání žádosti o dovolenou

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít modul Absence | Formulář žádosti |
| 2 | Vybrat typ "Dovolená" | Typ vybrán |
| 3 | Zadat datum od: 2026-02-10 | Datum vyplněno |
| 4 | Zadat datum do: 2026-02-14 | Datum vyplněno |
| 5 | Zadat poznámku: "Rodinná dovolená" | Poznámka vyplněna |
| 6 | Kliknout "Odeslat žádost" | Žádost odeslána |
| 7 | Zkontrolovat přehled | Žádost se stavem "Čeká na schválení" |

#### ABS-R-002: Podání žádosti k lékaři

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Vybrat typ "Lékař" | Objeví se pole pro čas |
| 2 | Zadat datum: 2026-02-05 | Datum vyplněno |
| 3 | Zadat čas od: 09:00 | Čas vyplněn |
| 4 | Zadat čas do: 11:30 | Čas vyplněn |
| 5 | Zadat poznámku | Poznámka vyplněna |
| 6 | Odeslat žádost | Žádost s časem odeslána |

#### ABS-R-003: Notifikace o zpracované žádosti

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Počkat na schválení žádosti | Žádost schválena |
| 2 | Přihlásit se jako žadatel | Přihlášen |
| 3 | Zkontrolovat badge | Badge ukazuje 1 |
| 4 | Otevřít modul Absence | Schválená žádost viditelná |
| 5 | Badge zmizí | seenByUser = true |

#### ABS-R-006: Zrušení pending žádosti

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Vytvořit žádost o absenci | Žádost ve stavu pending |
| 2 | V přehledu najít pending žádost | Ikona koše viditelná |
| 3 | Kliknout na ikonu koše | Potvrzovací dialog |
| 4 | Kliknout "Ano, zrušit" | Žádost smazána, toast "Žádost byla zrušena" |
| 5 | Zkontrolovat přehled | Žádost zmizela |
| 6 | Najít schválenou žádost | Ikona koše není viditelná |

### Hraniční případy

| ID | Situace | Očekávané chování |
|----|---------|-------------------|
| ABS-R-E001 | Jednodenní absence | Datum od = datum do funguje |
| ABS-R-E002 | Prázdná poznámka | Odeslání povoleno |
| ABS-R-E003 | Překrývající se žádosti | Chyba: "Na vybrané dny již existuje žádost o absenci!" |
| ABS-R-E005 | Zrušení schválené žádosti | Ikona koše se nezobrazuje, nelze zrušit |

---

## 4. Schvalování absencí

**Modul:** AbsenceApprovalModule
**Store:** useAbsenceStore
**Badge:** Počet pending žádostí

### Testovací scénáře

#### ABS-A-001: Schválení žádosti o dovolenou

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Přihlásit se jako Vedoucí velkoobchodu | Přihlášen |
| 2 | Zkontrolovat badge | Badge ukazuje pending žádosti |
| 3 | Otevřít modul Schvalování | Seznam žádostí |
| 4 | Najít pending žádost | Žádost nalezena |
| 5 | Kliknout "Schválit" | Žádost schválena |
| 6 | Badge se sníží | Badge aktualizován |

#### ABS-A-002: Zamítnutí žádosti

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Najít pending žádost | Žádost nalezena |
| 2 | Kliknout "Zamítnout" | Dialog potvrzení |
| 3 | Potvrdit | Žádost zamítnuta |

#### ABS-A-003: Hierarchie schvalování

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Přihlásit se jako Prodavač | Prodavač nemá přístup |
| 2 | Přihlásit se jako Administrátor | Vidí žádosti Vedoucích |
| 3 | Přihlásit se jako Majitel | Vidí všechny žádosti |

### Hraniční případy

| ID | Situace | Očekávané chování |
|----|---------|-------------------|
| ABS-A-E001 | Dvojité schválení | Chyba: "Žádost již byla vyřízena" |
| ABS-A-E002 | Schválení bez oprávnění | Chyba: "Nemáte oprávnění" |

---

## 5. Tržby (Sales)

**Modul:** SalesModule
**Store:** useSalesStore
**Badge:** Žádný

### Testovací scénáře

#### SALES-001: Evidence základní tržby

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít modul Tržby | Formulář tržeb |
| 2 | Zadat hotovost: 5000 | Hodnota vyplněna |
| 3 | Zadat kartou: 3000 | Hodnota vyplněna |
| 4 | Zadat partner: 1000 | Hodnota vyplněna |
| 5 | Zkontrolovat celkem | Celkem: 9000 |
| 6 | Kliknout "Odeslat tržbu" | Formulář se vyčistí |
| 7 | Zkontrolovat cashToCollect | Zvýšeno o 5000 |

#### SALES-002: Tržba s mimořádným příjmem

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Zadat hotovost: 2000 | Hodnota vyplněna |
| 2 | Kliknout "Přidat příjem" | Nový řádek |
| 3 | Zadat částku: 500 | Částka vyplněna |
| 4 | Zadat poznámku: "Vratka" | Poznámka vyplněna |
| 5 | Zkontrolovat celkem | Celkem: 2500 |

#### SALES-004: Validace povinné poznámky

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Přidat příjem s částkou 500 | Řádek přidán |
| 2 | Nechat poznámku prázdnou | Poznámka prázdná |
| 3 | Kliknout Odeslat | Chyba: "Doplňte poznámky!" |
| 4 | Doplnit poznámku | Poznámka vyplněna |
| 5 | Odeslat znovu | Úspěch |

---

## 6. Odvody (Collect)

**Modul:** CollectModule
**Store:** useCollectStore
**Badge:** Žádný

### Testovací scénáře

#### COLL-001: Provedení odvodu

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít modul Odvody | Částka k odvodu viditelná |
| 2 | Vidět období odvodu | Období zobrazeno |
| 3 | Zadat jméno řidiče: "Jan Novák" | Jméno vyplněno |
| 4 | Kliknout "Předat hotovost" | Odvod proveden |
| 5 | Částka se vynuluje | cashToCollect = 0 |

#### COLL-002: Odvod bez jména řidiče

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Nechat jméno prázdné | Jméno prázdné |
| 2 | Kliknout "Předat hotovost" | Chyba: "Vyplňte jméno řidiče!" |

---

## 7. Stav pokladny

**Modul:** CashInfoModule
**Store:** useSalesStore
**Badge:** Žádný

### Testovací scénáře

#### CASH-001: Zobrazení stavu pokladny

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Vidět modul v horní části | Modul zobrazen |
| 2 | Zkontrolovat cashToCollect | Částka zobrazena |
| 3 | Zkontrolovat provozní základnu | Základna zobrazena |

#### CASH-004: Načtení kumulované hotovosti z DB při mountu

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Zapsat tržbu (hotovost 5000 Kč) | cashToCollect = 5000 |
| 2 | Refresh stránky (F5) | cashToCollect = 5000 (nenuluje se) |
| 3 | Zapsat další tržbu (3000 Kč) | cashToCollect = 8000 (kumuluje) |
| 4 | Přepnout prodejnu a zpět | Data se načtou znovu z DB |

---

## 8. Docházka (Attendance)

**Modul:** HeaderAttendance
**Store:** useAttendanceStore
**Badge:** Žádný

### Testovací scénáře

#### ATT-001: Příchod Prodavače na prodejnu

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Vidět tlačítko "Příchod" | Tlačítko viditelné |
| 2 | Vidět název prodejny | Prodejna zobrazena |
| 3 | Kliknout na příchod | Stav: V práci |
| 4 | Tlačítko se změní na "Odchod" | UI aktualizováno |

#### ATT-002: Odchod s potvrzením kasy

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Být v práci (isInWork=true) | Status: V práci |
| 2 | Kliknout "Odchod" | Dialog kasy |
| 3 | Kliknout bez potvrzení | Chyba: "Potvrďte stav kasy!" |
| 4 | Zaškrtnout potvrzení | Checkbox zaškrtnut |
| 5 | Kliknout "Odchod" znovu | Odchod proveden |

#### ATT-005: Admin editace záznamu docházky

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít reporty v admin dashboardu | Tabulky docházky a tržeb viditelné |
| 2 | Kliknout na řádek v tabulce docházky | Editační modal se otevře |
| 3 | Vidět datum, pracoviště, zaměstnanec (readonly) | Info zobrazeno, nelze editovat |
| 4 | Upravit čas odchodu | Hodiny se automaticky přepočítají |
| 5 | Kliknout Uložit | Záznam uložen, modal se zavře |
| 6 | Ověřit tabulku | Nové hodnoty v tabulce |

#### ATT-006: Admin editace tržby

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Kliknout na řádek v tabulce tržeb | Editační modal se otevře |
| 2 | Upravit hotovost a kartu | Nové hodnoty v inputech |
| 3 | Kliknout Uložit | Tržby aktualizovány v DB |
| 4 | Ověřit tabulku tržeb | Nové hodnoty zobrazeny |

---

## 9. Směny (Shifts)

**Modul:** ShiftsModule
**Store:** useShiftsStore
**Badge:** Žádný

### Testovací scénáře

#### SHIFT-001: Zobrazení vlastních směn

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít modul Směny | Kalendář aktuálního měsíce |
| 2 | Vidět zvýrazněné pracovní dny | Zelené pozadí, pracovní doba zobrazena |
| 3 | Zdroj pracovní doby | Vždy "Vlastní" |

#### SHIFT-003: Střídání lichý/sudý týden

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Zaměstnanec s alternating=true | Lichý ISO týden: dny dle oddWeek |
| 2 | Přejít na sudý ISO týden | Dny dle evenWeek rozvrhu |
| 3 | Badges "Lichý"/"Sudý" | Zobrazují se jen při alternating |

#### SHIFT-005: Zaměstnanec bez střídání (skladník)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Zaměstnanec s alternating=false | Směny dle oddWeek |
| 2 | Po-Pá 08:00-16:30, So+Ne volno | Správné dny zvýrazněny |
| 3 | Žádné badges lichý/sudý | Badges se nezobrazují |

#### SHIFT-006: Zaměstnanec bez pracovní doby

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Zaměstnanec bez workingHours | Zpráva "Pracovní doba není nastavena" |
| 2 | Žádný kalendář | Kalendář se nezobrazuje |

#### SHIFT-007: Kopírování pracovní doby z prodejny

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít formulář zaměstnance | Formulář s pracovní dobou |
| 2 | Kliknout "Kopírovat z prodejny" | Předvyplnění dle otevírací doby prodejny |
| 3 | Upravit dle potřeby | Admin může dále upravit |

#### SHIFT-008: Zaměstnanec se starým formátem pracovní doby v DB

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít Nastavení → Zaměstnanci | Seznam zaměstnanců |
| 2 | Kliknout na zaměstnance se starým formátem (plochý JSON bez `alternating`) | Formulář se otevře bez chyby |
| 3 | Zkontrolovat pracovní dobu | Správné hodnoty (Po–Pá, So+Ne) |
| 4 | Uložit bez změn | Uloží se v novém formátu s `alternating` + `oddWeek` |

---

## 10. Přítomnost (Presence)

**Modul:** PresenceModule
**Store:** usePresenceStore
**Badge:** Žádný

### Testovací scénáře

#### PRES-001: Vedoucí skladu vidí podřízené

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Přihlásit se jako Vedoucí skladu | Přihlášen |
| 2 | Vidět modul Přítomnost | Modul v sidebar |
| 3 | Vidět Skladníky a Obsluhu e-shopu | Filtrováno podle viewMappings |
| 4 | Zkontrolovat stavy | Zelená/červená/oranžová |

#### PRES-004: Omluvená absence

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Zaměstnanec má schválenou absenci | Absence existuje |
| 2 | Zkontrolovat přítomnost | Status: omluven |
| 3 | Vidět typ absence | Dovolená/Nemoc/Lékař |

---

## 11. KPI Dashboard

**Modul:** KpiDashboardModule
**Store:** Agregace více stores
**Badge:** Žádný

### Testovací scénáře

#### KPI-001: Zobrazení dashboardu

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Přihlásit se jako Majitel | Přihlášen |
| 2 | Vidět KPI Dashboard v horní části | Dashboard zobrazen |
| 3 | Zkontrolovat metriky | Tržby, úkoly, přítomnost |

---

## 12. Reporty

**Modul:** ReportsModule
**Store:** Agregace více stores
**Badge:** Žádný

### Testovací scénáře

#### REP-001: Zobrazení reportu

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Přihlásit se jako Administrátor | Přihlášen |
| 2 | Otevřít modul Tržba a Docházka | Report zobrazen |
| 3 | Vybrat filtr: Prodejna = Bohnice | Filtrovano |
| 4 | Vybrat měsíc: Leden | Filtrovano |
| 5 | Zkontrolovat data | Správné záznamy |

---

## 13. Nápověda (Manual)

**Modul:** ManualFullView
**Store:** useManualStore
**Badge:** Žádný

### Testovací scénáře

#### MANUAL-001: Zobrazení nápovědy pro prodavače

**Přístup:** Prodavač (role-1)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Přihlásit se jako Prodavač | Přihlášen |
| 2 | Kliknout na ikonu HelpCircle v hlavičce | Otevře se fullscreen nápověda |
| 3 | Vidět úvod pro roli Prodavač | Titul, úvod, workflow, zásady |
| 4 | Vidět 8 modulů v seznamu | cash-info, sales, collect, absence-report, tasks, attendance, shifts, chat |
| 5 | Kliknout na sekci "Stav pokladny" | Sekce se rozbalí |
| 6 | Vidět obsah sekce | Účel, návod, FAQ, tipy |

#### MANUAL-002: Zobrazení nápovědy pro administrátora

**Přístup:** Administrátor (role-2)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Přihlásit se jako Administrátor | Přihlášen |
| 2 | Kliknout na ikonu HelpCircle | Otevře se nápověda |
| 3 | Vidět úvod pro roli Administrátor | Přizpůsobený obsah |
| 4 | Vidět 6 modulů | kpi-dashboard, reports, absence-approval, tasks, presence, chat |
| 5 | Nevidět moduly Prodavače | Stav pokladny, Tržby, Odvody |

#### MANUAL-003: Vyhledávání v nápovědě

**Přístup:** Jakákoliv role

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít nápovědu | Nápověda zobrazena |
| 2 | Zadat do vyhledávání "schválení" | Zobrazí se relevantní moduly |
| 3 | Sekce jsou automaticky rozbalené | Obsah viditelný |
| 4 | Úvodní sekce zmizí | Pouze výsledky hledání |
| 5 | Vymazat vyhledávání | Všechny moduly zpět, úvod zobrazen |

#### MANUAL-004: Sbalovací sekce

**Přístup:** Jakákoliv role

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít nápovědu | Nápověda zobrazena |
| 2 | Kliknout na sekci modulu | Sekce se rozbalí |
| 3 | Kliknout znovu | Sekce se sbalí |
| 4 | Rozbalit více sekcí najednou | Funguje správně |

#### MANUAL-005: Přepnutí role

**Přístup:** Uživatel s více rolemi

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít nápovědu | Vidím moduly pro aktuální roli |
| 2 | Zavřít nápovědu | Zpět na dashboard |
| 3 | Přepnout roli v hlavičce | Role změněna |
| 4 | Znovu otevřít nápovědu | Obsah aktualizován pro novou roli |

### Edge Cases

| ID | Popis | Očekávané chování |
|----|-------|-------------------|
| MANUAL-E001 | Vyhledávání bez výsledků | Zobrazí se "Žádné výsledky pro zadaný dotaz" |
| MANUAL-E002 | Neznámá role | Prázdný seznam modulů |

---

## Poznámky k testování

- Testovat na různých prohlížečích (Chrome, Firefox, Safari)
- Testovat responsivitu (desktop, tablet, mobile)
- Testovat edge cases a hraniční situace
- Dokumentovat nalezené bugy v `/specs/CHANGELOG.md`

---

## 14. E-mail

> Spec: `/specs/modules/email.spec.yaml`

### SC-EMAIL-01: Admin přidá e-mailový účet
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Admin otevře Nastavení → E-mail | Zobrazí se seznam účtů |
| 2 | Klikne "Přidat účet" | Otevře se formulář |
| 3 | Vyplní IMAP/SMTP údaje | Pole se vyplní |
| 4 | Klikne "Test připojení" | IMAP i SMTP zelené checkmarky |
| 5 | Uloží účet | Účet se objeví v seznamu, heslo šifrováno |

### SC-EMAIL-02: Admin přiřadí přístup zaměstnanci
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Admin otevře detail účtu | Zobrazí se rozšířené info |
| 2 | Klikne "Přidat přístup" | Zobrazí se formulář |
| 3 | Vybere zaměstnance a oprávnění | Zaměstnanec se přidá |
| 4 | Zaměstnanec otevře E-mail | Vidí přiřazený účet |

### SC-EMAIL-03: Spuštění synchronizace
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Uživatel otevře E-mail modul | Zobrazí se 3-panel layout |
| 2 | Klikne "Sync" | Spinner se zobrazí |
| 3 | Sync dokončena | Toast "Synchronizace dokončena", nové zprávy |
| 4 | Složky aktualizovány | Správné počty zpráv a nepřečtených |

### SC-EMAIL-04: Čtení e-mailu
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Vybere složku (Inbox) | Zobrazí se seznam zpráv |
| 2 | Klikne na zprávu | Detail se lazy-loadne |
| 3 | HTML body | Sanitizováno DOMPurify |
| 4 | Zpráva přečtena | Nepřečtené počítadlo klesne |

### SC-EMAIL-05: Odpověď na e-mail
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Klikne "Odpovědět" | Otevře se composer s předvyplněnými údaji |
| 2 | Napíše odpověď | Text se zobrazí |
| 3 | Klikne "Odeslat" | E-mail odeslán, toast, uložen do Sent |

### SC-EMAIL-06: Stažení přílohy
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Klikne na přílohu v detailu | Příloha se stáhne z IMAP |
| 2 | Soubor se otevře | Správný Content-Type a název |

### SC-EMAIL-07: Persistence po refreshi
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Pracuje s e-maily | Data viditelná |
| 2 | Stiskne F5 | Data se znovu načtou z DB |
| 3 | Stav konzistentní | Počty odpovídají |

### SC-EMAIL-08: Přesun e-mailu se sync na IMAP
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Přesune zprávu do jiné složky | Zpráva se přesune na IMAP serveru |
| 2 | Zkontroluje v jiném IMAP klientu | Zpráva je ve správné složce |
| 3 | Druhý uživatel vidí změnu | Realtime aktualizace bez refreshe |

### SC-EMAIL-09: Označení přečteno/nepřečteno se sync na IMAP
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Označí zprávu jako přečtenou | Flag \Seen se přidá na IMAP (best-effort) |
| 2 | Označí zprávu jako nepřečtenou | Flag \Seen se odebere na IMAP |

### SC-EMAIL-10: Smazání e-mailu se sync na IMAP
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Smaže zprávu (z koše) | Zpráva se smaže na IMAP serveru |
| 2 | Smaže zprávu (z Inbox) | Přesune se do koše (IMAP MOVE) |

### SC-EMAIL-11: Multi-klient Realtime
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Dva uživatelé otevřou stejný účet | Oba připojeni přes Realtime |
| 2 | Jeden přesune zprávu | Druhý vidí změnu okamžitě |
| 3 | Počty ve složkách | Aktualizují se u obou |

### SC-EMAIL-12: Odeslání e-mailu s IMAP APPEND
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Odešle e-mail | SMTP odesláno |
| 2 | Zkontroluje Sent v jiném klientu | Kopie existuje na IMAP serveru |
| 3 | imap_uid | Nenulový v DB |

### Edge cases
- Bez nastavené env proměnné `EMAIL_ENCRYPTION_KEY` → chyba při ukládání účtu
- Velká příloha → stahuje se on-demand z IMAP, ne z DB
- Timeout IMAP připojení → chyba v sync logu
- HTML e-mail s nebezpečným obsahem → DOMPurify sanitizace
- Uživatel bez přístupu → nezobrazí se žádný účet
- imapUid === 0 → přeskočit IMAP operace (lokálně vytvořené zprávy)
- IMAP MOVE vrací nový UID → aktualizovat v DB
- Auto-sync při neaktivní záložce → přeskočit
- Realtime event od vlastního klienta → nezduplikovat

---

## 15. Produkční audit (v1.5.0)

### AUDIT-001: Schválení absence z admin dashboardu
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Přihlásit jako Admin | Dashboard zobrazen |
| 2 | Otevřít Tržba a Docházka | Report view s absence panelem |
| 3 | Vidět pending žádosti | Skutečné žádosti z DB (ne z docházky) |
| 4 | Kliknout "Schválit" | Toast "Žádost schválena", žádost zmizí ze seznamu |

### AUDIT-002: Export XLS
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Přihlásit jako Admin | Dashboard zobrazen |
| 2 | Otevřít Tržba a Docházka | Report view zobrazen |
| 3 | Nastavit filtry (prodejna, měsíc) | Data filtrována |
| 4 | Kliknout "Export .XLS" | Stáhne se soubor dochazka.xlsx |
| 5 | Otevřít soubor | Hlavička + řádky odpovídají zobrazeným datům |

### AUDIT-003: Cleanup subscriptions při odhlášení
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Přihlásit se, otevřít chat/email | Realtime a auto-sync běží |
| 2 | Kliknout odhlásit | Přesměrování na login |
| 3 | Zkontrolovat Network tab | Žádné další WebSocket/fetch requesty |

### AUDIT-004: Deaktivovaný uživatel nemůže používat app
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Admin deaktivuje uživatele v nastavení | Uživatel deaktivován |
| 2 | Deaktivovaný uživatel obnoví stránku | Session cleared, přesměrování na login |

### AUDIT-005: Toast notifikace při chybách
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Simulovat DB chybu (offline mode) | Operace selže |
| 2 | Odeslat chat zprávu | Toast "Nepodařilo se odeslat zprávu" |
| 3 | Vytvořit úkol | Toast "Nepodařilo se vytvořit úkol" |

### AUDIT-006: Error Boundary
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Simulovat runtime error v komponentě | ErrorBoundary zachytí |
| 2 | Vidět fallback UI | "Něco se pokazilo" + tlačítko "Obnovit stránku" |
| 3 | Kliknout "Obnovit stránku" | Stránka se znovu načte |

### Edge cases
- Stub komponenty (LastPickups, Svozový status) jsou skryty — nezobrazují se v reportech
- TLS rejectUnauthorized řízeno env proměnnou — default `true` (bezpečný), override `false` pro self-signed certs
- IMAP best-effort operace (mark read/unread, flag) logují varování místo tichého selhání

---

## 16. DB Persistence audit (v1.6.0)

### PERSIST-001: Tržby — zápis do DB
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Přihlásit jako Prodavač, příchod | V práci na prodejně |
| 2 | Otevřít Tržby, zadat hotovost 5000, karta 3000, partner 1000 | Formulář vyplněn |
| 3 | Přidat příjem 500 s poznámkou "Vratka" | Řádek přidán |
| 4 | Kliknout "Uložit do systému" | Toast "Tržby uloženy", formulář resetován |
| 5 | Zkontrolovat tabulku `dochazka` v Supabase | Nový řádek s hotovost=5000, karta=3000, partner=1000, pohyby="+500" |
| 6 | Refreshnout stránku | cashToCollect se načte z DB |

### PERSIST-002: Odvody — update DB
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Otevřít Odvody (cashToCollect > 0) | Částka zobrazena |
| 2 | Zadat jméno řidiče "Jan Novák" | Jméno vyplněno |
| 3 | Kliknout "Potvrdit odvod řidiči" | Toast "Hotovost odevzdána", cashToCollect = 0 |
| 4 | Zkontrolovat tabulku `dochazka` v Supabase | Sloupec `vybrano` obsahuje "Jan Novák - {datum}" |

### PERSIST-003: Docházka příchod — INSERT do DB
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Přihlásit jako Prodavač | V dashboardu |
| 2 | Kliknout "Příchod" | Stav: V práci |
| 3 | Zkontrolovat tabulku `dochazka` v Supabase | Nový řádek s prichod=aktuální čas, odchod=NULL |

### PERSIST-004: Docházka odchod — UPDATE v DB
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Být V práci (po příchodu) | Status: V práci |
| 2 | Potvrdit kasu (checkbox) | Kasa potvrzena |
| 3 | Kliknout "Odchod" | Stav: Mimo práci |
| 4 | Zkontrolovat tabulku `dochazka` v Supabase | Záznam aktualizován: odchod=aktuální čas, hodiny=vypočtené |

### PERSIST-005: Email — validace oprávnění k odeslání
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Otevřít Email jako uživatel bez canSend | Email modul zobrazen |
| 2 | Pokusit se odeslat email | Toast "Nemáte oprávnění odesílat z tohoto účtu" |

### Edge cases
- Tržby bez přihlášeného uživatele → chyba "Uživatel není přihlášen"
- Odvody bez nastaveného pracoviště → chyba "Pracoviště není nastaveno"
- Odchod bez příchodu (záznam nenalezen) → lokální state se změní, DB zůstane konzistentní
- Refresh po příchodu → isInWork=false (lokální), ale DB záznam s prichod existuje

---

## 17. Produkční hardening audit (v1.8.0)

### HARD-001: Docházka — duplicitní check-in
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Přihlásit jako Prodavač, kliknout Příchod | Stav: V práci |
| 2 | V novém tabu rychle kliknout Příchod znovu | Toast "Dnešní příchod již byl zaznamenán" |
| 3 | Zkontrolovat DB | Pouze 1 záznam s odchod=NULL pro daný den a zaměstnance |

### HARD-002: Absence Lékař — nevalidní čas
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Otevřít Hlášení absence, typ Lékař | Zobrazena sekce času |
| 2 | Zadat čas od "99:99", čas do "10:00" | Chyba "Čas musí být ve formátu HH:mm" |
| 3 | Zadat čas od "14:00", čas do "10:00" | Chyba "Čas do musí být po čase od" |
| 4 | Zadat čas od "08:30", čas do "10:00" | Formulář projde validací |

### HARD-003: Opakované úkoly — overflow měsíce
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Vytvořit úkol s deadline 31.1.2026, opakovani=monthly | Úkol vytvořen |
| 2 | Schválit úkol, počkat na vygenerování opakování | Nový úkol vytvořen |
| 3 | Zkontrolovat deadline nového úkolu | 28.2.2026 (ne 3.3.2026) |

### HARD-004: Email — velká příloha
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Otevřít Email, kliknout Nový email | Composer zobrazen |
| 2 | Přidat přílohu > 25 MB | Toast "Celková velikost příloh nesmí překročit 25 MB" |

### HARD-005: Chat — smazání skupiny (CASCADE)
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Vytvořit chat skupinu, odeslat zprávy | Skupina s zprávami existuje |
| 2 | Smazat skupinu | Skupina, zprávy i read statuses smazány z DB |
| 3 | Zkontrolovat DB tabulky | Žádné sirotčí záznamy |

### HARD-006: API validace — nevalidní request body
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | POST /api/email/imap-action s prázdným body | 400 + Zod error message |
| 2 | POST /api/email/sync s `{accountId: ""}` | 400 + validation error |
| 3 | POST /api/pohoda/test s chybějícím polem | 400 + validation error |

### HARD-007: Decrypt chyba — srozumitelná hláška
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Nastavit špatný EMAIL_ENCRYPTION_KEY | Env proměnná změněna |
| 2 | Pokusit se synchronizovat email | Chyba "Nepodařilo se dešifrovat heslo..." |

### Edge cases
- Absence zamítnutí: sloupec `zpracovano` obsahuje timestamp (ne `schvaleno`)
- Pohoda URL: výchozí hodnota z NEXT_PUBLIC_POHODA_URL, prázdná pokud nenastaven
- Rate limit na email send: 20/min per IP, 429 s Retry-After hlavičkou
- CASCADE DELETE: smazání skupiny v jedné DB operaci (atomické)

---

## 18. Centralizace synchronizace — Cron Jobs (v2.0.0 + v2.1.0)

### CRON-001: Email sync cron endpoint
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | `curl -H "Authorization: Bearer <CRON_SECRET>" /api/cron/email-sync` | 200 + JSON s accountsSynced, totalNew |
| 2 | Zavolat bez auth headeru | 401 Unauthorized |
| 3 | Zavolat se špatným tokenem | 401 Unauthorized |
| 4 | Zkontrolovat emailovy_log v DB | Nový záznam s stav=success |

### CRON-002: Tasks repeat cron endpoint
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Vytvořit úkol s opakovani=daily, schválit | Úkol ve stavu approved |
| 2 | Počkat 24h (nebo manipulovat datum schválení) | Podmínka splněna |
| 3 | `curl -H "Authorization: Bearer <CRON_SECRET>" /api/cron/tasks-repeat` | 200 + JSON s createdTasks=1 |
| 4 | Zkontrolovat tabulku ukoly | Nový úkol s zdroj_opakovani = původní ID |

### CRON-003: Email polling odstraněn, chat/tasks mají auto-sync fallback
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Otevřít app v prohlížeči | Přihlášen |
| 2 | Otevřít Network tab, filtr: /api/email/sync | Žádné periodické email sync requesty |
| 3 | Network tab, filtr: chat_zpravy | Periodické requesty ~15s (chat auto-sync) |
| 4 | Network tab, filtr: ukoly | Periodické requesty ~30s (tasks auto-sync) |
| 5 | Zkontrolovat Realtime WebSocket | WS spojení aktivní (chat, email, tasks) |

### CRON-004: Manuální sync stále funguje
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Otevřít Email modul | Zobrazí se |
| 2 | Kliknout "Synchronizovat" | Spinner, pak toast "Synchronizace dokončena" |
| 3 | Nové zprávy se zobrazí | Data aktualizována |

### CRON-005: Realtime + auto-sync fallback funguje
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Otevřít chat ve dvou oknech (dva uživatelé) | Oba připojeni |
| 2 | Uživatel A pošle zprávu | Zpráva se zobrazí u B do 15s (Realtime okamžitě, auto-sync max 15s) |
| 3 | Uživatel A vytvoří úkol pro B | Úkol se zobrazí u B do 30s |
| 4 | Přepnout tab u B pryč a zpět | Při návratu se data okamžitě refreshnou (visibility change) |

### CRON-006: Reconciliace ghost messages
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Smazat/přesunout zprávu přímo na IMAP serveru (např. přes jiný klient) | Zpráva zmizí z IMAP |
| 2 | Počkat na cron sync (nebo spustit manuálně) | Sync proběhne |
| 3 | Zkontrolovat DB tabulku `emailove_zpravy` | Ghost zpráva odstraněna z DB |
| 4 | Zkontrolovat UI | Zpráva se nezobrazuje |

### CRON-007: Timeout ochrana syncu
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Spustit sync účtu s mnoha složkami (>50) | Sync začne |
| 2 | Počkat na timeout (2 min per account v cron) | Sync se zastaví po timeoutu |
| 3 | Zkontrolovat `emailovy_log` | Záznam se stavem `timeout`, ne `running` |
| 4 | Složky zpracované před timeoutem | Data uložena korektně |

### CRON-008: Stuck log cleanup
| Krok | Akce | Očekávaný výsledek |
|------|------|--------------------|
| 1 | Simulovat stuck log (stav=running, vytvoreno < 10 min) | Log existuje v DB |
| 2 | Spustit cron email-sync | Cron se spustí |
| 3 | Zkontrolovat stuck log | Stav změněn na `timeout` |

### Edge cases
- Cron bez `SUPABASE_SERVICE_ROLE_KEY` → chyba při inicializaci admin clienta
- Cron bez `CRON_SECRET` → 401 na všechny cron requesty
- Middleware exempt: `/api/cron/*` neprocházejí Supabase auth middleware
- Email sync cron: sekvenční zpracování účtů (ne paralelní) — šetří IMAP connections
- Tasks repeat cron: kontrola existujících non-approved opakování zabraňuje duplicitám
- Reconciliace: přeskočena pro složky >10000 zpráv (výkonnostní limit)
- Reconciliace: běží pouze v incremental mode (ne initial sync)
- Timeout: per-account 120s v cron, per-folder error neukončí celý sync
- Stuck log cleanup: logy starší 10 min ve stavu `running` → automaticky `timeout`
- Chat/Tasks auto-sync: přeskočí polling když tab není viditelný (`document.visibilityState !== 'visible'`)
- Chat/Tasks auto-sync: při návratu na tab (visibility change) se data okamžitě refreshnou
- Chat/Tasks auto-sync: cleanup při odhlášení / unmount (clearInterval + removeEventListener)

---

## 19. Motivace prodejny

**Modul:** MotivationModule
**Store:** useMotivationStore
**Badge:** Žádný

### Přístupové role

| Role | ID |
|------|-----|
| Administrátor | role-2 |
| Majitel | role-8 |

### Testovací scénáře

#### MOTIV-001: Otevření modulu a zobrazení produktů

**Přístup:** Administrátor (role-2)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Přihlásit se jako Administrátor | Dashboard s modulem Motivace |
| 2 | Kliknout na modul Motivace | Otevře se fullscreen dialog |
| 3 | Počkat na načtení | Produkty ze skladu se načtou (~5400) |
| 4 | Scrollovat tabulkou | Plynulý scroll, sticky hlavička |

#### MOTIV-002: Filtrování produktů

**Přístup:** Administrátor (role-2)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Zadat do filtru "8400000097" | Zobrazí se odpovídající produkt |
| 2 | Vymazat filtr | Zobrazí se všechny produkty |
| 3 | Zadat "šňůrka" | Produkty obsahující text v názvu |
| 4 | Zkontrolovat počet v patičce | Ukazuje počet vyfiltrovaných |

#### MOTIV-003: Řazení podle sloupců

**Přístup:** Administrátor (role-2)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Kliknout na hlavičku "Kód" | Seřadí ASC, šipka nahoru |
| 2 | Kliknout znovu na "Kód" | Seřadí DESC, šipka dolů |
| 3 | Kliknout na "Cena" | Seřadí podle ceny ASC |
| 4 | Kliknout na "Motivace" | Označené produkty nahoře |

#### MOTIV-004: Označení a uložení jednoho produktu

**Přístup:** Administrátor (role-2)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Najít produkt v tabulce | Produkt nalezen |
| 2 | Kliknout na řádek | Checkbox se zapne (zelený) |
| 3 | Zkontrolovat patičku | "1 změna" se zobrazí |
| 4 | Kliknout "Uložit" | Toast "Uloženo 1 změn" |
| 5 | Zavřít a znovu otevřít modal | Produkt je stále označený |

#### MOTIV-005: Hromadné označení vyfiltrovaných produktů

**Přístup:** Administrátor (role-2)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Zadat filtr (např. "šňůrka") | Zobrazí se jen vyfiltrované |
| 2 | Kliknout "Označit vše" | Všechny vyfiltrované se označí |
| 3 | Zkontrolovat počet změn | Odpovídá počtu vyfiltrovaných |
| 4 | Vymazat filtr | Ostatní produkty neoznačené |
| 5 | Kliknout "Uložit" | Batch upsert, toast potvrzení |

#### MOTIV-006: Hromadné odznačení

**Přístup:** Administrátor (role-2)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Seřadit podle Motivace DESC | Označené nahoře |
| 2 | Kliknout "Odznačit vše" | Všechny vyfiltrované se odznačí |
| 3 | Kliknout "Uložit" | Změny uloženy do DB |

#### MOTIV-007: Nastavení motivačního procenta a skladu (admin)

**Přístup:** Administrátor (role-2)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít admin panel → Nastavení modulů | Seznam modulů |
| 2 | Kliknout na modul Motivace | Detail nastavení |
| 3 | V sekci "Nastavení motivace" změnit procento na 6 | Hodnota nastavena |
| 4 | Vybrat sklad "ALL_Zdiby" | Sklad vybrán |
| 5 | Kliknout "Uložit nastavení" | Toast "Nastavení motivace uloženo" |
| 6 | Otevřít modul Motivace | Produkty z ALL_Zdiby se načtou |

### Edge cases
- Žádný sklad nevybrán → modal zobrazí prázdný stav s informační zprávou
- Velký počet produktů (5000+) → paginovaný fetch po 1000 řádcích, plynulý scroll
- Uložení bez změn → tlačítko "Uložit" je disabled
- Více uživatelů současně → poslední zápis vyhraje (upsert on conflict)
- Produkt smazán z Pohody → zůstane v motivace_produkty, ale nezobrazí se v tabulce

---

---

## 20. Převodky (picking + EAN)

**Modul:** AutomatizaceSettings (sekce Převodky)
**Store:** usePrevodkyStore
**Badge:** Žádný (notifikace přes úkoly)

### Přístupové role

| Role | ID | Práva |
|------|-----|-------|
| Administrátor | role-2 | Generování, přehled, detail, zrušení |
| Majitel | role-8 | Generování, přehled, detail, zrušení |
| Zaměstnanec (picker) | - | Picking UI přes úkol |

### Testovací scénáře

#### PREV-001: Generování převodek

**Přístup:** Administrátor (role-2)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít Automatizace > Převodky | Sekce s tlačítkem "Generovat převodky" |
| 2 | Kliknout "Generovat převodky" | Dialog s výběrem pickerů per prodejna |
| 3 | Vybrat pickery pro prodejny | Dropdown s aktivními zaměstnanci |
| 4 | Kliknout "Generovat" | Systém vytvoří N převodek + N úkolů |
| 5 | Zkontrolovat přehled | N nových převodek se stavem "Nová" |

#### PREV-002: Picking s EAN skenováním

**Přístup:** Zaměstnanec (picker)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít úkol typu převodka | Picking UI se otevře fullscreen |
| 2 | Stav se automaticky změní | nova → picking |
| 3 | Naskenovat EAN (qty=1) | Položka automaticky potvrzena (zelená) |
| 4 | Naskenovat EAN (qty>1) | Dialog s předvyplněným množstvím |
| 5 | Potvrdit množství | Položka potvrzena, progress se aktualizuje |
| 6 | Naskenovat neznámý EAN | Červená hláška "Produkt není v převodce" |
| 7 | Dokončit (vše vychystáno) | Kliknout "Dokončit picking", stav → vychystáno |

#### PREV-003: Partial picking s poznámkou

**Přístup:** Zaměstnanec (picker)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Neskenovat všechny položky | Progress ukazuje X/Y |
| 2 | Kliknout "Dokončit picking" | Dialog s povinnou poznámkou |
| 3 | Zadat poznámku a potvrdit | Stav → vychystáno, poznámka uložena |
| 4 | Admin otevře detail | Vidí poznámku pickera |

#### PREV-004: Odeslání převodky

**Přístup:** Administrátor (role-2)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít detail vychystané převodky | Detail s položkami a akcemi |
| 2 | Kliknout "Označit jako odesláno" | Stav → odesláno, časové razítko |

#### PREV-005: Zrušení převodky

**Přístup:** Administrátor (role-2)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít detail nové/picking převodky | Detail s tlačítkem "Zrušit" |
| 2 | Kliknout "Zrušit převodku" | Potvrzovací dialog |
| 3 | Potvrdit | Stav → zrušena, přiřazený úkol smazán |

#### PREV-006: Ruční přidání produktu při pickingu

**Přístup:** Zaměstnanec (picker)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Kliknout "Přidat produkt" v headeru pickingu | Otevře se fullscreen dialog s vyhledáváním |
| 2 | Zadat název nebo kód produktu (min 2 znaky) | Tabulka výsledků z centrálního skladu |
| 3 | Kliknout na produkt | Zobrazí se pole pro zadání počtu kusů |
| 4 | Zadat počet a kliknout "Přidat" | Produkt přidán jako vychystaný, zelená hláška |
| 5 | Zavřít dialog | Nový produkt viditelný v seznamu pickingu (zelený) |

#### PREV-008: Odeslání převodky do Pohody

**Přístup:** Administrátor (role-2)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít detail vychystané převodky | Detail s položkami, tlačítko "Odeslat do Pohody" viditelné |
| 2 | Kliknout "Odeslat do Pohody" | Loading spinner, tlačítko disabled |
| 3 | Počkat na odpověď z Pohody | Toast s výsledkem |
| 4 | Úspěch | Zelený badge s číslem dokladu (např. 26SPr00253), stav → odesláno |
| 5 | Chyba | Červený badge s chybovou zprávou, tlačítko "Odeslat znovu" |
| 6 | Kliknout "Odeslat znovu" | Nový pokus o odeslání |

#### PREV-007: Přidání duplicitního produktu

**Přístup:** Zaměstnanec (picker)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | V "Přidat produkt" vyhledat produkt již v převodce | U produktu badge "v převodce" |
| 2 | Kliknout na duplicitní produkt | Oranžové upozornění, ale možnost přidat |
| 3 | Zadat počet a přidat | Nová položka v převodce (s vlastním množstvím) |

### Edge cases
- Neznámý EAN → červená hláška, žádná položka se nezmění
- Již vychystaný produkt skenován znovu → hláška "Již vychystáno"
- Prodejna bez položek → převodka se nevytvoří
- Pokus o zrušení odeslané → API vrátí chybu 400
- Generování bez přiřazení pickerů → API vrátí chybu 400
- Odeslaná/potvrzená převodka → nelze zrušit
- Vyhledávání produktu s méně než 2 znaky → hint "Zadejte alespoň 2 znaky"
- Vyhledávání bez výsledků → hláška "Žádné výsledky"
- Odeslání do Pohody selhalo → stav zůstane vychystáno, chyba zobrazena, tlačítko "Odeslat znovu"
- Pokus o odeslání již odeslané převodky → chyba "Převodka už byla odeslána"
- Převodka bez vychystaných položek → chyba "Žádné položky k odeslání"

---

## 21. Produkty v motivaci

**Modul:** MotivationProductsModule
**Store:** useMotivationStore (sdílený s modulem Motivace)
**Badge:** Žádný

### Přístupové role

| Role | ID |
|------|-----|
| Prodavač | role-1 (výchozí) |
| Další role | Konfigurovatelné v Nastavení → Moduly |

### Testovací scénáře

#### MOTPROD-001: Otevření modulu a zobrazení motivačních produktů

**Přístup:** Prodavač (role-1)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Přihlásit se jako Prodavač | Dashboard s modulem "Produkty v motivaci" |
| 2 | Kliknout na modul | Otevře se fullscreen dialog |
| 3 | Počkat na načtení | Zobrazí se POUZE produkty označené v motivaci |
| 4 | Zkontrolovat sloupce | Kód, Název, EAN, Cena (žádný checkbox Motivace) |
| 5 | Zkontrolovat footer | Žádný footer s tlačítky |

#### MOTPROD-002: Filtrování motivačních produktů

**Přístup:** Prodavač (role-1)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Zadat do filtru část kódu nebo názvu | Zobrazí se odpovídající produkty |
| 2 | Zkontrolovat počet v headeru | Aktualizovaný počet produktů |
| 3 | Vymazat filtr | Všechny motivační produkty zpět |

#### MOTPROD-003: Řazení podle sloupců

**Přístup:** Prodavač (role-1)

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Kliknout na hlavičku "Kód" | Seřadí ASC, šipka nahoru |
| 2 | Kliknout znovu | Seřadí DESC, šipka dolů |
| 3 | Kliknout na "Cena" | Seřadí podle ceny |

#### MOTPROD-004: Realtime aktualizace při změně motivace

**Přístup:** Prodavač (role-1) + Administrátor (role-2) ve dvou oknech

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Prodavač otevře modul Produkty v motivaci | Tabulka s motivačními produkty |
| 2 | Admin v modulu Motivace označí nový produkt a uloží | Změna uložena do DB |
| 3 | Prodejce zkontroluje svůj modal | Nový produkt se objeví bez refreshe |
| 4 | Admin odznačí produkt z motivace a uloží | Změna uložena |
| 5 | Prodejce zkontroluje modal | Produkt zmizí bez refreshe |

### Edge cases

| ID | Situace | Očekávané chování |
|----|---------|-------------------|
| MOTPROD-E001 | Žádné produkty v motivaci | Text "Žádné produkty nejsou zařazeny do motivace." |
| MOTPROD-E002 | Žádný sklad nevybrán | Produkty se nenačtou, prázdný stav |
| MOTPROD-E003 | Velký počet motivačních produktů | Plynulý scroll, funkční filtrování a řazení |

---

*Poslední aktualizace: 2026-02-26*
