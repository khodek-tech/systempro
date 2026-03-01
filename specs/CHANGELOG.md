# SYSTEM.PRO - Specification Changelog

Všechny změny ve specifikacích jsou zaznamenány v tomto souboru.

## [2.22.1] - 2026-03-01

### Opraveno

#### Odvody - datové filtrování (bugfix)
- **parseCzechDate()**: Nová utility funkce pro parsování českého datového formátu "D. M. YYYY"
- **fetchCashToCollect()**: Filtruje záznamy podle období (pouze záznamy do konce aktuálního collection period)
- **submitCollection()**: Aktualizuje pouze záznamy spadající do aktuálního období (fetch IDs → filter → update by IDs)
- **Bug**: Na 1. března se do částky k odvodu za období "16. - Konec února" započítaly i tržby z 1. března

## [2.22.0] - 2026-03-01

### Přidáno

#### UX vylepšení e-shopu (Fáze 11.5)
- **Profil zákazníka**: Editace jména, příjmení a telefonu na stránce `/ucet` s inline formulářem
- **Změna hesla**: Formulář pro změnu hesla na stránce `/ucet` (současné heslo + nové + potvrzení)
- **Zapomenuté heslo**: Nová stránka `/ucet/zapomenute-heslo` — odešle reset email přes Resend
- **Reset hesla**: Nová stránka `/ucet/reset-hesla?token=...` — nastavení nového hesla z emailového odkazu
- **Checkout validace**: Email regex, PSČ formát (5 číslic), vizuální chybové zprávy per pole
- **Dynamická doprava zdarma**: Header načítá `zdarma_od` threshold z DB místo hardcoded hodnoty
- **Edge Function `customer-auth` v2**: Nové akce `update-profile`, `change-password`, `request-reset`, `reset-password`

## [2.21.0] - 2026-03-01

### Přidáno

#### Pohoda export objednávek (Fáze 11.4)
- **API route `/api/pohoda/export-invoice`**: Export e-shop objednávek jako vydané faktury do Pohoda mServer
- **Pohoda XML formát**: `inv:invoice` s `invoiceHeader` + `invoiceDetail` + doprava/platba jako řádky
- **UI tlačítko v OrderDetail**: Export jednotlivé objednávky do Pohody
- **Bulk export v OrderList**: Hromadný export vybraných objednávek
- **Pohoda badge**: Zelený badge "Pohoda" u exportovaných objednávek

## [2.20.0] - 2026-03-01

### Přidáno

#### Admin E-shop Dashboard + Email notifikace + Wishlist (Fáze 11.1-11.3)
- **Wishlist DB sync**: Tabulka `wishlist`, Edge Function `wishlist-sync`, merge localStorage↔DB při přihlášení
- **Email notifikace**: Edge Function `send-order-email` s Resend API, šablony pro potvrzení/změnu stavu/odeslání
- **Tabulka `email_log_eshop`**: Log odeslaných emailů s typem a statusem
- **Admin Dashboard modul**: KPI karty, tržby graf, koláč stavů, top produkty, nízký sklad
- **PostgreSQL RPC funkce**: `eshop_dashboard_stats`, `eshop_revenue_chart`, `eshop_top_products`, `eshop_low_stock`
- **Dashboard filtrování**: Per e-shop, datumové období (dnes/týden/měsíc/rok)
- **Konfigurace odesílatele**: Sloupce `odesilatel_email` a `odesilatel_jmeno` v tabulce `eshopy`

## [2.19.0] - 2026-03-01

### Změněno

#### Produkční příprava a optimalizace (Fáze 9)
- **AI model upgrade**: Edge function `generate-ai-text` přepnuta z `claude-haiku-4-5-20251001` na `claude-sonnet-4-5-20250514` pro vyšší kvalitu textů
- **SEO vylepšení**:
  - robots.txt: přidán `Disallow: /pokladna/` a `Disallow: /ucet/` (neindexovat checkout a účet)
  - Layout: přidány default Open Graph tagy (`siteName`, `locale: cs_CZ`, fallback logo)
  - Kategorie: přidány OG tagy a BreadcrumbList JSON-LD
  - Produkt: přidán BreadcrumbList JSON-LD strukturovaná data
- **Performance**:
  - HeroBanner: nahrazen CSS `background-image` za `next/image` s `priority` (LCP optimalizace)
  - ProductCarousel: opraven N+1 query problém (batch fetch obrázků jedním dotazem)
  - Header: kontaktní údaje skryté na mobilu (prevence overflow)
- **Error handling**:
  - Nový `app/error.tsx` - globální error boundary s tlačítkem "Zkusit znovu"
  - Nový `app/loading.tsx` - globální skeleton loading state
  - Loading states pro produkt detail, kategorii a blog post
- **RLS audit**: Všech 25+ tabulek má RLS zapnuté, žádné `rls_disabled` nebo `UNRESTRICTED` varování

## [2.18.0] - 2026-03-01

### Přidáno

