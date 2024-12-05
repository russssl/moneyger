import {
  createTRPCRouter,
  // protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export type Currency = {
  code: string;
  name: string;
  symbol: string;
  placedBeforeNumber?: boolean;
}
const availableCurrencies: Array<Currency> = [
  { code: "USD", name: "US Dollar", symbol: "$", placedBeforeNumber: true },
  { code: "EUR", name: "Euro", symbol: "€", placedBeforeNumber: true },
  { code: "GBP", name: "British Pound", symbol: "£", placedBeforeNumber: true },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", placedBeforeNumber: true },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴" },
];
export const currenciesRouter = createTRPCRouter({
  getAvailableCurrencies: publicProcedure.query(async () => {
    return availableCurrencies;
  }),
});