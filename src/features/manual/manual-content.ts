/**
 * Manual content configuration
 * Provides content structure for the manual module
 * Note: Role to module mapping is now handled by useModulesStore.getModulesForRole()
 */

// Module names for display
export const MODULE_NAMES: Record<string, string> = {
  'cash-info': 'Stav pokladny',
  'sales': 'Tržby',
  'collect': 'Odvody',
  'absence-report': 'Hlášení absence',
  'absence-approval': 'Schvalování absencí',
  'tasks': 'Úkoly',
  'kpi-dashboard': 'KPI Dashboard',
  'reports': 'Tržba a Docházka',
  'attendance': 'Docházka',
  'shifts': 'Směny',
  'presence': 'Přítomnost',
  'chat': 'Chat',
};

// Role names for display
export const ROLE_NAMES: Record<string, string> = {
  'role-1': 'Prodavač',
  'role-2': 'Administrátor',
  'role-3': 'Skladník',
  'role-4': 'Vedoucí skladu',
  'role-5': 'Obsluha e-shopu',
  'role-6': 'Obchodník',
  'role-7': 'Vedoucí velkoobchodu',
  'role-8': 'Majitel',
};

// Role intro content
export const ROLE_INTROS: Record<string, { title: string; intro: string; workflow: string[]; principles: string[]; contact: string }> = {
  'role-1': {
    title: 'Práce s aplikací Vapestyle.cz',
    intro: 'Vítejte v aplikaci Vapestyle.cz. Jako prodavač máte přístup k funkcím pro správu pokladny, evidenci tržeb a odvodů, hlášení absencí a komunikaci s kolegy.',
    workflow: [
      'Příchod - Přihlaste se do systému a potvrďte příchod na směnu pomocí modulu Docházka v záhlaví.',
      'Během dne - Evidujte tržby v modulu Tržby. Sledujte stav pokladny a provádějte odvody dle potřeby.',
      'Odchod - Zkontrolujte stav pokladny, ujistěte se, že vše sedí, a odhlaste se ze směny.',
    ],
    principles: [
      'Vždy evidujte tržby ihned po prodeji.',
      'Před odvodem hotovosti zkontrolujte stav pokladny.',
      'Absenci nahlaste co nejdříve, ideálně den předem.',
    ],
    contact: 'Vedoucí velkoobchodu nebo Administrátor',
  },
  'role-2': {
    title: 'Práce s aplikací Vapestyle.cz',
    intro: 'Jako administrátor máte přehled o klíčových ukazatelích firmy, schvalujete absence vedoucích pracovníků a koordinujete úkoly napříč týmy.',
    workflow: [
      'Ráno - Zkontrolujte KPI dashboard pro přehled o tržbách a docházce.',
      'Během dne - Schvalujte žádosti o absenci od vedoucích, spravujte úkoly a komunikujte přes chat.',
      'Konec dne - Zkontrolujte přítomnost zaměstnanců a stav úkolů.',
    ],
    principles: [
      'Reagujte na žádosti o schválení do 24 hodin.',
      'Pravidelně kontrolujte stav úkolů svých podřízených.',
      'Udržujte přehled o přítomnosti na pracovištích.',
    ],
    contact: 'Majitel firmy',
  },
  'role-3': {
    title: 'Práce s aplikací Vapestyle.cz',
    intro: 'Jako skladník máte přístup k evidenci docházky, hlášení absencí, úkolům a skupinovému chatu pro komunikaci s kolegy.',
    workflow: [
      'Příchod - Přihlaste příchod na směnu pomocí modulu Docházka.',
      'Během dne - Plňte přidělené úkoly a komunikujte s kolegy přes chat.',
      'Odchod - Odhlaste se ze směny.',
    ],
    principles: [
      'Úkoly plňte včas a v zadané kvalitě.',
      'O problémech informujte vedoucího skladu.',
      'Absenci nahlaste s dostatečným předstihem.',
    ],
    contact: 'Vedoucí skladu',
  },
  'role-4': {
    title: 'Práce s aplikací Vapestyle.cz',
    intro: 'Jako vedoucí skladu řídíte tým skladníků a obsluhy e-shopu. Schvalujete jejich absence, přidělujete úkoly a sledujete jejich přítomnost.',
    workflow: [
      'Ráno - Zkontrolujte přítomnost svého týmu a stav úkolů.',
      'Během dne - Přidělujte úkoly, schvalujte absence a komunikujte s týmem.',
      'Konec dne - Ověřte splnění denních úkolů.',
    ],
    principles: [
      'Reagujte na žádosti o absenci včas.',
      'Sledujte přítomnost zaměstnanců na pracovišti.',
      'Udržujte jasnou komunikaci s týmem.',
    ],
    contact: 'Administrátor',
  },
  'role-5': {
    title: 'Práce s aplikací Vapestyle.cz',
    intro: 'Jako obsluha e-shopu máte přístup k evidenci docházky, hlášení absencí, úkolům a chatu pro koordinaci s kolegy.',
    workflow: [
      'Příchod - Přihlaste příchod na směnu.',
      'Během dne - Plňte úkoly související s e-shopem a komunikujte s týmem.',
      'Odchod - Odhlaste se ze směny.',
    ],
    principles: [
      'Plňte úkoly dle priorit.',
      'O problémech s objednávkami informujte vedoucího skladu.',
      'Absenci nahlaste včas.',
    ],
    contact: 'Vedoucí skladu',
  },
  'role-6': {
    title: 'Práce s aplikací Vapestyle.cz',
    intro: 'Jako obchodník máte flexibilní pracovní dobu. Hlásíte absence, plníte úkoly a komunikujete s kolegy přes chat.',
    workflow: [
      'Plánování - Sledujte své směny a plánujte návštěvy klientů.',
      'Během dne - Plňte obchodní úkoly a komunikujte s vedením.',
      'Reporting - Evidujte výsledky své práce.',
    ],
    principles: [
      'Plánujte absenci s předstihem.',
      'Aktualizujte stav úkolů průběžně.',
      'Udržujte kontakt s vedoucím velkoobchodu.',
    ],
    contact: 'Vedoucí velkoobchodu',
  },
  'role-7': {
    title: 'Práce s aplikací Vapestyle.cz',
    intro: 'Jako vedoucí velkoobchodu řídíte prodavače a obchodníky. Schvalujete jejich absence, plánujete směny a sledujete jejich výkon.',
    workflow: [
      'Ráno - Zkontrolujte přítomnost týmu a plánované směny.',
      'Během dne - Schvalujte absence, přidělujte úkoly a koordinujte tým.',
      'Konec dne - Zkontrolujte stav úkolů a připravte plán na další den.',
    ],
    principles: [
      'Plánujte směny s týdenním předstihem.',
      'Reagujte na žádosti o absenci do 24 hodin.',
      'Udržujte pravidelnou komunikaci s týmem.',
    ],
    contact: 'Administrátor',
  },
  'role-8': {
    title: 'Práce s aplikací Vapestyle.cz',
    intro: 'Jako majitel máte přehled o celé firmě. Sledujete KPI ukazatele, schvalujete absence vedoucích a máte přístup ke všem důležitým informacím.',
    workflow: [
      'Přehled - Kontrolujte KPI dashboard pro rychlý přehled o firmě.',
      'Řízení - Schvalujte důležité žádosti a komunikujte s vedením.',
      'Strategické rozhodování - Analyzujte data a plánujte rozvoj firmy.',
    ],
    principles: [
      'Reagujte na kritické žádosti rychle.',
      'Sledujte klíčové ukazatele pravidelně.',
      'Delegujte operativní záležitosti na vedoucí.',
    ],
    contact: 'Přímá kontrola nad celou firmou',
  },
};

