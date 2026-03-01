'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function AiConfigPanel() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('ai_konfigurace')
        .select('hodnota')
        .eq('klic', 'anthropic_api_key')
        .single();

      if (data?.hodnota) {
        setApiKey(data.hodnota);
        setHasKey(true);
      }
      setLoaded(true);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('ai_konfigurace')
      .update({ hodnota: apiKey.trim(), aktualizovano: new Date().toISOString() })
      .eq('klic', 'anthropic_api_key');

    if (error) {
      toast.error('Nepodařilo se uložit API klíč');
    } else {
      setHasKey(!!apiKey.trim());
      toast.success('API klíč uložen');
    }
    setSaving(false);
  };

  const maskedKey = apiKey ? `sk-ant-...${apiKey.slice(-8)}` : '';

  if (!loaded) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">AI Přetextování</h3>
          <p className="text-xs text-slate-400">Anthropic Claude API klíč</p>
        </div>
        <div className="ml-auto">
          {hasKey ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <Check className="w-3 h-3" />
              Nakonfigurováno
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" />
              Klíč chybí
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
            API Klíč
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={showKey ? apiKey : (apiKey ? maskedKey : '')}
                onChange={(e) => {
                  setShowKey(true);
                  setApiKey(e.target.value);
                }}
                onFocus={() => setShowKey(true)}
                placeholder="sk-ant-api03-..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-purple-300 pr-10 transition-colors"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100 transition-colors"
                type="button"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? 'Ukládám...' : 'Uložit'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Získejte na{' '}
            <span className="font-medium text-slate-500">console.anthropic.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
