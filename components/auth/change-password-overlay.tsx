'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUsersStore } from '@/stores/users-store';

interface ChangePasswordOverlayProps {
  authId: string;
}

export function ChangePasswordOverlay({ authId }: ChangePasswordOverlayProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (newPassword.length < 4) {
      setError('Heslo musí mít alespoň 4 znaky.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Hesla se neshodují.');
      return;
    }

    if (newPassword === '1234') {
      setError('Nové heslo nesmí být "1234". Zvolte jiné heslo.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Update password via Supabase Auth (client-side, for current user)
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authError) {
        setError('Nepodařilo se změnit heslo: ' + authError.message);
        setLoading(false);
        return;
      }

      // Update vychozi_heslo = false in zamestnanci
      const { error: dbError } = await supabase
        .from('zamestnanci')
        .update({ vychozi_heslo: false })
        .eq('auth_id', authId);

      if (dbError) {
        setError('Heslo bylo změněno, ale nepodařilo se aktualizovat stav: ' + dbError.message);
        setLoading(false);
        return;
      }

      // Refresh user in store
      const { users } = useUsersStore.getState();
      const user = users.find((u) => u.authId === authId);
      if (user) {
        useUsersStore.setState((state) => ({
          users: state.users.map((u) =>
            u.id === user.id ? { ...u, mustChangePassword: false } : u
          ),
        }));
      }

      toast.success('Heslo bylo úspěšně změněno.');
    } catch {
      setError('Nepodařilo se změnit heslo.');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-lg"
      >
        <div className="flex justify-center mb-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
          Změna hesla
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Pro pokračování musíte nastavit nové heslo.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Nové heslo
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-orange-300"
              placeholder="Minimálně 4 znaky"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Potvrzení hesla
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-orange-300"
              placeholder="Zopakujte nové heslo"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {loading ? 'Ukládám...' : 'Nastavit heslo'}
          </button>
        </div>
      </form>
    </div>
  );
}
