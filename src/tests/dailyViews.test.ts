import { startOfToday, DAILY_FREE_LIMIT } from '../utils/dailyViews';

describe('startOfToday', () => {
  it('retorna 00:00 de hoje', () => {
    const d = startOfToday();
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getDate()).toBe(new Date().getDate());
  });
  it('DAILY_FREE_LIMIT = 10', () => {
    expect(DAILY_FREE_LIMIT).toBe(10);
  });
});
