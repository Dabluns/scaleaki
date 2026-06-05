import { applyFreemium } from '../utils/freemium';

const ads = Array.from({ length: 15 }, (_, i) => ({ id: `a${i}`, escala: i, adCopy: 'x', adSnapshotUrl: 'u', adHeadline: null, adCaption: null, adDescription: null, libraryUrl: null, destinationUrl: null, pageName: 'P' }));

describe('applyFreemium', () => {
  it('paid retorna tudo sem máscara nem cap', async () => {
    const out = await applyFreemium(ads as any, { id: 'u1', role: 'user', plan: 'mensal', subscription: { status: 'active', endDate: null } } as any);
    expect(out).toHaveLength(15);
    expect(out[0].adCopy).toBe('x');
    expect(out[0].locked).toBeUndefined();
  });
  it('admin retorna tudo', async () => {
    const out = await applyFreemium(ads as any, { id: 'adm', role: 'admin', plan: 'free', subscription: null } as any);
    expect(out[0].adCopy).toBe('x');
  });
});
