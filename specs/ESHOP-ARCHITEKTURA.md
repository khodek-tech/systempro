# E-shop platforma - Architektonický plán

## Kontext

SystemPro potřebuje rozšíření o multi-tenant e-shop platformu pro prodej elektronických cigaret, likidů, příchutí a náhradních dílů. Kvůli zákonným omezením marketingu e-cigaret v ČR je **SEO absolutní priorita** - veškerý traffic musí přijít z organického vyhledávání.

Platforma musí podporovat 10+ e-shopů na jedné databázi, každý s vlastním brandem, cílovou skupinou, tónem komunikace, cenami a unikátním obsahem. AI (Claude API) bude automaticky přetextovávat produktové popisy pro každý e-shop.

---

## Architektura - 3 části

### 1. E-shop Frontend (NOVÁ Next.js aplikace)
- **Samostatný projekt** (nový Git repo `eshop-frontend`) nasazený na Vercelu
- Multi-tenant: jedna appka, middleware detekuje doménu → načte konfiguraci e-shopu
- SSR/SSG pro maximální SEO výkon
- Vlastní custom domény per e-shop

### 2. E-shop Administrace (NOVÝ modul v SystemPro)
- Nové moduly v existující aplikaci: Správa e-shopů, Produkty, Objednávky, Page builder, Blog
- Stávající modulový systém práv (role-based, konfigurovatelné per zaměstnanec)
- Stávající zaměstnanci jako admini e-shopů

### 3. Sdílená databáze (existující Supabase)
- Nové tabulky v existující DB
- Stejné patterny: Czech DB columns, mappers, RLS policies

---

## Klíčové požadavky

- **SEO #1 priorita** - zákon zakazuje marketing e-cigaret, veškerý traffic z organického vyhledávání
- **10+ e-shopů** - všechny prodávají e-cigarety, likidy, příchutě, náhradní díly
- **Unikátní obsah per e-shop** - AI přetextování s různým tónem hlasu a cílovou skupinou
- **Varianty produktů** - nikotinová síla, odpor žhavící hlavy, barva
- **Alza-style zobrazení variant** - barvy rozbalené jako samostatné karty v kategorii, technické parametry jako dropdown na detailu
- **301 přesměrování** - automatické při smazání varianty
- **Společný sklad** - jedno skladové množství napříč e-shopy
- **Sdílené obrázky** - stejné fotky pro všechny e-shopy
- **Page builder** - bloky pro homepage a speciální stránky
- **Blog per e-shop** - obsahové SEO
- **CSV/XML feed import** - jednorázový i pravidelná sync ze Shoptetu
- **Zákazníci oddělení** per e-shop
- **Doprava** - napojení na přepravce (Zásilkovna, PPL, DPD)
- **Ověř 18** - integrace pro ověření věku (později)
- **Pohoda/mServer** - export objednávek jako faktury (později)
- **Vícejazyčnost** - zatím CZ, architektura připravená na další jazyky

---

## Databázové schéma

### Jádro e-shop systému

```sql
eshopy (
  id SERIAL PRIMARY KEY,
  nazev TEXT NOT NULL,
  domena TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  favicon_url TEXT,
  primarni_barva TEXT DEFAULT '#3B82F6',
  sekundarni_barva TEXT DEFAULT '#1E293B',
  font TEXT DEFAULT 'Inter',
  ton_hlasu TEXT,
  cilova_skupina TEXT,
  ai_instrukce TEXT,
  kontaktni_email TEXT,
  kontaktni_telefon TEXT,
  ico TEXT,
  dic TEXT,
  nazev_firmy TEXT,
  adresa_firmy TEXT,
  obchodni_podminky TEXT,
  gdpr_text TEXT,
  seo_title_sablona TEXT,
  seo_description_sablona TEXT,
  aktivni BOOLEAN DEFAULT true,
  vytvoreno TIMESTAMPTZ DEFAULT now(),
  aktualizovano TIMESTAMPTZ DEFAULT now()
)

presmerovani (
  id SERIAL PRIMARY KEY,
  eshop_id INT NOT NULL REFERENCES eshopy(id) ON DELETE CASCADE,
  stara_url TEXT NOT NULL,
  nova_url TEXT NOT NULL,
  typ INT DEFAULT 301,
  vytvoreno TIMESTAMPTZ DEFAULT now()
)
```

### Produkty a varianty