#### E-shop Page Builder Frontend + SEO vylepšení (Fáze 7)
- **Frontend bloky**: 5 nových komponent na eshop-frontend:
  - `TextBlock.tsx` — HTML obsah s prose styly a zarovnáním
  - `Banner.tsx` — oznamovací banner s vlastními barvami a odkazem
  - `FAQ.tsx` — accordion FAQ sekce (client component)
  - `Reviews.tsx` — zákaznické recenze s hvězdičkami (1-5)
  - `ProductCarousel.tsx` + `ProductCarouselClient.tsx` — horizontální karusel produktů s autoplay
- **BlockRenderer.tsx**: Všech 10 typů bloků nyní plně renderováno (předtím jen 5)
- **@tailwindcss/typography**: Nainstalován a aktivován pro prose třídy (bug fix)
- **SEO vylepšení**:
  - Canonical URL na všech stránkách (metadataBase + alternates.canonical)
  - Twitter card meta tagy (summary_large_image) na layout, produkt, blog
  - Shop-specific sitemap (filtr přes eshop_produkty, eshop_kategorie, blog_clanky per shop)
  - AggregateOffer JSON-LD pro produkty s variantami (cenový rozsah lowPrice/highPrice)
  - FAQPage JSON-LD schema pro FAQ bloky na homepage
- **Specifikace**: `specs/modules/eshop-page-builder.spec.yaml`

## [2.17.0] - 2026-03-01

### Přidáno

#### E-shop AI Přetextování (Fáze 9)
- **Edge Function `generate-ai-text`**: Volá Claude API (claude-sonnet-4-5-20250514) pro generování textů
  - Produkty: krátký popis, dlouhý popis (HTML), SEO title, SEO description
  - Blog články: krátký popis, obsah (HTML), SEO title, SEO description
  - Per-shop nastavení: tón hlasu, cílová skupina, AI instrukce
  - Retry s exponential backoff při rate limiting (429)
  - JSON parsing fallback (code block extraction, regex)
- **DB tabulky**: `ai_konfigurace` (API klíč), `ai_log` (audit trail generování)
- **AiPreviewModal**: Side-by-side porovnání původní/vygenerované texty
  - Checkboxy pro výběr polí k aplikaci
  - Editovatelné vygenerované texty před schválením
  - Zobrazení usage (tokeny, čas)
- **Produkty**: Tlačítko "AI Přetextovat" v product detail modalu
  - Hromadné AI generování s checkboxy + progress bar
  - Filtr podle AI statusu v toolbaru
- **Blog**: Tlačítko "AI Přetextovat" v blog editoru (sidebar)
  - AI status badge v seznamu článků
- **Admin UI**: AI záložka v E-shop modulu pro správu Anthropic API klíče
  - Maskovaný vstup, indikátor stavu (nakonfigurováno/chybí)
- **AI status**: ceka → generuje → vygenerovano → schvaleno (workflow)

## [2.16.0] - 2026-03-01

### Přidáno

#### E-shop Blog: Kompletní blog modul (Fáze 8)
- **Admin modul**: Nový modul `EshopBlogModule` pro správu blogových článků per e-shop
  - Zustand store `eshop-blog-store.ts` s CRUD, realtime, image upload
  - TipTap WYSIWYG editor s toolbarem (bold/italic/headings/lists/images/links)
  - Dvousloupcový formulář: obsah + sidebar (SEO, tagy, obrázek, stav)
  - Tag management s autocomplete z existujících tagů
  - Drag & drop upload obrázků do Supabase Storage
  - Náhled článku s DOMPurify sanitizací
  - Filtry: search + stav (vše/koncepty/plánované/publikované)
- **Plánované publikování**: Stav 'planovany' + pg_cron job (každé 2 min) auto-publikuje
- **Frontend vylepšení** (eshop-frontend):
  - `/blog/tag/[tag]` stránka s paginací
  - JSON-LD ArticleSchema (BlogPosting) na detailu článku
  - RSS feed na `/blog/feed.xml`
  - Sekce "Související články" na detailu
  - Tagy jako klikatelné odkazy
- **Nové soubory**: EshopBlogModule, eshop-blog-full-view, BlogPostList, BlogPostFormModal, BlogPostPreviewModal, BlogRichTextEditor, BlogTagInput, BlogImageUpload, eshop-blog-store
- **DB**: pg_cron job `publish-scheduled-blog-posts`, funkce `publish_scheduled_blog_posts()`

## [2.15.0] - 2026-03-01

### Změněno

#### Chat: Paginace, Oddělovač nepřečtených, Fulltext vyhledávání
- **Paginace zpráv**: Lazy-loading posledních 50 zpráv na skupinu místo načítání VŠECH zpráv naráz
  - Infinite scroll nahoru pro starší zprávy s zachováním scroll pozice
  - `groupMessages: Record<string, ChatGroupPaginationState>` nahrazuje `messages: ChatMessage[]`
  - Sidebar souhrny přes RPC `get_chat_group_summaries` (nový typ `ChatGroupSummary`)
