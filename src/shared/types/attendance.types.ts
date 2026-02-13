/**
 * Attendance types
 */

import { WorkplaceType } from './base.types';

// Attendance record with new workplace structure
export interface AttendanceRecord {
  id: number;
  date: string;
  store: string;
  workplaceType: WorkplaceType;
  workplaceId: string;
  workplaceName: string;
  user: string;
  in: string;
  out: string;
  abs: string;
  hrs: string;
  absNote: string;
  cash: number;
  card: number;
  partner: number;
  flows: string;
  saleNote: string;
  collected: string | false;
}