```sql
produkty (
  id SERIAL PRIMARY KEY,
  sku TEXT UNIQUE,
  nazev TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  znacka TEXT,
  vyrobce TEXT,
  ean TEXT,
  hmotnost DECIMAL,
  rozmery JSONB,
  zakladni_popis TEXT,
  zakladni_kratky_popis TEXT,
  skladem INT DEFAULT 0,
  min_skladem INT DEFAULT 0,
  aktivni BOOLEAN DEFAULT true,
  feed_id TEXT,
  feed_data JSONB,
  vytvoreno TIMESTAMPTZ DEFAULT now(),
  aktualizovano TIMESTAMPTZ DEFAULT now()
)

atributy_typy (
  id SERIAL PRIMARY KEY,
  nazev TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  typ_zobrazeni TEXT DEFAULT 'dropdown',
  rozbalit_v_kategorii BOOLEAN DEFAULT false,
  poradi INT DEFAULT 0,
  vytvoreno TIMESTAMPTZ DEFAULT now()
)

atributy_hodnoty (
  id SERIAL PRIMARY KEY,
  atribut_typ_id INT NOT NULL REFERENCES atributy_typy(id) ON DELETE CASCADE,
  hodnota TEXT NOT NULL,
  slug TEXT NOT NULL,
  hex_barva TEXT,
  poradi INT DEFAULT 0
)

produkty_varianty (
  id SERIAL PRIMARY KEY,
  produkt_id INT NOT NULL REFERENCES produkty(id) ON DELETE CASCADE,
  sku TEXT,
  nazev TEXT NOT NULL,
  slug TEXT NOT NULL,
  cena_zakladni DECIMAL NOT NULL DEFAULT 0,
  skladem INT DEFAULT 0,
  ean TEXT,
  aktivni BOOLEAN DEFAULT true,
  feed_id TEXT,
  vytvoreno TIMESTAMPTZ DEFAULT now(),
  aktualizovano TIMESTAMPTZ DEFAULT now()
)

varianty_atributy (
  id SERIAL PRIMARY KEY,
  varianta_id INT NOT NULL REFERENCES produkty_varianty(id) ON DELETE CASCADE,
  atribut_hodnota_id INT NOT NULL REFERENCES atributy_hodnoty(id) ON DELETE CASCADE,
  UNIQUE(varianta_id, atribut_hodnota_id)
)

produkty_obrazky (
  id SERIAL PRIMARY KEY,
  produkt_id INT NOT NULL REFERENCES produkty(id) ON DELETE CASCADE,
  varianta_id INT REFERENCES produkty_varianty(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  poradi INT DEFAULT 0,
  hlavni BOOLEAN DEFAULT false
)
```

### Kategorie

```sql
kategorie (
  id SERIAL PRIMARY KEY,
  nazev TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  rodic_id INT REFERENCES kategorie(id) ON DELETE SET NULL,
  popis TEXT,
  poradi INT DEFAULT 0,
  aktivni BOOLEAN DEFAULT true
)

eshop_kategorie (
  id SERIAL PRIMARY KEY,
  eshop_id INT NOT NULL REFERENCES eshopy(id) ON DELETE CASCADE,
  kategorie_id INT NOT NULL REFERENCES kategorie(id) ON DELETE CASCADE,
  nazev_override TEXT,
  popis_override TEXT,
  seo_title TEXT,
  seo_description TEXT,
  poradi INT DEFAULT 0,
  aktivni BOOLEAN DEFAULT true,
  UNIQUE(eshop_id, kategorie_id)
)

produkty_kategorie (
  id SERIAL PRIMARY KEY,
  produkt_id INT NOT NULL REFERENCES produkty(id) ON DELETE CASCADE,
  kategorie_id INT NOT NULL REFERENCES kategorie(id) ON DELETE CASCADE,
  poradi INT DEFAULT 0,
  UNIQUE(produkt_id, kategorie_id)
)
```

### E-shop ↔ Produkty

```sql
eshop_produkty (
  id SERIAL PRIMARY KEY,
  eshop_id INT NOT NULL REFERENCES eshopy(id) ON DELETE CASCADE,
  produkt_id INT NOT NULL REFERENCES produkty(id) ON DELETE CASCADE,
  cena DECIMAL NOT NULL DEFAULT 0,
  cena_pred_slevou DECIMAL,
  nazev_override TEXT,
  kratky_popis TEXT,
  dlouhy_popis TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_slug TEXT,
  ai_stav TEXT DEFAULT 'ceka',
  aktivni BOOLEAN DEFAULT true,
  poradi INT DEFAULT 0,
  vytvoreno TIMESTAMPTZ DEFAULT now(),
  aktualizovano TIMESTAMPTZ DEFAULT now(),
  UNIQUE(eshop_id, produkt_id)
)

eshop_produkty_varianty (
  id SERIAL PRIMARY KEY,
  eshop_produkt_id INT NOT NULL REFERENCES eshop_produkty(id) ON DELETE CASCADE,
  varianta_id INT NOT NULL REFERENCES produkty_varianty(id) ON DELETE CASCADE,
  cena_override DECIMAL,
  aktivni BOOLEAN DEFAULT true,
  UNIQUE(eshop_produkt_id, varianta_id)
)
```

