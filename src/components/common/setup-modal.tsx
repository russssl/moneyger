"use client";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from "@/components/common/modal";
import { useEffect, useState, useReducer, Fragment } from "react";
import CurrencySelect from "./currency-select";
import { useTranslations } from "next-intl";
import { ErrorAlert } from "./error-alert";
import { useFetch, useMutation } from "@/hooks/use-api";
import { type NewUser } from "@/server/db/user";
import { defineStepper } from "@stepperize/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Globe, Palette, Sun, Moon, Computer } from "lucide-react";
import { useTheme } from "next-themes";
import { type Wallet as WalletType } from "@/server/db/wallet";
import { cn } from "@/lib/utils";
import {
  Stepper,
  StepperItem,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
} from "@/components/ui/stepper";
import LoadingButton from "./loading-button";
import { useTranslations as useServiceTranslations } from "next-intl";

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
  const generalTranslations = useTranslations("general");
  const financesTranslations = useTranslations("finances");

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
  const { setTheme, theme } = useTheme();
  const saveDataMutation = useMutation<Partial<NewUser>>("/api/user", "POST");
  const createWalletMutation = useMutation<any, any>("/api/wallets", "POST");

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

  type StepConfig = {
    id: string;
    title: string;
    icon: typeof Globe;
  };

  const stepConfigs: StepConfig[] = [
    {
      id: "currency",
      title: t("step_1_title"),
      icon: Globe,
    },
    {
      id: "theme",
      title: t("step_2_title"),
      icon: Palette,
    },
    {
      id: "wallet",
      title: t("step_3_title"),
      icon: Wallet,
    },
  ];

  // Always show all steps on first launch

  // Map current step ID to numeric index
  const currentStepIndex = stepConfigs.findIndex(
    (step) => step.id === stepper.current.id,
  );
  const numericActiveStep = currentStepIndex >= 0 ? currentStepIndex : 0;

  const handleStepClick = (stepIndex: number) => {
    const step = stepConfigs[stepIndex];
    if (step) {
      stepper.goTo(step.id);
    }
  };

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

      // Refetch all data to update the UI
      await Promise.all([refetchUserData(), refetchWallets()]);
    } catch (error) {
      // Error is already set in the individual save functions
      console.error("Failed to save settings:", error);
    }
  }

  const canProceedFromCurrency = !!currency;
  const canProceedFromTheme = !!selectedTheme;
  const canProceedFromWallet = walletState.walletName.trim().length > 0;

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
        <div className="flex flex-col px-1">
          <div className="mb-3 sm:mb-5">
            <Stepper
              value={numericActiveStep}
              onValueChange={handleStepClick}
              orientation="horizontal"
              className="w-full justify-between gap-2 sm:gap-2"
            >
              {stepConfigs.map((step, index) => {
                const isActive = step.id === stepper.current.id;
                const isCompleted = currentStepIndex > index;
                const StepIcon = step.icon;

                return (
                  <Fragment key={step.id}>
                    <StepperItem
                      step={index}
                      completed={isCompleted}
                      className="flex min-w-0 flex-1 flex-col items-center px-2 sm:flex-1 sm:px-0"
                    >
                      {/* Step Indicator with custom icon */}
                      <div className="relative mb-2 flex items-center justify-center">
                        {/* Outer ring for active state */}
                        {isActive && (
                          <div
                            className="absolute inset-0 animate-pulse rounded-full bg-primary/20"
                            style={{
                              width: "calc(100% + 6px)",
                              height: "calc(100% + 6px)",
                              margin: "-3px",
                            }}
                          />
                        )}

                        {/* Custom indicator with icon */}
                        {isCompleted ? (
                          <StepperIndicator
                            className={cn(
                              "relative flex size-8 shrink-0 scale-100 items-center justify-center rounded-full border-2 border-primary bg-primary text-xs font-semibold text-primary-foreground shadow-sm transition-all duration-300 sm:size-9",
                            )}
                          />
                        ) : (
                          <StepperIndicator
                            asChild
                            className={cn(
                              "relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold shadow-sm transition-all duration-300 sm:size-9",
                              isActive
                                ? "scale-105 border-primary bg-primary text-primary-foreground shadow-md"
                                : "scale-100 border-muted-foreground/30 bg-muted text-muted-foreground",
                            )}
                          >
                            <StepIcon
                              className={cn(
                                "size-4 transition-all sm:size-5",
                                isActive ? "scale-110" : "scale-100",
                              )}
                            />
                          </StepperIndicator>
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="flex w-full flex-col items-center px-1 text-center">
                        <StepperTitle
                          className={cn(
                            "mb-0.5 text-xs font-semibold transition-colors duration-200 sm:text-sm",
                            isActive
                              ? "text-foreground"
                              : isCompleted
                                ? "text-foreground/80"
                                : "text-muted-foreground",
                          )}
                        >
                          {step.title}
                        </StepperTitle>
                        <StepperDescription
                          className={cn(
                            "line-clamp-2 text-[10px] transition-colors duration-200 sm:text-xs",
                            isActive
                              ? "text-muted-foreground"
                              : "text-muted-foreground/70",
                          )}
                        ></StepperDescription>
                      </div>
                    </StepperItem>

                    {index < stepConfigs.length - 1 && (
                      <StepperSeparator className="hidden sm:relative sm:mx-2 sm:mt-5 sm:flex sm:flex-1 sm:items-center sm:justify-center" />
                    )}
                  </Fragment>
                );
              })}
            </Stepper>
          </div>

          {/* Step Content */}
          <div className="flex flex-col gap-6">
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
                      {financesTranslations("wallet_name")}
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
                      {financesTranslations("wallet_initial_balance")} (
                      {generalTranslations("optional")})
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
          </div>

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
                  saveDataMutation.isPending || createWalletMutation.isPending
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
                (saveDataMutation.isPending || createWalletMutation.isPending)
              }
              disabled={
                (stepper.current.id === "currency" &&
                  !canProceedFromCurrency) ||
                (stepper.current.id === "theme" &&
                  (!canProceedFromTheme ||
                    (stepper.isLast && !canProceedFromCurrency))) ||
                (stepper.current.id === "wallet" && !canProceedFromWallet) ||
                (stepper.isLast &&
                  (saveDataMutation.isPending ||
                    createWalletMutation.isPending))
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
  const { data: userData } = useFetch<{ currency: string | undefined }>(
    "/api/user/me",
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
      id: "wallet",
      title: t("stepper_wallet_title"),
      description: t("stepper_wallet_description"),
    },
  );

  useEffect(() => {
    if (userData) {
      const hasCurrency = !!userData.currency;
      console.log("hasCurrency", hasCurrency);
      // Setup is needed if currency is missing (first launch)
      const needsSetup = !hasCurrency;
      setOpen(needsSetup);
    }
  }, [userData]);

  if (!open) return null;

  return (
    <Modal open={true}>
      <Scoped>
        <SetupModalContent useStepper={useStepper} />
      </Scoped>
    </Modal>
  );
}
