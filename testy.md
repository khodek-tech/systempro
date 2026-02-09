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

---

## Přístupové role

| Role | ID | Přístup k modulům |
|------|-----|-------------------|
| Prodavač | role-1 | cash-info, sales, collect, absence-report, tasks, attendance, shifts, chat, email |
| Administrátor | role-2 | absence-approval, tasks, kpi-dashboard, reports, presence, chat, email |
| Skladník | role-3 | absence-report, tasks, attendance, shifts, chat, email |
| Vedoucí skladu | role-4 | absence-report, absence-approval, tasks, attendance, presence, chat, email |
| Obsluha e-shopu | role-5 | absence-report, tasks, attendance, shifts, chat, email |
| Obchodník | role-6 | absence-report, tasks, attendance, shifts, chat, email |
| Vedoucí velkoobchodu | role-7 | absence-report, absence-approval, tasks, attendance, presence, chat, email |
| Majitel | role-8 | absence-approval, tasks, kpi-dashboard, presence, chat, email |

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

### Hraniční případy

| ID | Situace | Očekávané chování |
|----|---------|-------------------|
| TASK-E001 | Samopřiřazení úkolu | Badge počítá úkol pouze jednou |
| TASK-E002 | Delegace na sebe | Systém by měl zakázat |
| TASK-E003 | Úkol bez assignee | Zobrazí se ve "Všechny" |
| TASK-E004 | Dvojí delegace | Chyba: "Úkol je již delegován" |

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

#### CHAT-006: Realtime multi-klient

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Otevřít chat ve dvou prohlížečích | Oba připojeni přes Realtime |
| 2 | Uživatel A pošle zprávu | Zpráva se okamžitě objeví u B |
| 3 | Zkontrolovat badge u B | Badge se aktualizuje bez refreshe |

### Hraniční případy

| ID | Situace | Očekávané chování |
|----|---------|-------------------|
| CHAT-E001 | Prázdná skupina | Text "Zatím žádné zprávy" |
| CHAT-E002 | Odebrání ze skupiny | Skupina zmizí ze seznamu |
| CHAT-E003 | Smazání skupiny s nepřečtenými | Badge se přepočítá |

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
| ABS-R-E003 | Překrývající se žádosti | Systém nekontroluje (potenciální bug) |
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
| 2 | Vidět zvýrazněné pracovní dny | Barevné rozlišení |
| 3 | Vidět krátký/dlouhý týden | Označení týdnů |
| 4 | Kliknout na pracovní den | Otevírací doba zobrazena |

#### SHIFT-003: Krátký vs dlouhý týden

| # | Krok | Očekávaný výsledek |
|---|------|-------------------|
| 1 | Najít lichý týden | Týden nalezen |
| 2 | Zkontrolovat pracovní dny | St, Čt (krátký) nebo Po,Út,Pá,So,Ne (dlouhý) |
| 3 | Přejít na sudý týden | Opačné dny |

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

*Poslední aktualizace: 2026-02-09*