### Zákazníci

```sql
zakaznici (
  id SERIAL PRIMARY KEY,
  eshop_id INT NOT NULL REFERENCES eshopy(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  heslo_hash TEXT,
  jmeno TEXT,
  prijmeni TEXT,
  telefon TEXT,
  vek_overen BOOLEAN DEFAULT false,
  aktivni BOOLEAN DEFAULT true,
  vytvoreno TIMESTAMPTZ DEFAULT now(),
  posledni_prihlaseni TIMESTAMPTZ,
  UNIQUE(eshop_id, email)
)

zakaznici_adresy (
  id SERIAL PRIMARY KEY,
  zakaznik_id INT NOT NULL REFERENCES zakaznici(id) ON DELETE CASCADE,
  typ TEXT NOT NULL DEFAULT 'dodaci',
  jmeno TEXT,
  prijmeni TEXT,
  ulice TEXT,
  mesto TEXT,
  psc TEXT,
  stat TEXT DEFAULT 'CZ',
  vychozi BOOLEAN DEFAULT false
)
```

### Objednávky

```sql
objednavky (
  id SERIAL PRIMARY KEY,
  eshop_id INT NOT NULL REFERENCES eshopy(id) ON DELETE CASCADE,
  zakaznik_id INT REFERENCES zakaznici(id) ON DELETE SET NULL,
  cislo_objednavky TEXT NOT NULL,
  stav TEXT NOT NULL DEFAULT 'nova',
  celkova_cena DECIMAL NOT NULL DEFAULT 0,
  doprava_cena DECIMAL DEFAULT 0,
  platba_cena DECIMAL DEFAULT 0,
  doprava_typ TEXT,
  platba_typ TEXT,
  sledovaci_cislo TEXT,
  poznamka TEXT,
  interni_poznamka TEXT,
  pohoda_export BOOLEAN DEFAULT false,
  prirazeno_komu INT,
  fakturacni_adresa JSONB,
  dodaci_adresa JSONB,
  vytvoreno TIMESTAMPTZ DEFAULT now(),
  aktualizovano TIMESTAMPTZ DEFAULT now(),
  UNIQUE(eshop_id, cislo_objednavky)
)

objednavky_polozky (
  id SERIAL PRIMARY KEY,
  objednavka_id INT NOT NULL REFERENCES objednavky(id) ON DELETE CASCADE,
  produkt_id INT REFERENCES produkty(id) ON DELETE SET NULL,
  varianta_id INT REFERENCES produkty_varianty(id) ON DELETE SET NULL,
  nazev TEXT NOT NULL,
  cena DECIMAL NOT NULL,
  pocet INT NOT NULL DEFAULT 1,
  celkem DECIMAL NOT NULL
)

objednavky_historie (
  id SERIAL PRIMARY KEY,
  objednavka_id INT NOT NULL REFERENCES objednavky(id) ON DELETE CASCADE,
  stav_z TEXT,
  stav_na TEXT NOT NULL,
  poznamka TEXT,
  zmenil INT,
  vytvoreno TIMESTAMPTZ DEFAULT now()
)
```

### Doprava a platby

```sql
eshop_doprava (
  id SERIAL PRIMARY KEY,
  eshop_id INT NOT NULL REFERENCES eshopy(id) ON DELETE CASCADE,
  nazev TEXT NOT NULL,
  typ TEXT NOT NULL,
  cena DECIMAL NOT NULL DEFAULT 0,
  zdarma_od DECIMAL,
  konfigurace JSONB DEFAULT '{}',
  aktivni BOOLEAN DEFAULT true,
  poradi INT DEFAULT 0
)

eshop_platby (
  id SERIAL PRIMARY KEY,
  eshop_id INT NOT NULL REFERENCES eshopy(id) ON DELETE CASCADE,
  nazev TEXT NOT NULL,
  typ TEXT NOT NULL,
  cena DECIMAL NOT NULL DEFAULT 0,
  konfigurace JSONB DEFAULT '{}',
  aktivni BOOLEAN DEFAULT true,
  poradi INT DEFAULT 0
)
```

### Page builder

```sql
bloky_typy (
  id SERIAL PRIMARY KEY,
  nazev TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  popis TEXT,
  vychozi_konfigurace JSONB DEFAULT '{}',
  schema_konfigurace JSONB DEFAULT '{}'
)

stranky_bloky (
  id SERIAL PRIMARY KEY,
  eshop_id INT NOT NULL REFERENCES eshopy(id) ON DELETE CASCADE,
  stranka TEXT NOT NULL DEFAULT 'homepage',
  stranka_id INT,
  blok_typ_id INT NOT NULL REFERENCES bloky_typy(id) ON DELETE CASCADE,
  konfigurace JSONB DEFAULT '{}',
  poradi INT DEFAULT 0,
  aktivni BOOLEAN DEFAULT true,
  vytvoreno TIMESTAMPTZ DEFAULT now(),
  aktualizovano TIMESTAMPTZ DEFAULT now()
)
```