// Module content
export const MODULE_CONTENT: Record<string, { description: string; purpose: string; howToUse: string[]; faq: { q: string; a: string }[]; tips: string[] }> = {
  'cash-info': {
    description: 'Zobrazuje aktuální stav pokladny včetně hotovosti k odevzdání a provozní základny.',
    purpose: 'Modul Stav pokladny vám umožňuje rychle zjistit, kolik hotovosti máte v pokladně. Vidíte částku určenou k odvodu a provozní základnu, kterou ponecháváte v pokladně.',
    howToUse: [
      'Stav pokladny se automaticky aktualizuje na základě evidovaných tržeb a odvodů.',
      'Zelená částka nahoře ukazuje hotovost k odevzdání.',
      'Provozní základna je fixní částka nastavená administrátorem.',
    ],
    faq: [
      { q: 'Proč se mi zobrazuje záporná částka k odvodu?', a: 'To znamená, že v pokladně chybí hotovost. Zkontrolujte evidenci tržeb.' },
      { q: 'Jak změnit provozní základnu?', a: 'Provozní základnu může změnit pouze administrátor v nastavení modulu.' },
    ],
    tips: [
      'Kontrolujte stav pokladny před každým odvodem.',
    ],
  },
  'sales': {
    description: 'Evidence denní tržby zaměstnance.',
    purpose: 'Modul Tržby slouží k zápisu vaší celkové denní tržby. Na konci směny při uzavření pokladny zapíšete jednu hodnotu - celkovou tržbu za váš pracovní den.',
    howToUse: [
      'Na konci směny, po uzavření pokladny, otevřete modul Tržby.',
      'Klikněte na "Zapsat tržbu".',
      'Zadejte celkovou částku vaší denní tržby.',
      'Potvrďte záznam.',
    ],
    faq: [
      { q: 'Kolik záznamů mám za den vytvořit?', a: 'Jeden záznam za směnu. Pokud pracujete půl dne a kolega druhou polovinu, každý zapíše svou tržbu.' },
      { q: 'Mohu opravit chybně zadanou tržbu?', a: 'Ano, klikněte na záznam a upravte ho. Změny jsou evidovány v historii.' },
    ],
    tips: [
      'Tržbu zapisujte vždy na konci směny při uzavření pokladny.',
      'Zkontrolujte částku před potvrzením.',
    ],
  },
  'collect': {
    description: 'Evidence odvodů hotovosti z pokladny.',
    purpose: 'Modul Odvody slouží k záznamu předání hotovosti z pokladny. Každý odvod musí být evidován pro správné vedení pokladny.',
    howToUse: [
      'Klikněte na "Nový odvod" pro vytvoření záznamu.',
      'Zadejte částku odvodu.',
      'Vyberte způsob odvodu (bankovní vklad, výběr, apod.).',
      'Přiložte fotografii potvrzení (volitelné).',
    ],
    faq: [
      { q: 'Co když jsem odvedl jinou částku než jsem zapsal?', a: 'Kontaktujte administrátora pro opravu záznamu.' },
    ],
    tips: [
      'Vždy si zkontrolujte částku před potvrzením odvodu.',
    ],
  },
  'absence-report': {
    description: 'Hlášení nepřítomnosti v práci.',
    purpose: 'Modul Absence umožňuje nahlásit plánovanou nebo neplánovanou nepřítomnost. Žádost jde ke schválení vašemu nadřízenému.',
    howToUse: [
      'Klikněte na "Nová žádost" pro vytvoření hlášení.',
      'Vyberte typ absence (dovolená, nemoc, osobní volno, apod.).',
      'Zvolte datum od a do.',
      'Přidejte poznámku s důvodem (volitelné, ale doporučené).',
      'Odešlete žádost.',
    ],
    faq: [
      { q: 'Komu jde žádost ke schválení?', a: 'Žádost automaticky směřuje k vašemu přímému nadřízenému dle organizační struktury.' },
      { q: 'Jak dlouho trvá schválení?', a: 'Schválení závisí na vašem nadřízeném. Obvykle do 24-48 hodin.' },
      { q: 'Mohu zrušit odeslanou žádost?', a: 'Ano, dokud není schválena nebo zamítnuta.' },
    ],
    tips: [
      'Hlaste absenci s co největším předstihem.',
      'U nemoci přiložte lékařské potvrzení.',
    ],
  },
  'absence-approval': {
    description: 'Schvalování žádostí o absenci od podřízených.',
    purpose: 'Modul Schvalování vám zobrazuje žádosti o absenci od vašich podřízených. Můžete je schválit nebo zamítnout.',
    howToUse: [
      'Otevřete modul pro zobrazení čekajících žádostí.',
      'Klikněte na žádost pro zobrazení detailu.',
      'Zkontrolujte datum a důvod absence.',
      'Schvalte nebo zamítněte žádost s komentářem.',
    ],
    faq: [
      { q: 'Mohu změnit rozhodnutí po schválení?', a: 'Ne, rozhodnutí je konečné. V případě potřeby kontaktujte administrátora.' },
      { q: 'Jak zjistím, kdo je můj podřízený?', a: 'Vidíte pouze žádosti od zaměstnanců, které máte nastavené jako podřízené.' },
    ],
    tips: [
      'Reagujte na žádosti včas, aby zaměstnanci mohli plánovat.',
      'U zamítnutí vždy uveďte důvod.',
    ],
  },
  'tasks': {
    description: 'Přehled a správa úkolů.',
    purpose: 'Modul Úkoly slouží ke správě pracovních úkolů. Vidíte úkoly přidělené vám, můžete vytvářet nové a sledovat jejich stav.',
    howToUse: [
      'V kartě vidíte počet nevyřešených úkolů.',
      'Klikněte pro otevření detailního přehledu.',
      'Záložka "Moje úkoly" zobrazuje úkoly přidělené vám.',
      'Záložka "Vytvořené mnou" ukazuje úkoly, které jste zadali.',
      'Pro splnění úkolu klikněte na "Odeslat ke schválení".',
    ],
    faq: [
      { q: 'Kdo schvaluje moje úkoly?', a: 'Úkoly schvaluje osoba, která je vytvořila.' },
      { q: 'Mohu delegovat úkol na kolegu?', a: 'Ano, použijte funkci "Delegovat" v detailu úkolu.' },
      { q: 'Co když nestihnu termín?', a: 'Úkoly po termínu jsou označeny červeně. Informujte zadavatele o zpoždění.' },
    ],
    tips: [
      'Pravidelně kontrolujte své úkoly.',
      'Přidávejte komentáře s průběhem práce.',
    ],
  },
  'kpi-dashboard': {
    description: 'Přehled klíčových ukazatelů výkonnosti.',
    purpose: 'KPI Dashboard poskytuje rychlý přehled o důležitých ukazatelích firmy - tržby, docházka, počet čekajících schválení a další.',
    howToUse: [
      'Dashboard se zobrazuje automaticky po přihlášení.',
      'Jednotlivé karty zobrazují aktuální hodnoty klíčových metrik.',
      'Kliknutím na kartu zobrazíte podrobnosti.',
    ],
    faq: [
      { q: 'Jak často se data aktualizují?', a: 'Data se aktualizují v reálném čase při každé změně.' },
      { q: 'Mohu si přizpůsobit zobrazené metriky?', a: 'Aktuálně ne, zobrazení je standardizované.' },
    ],
    tips: [
      'Sledujte trendy v datech pro včasnou reakci na problémy.',
    ],
  },
  'reports': {
    description: 'Reporty tržeb a docházky.',
    purpose: 'Modul Tržba a Docházka poskytuje detailní reporty pro analýzu výkonu prodejen a docházky zaměstnanců.',
    howToUse: [
      'Klikněte na modul pro otevření reportů.',
      'Vyberte časové období a prodejnu pomocí filtrů.',
      'Prohlédněte si tabulky s daty.',
      'Použijte tlačítko Export pro stažení dat.',
    ],
    faq: [
      { q: 'V jakém formátu mohu exportovat data?', a: 'Data lze exportovat do formátu XLS (Excel).' },
      { q: 'Jak daleko do historie mohu jít?', a: 'K dispozici jsou data za celou dobu používání systému.' },
    ],
    tips: [
      'Pravidelně exportujte důležité reporty pro archivaci.',
    ],
  },
  'attendance': {
    description: 'Evidence příchodů a odchodů.',
    purpose: 'Modul Docházka v záhlaví aplikace slouží k evidenci vašeho příchodu a odchodu ze směny.',
    howToUse: [
      'Při příchodu klikněte na zelené tlačítko "Příchod".',
      'Potvrďte pracoviště (automaticky předvyplněno).',
      'Při odchodu klikněte na červené tlačítko "Odchod".',
    ],
    faq: [
      { q: 'Co když zapomenu evidovat příchod?', a: 'Kontaktujte svého nadřízeného pro dodatečný záznam.' },
      { q: 'Mohu upravit čas příchodu?', a: 'Ne, časy jsou evidovány automaticky. Úpravy provádí administrátor.' },
    ],
    tips: [
      'Evidujte příchod ihned po přijetí na pracoviště.',
    ],
  },
  'shifts': {
    description: 'Plánování a přehled směn.',
    purpose: 'Modul Směny zobrazuje váš rozpis směn. Vidíte kdy máte pracovat.',
    howToUse: [
      'V kartě vidíte vaši příští směnu.',
      'Klikněte pro zobrazení kalendáře směn.',
      'Barevné označení rozlišuje různé typy směn.',
    ],
    faq: [
      { q: 'Kdo plánuje směny?', a: 'Směny plánuje váš nadřízený nebo administrátor.' },
      { q: 'Mohu požádat o výměnu směny?', a: 'Kontaktujte svého nadřízeného, výměnu nelze provést přímo v systému.' },
    ],
    tips: [
      'Pravidelně kontrolujte svůj rozpis směn.',
    ],
  },
  'presence': {
    description: 'Přehled přítomnosti zaměstnanců.',
    purpose: 'Modul Přítomnost ukazuje, kdo z vašeho týmu je aktuálně přítomen na pracovišti.',
    howToUse: [
      'Modul automaticky zobrazuje aktuální stav.',
      'Zelená značka = zaměstnanec je přítomen.',
      'Šedá značka = zaměstnanec není přítomen.',
    ],
    faq: [
      { q: 'Proč nevidím některé zaměstnance?', a: 'Vidíte pouze zaměstnance, které máte nastavené jako podřízené.' },
      { q: 'Jak často se aktualizuje?', a: 'Stav se aktualizuje v reálném čase.' },
    ],
    tips: [
      'Používejte pro rychlý přehled o obsazenosti pracoviště.',
    ],
  },
  'chat': {
    description: 'Skupinové konverzace a přímé zprávy s kolegy.',
    purpose: 'Modul Chat umožňuje komunikovat s kolegy ve skupinových konverzacích i přímých zprávách. Můžete posílat zprávy, reagovat na ně emoji, mazat vlastní zprávy, vkládat emoji přes emoji picker a sdílet soubory.',
    howToUse: [
      'Klikněte na modul pro otevření chatu.',
      'Vyberte skupinu ze seznamu vlevo, nebo zahajte přímou konverzaci tlačítkem "Nová zpráva".',
      'Napište zprávu do pole dole a odešlete klávesou Enter nebo tlačítkem.',
      'Pro vložení emoji klikněte na ikonu smajlíku vedle textového pole.',
      'Na zprávy můžete reagovat pomocí emoji kliknutím na ikonu smajlíku u zprávy.',
      'Vlastní zprávu můžete smazat najetím myší na zprávu a kliknutím na ikonu koše.',
      'Pro přiložení souboru klikněte na ikonu sponky.',
    ],
    faq: [
      { q: 'Mohu smazat zprávu?', a: 'Ano, najetím myší na vlastní zprávu se zobrazí ikona koše. Smazat lze pouze vlastní zprávy.' },
      { q: 'Mohu vytvořit novou skupinu?', a: 'Skupiny vytváří administrátor. Pro soukromou konverzaci použijte přímé zprávy.' },
      { q: 'Jak zahájit přímou konverzaci?', a: 'Klikněte na tlačítko "Nová zpráva" nad seznamem konverzací a vyberte kolegu.' },
      { q: 'Jak vložit emoji?', a: 'Klikněte na ikonu smajlíku vedle textového pole. Otevře se výběr emoji.' },
    ],
    tips: [
      'Sledujte badge s počtem nepřečtených zpráv.',
      'Používejte reakce pro rychlou odezvu na zprávy.',
      'Přímé zprávy slouží pro soukromou komunikaci s jedním kolegou.',
      'Emoji picker umožňuje rychlé vložení emoji do textu zprávy.',
    ],
  },
};

