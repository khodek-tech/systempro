# SYSTEM.PRO - Test Runner Guide

## Jak testovat specifikace

Tento dokument popisuje jak testovat scénáře ze spec souborů.

## Struktura testů

Každý modul má spec soubor v `/specs/modules/{module-id}.spec.yaml` obsahující:

- **scenarios**: Testovací scénáře s kroky a očekávanými výsledky
- **edge_cases**: Hraniční případy a jejich očekávané chování

## Formát scénáře

```yaml
scenarios:
  - id: MODULE-001
    name: Název scénáře
    preconditions:
      - Podmínka 1
      - Podmínka 2
    steps:
      - Krok 1
      - Krok 2
      - Krok 3
    expected:
      - Očekávaný výsledek 1
      - Očekávaný výsledek 2
```

## Manuální testování

### Příprava

1. Spustit aplikaci: `npm run dev`
2. Otevřít v prohlížeči: `http://localhost:3000`
3. Přihlásit se jako požadovaná role

### Testovací účty

| Role | Username | Popis |
|------|----------|-------|
| Prodavač | pkot | Patricia Kot, prodejna Bohnice |
| Administrátor | khodek | Karel Hodek |
| Skladník | pbures | Pavel Bureš |
| Vedoucí skladu | mkunik | Martin Kunik |
| Obsluha e-shopu | lferova | Lucie Férová |
| Obchodník | tlhotak | Tomáš Lhoták |
| Vedoucí velkoobchodu | jlhotak | Jan Lhoták |
| Majitel | dhysek | David Hýsek |

### Postup testování

1. Najít scénář ve spec souboru
2. Splnit preconditions (přihlášení správnou rolí, příprava dat)
3. Provést kroky (steps) v pořadí
4. Ověřit očekávané výsledky (expected)
5. Zaznamenat případné odchylky

## Checklist pro testování modulů

### Tasks (Úkoly)
- [ ] TASK-001: Vytvoření a dokončení jednoduchého úkolu
- [ ] TASK-002: Delegace úkolu
- [ ] TASK-003: Vrácení úkolu s důvodem
- [ ] TASK-004: Úkol přiřazený prodejně
- [ ] TASK-005: Opakující se úkol

### Chat
- [ ] CHAT-001: Základní konverzace
- [ ] CHAT-002: Reakce na zprávu
- [ ] CHAT-003: Správa skupin (admin)
- [ ] CHAT-004: Vyhledávání v konverzaci
- [ ] CHAT-005: Přístup do skupin podle členství

### Absence Report
- [ ] ABS-R-001: Podání žádosti o dovolenou
- [ ] ABS-R-002: Podání žádosti k lékaři
- [ ] ABS-R-003: Notifikace o zpracované žádosti
- [ ] ABS-R-004: Filtrování žádostí
- [ ] ABS-R-005: Validace neplatných dat

### Absence Approval
- [ ] ABS-A-001: Schválení žádosti o dovolenou
- [ ] ABS-A-002: Zamítnutí žádosti
- [ ] ABS-A-003: Hierarchie schvalování
- [ ] ABS-A-004: Majitel vidí všechny žádosti
- [ ] ABS-A-005: Filtrování žádostí
- [ ] ABS-A-006: Vlastní žádosti se nezobrazují

### Sales (Tržby)
- [ ] SALES-001: Evidence základní tržby
- [ ] SALES-002: Tržba s mimořádným příjmem
- [ ] SALES-003: Tržba s výdajem
- [ ] SALES-004: Validace povinné poznámky
- [ ] SALES-005: Odstranění řádku příjmu/výdaje

### Collect (Odvody)
- [ ] COLL-001: Provedení odvodu
- [ ] COLL-002: Odvod bez jména řidiče
- [ ] COLL-003: Nulová částka k odvodu
- [ ] COLL-004: Akumulace tržeb
- [ ] COLL-005: Období odvodu - první polovina měsíce
- [ ] COLL-006: Období odvodu - druhá polovina měsíce

### Attendance (Docházka)
- [ ] ATT-001: Příchod Prodavače na prodejnu
- [ ] ATT-002: Odchod s potvrzením kasy
- [ ] ATT-003: Příchod Skladníka (bez kasy)
- [ ] ATT-004: Globální tracking přítomnosti

### Shifts (Směny)
- [ ] SHIFT-001: Zobrazení vlastních směn Prodavače
- [ ] SHIFT-002: Navigace mezi měsíci
- [ ] SHIFT-003: Krátký vs dlouhý týden
- [ ] SHIFT-004: Vedoucí vidí směny podřízených
- [ ] SHIFT-005: Zaměstnanec bez prodejny (Skladník)

### Presence (Přítomnost)
- [ ] PRES-001: Vedoucí skladu vidí podřízené
- [ ] PRES-002: Majitel vidí všechny
- [ ] PRES-003: Aktualizace při příchodu zaměstnance
- [ ] PRES-004: Omluvená absence
- [ ] PRES-005: Zaměstnanec bez dnešní směny
- [ ] PRES-006: Administrátor vidí pouze vedoucí

### KPI Dashboard
- [ ] KPI-001: Zobrazení dashboardu pro Majitele
- [ ] KPI-002: Trend tržeb
- [ ] KPI-003: Přehled otevřených úkolů
- [ ] KPI-004: Administrátor s omezeným přístupem

### Reports
- [ ] REP-001: Zobrazení reportu docházky
- [ ] REP-002: Přehled tržeb za období
- [ ] REP-003: Report s absencemi
- [ ] REP-004: Filtr všech prodejen
- [ ] REP-005: Prázdný report

## Reporting bugů

Při nalezení bugu:

1. Zaznamenat ID scénáře (např. TASK-001)
2. Popsat očekávané vs skutečné chování
3. Přiložit screenshot pokud relevantní
4. Aktualizovat `/specs/CHANGELOG.md`

## Automatizace testů

Pro automatizaci testů zvažte:

- **Playwright/Cypress**: E2E testy podle scénářů
- **Jest/Vitest**: Unit testy pro store funkce
- **Testing Library**: Testy React komponent

Příklad Playwright testu:

```typescript
test('TASK-001: Vytvoření a dokončení jednoduchého úkolu', async ({ page }) => {
  // Preconditions
  await loginAs(page, 'mkunik'); // Vedoucí skladu

  // Steps
  await page.click('[data-module="tasks"]');
  await page.click('text=Nový úkol');
  await page.fill('[name="title"]', 'Test úkol');
  // ...

  // Expected
  await expect(page.locator('[data-task-status]')).toContainText('Schváleno');
});
```

## Aktualizace specifikací

Při změně funkcionality:

1. Aktualizovat příslušný `.spec.yaml` soubor
2. Aktualizovat `/testy.md`
3. Přidat záznam do `/specs/CHANGELOG.md`
