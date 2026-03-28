const { genererPin, validerPassword, echapperHtml } = require('../utils/helpers');

describe('genererPin', () => {
  test('retourne bien 6 chiffres', () => {
    const pin = genererPin();
    expect(pin).toHaveLength(6);
    expect(/^\d{6}$/.test(pin)).toBe(true);
  });

  test('ne génère pas deux fois le même code', () => {
    const pins = new Set();
    for (let i = 0; i < 10; i++) pins.add(genererPin());
    expect(pins.size).toBeGreaterThan(1);
  });

  test('reste dans la plage 6 chiffres', () => {
    for (let i = 0; i < 20; i++) {
      const n = parseInt(genererPin());
      expect(n).toBeGreaterThanOrEqual(100000);
      expect(n).toBeLessThanOrEqual(999999);
    }
  });
});

describe('validerPassword', () => {
  test('passe si le mot de passe est correct', () => {
    expect(validerPassword('MonMotDePasse1')).toBeNull();
    expect(validerPassword('Azerty123')).toBeNull();
  });

  test('bloque si trop court', () => {
    const err = validerPassword('Ab1');
    expect(err).toBeTruthy();
    expect(err).toContain('8');
  });

  test('bloque sans majuscule', () => {
    const err = validerPassword('motdepasse1');
    expect(err).toBeTruthy();
    expect(err.toLowerCase()).toContain('majuscule');
  });

  test('bloque sans chiffre', () => {
    const err = validerPassword('MotDePasseSansChiffre');
    expect(err).toBeTruthy();
    expect(err.toLowerCase()).toContain('chiffre');
  });

  test('bloque une chaîne vide', () => {
    expect(validerPassword('')).toBeTruthy();
  });
});

describe('echapperHtml', () => {
  test('chevrons <>', () => {
    expect(echapperHtml('<script>')).toBe('&lt;script&gt;');
  });

  test('guillemets', () => {
    expect(echapperHtml('"test"')).toBe('&quot;test&quot;');
  });

  test('ampersand', () => {
    expect(echapperHtml('a & b')).toBe('a &amp; b');
  });

  test('texte sans caractères spéciaux reste intact', () => {
    expect(echapperHtml('hello world')).toBe('hello world');
  });

  test('converti les non-strings', () => {
    expect(echapperHtml(123)).toBe('123');
  });

  test('bloque injection XSS simple', () => {
    const mauvais = '<img src=x onerror="alert(1)">';
    const result = echapperHtml(mauvais);
    expect(result).not.toContain('<img');
    expect(result).not.toContain('>');
  });
});
