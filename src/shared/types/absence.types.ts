/**
 * Absence types
 */

export type AbsenceType = 'Dovolená' | 'Nemoc / Neschopenka' | 'Lékař' | 'Neplacené volno';

export interface AbsenceFormData {
  type: AbsenceType;
  dateFrom: string;
  dateTo: string;
  timeFrom?: string;
  timeTo?: string;
  note: string;
}

export type AbsenceRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AbsenceRequest {
  id: string;
  userId: string;
  type: AbsenceType;
  dateFrom: string;
  dateTo: string;
  timeFrom?: string;
  timeTo?: string;
  note: string;
  status: AbsenceRequestStatus;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  seenByUser?: boolean;
  approverNote?: string;
}