- **Oddělovač nepřečtených**: Červená linie "Nové zprávy" mezi přečtenými a nepřečtenými zprávami
  - Automatický scroll na oddělovač při otevření skupiny
  - Snapshot `firstUnreadTimestamp` při mount — nezměnitelný po markAsRead
- **Fulltext vyhledávání přes DB**: RPC `search_chat_messages` s pg_trgm ILIKE
  - Hledá přes celou historii všech skupin uživatele (ne jen načtené zprávy)
  - Debounce 300ms, overlay panel s výsledky, navigace na výsledek
- **DB migrace**: Indexy `(id_skupiny, vytvoreno DESC)`, pg_trgm extension + GIN index
- **Nové typy**: `ChatGroupSummary`, `ChatGroupPaginationState`, `ChatSearchResult`
- **Nové mappery**: `mapDbToChatGroupSummary`, `mapDbToChatSearchResult`
- **Store refaktor**: Nové akce `fetchGroupSummaries`, `fetchMessagesForGroup`, `loadOlderMessages`, `searchMessages`, `navigateToSearchResult`
- **Komponenty**: ChatConversation (infinite scroll, unread separator, DB search), ChatGroupItem (summaries), ChatGroupList (summaries řazení)
- **Performance**: `fetchChatData` nenačítá žádné zprávy — pouze groups + readStatuses + summaries
- **Auto-sync**: Refresh pouze summaries + readStatuses + aktivní skupiny (ne všech zpráv)

## [2.14.0] - 2026-02-26

### Přidáno

#### Nový modul: Produkty v motivaci
- **Účel**: Read-only přehled produktů zařazených do motivačního programu pro prodejce
- **Přístup**: Konfigurovatelný přes Nastavení → Moduly (výchozí: Prodavač role-1)
- **UI**: Fullscreen dialog (95vw × 95vh) s tabulkou — sloupce Kód, Název, EAN, Cena
- **Funkce**: Textový filtr (kód/název/EAN), řazení (kód/název/cena), počet produktů v headeru
- **Realtime**: Změny motivace se propisují okamžitě (sdílí subscribeRealtime() z motivation-store)
- **Žádné editace**: Čistě zobrazovací modul bez checkboxů, bez footeru s tlačítky
- **Nové soubory**: `MotivationProductsModule.tsx`, `motivation-products-modal.tsx`, `motivation-products.spec.yaml`
- **Upravené soubory**: `ui-store.ts`, `registry.ts`, `index.ts`, `default-modules.ts`

## [2.13.0] - 2026-02-25

### Přidáno

#### Převodky: Odeslání do Pohody
- **Účel**: Administrátor může manuálně odeslat vychystanou převodku do účetního systému Pohoda
- **Edge Function**: `send-prevodka` — sestaví XML převodku, odešle na mServer, zpracuje odpověď
- **XML formát**: Číselná řada `SPr`, skutečné vychystané množství, sklady přes textové `<ids>`
- **UI**: Tlačítko "Odeslat do Pohody" v detailu převodky + Pohoda status sekce (úspěch/chyba)
- **Chování**: Po úspěchu se stav změní na `odeslano`, při chybě zobrazí detail + "Odeslat znovu"
- **DB**: Nový sloupec `pohoda_odeslano_at` v tabulce `prevodky`
- **Nové**: Edge Function `send-prevodka`, store metoda `sendToPohoda()`
- **Upravené**: `PrevodkaDetail.tsx` (Pohoda tlačítko + status), `prevodka.types.ts`, `mappers.ts`

## [2.12.0] - 2026-02-25

### Přidáno

#### Převodky: Ruční přidání produktu při pickingu
- **Účel**: Obsluha může při pickování ručně přidat produkt do převodky (mimo původní seznam)
- **UI**: Tlačítko "Přidat produkt" v headeru picking UI → fullscreen dialog s vyhledáváním
- **Vyhledávání**: Podle názvu, kódu nebo EAN v `pohoda_zasoby` (filtrováno na zdrojový sklad)
- **Chování**: Přidaný produkt je rovnou označen jako vychystaný (picker ho má fyzicky v ruce)
- **Duplicity**: Upozornění pokud produkt již v převodce (badge "v převodce"), ale možnost přesto přidat
- **Nové**: `AddProductDialog` komponenta, `addItemToPrevodka()` v prevodky-store
- **Upravené**: `PickingView.tsx` (nové tlačítko + integrace dialogu)

## [2.11.0] - 2026-02-23

### Přidáno

#### Chat: WhatsApp-style fajfky u DM zpráv
- **Účel**: Vizuální indikátor stavu doručení/přečtení u vlastních zpráv v přímých zprávách (1:1)
- **Chování**: ✓ šedá = zpráva doručena (uložena v DB), ✓✓ modrá = přečtena příjemcem
- **Implementace**: Využívá stávající `chat_stav_precteni.lastReadAt` bez změny DB
- **Omezení**: Pouze u DM, ne ve skupinových chatech
- **Nové**: `getMessageDeliveryStatus()` helper v `chat-helpers.ts`
- **Upravené**: `ChatMessage.tsx` (nový prop `deliveryStatus` + ikony `Check`/`CheckCheck`), `ChatConversation.tsx` (výpočet a předání statusu)
- **Specifikace**: `chat.spec.yaml` — feature `delivery_status`, scénář CHAT-011
- **Testy**: `testy.md` — nový test CHAT-011

