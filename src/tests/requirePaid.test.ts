import { requirePaid } from '../middlewares/requirePaid';

function mockRes() {
  const r: any = {};
  r.status = (c: number) => { r._status = c; return r; };
  r.json = (b: any) => { r._body = b; return r; };
  return r;
}

describe('requirePaid', () => {
  it('admin passa sem checar DB', async () => {
    const res = mockRes(); let nexted = false;
    await requirePaid({ user: { userId: 'a', role: 'admin' } } as any, res, () => { nexted = true; });
    expect(nexted).toBe(true);
  });
  it('sem auth = 401', async () => {
    const res = mockRes(); let nexted = false;
    await requirePaid({ user: undefined } as any, res, () => { nexted = true; });
    expect(nexted).toBe(false);
    expect(res._status).toBe(401);
  });
});
