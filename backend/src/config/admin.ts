/** Conta administrativa principal (seed + promoção automática em login/refresh). */
export const PRIMARY_ADMIN_EMAIL = 'jonataloubah98@gmail.com';

export function isPrimaryAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL;
}