---

## [2.10.1] - 2026-02-21

### Změněno

#### Posun cron časů Pohoda synchronizace
- **Důvod**: ePodnik restartuje server v noci — sync okno je až od 4:15 CET (3:15 UTC). Předchozí časy začínaly od 3:05 UTC (4:05 CET), což bylo mimo okno a způsobovalo HTTP 500.
- **DB změna**: `cron.alter_job` — posun `sync-zasoby-daily` z `5 3 * * *` na `15 3 * * *`, `sync-pohyby-daily` z `20 3 * * *` na `25 3 * * *`
- `sync-prodejky-daily` beze změny (`35 3 * * *` — již bylo v okně)
- Vše končí do 04:36 CET, s velkou rezervou před 05:15 CET

---

## [2.10.0] - 2026-02-21

### Přidáno

#### Záložka "Pravidelné úkoly" + pozastavení/obnovení + aktualizace manuálu
- **Spec**: `tasks.spec.yaml` — přidáno `repeatPaused?: boolean` do data_model, nová feature `recurring_tab`, aktualizovaná feature `task_tabs` o záložku "Pravidelné úkoly", nový scénář TASK-010
- **Testy**: `testy.md` — přidán test TASK-010 (pozastavení a obnovení pravidelného úkolu)
- **Manuál**: `manual-content.ts` — kompletně přepsaná sekce `tasks` s podrobným návodem pokrývajícím: základní orientaci (4 záložky), vytvoření úkolu, plnění jako příjemce, schvalování/vracení, delegaci, pravidelné úkoly s pozastavením, komentáře a přílohy. Rozšířeno z 5 na 35+ kroků, z 3 na 9 FAQ, z 2 na 5 tipů.

---

## [2.9.0] - 2026-02-19

### Přidáno

#### Nový modul: Převodky (picking + EAN skenování)
- **Účel**: Digitalizace procesu distribuce zboží na prodejny — místo tištěného Excelu systém generuje interní převodky (transfer orders) a přiřazuje je zaměstnancům jako úkoly
- **Přístup**: Administrator (role-2), Majitel (role-8) pro správu; všichni zaměstnanci jako pickeři
- **DB migrace**: `create_prevodky_tables` — tabulky `prevodky` + `prevodky_polozky` s RLS + indexy, sloupec `typ_ukolu` v `ukoly`
- **Workflow**: nova → picking → vychystano → odeslano → potvrzeno (+ zrusena)
- **Generování**: Admin vybere pickery per prodejna, systém vytvoří N převodek + N úkolů (výpočet z `get_rozdeleni_data` RPC)
- **Picking UI**: Fullscreen view s EAN scanner podporou — auto-focus input, qty=1 auto-confirm, qty>1 dialog, partial picking s povinnou poznámkou
- **Admin UI**: Sekce "Převodky" v Automatizace s tabulkou přehledu, filtry stavu, detail view s položkami
- **Task integrace**: Úkol typu `prevodka` automaticky otevírá picking UI, tlačítko "Otevřít picking" v task detail modalu
- **Realtime**: Subscriptions na `prevodky` + `prevodky_polozky` tabulky
- **Pohoda příprava**: DB sloupce `pohoda_odeslano`, `pohoda_cislo_dokladu`, `pohoda_chyba` pro budoucí XML integraci
- **Nové soubory**: `prevodka.types.ts`, `prevodky-store.ts`, `PickingView.tsx`, `PrevodkaDetail.tsx`, `GenerateDialog.tsx`, `QuantityDialog.tsx`, API routes (`generate`, `[id]`, `[id]/cancel`)
- **Upravené soubory**: `mappers.ts`, `init.ts`, `task.types.ts`, `AutomatizaceSettings.tsx`, `RoleView.tsx`, `task-detail-modal.tsx`, `types/index.ts`
- **Specifikace**: `prevodky.spec.yaml` (scénáře PREV-001 až PREV-005, edge cases PREV-E001 až PREV-E005)

## [2.8.0] - 2026-02-19

### Přidáno

#### Editace docházky v admin dashboardu
- **Účel**: Admin může kliknout na řádek v tabulce docházky/tržeb a editovat záznam
- **UI**: Editační modal se sekcemi Docházka (příchod, odchod, hodiny, absence) a Tržby (hotovost, karta, partner, pohyby, poznámka)
- **Auto-kalkulace**: Hodiny se automaticky přepočítají z příchod/odchod
- **DB**: `updateAttendanceRecord` aktualizuje pouze změněná pole v tabulce `dochazka`
- **Nové soubory**: `AttendanceEditModal.tsx`
- **Upravené soubory**: `admin-store.ts`, `attendance-table.tsx`, `sales-table.tsx`, `admin-view.tsx`
- **Specifikace**: Scénáře ATT-005, ATT-006 v `attendance.spec.yaml` a `testy.md`

