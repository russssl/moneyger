export type Currency = {
  code: string;
  name: string;
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
      name: "US Dollar",
      symbol: "$",
      placedBeforeNumber: true,
    },
    {
      code: "EUR",
      name: "Euro",
      symbol: "€",
      placedBeforeNumber: true,
    },
    {
      code: "GBP",
      name: "British Pound",
      symbol: "£",
      placedBeforeNumber: true,
    },
    {
      code: "JPY",
      name: "Japanese Yen",
      symbol: "¥",
      placedBeforeNumber: true,
    },
    {
      code: "PLN",
      name: "Polish Zloty",
      symbol: "zł",
    },
    {
      code: "CZK",
      name: "Czech Koruna",
      symbol: "Kč",
    },
    {
      code: "UAH",
      name: "Ukrainian Hryvnia",
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