/**
 * Get role intro content
 */
export function getRoleIntro(roleId: string) {
  return ROLE_INTROS[roleId];
}

/**
 * Get module content
 */
export function getModuleContent(moduleId: string) {
  return MODULE_CONTENT[moduleId];
}

/**
 * Get module name
 */
export function getModuleName(moduleId: string): string {
  return MODULE_NAMES[moduleId] || moduleId;
}

/**
 * Get role name
 */
export function getRoleName(roleId: string): string {
  return ROLE_NAMES[roleId] || roleId;
}

/**
 * Filter modules by search query
 */
export function filterModulesBySearch(
  moduleIds: string[],
  searchQuery: string
): string[] {
  if (!searchQuery.trim()) {
    return moduleIds;
  }

  const query = searchQuery.toLowerCase();

  return moduleIds.filter((moduleId) => {
    const name = MODULE_NAMES[moduleId]?.toLowerCase() || '';
    const content = MODULE_CONTENT[moduleId];

    if (name.includes(query)) return true;
    if (content?.description.toLowerCase().includes(query)) return true;
    if (content?.purpose.toLowerCase().includes(query)) return true;
    if (content?.howToUse.some((step) => step.toLowerCase().includes(query))) return true;
    if (content?.faq.some((item) =>
      item.q.toLowerCase().includes(query) ||
      item.a.toLowerCase().includes(query)
    )) return true;
    if (content?.tips.some((tip) => tip.toLowerCase().includes(query))) return true;

    return false;
  });
}
