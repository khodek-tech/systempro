'use client';

import { useEffect, useState, useMemo } from 'react';
import { useMotivationStore } from '@/stores/motivation-store';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

export function MotivationSettingsPanel() {
  const { settings, saveSettings } = useMotivationStore();

  const initialPercentage = useMemo(() => settings?.percentage ?? 0, [settings?.percentage]);
  const initialWarehouseId = useMemo(() => settings?.warehouseId ?? '', [settings?.warehouseId]);

  const [percentage, setPercentage] = useState(initialPercentage);
  const [warehouseId, setWarehouseId] = useState(initialWarehouseId);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Sync from store only on first load
  if (!initialized && settings) {
    setPercentage(settings.percentage);
    setWarehouseId(settings.warehouseId ?? '');
    setInitialized(true);
  }

  useEffect(() => {
    const fetchWarehouses = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('pohoda_zasoby')
        .select('cleneni_skladu_nazev')
        .not('cleneni_skladu_nazev', 'is', null);

      if (!error && data) {
        const unique = [...new Set(data.map((r: { cleneni_skladu_nazev: string }) => r.cleneni_skladu_nazev))].sort();
        setWarehouses(unique);
      } else {
        logger.error('Failed to fetch warehouse names');
      }
    };
    fetchWarehouses();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveSettings({ percentage, warehouseId: warehouseId || null });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">Nastavení motivace</h3>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">
            Motivační procento (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold text-right outline-none focus:border-orange-300 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">
            Sklad (zdroj produktů)
          </label>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="w-64 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-none cursor-pointer focus:border-orange-300 transition-colors"
          >
            <option value="">— Nevybráno —</option>
            {warehouses.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? 'Ukládám...' : 'Uložit nastavení'}
          </button>
        </div>
      </div>
    </div>
  );
}
