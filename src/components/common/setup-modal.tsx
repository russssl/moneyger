"use client";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/common/modal";
import { useEffect, useState, useReducer } from "react";
import CurrencySelect from "./currency-select";
import { useTranslations } from "next-intl";
import { ErrorAlert } from "./error-alert";
import { useFetch, useMutation } from "@/hooks/use-api";
import { type NewUser } from "@/server/db/user";
import { defineStepper } from "@stepperize/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Globe, Palette, Sun, Moon, Computer, Tag, Plus, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { type Wallet as WalletType } from "@/server/db/wallet";
import { type Category } from "@/server/db/category";
import { cn } from "@/lib/utils";
import LoadingButton from "./loading-button";
import { useTranslations as useServiceTranslations } from "next-intl";
import { IconPicker, Icon, type IconName } from "@/components/ui/icon-picker";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type WalletFormState = {
  walletName: string;
  balance: number | null;
  currency: string | undefined;
};

type WalletFormAction =
  | { type: "SET_WALLET_NAME"; payload: string }
  | { type: "SET_BALANCE"; payload: number | null }
  | { type: "SET_CURRENCY"; payload: string | undefined }
  | { type: "RESET"; payload?: string | undefined };

const walletInitialState: WalletFormState = {
  walletName: "",
  balance: null,
  currency: undefined,
};

function walletFormReducer(
  state: WalletFormState,
  action: WalletFormAction,
): WalletFormState {
  switch (action.type) {
  case "SET_WALLET_NAME":
    return { ...state, walletName: action.payload };
  case "SET_BALANCE":
    return { ...state, balance: action.payload };
  case "SET_CURRENCY":
    return { ...state, currency: action.payload };
  case "RESET":
    return { walletName: "", balance: null, currency: action.payload };
  default:
    return state;
  }
}

