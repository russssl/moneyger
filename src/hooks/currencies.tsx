export type Currency = {
  code: string;
  name_code: string;
  symbol: string;
  placedBeforeNumber?: boolean;
}

// Function overloads
export function currencies(): Currency[];
export function currencies(currencyCode: string | null): Currency | undefined;
export function currencies(currencyCode: null): Currency[];
export function currencies(currencyCode?: string | null): Currency[] | Currency | undefined {
  const data: Currency[] = [
    {
      code: "USD",
      name_code: "us_dollar",
      symbol: "$",
      placedBeforeNumber: true,
    },
    {
      code: "EUR",
      name_code: "euro",
      symbol: "€",
      placedBeforeNumber: true,
    },
    {
      code: "GBP",
      name_code: "pound_sterling",
      symbol: "£",
      placedBeforeNumber: true,
    },
    {
      code: "JPY",
      name_code: "japanese_yen",
      symbol: "¥",
      placedBeforeNumber: true,
    },
    {
      code: "PLN",
      name_code: "polish_zloty",
      symbol: "zł",
    },
    {
      code: "CZK",
      name_code: "czech_koruna",
      symbol: "Kč",
    },
    {
      code: "UAH",
      name_code: "ukrainian_hryvnia",
      symbol: "₴",
      placedBeforeNumber: true,
    },
  ]

  if (!currencyCode) {
    return data;
  }

  return data.find((currency) => currency.code === currencyCode);
}

export function formatCurrency(amount: number, currencyCode: string | null) {
  const currency = currencies(currencyCode);
  if (!currency || Array.isArray(currency)) {
    return `${amount.toFixed(2)}`;
  }
  return currency.placedBeforeNumber 
    ? `${currency.symbol}${amount.toFixed(2)}` 
    : `${amount.toFixed(2)}${currency.symbol}`;
}