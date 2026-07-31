import { User } from '../types/api';

export const getUserFullName = (user?: User | null): string => {
  if (!user) return 'Bilinmeyen Kullanıcı';
  const first = (user.first_name || '').trim();
  const last = (user.last_name || '').trim();
  if (first || last) {
    return `${first} ${last}`.trim();
  }
  return user.username || `Kullanıcı #${user.id}`;
};

export const getUserInitials = (user?: User | null): string => {
  if (!user) return '?';
  const first = (user.first_name || '').trim();
  const last = (user.last_name || '').trim();
  if (first || last) {
    const fChar = first ? first.charAt(0) : '';
    const lChar = last ? last.charAt(0) : '';
    return `${fChar}${lChar}`.toUpperCase();
  }
  if (user.username) {
    return user.username.substring(0, 2).toUpperCase();
  }
  return '?';
};
