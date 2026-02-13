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
  vytvoreno: string;
}