## [2.7.0] - 2026-02-16

### Přidáno

#### Nový modul: Motivace prodejny
- **Účel**: Označení produktů s vyšším procentem motivační odměny
- **Přístup**: Administrátor (role-2), Majitel (role-8)
- **DB migrace**: `create_motivace_tables` — tabulky `motivace_nastaveni` (singleton, globální procento + výběr skladu) a `motivace_produkty` (označení produktů přes kód)
- **UI**: Fullscreen dialog (95vw × 95vh) s Excel-like tabulkou ~5400 produktů z Pohody
- **Funkce**: Textový filtr (kód/název/EAN), řazení všech sloupců, toggle checkbox, hromadné označení/odznačení vyfiltrovaných, buffered save (batch upsert)
- **Admin panel**: Nastavení motivačního procenta (%) a výběr skladu (z `pohoda_zasoby`)
- **Paginace**: Fetch po 1000 řádcích pro překonání Supabase limitu
- **Nové soubory**: `motivation.types.ts`, `motivation-store.ts`, `MotivationModule.tsx`, `motivation-modal.tsx`, `MotivationSettingsPanel.tsx`
- **Upravené soubory**: `mappers.ts`, `ui-store.ts`, `init.ts`, `default-modules.ts`, `registry.ts`, `ModuleSettingsDetail.tsx`
- **Specifikace**: `specs/modules/motivation.spec.yaml`, aktualizace `testy.md`, nápověda v `manual-content.ts`

---

## [2.6.1] - 2026-02-13

### Opraveno

#### Crash při editaci zaměstnance se starým formátem pracovní doby
- **Hlavní problém**: "Cannot read properties of undefined (reading 'sameAllWeek')" při otevření formuláře zaměstnance (např. Kunik Martin)
- **Příčina**: `pracovni_hodiny` v DB měl starý plochý formát `{ sameAllWeek, monday, ... }`, ale kód od v2.4.0 očekává `{ alternating, oddWeek: { sameAllWeek, ... } }`
- `lib/supabase/mappers.ts`: nová funkce `migrateWorkingHours()` — detekuje starý formát (chybí `alternating`) a automaticky obalí do `{ alternating: false, oddWeek: raw }`
- **DB migrace**: `migrate_old_working_hours_format` — jednorázová konverze všech záznamů se starým formátem

---

## [2.6.0] - 2026-02-13

### Opraveno

#### Real-time aktualizace chatu a úkolů
- **Hlavní problém**: Po v2.0.0 (cron centralizace) přestaly fungovat real-time aktualizace — druhý uživatel musel refreshnout stránku
- **Příčina**: Polling (15s) odstraněn, ale Supabase Realtime subscriptions nebyly spolehlivé (chybějící publikace + RLS politiky)
- **DB migrace 1**: `ALTER PUBLICATION supabase_realtime ADD TABLE chat_skupiny` — chyběla v publikaci
- **DB migrace 2**: `anon` SELECT RLS politiky pro `chat_zpravy`, `chat_skupiny`, `chat_stav_precteni`, `ukoly`, `komentare_ukolu` — pojistka pro Realtime eventy
- `chat-store.ts`: nové metody `startAutoSync()` / `stopAutoSync()` — polling 15s jako fallback
- `tasks-store.ts`: nové metody `startAutoSync()` / `stopAutoSync()` — polling 30s jako fallback
- `lib/supabase/init.ts`: auto-sync spuštěn v Phase 4, cleanup v `cleanupSubscriptions()`
- `chat-store.ts`, `tasks-store.ts`: opraveno error logging v Realtime subscribe callback — loguje `err` místo jen `status`
- Visibility change listener — při návratu na tab se data okamžitě refreshnou

---

## [2.5.0] - 2026-02-12

### Přidáno

#### Chat: 3 nové funkce — mazání zpráv, přímé zprávy (1:1), emoji picker

**Mazání vlastních zpráv**
- `chat-store.ts`: nová akce `deleteMessage(messageId)` — ověří vlastnictví, smaže z DB
- `ChatMessage.tsx`: tlačítko Trash2 viditelné na hover u vlastních zpráv s `window.confirm()`
- DB migrace: `REPLICA IDENTITY FULL` na `chat_zpravy` pro realtime DELETE eventy
- Realtime handler pro DELETE event na `chat_zpravy`

