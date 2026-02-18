export interface PohodaSyncLogDetail {
  sklad: string;
  pocetZaznamu: number;
  trvaniMs: number;
}

export interface PohodaSyncLog {
  id: number;
  typ: 'zasoby' | 'pohyby';
  stav: 'running' | 'success' | 'error';
  zprava: string | null;
  pocetZaznamu: number;
  pocetNovych: number;
  pocetAktualizovanych: number;
  sklad: string | null;
  trvaniMs: number;
  detail: PohodaSyncLogDetail[] | null;
  vytvoreno: string;
}
