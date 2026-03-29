import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('GET /api/health', () => {
  it('retorna 200 e payload de saúde', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body?.data?.ok).toBe(true);
    expect(res.body?.data?.service).toBe('cia-do-disfarce-api');
  });
});