**Přímé zprávy (1:1)**
- DB migrace: `ALTER TABLE chat_skupiny ADD COLUMN typ TEXT NOT NULL DEFAULT 'group'` s CHECK constraint
- `chat.types.ts`: nový typ `ChatGroupType = 'group' | 'direct'`, `type` field v `ChatGroup`
- `mappers.ts`: mapování `typ` ↔ `type` v `mapDbToChatGroup`/`mapChatGroupToDb`
- `chat-store.ts`: nové akce `openNewDm()`, `closeNewDm()`, `startDirectMessage(otherUserId)`, `getDirectGroupWith()`
- `chat-helpers.ts`: nové funkce `getDirectGroupDisplayName()`, `sortDirectGroupsAlphabetically()`
- `ChatNewDmModal.tsx`: nová komponenta — modal se seznamem zaměstnanců, search, klik → DM
- `ChatGroupList.tsx`: tlačítko "Nová zpráva" (`MessageCirclePlus`), search hledá i dle jména u DM
- `ChatGroupItem.tsx`: ikona User/Users, display name pro DM, message preview bez prefixu u DM
- `ChatConversation.tsx`: header zobrazuje jméno + "Přímá zpráva" u DM
- `ChatGroupsSettings.tsx`: filtr `type === 'group'` — admin nevidí DM
- `getGroupsForUser()`: admin skupiny nahoře seřazené dle poslední zprávy, DM pod nimi abecedně
- Realtime handler pro INSERT na `chat_skupiny` (druhý uživatel vidí novou konverzaci)
- DB migrace: `REPLICA IDENTITY FULL` na `chat_skupiny`

**Emoji picker**
- Instalace `@emoji-mart/react` + `@emoji-mart/data`
- `ChatMessageInput.tsx`: tlačítko Smile, `<Picker>` z emoji-mart, vkládání na pozici kurzoru
- Click-outside handler pro zavření pickeru

#### Spec soubory
- `specs/modules/chat.spec.yaml`: features `delete_message`, `direct_messages`, `emoji_picker`; scénáře CHAT-008 až CHAT-010; edge cases CHAT-E005 až CHAT-E007
- `testy.md`: nové testovací scénáře

---

## [2.4.0] - 2026-02-12

### Změněno

#### Redesign pracovní doby zaměstnanců
- **Nový datový model:** `EmployeeWorkingHours` typ s volitelným střídáním lichý/sudý týden (dle ISO week čísla)
- `src/shared/types/base.types.ts`: přidán `EmployeeWorkingHours` interface, `User.workingHours` změněn na nový typ, odstraněn `startsWithShortWeek`
- `lib/supabase/mappers.ts`: odstraněno mapování `zacina_kratkym_tydnem`, `pracovni_hodiny` nyní ukládá `EmployeeWorkingHours`
- `src/features/shifts/shifts-store.ts`: kompletně přepsán — `isOddWeek()` místo `isShortWeekForUser()`, `isWorkDayForUser()` bez hardcoded dnů, `getEffectiveWorkingHours()` vždy z `user.workingHours`, `ShiftDay.isOddWeek` místo `isShortWeek`
- `src/admin/employee-form-store.ts`: nové akce `toggleAlternating()`, `setWeekDayHours()`, `toggleWeekSameAllWeek()`, `copyFromStore()`; odstraněn `startsWithShortWeek` stav a `setStartsWithShortWeek()`
- `components/admin-dashboard/settings/EmployeeFormModal.tsx`: kompletně přepsaná sekce pracovní doby — toggle střídání, per-week editor, tlačítko "Kopírovat z prodejny"
- `components/views/shifts-full-view.tsx`: badges "Lichý"/"Sudý" (jen při alternating), zpráva "Pracovní doba není nastavena", zdroj vždy "Vlastní"
- `src/features/presence/presence-store.ts`: aktualizovány volání `isWorkDayForUser()` a `getEffectiveWorkingHours()` na nové signatury
- `specs/modules/shifts.spec.yaml`: přepsány features, scénáře a edge cases pro nový model
- `testy.md`: aktualizované testovací scénáře SHIFT-001 až SHIFT-007

---

## [2.3.0] - 2026-02-12

### Přidáno

#### Klikatelné URL odkazy v chatu a úkolech
- `lib/linkify.tsx`: nová utilita `linkifyText()` — detekce URL v textu a vykreslení jako `<a>` s `target="_blank"`
- `components/chat/ChatMessage.tsx`: zprávy s URL se zobrazují jako klikatelné odkazy (vlastní: bílý, cizí: modrý)
- `components/shared/task-detail-modal.tsx`: popis úkolu a komentáře s URL se zobrazují jako klikatelné modré odkazy
- `specs/modules/chat.spec.yaml`: feature `clickable_urls`, scénář CHAT-007
- `specs/modules/tasks.spec.yaml`: feature `clickable_urls`, scénář TASK-009
- `testy.md`: přidány testy CHAT-007 a TASK-009

---

## [2.2.0] - 2026-02-12

### Opraveno

#### CashInfoModule: hotovost k odevzdání se nuluje po refreshi
- `modules/CashInfoModule.tsx`: přidán `useEffect` volající `fetchCashToCollect(activeStoreId)` při mountu
- Částka se nyní načítá z DB při každém mountu komponenty a při přepnutí prodejny
- `specs/modules/cash-info.spec.yaml`: přidán scénář CASH-004, přečíslován CASH-004→CASH-005
- `testy.md`: přidán test CASH-004

