export type DefaultCategoryTemplate = {
  key: string;
  type: "income" | "expense";
  iconName: string;
};

export const DEFAULT_CATEGORIES: { income: DefaultCategoryTemplate[]; expense: DefaultCategoryTemplate[] } = {
  income: [
    { key: "default_salary", type: "income", iconName: "banknote" },
    { key: "default_investment", type: "income", iconName: "trending-up" },
    { key: "default_gifts", type: "income", iconName: "gift" },
  ],
  expense: [
    { key: "default_groceries", type: "expense", iconName: "shopping-cart" },
    { key: "default_housing", type: "expense", iconName: "home" },
    { key: "default_transport", type: "expense", iconName: "car" },
    { key: "default_entertainment", type: "expense", iconName: "gamepad-2" },
    { key: "default_health", type: "expense", iconName: "heart-pulse" },
    { key: "default_shopping", type: "expense", iconName: "shopping-bag" },
    { key: "default_dining", type: "expense", iconName: "utensils" },
  ],
};
