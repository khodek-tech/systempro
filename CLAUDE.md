# Pravidla pro vývoj

## Kvalita kódu
- **Zero tolerance pro ESLint chyby a varování** - `npm run lint` musí projít bez jakýchkoliv chyb nebo varování
- Před commitem vždy spustit `npm run lint`
- Nepoužívat `// eslint-disable` komentáře bez schválení

## State Management
- Všechna data musí být uložena v Zustand store
- Komponenty nesmí přímo manipulovat s daty, pouze volat akce ze store

## Komponenty
- Komponenty nesmí obsahovat business logiku
- Komponenty slouží pouze pro prezentaci a volání akcí
- Veškerá business logika patří do Zustand store nebo pomocných funkcí

---

## Design Pattern

### Typografie

#### Velikosti písma
| Třída | Použití | Příklad |
|-------|---------|---------|
| `text-xs` | Labels, badges, meta info | `text-xs font-semibold uppercase tracking-wide` |
| `text-sm` | Sekundární text, popisy | `text-sm font-medium text-slate-500` |
| `text-base` | Body text, formuláře | `text-base font-medium text-slate-600` |
| `text-lg` | Menší nadpisy | `text-lg font-semibold` |
| `text-xl` | Sekundární nadpisy | `text-xl font-bold text-purple-600` |
| `text-2xl` | Titulky modálů | `text-2xl font-bold text-center text-slate-800` |
| `text-3xl` | Hlavní nadpisy karet | `text-3xl font-extrabold tracking-tight` |
| `text-4xl` | Velké hodnoty | `text-4xl font-bold font-mono` |
| `text-5xl` | Extra velké částky | `text-5xl font-bold text-slate-900 font-mono` |

#### Váhy písma
| Třída | Použití |
|-------|---------|
| `font-medium` | Standardní labels, sekundární text |
| `font-semibold` | Titulky sekcí, důležitý text |
| `font-bold` | Tlačítka, nadpisy, hodnoty |
| `font-extrabold` | Velké nadpisy, hlavní titulky |
| `font-black` | Důraz, tabulkové headers |

---

### Barvy

#### Text
| Barva | Použití | Příklad |
|-------|---------|---------|
| `text-slate-400` | Placeholder, disabled | Meta informace |
| `text-slate-500` | Sekundární text | Labels, popisy |
| `text-slate-600` | Body text | Standardní obsah |
| `text-slate-800` | Nadpisy | Titulky, důležitý text |
| `text-slate-900` | Hlavní text | Hodnoty, čísla |
| `text-blue-600` | Primární akce | Odkazy, aktivní stavy |
| `text-green-600` | Úspěch | Potvrzení, aktivní |
| `text-orange-600` | Upozornění | Absence, varování |
| `text-red-600` | Chyba | Error stavy |
| `text-purple-600` | Speciální | Odvody, finanční |

#### Background
| Barva | Použití |
|-------|---------|
| `bg-white` | Karty, modály |
| `bg-slate-50` | Inputy, sekce, alternating rows |
| `bg-blue-50` | Primární highlight |
| `bg-green-50` | Success highlight |
| `bg-orange-50` | Warning highlight |
| `bg-emerald-50` | Earnings/sales highlight |
| `bg-purple-50` | Special highlight |

#### Border
- Standardní: `border-slate-200`
- Focus: `focus:border-blue-300` nebo `focus:border-orange-300`

---

### Komponenty

#### Karty
```
Standardní karta:
bg-white border border-slate-200 rounded-xl shadow-sm p-5

Velká interaktivní karta:
bg-white border border-slate-100 rounded-[40px] p-10
hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)]
hover:-translate-y-2 transition-all duration-500
```

#### Tabulky
```
Kontejner: shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden
Header: bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500
Cell: text-sm font-medium text-slate-600 border-b border-slate-100
Row hover: hover:bg-slate-50
```

#### Tlačítka
```
Primary:
bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold
hover:bg-blue-700 active:scale-[0.98] transition-all

Secondary:
bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium
hover:bg-slate-200

Success:
bg-green-600 text-white px-4 py-2 rounded-lg font-semibold
hover:bg-green-700

Warning:
bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold
hover:bg-orange-600

Destructive:
bg-red-600 text-white px-4 py-2 rounded-lg font-semibold
hover:bg-red-700

Ghost:
bg-transparent text-slate-600 px-4 py-2 rounded-lg font-medium
hover:bg-slate-100
```

#### Formuláře
```
Input:
bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium
outline-none focus:border-orange-300

Select:
bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-semibold
outline-none cursor-pointer focus:border-orange-300

Textarea:
bg-slate-50 border border-slate-200 rounded-xl p-5 text-base font-medium
outline-none resize-none focus:border-orange-300

Currency Input:
bg-white border border-slate-200 rounded-lg p-4 text-right font-bold text-xl
shadow-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100
```

#### Modály
```
Malý (formuláře): max-w-md rounded-2xl p-8
Střední (detail): max-w-lg rounded-2xl p-10
Velký (komplexní): max-w-[900px] rounded-2xl p-12

Title: text-2xl font-bold text-center text-slate-800
```

---

### Spacing

#### Padding
| Hodnota | Použití |
|---------|---------|
| `p-3` | Malé prvky, form rows |
| `p-4` | Standardní sekce |
| `p-5` | Karty, větší sekce |
| `p-6` | Modální sekce |
| `p-8` | Velké sekce, hlavní kontejnery |
| `p-10` | Extra velké karty |
| `p-12` | Modální obsah |

#### Gap
| Hodnota | Použití |
|---------|---------|
| `gap-2` | Malé mezery (ikony, badges) |
| `gap-3` | Standardní mezery (form items) |
| `gap-4` | Větší mezery (grid items) |
| `gap-6` | Sekce v kartách |
| `gap-10` | Hlavní grid layout |

#### Space-y (vertikální)
| Hodnota | Použití |
|---------|---------|
| `space-y-3` | Formulářové položky |
| `space-y-4` | Standardní sekce |
| `space-y-5` | Modální sekce |
| `space-y-6` | Větší sekce |

---

### Animace a přechody

#### Transitions
```
Standardní: transition-all duration-300
Rychlý: transition-all duration-200
Pomalý (hover efekty): transition-all duration-500
```

#### Hover efekty
```
Lift: hover:-translate-y-2
Scale up: group-hover:scale-110
Rotate: group-hover:rotate-3
Opacity: opacity-60 hover:opacity-100
```

#### Click efekty
```
Press: active:scale-95 nebo active:scale-[0.98]
```

#### Animace
```
Fade in: animate-in fade-in duration-300
Slide in: animate-in slide-in-from-top-1
Pulse: animate-pulse (pro status indikátory)
```

---

### Border Radius

| Hodnota | Použití |
|---------|---------|
| `rounded-md` | Malé prvky (badges) |
| `rounded-lg` | Inputy, tlačítka |
| `rounded-xl` | Standardní karty, modály |
| `rounded-2xl` | Větší modály |
| `rounded-[36px]` | Ikony v kartách |
| `rounded-[40px]` | Extra velké karty |
| `rounded-full` | Avatary, badges |

---

### Shadows

| Hodnota | Použití |
|---------|---------|
| `shadow-xs` | Inputy, malé prvky |
| `shadow-sm` | Karty, tabulky |
| `shadow-md` | Modály |
| `shadow-lg` | Dialogy, overlay |
| Custom hover: `shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)]` |