---

## [2.1.0] - 2026-02-10

### Opraveno

#### Ghost messages — reconciliace IMAP vs DB
- `lib/email/sync-core.ts`: po stažení nových zpráv se porovnají IMAP UIDs s DB UIDs
- Zprávy v DB které už neexistují na IMAP serveru (smazané/přesunuté) se odstraní
- Reconciliace běží pouze v `incremental` mode a pro složky s ≤10000 zprávami

#### Timeout ochrana pro email sync
- `lib/email/sync-core.ts`: nový parametr `timeoutMs` — kontrola před každou složkou
- Per-folder try/catch — selhání jedné složky neukončí celý sync
- `finally` blok vždy aktualizuje log (i při timeout)
- DB migrace: přidán stav `'timeout'` do check constraint na `emailovy_log.stav`

#### Stuck sync logs
- `app/api/cron/email-sync/route.ts`: na začátku každého cron běhu vyčistí logy starší 10 min ve stavu `running` → `timeout`
- Jednorázový cleanup: 1513 stuck logů Obchod účtu vyčištěno

### Změněno

#### Cron interval 5→10 min
- `vercel.json`: oba cron joby (`email-sync`, `tasks-repeat`) běží každých 10 min místo 5 min
- Šetří Vercel Pro execution time, 10 min stačí pro 2 účty s timeout ochranou

#### Cron endpoint — per-account timeout
- `app/api/cron/email-sync/route.ts`: `syncAccount()` dostává `timeoutMs: 120000` (2 min per account)
- S 2 účty = max 4 min, bezpečně pod 5 min Vercel limit

---

## [2.0.0] - 2026-02-09

### Změněno

#### Centralizace synchronizace: Vercel Cron Jobs místo browser polling
- **Email sync**: Každý browser polloval 1x/min → **1 cron job 1x/5min** (`/api/cron/email-sync`)
- **Tasks repeat check**: Každý browser polloval 1x/30s → **1 cron job 1x/5min** (`/api/cron/tasks-repeat`)
- **Chat refresh**: Každý browser polloval 1x/15s → **pouze Supabase Realtime** (žádný polling)
- S 30 uživateli ušetří ~3 CPU hodiny/hodinu (z ~180 requestů/min na 2 requesty/5min)

### Přidáno

#### Cron infrastruktura
- `lib/supabase/admin.ts` — Supabase service role client pro cron joby (bypass RLS)
- `lib/email/sync-core.ts` — extrahovaná IMAP sync logika sdílená mezi manual sync API a cron jobem
- `app/api/cron/email-sync/route.ts` — GET endpoint pro centrální email sync (auth: CRON_SECRET)
- `app/api/cron/tasks-repeat/route.ts` — GET endpoint pro centrální repeat check (auth: CRON_SECRET)
- `vercel.json` — Vercel Cron schedule (`*/5 * * * *` pro oba joby)

### Odstraněno

#### Browser polling
- `startAutoSync()` / `stopAutoSync()` odstraněny z email-store, tasks-store, chat-store
- `_autoSyncInterval` state odstraněn ze všech tří stores
- `checkAndCreateRepeatingTasks()` call z init.ts odstraněn (běží přes cron)
- Všechny `startAutoSync()` / `stopAutoSync()` volání odstraněny z `lib/supabase/init.ts`

### Změněno
- `app/api/email/sync/route.ts` — refaktorováno na volání `syncAccount()` z `lib/email/sync-core.ts`
- `middleware.ts` — `/api/cron/*` routes exempt z Supabase auth (používají vlastní CRON_SECRET)

#### Nové env proměnné (nutno nastavit ručně)
- `SUPABASE_SERVICE_ROLE_KEY` — z Supabase Dashboard → Settings → API
- `CRON_SECRET` — random string, nastavit ve Vercel Dashboard → Environment Variables

---

## [1.9.0] - 2026-02-09

### Vylepšeno

#### Produkční bezpečnost: logger místo console.error/warn (79 výskytů)
- Všech 13 souborů (`src/` stores + `lib/` utilities) nyní používá `logger` z `lib/logger.ts`
- V produkci se loguje pouze zpráva bez citlivých error objektů a stack traces

#### Inicializace: retry logika s exponenciálním backoff
- `lib/supabase/init.ts`: kritické fáze (Phase 1+2) se retryují max 3× s exponenciálním backoff
- Phase 3 (nekritické moduly) používá `Promise.allSettled()` — částečné selhání neblokuje aplikaci

#### Absence: validace překrývajících se žádostí
- `absence-store.ts`: před vytvořením žádosti se kontroluje overlap s existujícími pending/approved žádostmi
- `absence-report.spec.yaml`: přidáno acceptance criterion pro overlap validaci

#### Přístupnost: ARIA labely na icon-only tlačítkách
- Přidány `aria-label` atributy na 11 icon-only tlačítek v chat a email komponentách

