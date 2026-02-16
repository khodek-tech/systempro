/**
 * Motivation types
 */

export interface MotivationSettings {
  id: number;
  percentage: number;
  warehouseId: string | null;
  updatedAt: string;
}

export interface MotivationProduct {
  kod: string;
  nazev: string;
  ean: string | null;
  prodejniCena: number;
  motivation: boolean;
  changedBy: string | null;
  changedAt: string | null;
}
