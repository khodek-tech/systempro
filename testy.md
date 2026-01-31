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

---

## Přístupové role

| Role | ID | Přístup k modulům |
|------|-----|-------------------|
| Prodavač | role-1 | cash-info, sales, collect, absence-report, tasks, attendance, shifts, chat |
| Administrátor | role-2 | absence-approval, tasks, kpi-dashboard, reports, presence, chat |
| Skladník | role-3 | absence-report, tasks, attendance, shifts, chat |
| Vedoucí skladu | role-4 | absence-report, absence-approval, tasks, attendance, presence, chat |
| Obsluha e-shopu | role-5 | absence-report, tasks, attendance, shifts, chat |
| Obchodník | role-6 | absence-report, tasks, attendance, shifts, chat |
| Vedoucí velkoobchodu | role-7 | absence-report, absence-approval, tasks, attendance, presence, chat |
| Majitel | role-8 | absence-approval, tasks, kpi-dashboard, presence, chat |

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

### Hraniční případy

| ID | Situace | Očekávané chování |
|----|---------|-------------------|
| ABS-R-E001 | Jednodenní absence | Datum od = datum do funguje |
| ABS-R-E002 | Prázdná poznámka | Odeslání povoleno |
| ABS-R-E003 | Překrývající se žádosti | Systém nekontroluje (potenciální bug) |

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

## Poznámky k testování

- Testovat na různých prohlížečích (Chrome, Firefox, Safari)
- Testovat responsivitu (desktop, tablet, mobile)
- Testovat edge cases a hraniční situace
- Dokumentovat nalezené bugy v `/specs/CHANGELOG.md`

---

*Poslední aktualizace: 2026-01-31*
