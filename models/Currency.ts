export type CryptoCurrency = 'BTC' | 'ETH' | 'XRP' | 'LTC' | 'BCH' | 'ETC';

export type FiatCurrency = 'USD' | 'GBP' | 'EUR' | 'JPY' | 'ZAR';

export type Currency = CryptoCurrency | FiatCurrency;

export interface IPairQuote {
  base: Currency;
  quote: Currency;
  amount: number;
  source?: string;
}
