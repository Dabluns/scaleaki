import { maskAnuncio, LOCKED_FIELDS } from '../utils/anuncioSerializer';

const full = {
  id: 'a1', pageName: 'Loja X', escala: 42, duplicatas: 12, deliveryStartTime: new Date(),
  adSnapshotUrl: 'https://store/img.jpg', adCopy: 'compre já', adHeadline: 'H', adCaption: 'C',
  adDescription: 'D', libraryUrl: 'https://fb/lib', destinationUrl: 'https://offer',
};

describe('maskAnuncio', () => {
  it('paid=true retorna tudo', () => {
    expect(maskAnuncio(full as any, true)).toEqual(full);
  });
  it('paid=false nulifica campos sensíveis e marca locked', () => {
    const m = maskAnuncio(full as any, false) as any;
    for (const f of LOCKED_FIELDS) expect(m[f]).toBeNull();
    expect(m.locked).toBe(true);
    expect(m.pageName).toBe('Loja X');
    expect(m.escala).toBe(42);
    expect(m.duplicatas).toBe(12);
  });
});
