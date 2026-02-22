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
import { useTranslations } from "next-intl";
import { ErrorAlert } from "./error-alert";
import { useFetch, useMutation } from "@/hooks/use-api";
import { type NewUser } from "@/server/db/user";
import { defineStepper } from "@stepperize/react";
import { useTheme } from "next-themes";
import { type Wallet as WalletType } from "@/server/db/wallet";
import { type Category } from "@/server/db/category";
import LoadingButton from "./loading-button";
import { useTranslations as useServiceTranslations } from "next-intl";
import type { IconName } from "@/components/ui/icon-picker";
import { toast } from "sonner";
import type { WalletFormState, WalletFormAction } from "./setup-modal/types";
import { CurrencyStep } from "./setup-modal/steps/currency-step";
import { ThemeStep } from "./setup-modal/steps/theme-step";
import { CategoriesStep } from "./setup-modal/steps/categories-step";
import { WalletStep } from "./setup-modal/steps/wallet-step";

const walletInitialState: WalletFormState = {
  walletName: "",
  balance: null,
  currency: undefined,
};

function walletFormReducer(state: WalletFormState, action: WalletFormAction): WalletFormState {
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
  const [pendingDefaultCategories, setPendingDefaultCategories] = useState<Array<{ id: string; key: string; type: "income" | "expense"; iconName?: string }>>([]);
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

  const { data: categories, refetch: refetchCategories, isLoading: isLoadingCategories } = useFetch<Category[]>("/api/categories");
  const shouldFetchDefaults = stepper.current.id === "categories" && (categories?.length ?? 0) === 0;
  const { data: defaultsData, isLoading: isLoadingDefaultsTemplate } = useFetch<{
    income: Array<{ key: string; type: "income"; iconName: string }>;
    expense: Array<{ key: string; type: "expense"; iconName: string }>;
  }>(shouldFetchDefaults ? "/api/categories/defaults" : null, { queryKey: ["categories", "defaults"] });

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

      // Save pending default categories (resolve key -> name via i18n)
      if (pendingDefaultCategories.length > 0) {
        await createCategoriesMutation.mutateAsync({
          categories: pendingDefaultCategories.map(({ id: _id, key, type, iconName }) => ({ name: tCategories(key), type, iconName })),
        });
        setPendingDefaultCategories([]);
        await refetchCategories();
      }

      await Promise.all([refetchUserData(), refetchWallets()]);
    } catch (error) {
      // Error is already set in the individual save functions
      console.error("Failed to save settings:", error);
    }
  }

  // Prefetch categories when on theme step so they're ready when user goes to categories step
  useEffect(() => {
    if (stepper.current.id === "theme") {
      void refetchCategories();
    }
  }, [stepper.current.id, refetchCategories, stepper]);

  // Sync fetched default templates into pending when on categories step (show, don't save yet)
  useEffect(() => {
    if (stepper.current.id !== "categories" || !defaultsData || pendingDefaultCategories.length > 0) return;
    const all = [...(defaultsData.income ?? []), ...(defaultsData.expense ?? [])];
    setPendingDefaultCategories(all.map((c, i) => ({ ...c, id: `pending-${i}-${Date.now()}` })));
  }, [stepper.current.id, defaultsData, pendingDefaultCategories.length, stepper]);

  const categoriesForStep = [
    ...(categories ?? []),
    ...pendingDefaultCategories.map((p) => ({ id: p.id, name: tCategories(p.key), type: p.type, iconName: p.iconName ?? "" })),
  ] as Category[];

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

  const handleDeleteCategory = async (categoryId: string) => {
    if (categoryId.startsWith("pending-")) {
      setPendingDefaultCategories((prev) => prev.filter((c) => c.id !== categoryId));
      return;
    }
    try {
      await deleteCategoryMutation.mutateAsync({ id: categoryId });
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
          {stepper.current.id === "currency" && (
            <CurrencyStep currency={currency} setCurrency={setCurrency} />
          )}
          {stepper.current.id === "theme" && (
            <ThemeStep selectedTheme={selectedTheme} onThemeSelect={handleThemeSelection} />
          )}
          {stepper.current.id === "categories" && (
            <CategoriesStep
              categories={categoriesForStep}
              isLoading={isLoadingCategories}
              isLoadingDefaults={isLoadingDefaultsTemplate}
              newCategoryName={newCategoryName}
              setNewCategoryName={setNewCategoryName}
              newCategoryIcon={newCategoryIcon}
              setNewCategoryIcon={setNewCategoryIcon}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              isCreatePending={createCategoryMutation.isPending}
              isDeletePending={deleteCategoryMutation.isPending}
            />
          )}
          {stepper.current.id === "wallet" && (
            <WalletStep
              walletState={walletState}
              dispatchWallet={dispatchWallet}
              currency={currency}
              onSubmit={async (e) => {
                e.preventDefault();
                if (stepper.isLast && canProceedFromWallet) await handleFinish();
              }}
            />
          )}

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