### Blog

```sql
blog_clanky (
  id SERIAL PRIMARY KEY,
  eshop_id INT NOT NULL REFERENCES eshopy(id) ON DELETE CASCADE,
  nazev TEXT NOT NULL,
  slug TEXT NOT NULL,
  kratky_popis TEXT,
  obsah TEXT,
  obrazek_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  autor_id INT,
  stav TEXT DEFAULT 'koncept',
  publikovano_v TIMESTAMPTZ,
  tagy TEXT[] DEFAULT '{}',
  ai_stav TEXT,
  vytvoreno TIMESTAMPTZ DEFAULT now(),
  aktualizovano TIMESTAMPTZ DEFAULT now(),
  UNIQUE(eshop_id, slug)
)
```

### Feed import

```sql
feed_konfigurace (
  id SERIAL PRIMARY KEY,
  nazev TEXT NOT NULL,
  url TEXT,
  typ TEXT NOT NULL DEFAULT 'csv',
  oddelovac TEXT DEFAULT ';',
  kodovani TEXT DEFAULT 'utf-8',
  mapovani JSONB DEFAULT '{}',
  auto_sync BOOLEAN DEFAULT false,
  sync_interval TEXT DEFAULT 'daily',
  posledni_sync TIMESTAMPTZ,
  posledni_sync_stav TEXT,
  posledni_sync_log TEXT,
  aktivni BOOLEAN DEFAULT true,
  vytvoreno TIMESTAMPTZ DEFAULT now()
)

feed_log (
  id SERIAL PRIMARY KEY,
  feed_id INT NOT NULL REFERENCES feed_konfigurace(id) ON DELETE CASCADE,
  typ TEXT NOT NULL,
  stav TEXT NOT NULL,
  novych_produktu INT DEFAULT 0,
  aktualizovano_produktu INT DEFAULT 0,
  chyb INT DEFAULT 0,
  detaily JSONB,
  spusteno TIMESTAMPTZ DEFAULT now(),
  dokonceno TIMESTAMPTZ
)
```

---

## Struktura složek

### SystemPro (admin modul)
```
src/features/eshop/
  eshop-store.ts              # Hlavní store: e-shopy, nastavení
  eshop-produkty-store.ts     # Produkty, varianty, kategorie
  eshop-objednavky-store.ts   # Objednávky, historie
  eshop-blog-store.ts         # Blog články
  eshop-page-builder-store.ts # Page builder bloky
  eshop-feed-store.ts         # Feed import/sync
  eshop-helpers.ts            # Business logika
  eshop-ai.ts                 # AI přetextování logika
  index.ts

components/eshop/
  EshopDashboard.tsx           # Přehled e-shopů
  EshopSettings.tsx            # Nastavení e-shopu
  ProductManager.tsx           # Správa produktů + varianty
  OrderManager.tsx             # Správa objednávek
  CategoryManager.tsx          # Strom kategorií
  PageBuilder.tsx              # Drag & drop page builder
  BlogEditor.tsx               # WYSIWYG editor článků
  FeedImport.tsx               # Import z CSV/XML
  AiTextGenerator.tsx          # UI pro AI přetextování
```

### E-shop Frontend (nový projekt - `eshop-frontend`)
```
app/
  layout.tsx                   # Root layout
  page.tsx                     # Homepage (page builder bloky)
  produkt/[slug]/page.tsx      # Detail produktu (SSR)
  kategorie/[...slug]/page.tsx # Kategorie (SSR)
  blog/[slug]/page.tsx         # Blog článek
  kosik/page.tsx               # Košík
  objednavka/page.tsx          # Checkout
  ucet/                        # Zákaznický účet

middleware.ts                  # Detekce domény → shop config
lib/
  shop-config.ts               # Načtení a cache konfigurace
  seo.ts                       # Meta tagy, JSON-LD
  cart.ts                      # Logika košíku
```

---

## Fáze implementace

1. **Databáze** - tabulky, RLS, typy, mappers
2. **Admin - Produkty** - CRUD, varianty, kategorie
3. **Admin - E-shopy** - nastavení, přiřazení produktů
4. **CSV/XML Import** - feed, mapování, sync
5. **E-shop Frontend** - SSR, SEO, kategorie, detail
6. **AI Přetextování** - Claude API, progress, schválení
7. **Page Builder** - bloky, drag & drop
8. **Blog** - WYSIWYG, SEO
9. **Objednávky** - checkout, správa
10. **Doprava/Platby** - přepravci, brány
11. **Zákazníci** - účty, Ověř 18
12. **Rozšíření** - kupony, věrnostní program, Pohoda export, vícejazyčnost
