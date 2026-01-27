'use client';

import { useState, useCallback } from 'react';
import { Role } from '@/types';

export function useRole(initialRole: Role = 'prodavac') {
  const [role, setRole] = useState<Role>(initialRole);

  const switchRole = useCallback((newRole: Role) => {
    setRole(newRole);
  }, []);

  const isProdavac = role === 'prodavac';
  const isVedouci = role === 'vedouci';

  return {
    role,
    switchRole,
    isProdavac,
    isVedouci,
  };
}