function SetupModalContent({ useStepper }: { useStepper: any }) {
  const t = useTranslations("setup-modal");
  const tGeneral = useTranslations("general");
  const tFinances = useTranslations("finances");
  const tCategories = useTranslations("categories");

  // useStepper must be called inside Scoped context
  const stepper = useStepper();

  const [currency, setCurrency] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [walletState, dispatchWallet] = useReducer(
    walletFormReducer,
    walletInitialState,
  );
  const [selectedTheme, setSelectedTheme] = useState<string | undefined>(
    undefined,
  );
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState<IconName | undefined>(undefined);
  const { setTheme, theme } = useTheme();
  const saveDataMutation = useMutation<Partial<NewUser>>("/api/user", "POST");
  const createWalletMutation = useMutation<any, any>("/api/wallets", "POST");
  const createCategoriesMutation = useMutation<any, any>("/api/categories/batch", "POST");
  const createCategoryMutation = useMutation<{ name: string; type: string; iconName?: string }, Category>(
    "/api/categories",
    "POST"
  );
  const deleteCategoryMutation = useMutation<{ id: string }, void>(
    (data) => `/api/categories/${data.id}`,
    "DELETE"
  );
  
  const { data: categories, refetch: refetchCategories } = useFetch<Category[]>("/api/categories");

  const { data: userData, refetch: refetchUserData } = useFetch<{
    currency: string | undefined;
  }>("/api/user/me");
  const { refetch: refetchWallets } = useFetch<WalletType[]>("/api/wallets");

  // Track if we've done initial navigation to prevent interference with manual navigation
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (userData && !hasInitialized) {
      setCurrency(userData.currency ?? undefined);
      const hasCurrency = !!userData.currency;

      // Initialize theme from current theme or default to system
      if (theme) {
        setSelectedTheme(theme);
      } else {
        setSelectedTheme("system");
      }

      // Only auto-navigate on initial load
      if (!hasCurrency) {
        stepper.goTo("currency");
      }
      setHasInitialized(true);
    } else if (userData) {
      // Update currency state when userData changes
      setCurrency(userData.currency ?? undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, hasInitialized, theme]);

  // Initialize wallet currency when main currency changes
  useEffect(() => {
    if (currency && !walletState.currency) {
      dispatchWallet({ type: "SET_CURRENCY", payload: currency });
    }
  }, [currency, walletState.currency]);

  const serviceTranslations = useServiceTranslations("service");


  async function saveCurrency() {
    if (!currency) return;

    await saveDataMutation.mutateAsync(
      {
        currency,
      },
      {
        onError: (error) => {
          setError(error.message || t("error_save_currency"));
          console.error(error);
          throw error;
        },
        onSuccess: () => {
          setError(undefined);
        },
      },
    );
  }

  async function createWallet() {
    if (!walletState.walletName.trim()) return;
    const walletCurrency = walletState.currency || currency;
    if (!walletCurrency) return;

    const payload = {
      name: walletState.walletName,
      currency: walletCurrency,
      balance: walletState.balance ?? 0,
    };

    await createWalletMutation.mutateAsync(payload, {
      onError: (error) => {
        setError(error.message || t("error_create_wallet"));
        console.error(error);
        throw error;
      },
      onSuccess: () => {
        setError(undefined);
      },
    });
  }

  async function saveAllSettings() {
    setError(undefined);

    try {
      // Save currency if it's set and different from current
      if (currency && currency !== userData?.currency) {
        await saveCurrency();
      }

      // Ensure theme is applied (already set via handleThemeSelection, but ensure it's persisted)
      if (selectedTheme) {
        setTheme(selectedTheme);
      }

      // Create wallet if wallet name is provided
      if (walletState.walletName.trim() && (walletState.currency || currency)) {
        await createWallet();
      }

      // Categories are already loaded if user clicked the button, no need to save again

      // Refetch all data to update the UI
      await Promise.all([refetchUserData(), refetchWallets()]);
    } catch (error) {
      // Error is already set in the individual save functions
      console.error("Failed to save settings:", error);
    }
  }

  // Default categories
  const defaultCategories = {
    income: [
      { name: "Salary", type: "income" as const, iconName: "banknote" },
      { name: "Investment", type: "income" as const, iconName: "trending-up" },
      { name: "Gifts", type: "income" as const, iconName: "gift" },
    ],
    expense: [
      { name: "Groceries", type: "expense" as const, iconName: "shopping-cart" },
      { name: "Housing", type: "expense" as const, iconName: "home" },
      { name: "Transport", type: "expense" as const, iconName: "car" },
      { name: "Entertainment", type: "expense" as const, iconName: "gamepad-2" },
      { name: "Health", type: "expense" as const, iconName: "heart-pulse" },
      { name: "Shopping", type: "expense" as const, iconName: "shopping-bag" },
      { name: "Dining", type: "expense" as const, iconName: "utensils" },
    ],
  };

  const handleLoadDefaultCategories = async () => {
    try {
      const allCategories = [
        ...defaultCategories.income,
        ...defaultCategories.expense,
      ];
      await createCategoriesMutation.mutateAsync(
        { categories: allCategories },
        {
          onError: (error) => {
            setError(error.message || t("error_load_categories"));
            throw error;
          },
          onSuccess: () => {
            setError(undefined);
            setCategoriesLoaded(true);
            void refetchCategories();
          },
        },
      );
    } catch (error) {
      console.error("Failed to load default categories:", error);
    }
  };

  // Auto-load default categories when categories step is shown
  useEffect(() => {
    if (stepper.current.id === "categories" && !categoriesLoaded && categories && categories.length === 0) {
      void handleLoadDefaultCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepper.current.id, categoriesLoaded]);

  const handleAddCategory = async (type: "income" | "expense") => {
    if (!newCategoryName.trim()) return;
    
    try {
      await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
        type: type,
        iconName: newCategoryIcon,
      });
      toast.success(tGeneral("success"));
      setNewCategoryName("");
      setNewCategoryIcon(undefined);
      void refetchCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tGeneral("error"));
    }
  };

  const incomeCategories = categories?.filter((c) => c.type === "income") || [];
  const expenseCategories = categories?.filter((c) => c.type === "expense") || [];

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategoryMutation.mutateAsync({ id: categoryId });
      toast.success(tGeneral("success"));
      void refetchCategories();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tGeneral("error"));
    }
  };

  const canProceedFromCurrency = !!currency;
  const canProceedFromTheme = !!selectedTheme;
  const canProceedFromWallet = walletState.walletName.trim().length > 0;
  const canProceedFromCategories = true; // Categories step is optional

  const handleThemeSelection = (themeValue: string) => {
    setSelectedTheme(themeValue);
    setTheme(themeValue);
  };

  const handleNext = () => {
    // Just navigate to next step without saving
    stepper.next();
  };

  const handleFinish = async () => {
    // Save all settings when finishing
    await saveAllSettings();
  };

  const handleBack = () => {
    setError(undefined);
  };

  return (
    <ModalContent
      className="flex max-h-[85vh] max-w-2xl flex-col"
      disableClose={true}
    >
      <ModalHeader>
        <ModalTitle>{t("title")}</ModalTitle>
        <ModalDescription>{t("description")}</ModalDescription>
      </ModalHeader>
      <ModalBody className="min-h-0 flex-1 overflow-y-auto pb-3 pt-4">
        <div className="flex flex-col gap-6 px-1">
          {error && (
            <div className="mb-4">
              <ErrorAlert error={error} />
            </div>
          )}
          {stepper.current.id === "currency" ? (
            <div className="flex flex-col gap-4 duration-300 animate-in fade-in slide-in-from-right-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">
                    {t("currency_step_title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("currency_step_description")}
                  </p>
                </div>
              </div>
              <CurrencySelect
                selectedCurrency={currency}
                setSelectedCurrency={(currency) =>
                  setCurrency(currency ?? undefined)
                }
              />
            </div>
          ) : stepper.current.id === "theme" ? (
            <div className="flex flex-col gap-4 duration-300 animate-in fade-in slide-in-from-right-4">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Palette className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">
                    {t("theme_step_title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("theme_step_description")}
                  </p>
                </div>
              </div>
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => handleThemeSelection("light")}
                  className={cn(
                    "flex w-full flex-row items-center justify-start gap-3 rounded-lg border-2 p-3 transition-colors duration-200 sm:flex-col sm:justify-center sm:gap-0 sm:p-6",
                    selectedTheme === "light"
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-muted hover:border-muted-foreground/50",
                  )}
                >
                  <Sun
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors sm:mb-3 sm:h-6 sm:w-6",
                      selectedTheme === "light"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <div className="flex flex-1 flex-col items-start text-left sm:flex-none sm:items-center sm:text-center">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        selectedTheme === "light"
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {t("light_theme")}
                    </span>
                    <span className="hidden text-xs text-muted-foreground sm:mt-1 sm:block">
                      {t("light_theme_desc")}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeSelection("dark")}
                  className={cn(
                    "flex w-full flex-row items-center justify-start gap-3 rounded-lg border-2 p-3 transition-colors duration-200 sm:flex-col sm:justify-center sm:gap-0 sm:p-6",
                    selectedTheme === "dark"
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-muted hover:border-muted-foreground/50",
                  )}
                >
                  <Moon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors sm:mb-3 sm:h-6 sm:w-6",
                      selectedTheme === "dark"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <div className="flex flex-1 flex-col items-start text-left sm:flex-none sm:items-center sm:text-center">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        selectedTheme === "dark"
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {t("dark_theme")}
                    </span>
                    <span className="hidden text-xs text-muted-foreground sm:mt-1 sm:block">
                      {t("dark_theme_desc")}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeSelection("system")}
                  className={cn(
                    "flex w-full flex-row items-center justify-start gap-3 rounded-lg border-2 p-3 transition-colors duration-200 sm:flex-col sm:justify-center sm:gap-0 sm:p-6",
                    selectedTheme === "system"
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-muted hover:border-muted-foreground/50",
                  )}
                >
                  <Computer
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors sm:mb-3 sm:h-6 sm:w-6",
                      selectedTheme === "system"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <div className="flex flex-1 flex-col items-start text-left sm:flex-none sm:items-center sm:text-center">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        selectedTheme === "system"
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {t("system_theme")}
                    </span>
                    <span className="hidden text-xs text-muted-foreground sm:mt-1 sm:block">
                      {t("system_theme_desc")}
                    </span>
                  </div>
                </button>
              </div>
              <p className="mt-2 hidden text-center text-xs text-muted-foreground sm:block">
                {t("theme_note")}
              </p>
            </div>
          ) : stepper.current.id === "categories" ? (
            <div className="flex flex-col gap-3 sm:gap-4 duration-300 animate-in fade-in slide-in-from-right-4">
              <div className="mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                <div className="rounded-lg bg-primary/10 p-1.5 sm:p-2">
                  <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-semibold">
                    {t("categories_step_title")}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("categories_step_description")}
                  </p>
                </div>
              </div>

              <Tabs defaultValue="expense" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-2 sm:mb-4">
                  <TabsTrigger value="expense" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {tGeneral("expense")}
                  </TabsTrigger>
                  <TabsTrigger value="income" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {tGeneral("income")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="expense" className="space-y-2 sm:space-y-4 mt-0">
                  <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-48 overflow-y-auto">
                    {expenseCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card group hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 flex items-center justify-center rounded-md bg-muted h-7 w-7 sm:h-8 sm:w-8">
                            {category.iconName ? (
                              <Icon name={category.iconName as IconName} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : (
                              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium text-xs sm:text-sm truncate">{category.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => void handleDeleteCategory(category.id)}
                          disabled={deleteCategoryMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-2 sm:pt-4 space-y-2 sm:space-y-3">
                    <h4 className="text-xs sm:text-sm font-semibold">{tCategories("add_category")}</h4>
                    <div className="flex flex-col gap-2 sm:gap-3">
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <Label htmlFor="category-name" className="text-xs sm:text-sm">{tGeneral("name")}</Label>
                        <Input
                          id="category-name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder={tCategories("category_name")}
                          className="h-9 sm:h-10 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newCategoryName.trim()) {
                              e.preventDefault();
                              void handleAddCategory("expense");
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <Label className="text-xs sm:text-sm">{tCategories("category_icon")}</Label>
                        <IconPicker
                          value={newCategoryIcon}
                          onValueChange={(val) => setNewCategoryIcon(val)}
                          triggerPlaceholder={tFinances("select_icon")}
                          modal={true}
                        >
                          <Button variant="outline" className="w-full justify-start h-9 sm:h-10 text-sm">
                            {newCategoryIcon ? (
                              <>
                                <Icon name={newCategoryIcon} className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                                <span className="text-xs sm:text-sm">{newCategoryIcon}</span>
                              </>
                            ) : (
                              <span className="text-xs sm:text-sm">{tFinances("select_icon")}</span>
                            )}
                          </Button>
                        </IconPicker>
                      </div>
                      <LoadingButton
                        onClick={() => {
                          void handleAddCategory("expense");
                        }}
                        loading={createCategoryMutation.isPending}
                        disabled={!newCategoryName.trim()}
                        className="w-full h-9 sm:h-10 text-sm"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        {tCategories("add_category")}
                      </LoadingButton>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="income" className="space-y-2 sm:space-y-4 mt-0">
                  <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-48 overflow-y-auto">
                    {incomeCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card group hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 flex items-center justify-center rounded-md bg-muted h-7 w-7 sm:h-8 sm:w-8">
                            {category.iconName ? (
                              <Icon name={category.iconName as IconName} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : (
                              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium text-xs sm:text-sm truncate">{category.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => void handleDeleteCategory(category.id)}
                          disabled={deleteCategoryMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-2 sm:pt-4 space-y-2 sm:space-y-3">
                    <h4 className="text-xs sm:text-sm font-semibold">{tCategories("add_category")}</h4>
                    <div className="flex flex-col gap-2 sm:gap-3">
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <Label htmlFor="category-name-income" className="text-xs sm:text-sm">{tGeneral("name")}</Label>
                        <Input
                          id="category-name-income"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder={tCategories("category_name")}
                          className="h-9 sm:h-10 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newCategoryName.trim()) {
                              e.preventDefault();
                              void handleAddCategory("income");
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <Label className="text-xs sm:text-sm">{tCategories("category_icon")}</Label>
                        <IconPicker
                          value={newCategoryIcon}
                          onValueChange={(val) => setNewCategoryIcon(val)}
                          triggerPlaceholder={tFinances("select_icon")}
                          modal={true}
                        >
                          <Button variant="outline" className="w-full justify-start h-9 sm:h-10 text-sm">
                            {newCategoryIcon ? (
                              <>
                                <Icon name={newCategoryIcon} className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                                <span className="text-xs sm:text-sm">{newCategoryIcon}</span>
                              </>
                            ) : (
                              <span className="text-xs sm:text-sm">{tFinances("select_icon")}</span>
                            )}
                          </Button>
                        </IconPicker>
                      </div>
                      <LoadingButton
                        onClick={() => {
                          void handleAddCategory("income");
                        }}
                        loading={createCategoryMutation.isPending}
                        disabled={!newCategoryName.trim()}
                        className="w-full h-9 sm:h-10 text-sm"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        {tCategories("add_category")}
                      </LoadingButton>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <p className="text-center text-[10px] sm:text-xs text-muted-foreground">
                {t("categories_note")}
              </p>
            </div>
          ) : stepper.current.id === "wallet" ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (stepper.isLast && canProceedFromWallet) {
                  await handleFinish();
                }
              }}
              className="flex flex-col gap-4 duration-300 animate-in fade-in slide-in-from-right-4"
            >
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">
                    {t("wallet_step_title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("wallet_step_description")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="wallet-name">
                    {tFinances("wallet_name")}
                  </Label>
                  <Input
                    id="wallet-name"
                    placeholder={t("wallet_name_placeholder")}
                    value={walletState.walletName}
                    onChange={(e) =>
                      dispatchWallet({
                        type: "SET_WALLET_NAME",
                        payload: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <CurrencySelect
                  selectedCurrency={walletState.currency || currency}
                  setSelectedCurrency={(currencyCode) =>
                    dispatchWallet({
                      type: "SET_CURRENCY",
                      payload: currencyCode ?? undefined,
                    })
                  }
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="initial-balance">
                    {tFinances("wallet_initial_balance")} (
                    {tGeneral("optional")})
                  </Label>
                  <Input
                    id="initial-balance"
                    placeholder={t("initial_balance_placeholder")}
                    type="number"
                    step="0.01"
                    value={walletState.balance ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      dispatchWallet({
                        type: "SET_BALANCE",
                        payload: value === "" ? null : parseFloat(value),
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("initial_balance_hint")}
                  </p>
                </div>
              </div>
            </form>
          ) : null}

          {/* Footer Navigation */}
          <div className="mt-6 flex w-full flex-col-reverse justify-between gap-3 sm:flex-row">
            {!stepper.isFirst && (
              <LoadingButton
                variant="outline"
                loading={false}
                onClick={() => {
                  handleBack();
                  stepper.prev();
                }}
                disabled={
                  saveDataMutation.isPending ||
                  createWalletMutation.isPending ||
                  createCategoriesMutation.isPending
                }
                className="w-full sm:w-auto"
              >
                {serviceTranslations("back")}
              </LoadingButton>
            )}
            <LoadingButton
              variant="success"
              loading={
                stepper.isLast &&
                (saveDataMutation.isPending ||
                  createWalletMutation.isPending ||
                  createCategoriesMutation.isPending)
              }
              disabled={
                (stepper.current.id === "currency" &&
                  !canProceedFromCurrency) ||
                (stepper.current.id === "theme" &&
                  (!canProceedFromTheme ||
                    (stepper.isLast && !canProceedFromCurrency))) ||
                (stepper.current.id === "wallet" && !canProceedFromWallet) ||
                (stepper.current.id === "categories" && !canProceedFromCategories) ||
                (stepper.isLast &&
                  (saveDataMutation.isPending ||
                    createWalletMutation.isPending ||
                    createCategoriesMutation.isPending))
              }
              onClick={stepper.isLast ? handleFinish : handleNext}
              className="w-full sm:ml-auto sm:w-auto"
            >
              {stepper.isLast ? t("finish") : serviceTranslations("next")}
            </LoadingButton>
          </div>
        </div>
      </ModalBody>
    </ModalContent>
  );
}

export default function SetupModal() {
  const t = useTranslations("setup-modal");
  const [open, setOpen] = useState(false);
  const { data: userData, isLoading: isLoadingUser } = useFetch<{ currency: string | undefined }>(
    "/api/user/me",
  );
  const { data: wallets, isLoading: isLoadingWallets } = useFetch<WalletType[]>(
    "/api/wallets",
  );

  // Define stepper with translations
  // Note: These strings are used internally by the stepper library.
  // The actual UI displays translated strings from en.json (step_1_title, step_1_description, etc.)
  const { Scoped, useStepper } = defineStepper(
    {
      id: "currency",
      title: t("stepper_currency_title"),
      description: t("stepper_currency_description"),
    },
    {
      id: "theme",
      title: t("stepper_theme_title"),
      description: t("stepper_theme_description"),
    },
    {
      id: "categories",
      title: t("stepper_categories_title"),
      description: t("stepper_categories_description"),
    },
    {
      id: "wallet",
      title: t("stepper_wallet_title"),
      description: t("stepper_wallet_description"),
    },
  );

  useEffect(() => {
    // Wait for both user data and wallets to load
    if (!isLoadingUser && !isLoadingWallets) {
      // Show setup modal if user has no wallets (new user hasn't completed setup)
      // This is more reliable than checking currency since new users get default "USD"
      const hasWallets = wallets && wallets.length > 0;
      const needsSetup = !hasWallets;
      setOpen(needsSetup);
    }
  }, [userData, wallets, isLoadingUser, isLoadingWallets]);

  if (!open) return null;

  return (
    <Modal open={true}>
      <Scoped>
        <SetupModalContent useStepper={useStepper} />
      </Scoped>
    </Modal>
  );
}
