"use client";
import { useTranslations } from "next-intl";
import { Tag, Plus, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker, Icon, type IconName } from "@/components/ui/icon-picker";
import LoadingButton from "@/components/common/loading-button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/server/db/category";
import { cn } from "@/lib/utils";

const CATEGORY_LIST_MIN_H = "8rem";
const SKELETON_ROWS = 4;

type CategoriesStepProps = {
  categories: Category[] | undefined;
  isLoading: boolean;
  isLoadingDefaults: boolean;
  newCategoryName: string;
  setNewCategoryName: (v: string) => void;
  newCategoryIcon: IconName | undefined;
  setNewCategoryIcon: (v: IconName | undefined) => void;
  onAddCategory: (type: "income" | "expense") => void;
  onDeleteCategory: (id: string) => void;
  isCreatePending: boolean;
  isDeletePending: boolean;
};

function CategoryListSkeleton() {
  return (
    <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-48 overflow-hidden" style={{ minHeight: CATEGORY_LIST_MIN_H }}>
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card">
          <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-md flex-shrink-0" />
          <Skeleton className="h-4 flex-1 max-w-[120px] sm:max-w-[160px]" />
        </div>
      ))}
    </div>
  );
}

function CategoryRow({
  category,
  onDelete,
  isDeletePending,
  className,
}: {
  category: Category;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card group hover:bg-accent/50 transition-colors", className)}>
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
        onClick={() => void onDelete(category.id)}
        disabled={isDeletePending}
      >
        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </Button>
    </div>
  );
}

function AddCategoryForm({
  type,
  newCategoryName,
  setNewCategoryName,
  newCategoryIcon,
  setNewCategoryIcon,
  onAdd,
  isCreatePending,
  inputId,
}: {
  type: "income" | "expense";
  newCategoryName: string;
  setNewCategoryName: (v: string) => void;
  newCategoryIcon: IconName | undefined;
  setNewCategoryIcon: (v: IconName | undefined) => void;
  onAdd: (type: "income" | "expense") => void;
  isCreatePending: boolean;
  inputId: string;
}) {
  const tGeneral = useTranslations("general");
  const tCategories = useTranslations("categories");
  const tFinances = useTranslations("finances");
  return (
    <div className="border-t pt-2 sm:pt-4 space-y-2 sm:space-y-3">
      <h4 className="text-xs sm:text-sm font-semibold">{tCategories("add_category")}</h4>
      <div className="flex flex-col gap-2 sm:gap-3">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <Label htmlFor={inputId} className="text-xs sm:text-sm">{tGeneral("name")}</Label>
          <Input
            id={inputId}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={tCategories("category_name")}
            className="h-9 sm:h-10 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCategoryName.trim()) {
                e.preventDefault();
                onAdd(type);
              }
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <Label className="text-xs sm:text-sm">{tCategories("category_icon")}</Label>
          <IconPicker value={newCategoryIcon} onValueChange={setNewCategoryIcon} triggerPlaceholder={tFinances("select_icon")} modal={true}>
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
          onClick={() => onAdd(type)}
          loading={isCreatePending}
          disabled={!newCategoryName.trim()}
          className="w-full h-9 sm:h-10 text-sm"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          {tCategories("add_category")}
        </LoadingButton>
      </div>
    </div>
  );
}

export function CategoriesStep({
  categories,
  isLoading,
  isLoadingDefaults,
  newCategoryName,
  setNewCategoryName,
  newCategoryIcon,
  setNewCategoryIcon,
  onAddCategory,
  onDeleteCategory,
  isCreatePending,
  isDeletePending,
}: CategoriesStepProps) {
  const t = useTranslations("setup-modal");
  const tGeneral = useTranslations("general");
  const incomeCategories = categories?.filter((c) => c.type === "income") ?? [];
  const expenseCategories = categories?.filter((c) => c.type === "expense") ?? [];
  const showSkeleton = isLoading || isLoadingDefaults;

  return (
    <div className="flex flex-col gap-3 sm:gap-4 duration-300 animate-in fade-in slide-in-from-right-4">
      <div className="mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
        <div className="rounded-lg bg-primary/10 p-1.5 sm:p-2">
          <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-semibold">{t("categories_step_title")}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">{t("categories_step_description")}</p>
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
          <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-48 overflow-y-auto" style={{ minHeight: CATEGORY_LIST_MIN_H }}>
            {showSkeleton ? (
              <CategoryListSkeleton />
            ) : (
              <div className="animate-in fade-in duration-300">
                {expenseCategories.map((category) => (
                  <CategoryRow key={category.id} category={category} onDelete={onDeleteCategory} isDeletePending={isDeletePending} className="mt-2"/>
                ))}
              </div>
            )}
          </div>
          <AddCategoryForm
            type="expense"
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            newCategoryIcon={newCategoryIcon}
            setNewCategoryIcon={setNewCategoryIcon}
            onAdd={onAddCategory}
            isCreatePending={isCreatePending}
            inputId="category-name"
          />
        </TabsContent>

        <TabsContent value="income" className="space-y-2 sm:space-y-4 mt-0">
          <div className="space-y-1.5 sm:space-y-2 max-h-32 sm:max-h-48 overflow-y-auto" style={{ minHeight: CATEGORY_LIST_MIN_H }}>
            {showSkeleton ? (
              <CategoryListSkeleton />
            ) : (
              <div className="animate-in fade-in duration-300">
                {incomeCategories.map((category) => (
                  <CategoryRow key={category.id} category={category} onDelete={onDeleteCategory} isDeletePending={isDeletePending} />
                ))}
              </div>
            )}
          </div>
          <AddCategoryForm
            type="income"
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            newCategoryIcon={newCategoryIcon}
            setNewCategoryIcon={setNewCategoryIcon}
            onAdd={onAddCategory}
            isCreatePending={isCreatePending}
            inputId="category-name-income"
          />
        </TabsContent>
      </Tabs>

      <p className="text-center text-[10px] sm:text-xs text-muted-foreground">{t("categories_note")}</p>
    </div>
  );
}
