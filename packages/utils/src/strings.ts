import { log } from '@charmverse/core/log';
import { init } from '@paralleldrive/cuid2';

/**
 * Change the first character of a string to uppercase
 * Leaves other characters unchanged
 * @param input
 */
export function capitalize(input?: string): string {
  if (!input) {
    return '';
  }
  const trimmed = input.trim();
  return `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
}

export function fancyTrim(_text: string = '', maxLength: number = 40) {
  const text = _text || '';
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}

export function fancyTrimWords(_text: string = '', maxWords: number = 40) {
  const text = _text || '';
  const words = text.split(' ');
  if (words.length <= maxWords) {
    return text;
  }
  return `${words.slice(0, maxWords).join(' ')}...`;
}

export function prettyPrint(input: any): string {
  const pretty =
    typeof input === 'object'
      ? JSON.stringify(input, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)
      : input.toString
        ? input.toString()
        : input;

  // eslint-disable-next-line
  console.log(pretty);

  return pretty;
}

// generate a color based on a string. Copied from https://medium.com/@pppped/compute-an-arbitrary-color-for-user-avatar-starting-from-his-username-with-javascript-cd0675943b66
export function stringToColor(name: string, saturation = 50, lightness = 60) {
  if (name === '') {
    // return 'var(--background-dark)';
    return 'transparent';
  }
  return `hsl(${stringToHue(name)}, ${saturation}%, ${lightness}%)`;
}

export function stringToHue(name: string) {
  const cleanName = name.replace('0x', ''); // ignore the universal prefix of addresses
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    // eslint-disable-next-line
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = hash % 360;
  return h;
}

/**
 * Create by default a cuid with length 10
 */
export const randomString = init({
  length: 10
});

export function concatenateStringValues(obj: Record<string, any>): string[] {
  const stringValues = Object.keys(obj).reduce((acc: string[], key) => {
    const value = obj[key];

    if (typeof value === 'string') {
      acc.push(value);
    } else if (Array.isArray(value)) {
      const arrayOfStrings = value.filter((item) => typeof item === 'string');
      if (arrayOfStrings.length > 0) {
        acc.push(arrayOfStrings.join(', '));
      }
    }

    return acc;
  }, []);

  return stringValues;
}

/**
 * Append an 's' to a value's descriptor if it is not equal to 1
 * Default values will return an empty string
 */
export function conditionalPlural({
  word = '',
  count = 1,
  plural
}: {
  word: string;
  count: number;
  plural?: string;
}): string {
  if (count !== 1) {
    return plural ?? `${word}s`;
  }
  return word;
}

// not a foolproof check but also should not result in false negatives
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function shortenHex(hex: string = '', length = 4): string {
  if (hex.length <= length * 2) {
    return hex;
  }
  return `${hex.substring(0, length + 2)}…${hex.substring(hex.length - length)}`;
}

// Remove trailing zeros after decimal point
// Examples: 1.000000 -> 1, 1.100000 -> 1.1, 1.000100 -> 1.0001
export function formatNumber(num: number, maxDecimals: number): string {
  // Convert to string with fixed decimal places
  const fixed = num.toFixed(maxDecimals);
  // Remove trailing zeros after decimal point and remove decimal point if no decimals
  return fixed.replace(/\.?0+$/, '');
}
