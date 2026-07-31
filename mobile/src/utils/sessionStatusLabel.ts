import { Session } from '../types/api';

export function getSessionStatusLabel(status: Session['status']): string {
  if (status === 'COMPLETED') return 'Tamamlandı';
  return 'Tamamlanmadı';
}
