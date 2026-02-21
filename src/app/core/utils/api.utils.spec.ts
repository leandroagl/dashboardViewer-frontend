import { requireData } from './api.utils';
import { ApiResponse } from '../models';

describe('requireData', () => {
  it('returns data when present', () => {
    const res: ApiResponse<{ id: number }> = { ok: true, data: { id: 1 } };
    expect(requireData(res)).toEqual({ id: 1 });
  });

  it('returns data when it is a falsy non-null value (0, false, "")', () => {
    expect(requireData({ ok: true, data: 0 } as ApiResponse<number>)).toBe(0);
    expect(requireData({ ok: true, data: false } as ApiResponse<boolean>)).toBe(false);
    expect(requireData({ ok: true, data: '' } as ApiResponse<string>)).toBe('');
  });

  it('throws when data is null', () => {
    const res: ApiResponse<unknown> = { ok: false, data: null };
    expect(() => requireData(res)).toThrow('La respuesta del servidor no contiene datos.');
  });

  it('throws when data is undefined', () => {
    const res = { ok: false } as ApiResponse<unknown>;
    expect(() => requireData(res)).toThrow('La respuesta del servidor no contiene datos.');
  });
});