#### Email: paralelní auto-sync
- `email-store.ts`: `forEach` nahrazeno za `Promise.all()` v auto-sync intervalu

## [1.8.0] - 2026-02-09

### Opraveno

#### Docházka: Race condition při check-inu
- DB migration: přidán UNIQUE partial index `(datum, zamestnanec) WHERE odchod IS NULL`
- `attendance-store.ts`: detekce duplicitního check-inu přes PostgreSQL error code `23505`

#### Absence: Validace času u typu Lékař
- `absence-store.ts`: přidána regex validace `HH:mm` a kontrola `timeTo > timeFrom`

#### Absence: Přejmenování sloupce schvaleno → zpracovano
- DB migration: `ALTER TABLE zadosti_o_absenci RENAME COLUMN schvaleno TO zpracovano`
- `mappers.ts` + `absence-store.ts`: aktualizovány DB mappery a store operace

#### Úkoly: Monthly/yearly repeat date overflow
- `tasks-store.ts`: nahrazeny ruční `setMonth()`/`setFullYear()` za `date-fns` `addMonths()`/`addYears()` — Jan 31 + 1 měsíc = Feb 28/29

#### Úkoly: Circular dependency přes require()
- `tasks-store.ts`: lazy `require('@/core/stores/modules-store')` nahrazen za `void import()` s pre-warm pattern

#### Pohoda: Hardcoded interní URL
- `pohoda-store.ts`: URL přesunuto do `process.env.NEXT_PUBLIC_POHODA_URL`
- `.env.example`: přidána proměnná `NEXT_PUBLIC_POHODA_URL`

#### IMAP: decrypt() bez try/catch
- `imap-client.ts`: `decrypt()` obalen `try/catch` s českou chybovou zprávou
- `email/send/route.ts`: decrypt failure vrací 500 s jasnou chybou

#### Chat: Smazání skupiny není atomické
- DB migration: přidán FK constraint `chat_stav_precteni_id_skupiny_fkey` s `ON DELETE CASCADE`
- `chat-store.ts`: zjednodušen `deleteGroup()` — CASCADE řeší mazání child záznamů

### Přidáno

#### Zod validace API routes
- `lib/api/schemas.ts`: nový soubor se Zod schématy pro všechny API endpointy
- Validace přidána do: email/send, email/imap-action, email/sync, email/test-connection, email/backfill, email/accounts (POST+PUT), pohoda/test, pohoda/sklady/list, pohoda/sklady/export, pohoda/vsechny-sklady, pohoda/generate-order

#### Email: Limit velikosti příloh
- `email/send/route.ts`: server-side limit 25 MB
- `email-store.ts`: client-side validace před odesláním

### Změněno
- Závislosti: přidány `date-fns` a `zod`

---

## [1.7.0] - 2026-02-09

### Přidáno

#### Mazání žádostí o absenci
- `absence-store.ts`: nová metoda `deleteAbsenceRequest(requestId, userId)` — smazání pending žádosti z DB
- `absence-requests-list.tsx`: tlačítko Zrušit (Trash2 ikona) u pending žádostí s potvrzovacím dialogem
- `/specs/modules/absence-report.spec.yaml`: feature `delete_request`, scénář ABS-R-006

#### Health check endpoint
- `app/api/health/route.ts`: GET endpoint pro monitoring — testuje DB konektivitu, vrací JSON status

### Opraveno

#### Email deleteRule error handling
- `email-store.ts`: přidán `console.error` + `toast.error` při selhání smazání e-mailového pravidla

#### CSP unsafe-eval pouze v development
- `next.config.ts`: `'unsafe-eval'` v CSP script-src je podmíněný na `NODE_ENV === 'development'`

---

## [1.6.0] - 2026-02-09

### Opraveno

#### DB persistence pro nedotažené moduly
- **Tržby (submitSales)**: INSERT do `dochazka` s hotovost, karta, partner, pohyby, poznamka_trzba — data přetrvávají po refreshi
- **Odvody (submitCollection)**: UPDATE `dochazka` SET `vybrano` = řidič+datum WHERE nevybráno — odvod se zaznamenává do DB
- **Docházka (toggleAttendance)**: Příchod → INSERT do `dochazka` s prichod; Odchod → UPDATE SET odchod, hodiny
- **Email (sendEmail)**: Přidána validace canSend oprávnění před odesláním e-mailu

### Změněno
- `sales-store.ts`: submitSales a submitCollection nyní async, píší do DB
- `attendance-store.ts`: toggleAttendance nyní async, INSERT/UPDATE do DB
- `email-store.ts`: sendEmail ověřuje accountAccess.canSend
- `tasks-store.ts`: require() refaktorován na lazy singleton (odstranění eslint-disable)
- `sales-modal.tsx`, `collect-modal.tsx`: onSubmit typy → async
- `attendance-module.tsx`: onToggleAttendance typ → async
- `header.tsx`: handleToggleAttendance → async

---

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
