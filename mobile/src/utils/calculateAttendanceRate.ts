import { Attendance } from '../types/api';

export function calculateAttendanceRate(attendances: Attendance[]): number {
  if (!attendances || attendances.length === 0) return 0;
  const presentCount = attendances.filter(a => a.is_present).length;
  return Math.round((presentCount / attendances.length) * 100);
}
