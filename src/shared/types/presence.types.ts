/**
 * Presence module types
 */

import { AbsenceType } from './absence.types';

export type PresenceStatus = 'present' | 'absent' | 'excused';

export interface PresenceRecord {
  userId: string;
  userName: string;
  status: PresenceStatus;
  absenceType?: AbsenceType;
  storeName?: string;
  roleName?: string;
  arrivalTime?: string;
}
