import { describe, it, expect } from 'vitest';
import { isStaffRole } from '../auth';

describe('isStaffRole', () => {
  it('retorna true para ADMIN e SUB_ADMIN', () => {
    expect(isStaffRole('ADMIN')).toBe(true);
    expect(isStaffRole('SUB_ADMIN')).toBe(true);
  });

  it('retorna false para CLIENT', () => {
    expect(isStaffRole('CLIENT')).toBe(false);
  });
});
