/**
 * Expense-related constants and enums
 */

// Currency enum
export enum Currency {
  INR = 'INR',
  // Future currencies can be added here
  // USD = 'USD',
  // EUR = 'EUR',
  // GBP = 'GBP',
}

// Currency display configuration
export const CURRENCY_CONFIG: Record<Currency, { symbol: string; name: string }> = {
  [Currency.INR]: {
    symbol: '₹',
    name: 'Indian Rupee',
  },
  // Future currency configs
  // [Currency.USD]: {
  //   symbol: '$',
  //   name: 'US Dollar'
  // },
  // [Currency.EUR]: {
  //   symbol: '€',
  //   name: 'Euro'
  // },
  // [Currency.GBP]: {
  //   symbol: '£',
  //   name: 'British Pound'
  // },
};

// Split type enum
export enum SplitType {
  EQUAL = 'equal',
  EXACT = 'exact',
  // Future split types
  // PERCENTAGE = 'percentage',
  // SHARES = 'shares',
}

// Split type display configuration
export const SPLIT_TYPE_CONFIG: Record<SplitType, { label: string; description: string }> = {
  [SplitType.EQUAL]: {
    label: 'Split Equally',
    description: 'The expense will be divided equally among selected members',
  },
  [SplitType.EXACT]: {
    label: 'Exact Amounts',
    description: 'Manually specify the exact amount each member owes',
  },
  // Future split type configs
  // [SplitType.PERCENTAGE]: {
  //   label: 'By Percentage',
  //   description: 'Specify percentage for each member'
  // },
  // [SplitType.SHARES]: {
  //   label: 'By Shares',
  //   description: 'Specify shares for each member'
  // },
};

// Get default currency
export const DEFAULT_CURRENCY = Currency.INR;

// Get default split type
export const DEFAULT_SPLIT_TYPE = SplitType.EQUAL;

// Get all available currencies
export const getAvailableCurrencies = (): Currency[] => {
  return Object.values(Currency);
};

// Get all available split types
export const getAvailableSplitTypes = (): SplitType[] => {
  return Object.values(SplitType);
};

// Get currency symbol
export const getCurrencySymbol = (currency: Currency): string => {
  return CURRENCY_CONFIG[currency]?.symbol || '';
};

// Get currency name
export const getCurrencyName = (currency: Currency): string => {
  return CURRENCY_CONFIG[currency]?.name || '';
};

// Get split type label
export const getSplitTypeLabel = (splitType: SplitType): string => {
  return SPLIT_TYPE_CONFIG[splitType]?.label || '';
};

// Get split type description
export const getSplitTypeDescription = (splitType: SplitType): string => {
  return SPLIT_TYPE_CONFIG[splitType]?.description || '';
};
