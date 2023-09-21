import { conditionalPlural, sanitizeForRegex, isUrl, isValidEmail } from '../strings';

describe('strings', () => {
  it('should sanitize parenthesis in a regex', () => {
    const text = sanitizeForRegex('test (test)');

    expect(text).toBe('test \\(test\\)');
  });
});

describe('conditionalPlural', () => {
  it('should return the word if the number is 1', () => {
    expect(conditionalPlural({ word: 'test', count: 1 })).toBe('test');
  });
  it('should append the letter "s" to a word if the number if not 1', () => {
    expect(conditionalPlural({ word: 'test', count: 2 })).toBe('tests');
  });

  it('should return plural if provided and the number is not 1', () => {
    expect(conditionalPlural({ word: 'Identity', count: 2, plural: 'Identities' })).toBe('Identities');
  });
});

describe('isUrl()', () => {
  const validUrls = [
    'https://twitter.com',
    'https://docs.google.com/forms/d/e/1FAIpQLSf-Z7e_l7htY7DO6GQuzkW2KWsqUOcXjzLS2fwvWnapvfltEQ/viewform',
    'https://www.loom.com/share/d0e3f7b3abb6448eb0c7a00bdd6dcd90',
    'https://en.m.wikipedia.org/wiki/C_Sharp_(programming_language)',
    'https://zh.wikipedia.org/wiki/Wikipedia:维基百科:关于中文维基百科/en',
    'https://odysee.com/@Coldfusion:f/google-panics-over-chatgpt-the-ai-wars:a'
  ];

  validUrls.forEach((url) => {
    it(`should return true for ${url}`, () => {
      expect(isUrl(url)).toBe(true);
    });
  });

  const invalidUrls = ['', 'hippo!', 'https://www', 'mailto://mail@freecodecamp.org'];
  invalidUrls.forEach((url) => {
    it(`should return false for ${url}`, () => {
      expect(isUrl(url)).toBe(false);
    });
  });
});
describe('isValidEmail', () => {
  it('should return true for a corporate email', () => {
    expect(isValidEmail('hello@charmverse.io')).toBe(true);
  });

  it('should return true for a free email', () => {
    expect(isValidEmail('test@gmail.com')).toBe(true);
  });

  // TBC - If we do this
  // it('should return true when email contains non-latin characters', () => {
  //   expect(isValidEmail('アシッシュ@ビジネス.コム')).toBe(true);
  // });

  it('should return false for an invalid email', () => {
    expect(isValidEmail('hello')).toBe(false);
    expect(isValidEmail('charmverse.io')).toBe(false);
  });
});
