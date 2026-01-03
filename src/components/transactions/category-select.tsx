"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, X } from "lucide-react";
import { useFetch, useMutation } from "@/hooks/use-api";
import { type Category } from "@/server/db/category";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import LoadingButton from "@/components/common/loading-button";
import { IconPicker, Icon, type IconName } from "@/components/ui/icon-picker";

type TransactionType = "income" | "expense";

interface CategorySelectProps {
  transactionType: TransactionType;
  selectedCategory?: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function CategorySelect({
  transactionType,
  selectedCategory,
  onCategoryChange,
}: CategorySelectProps) {
  const t = useTranslations("finances");
  const tGeneral = useTranslations("general");
  const tCategories = useTranslations("categories");
  
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState<IconName | undefined>(undefined);
  
  const { data: categoriesData, refetch: refetchCategories } = useFetch<Category[]>(
    "/api/categories"
  );
  
  const createCategory = useMutation<{ name: string; type: string; iconName?: string }, Category>(
    "/api/categories",
    "POST",
    {
      invalidates: [["categories"]],
    }
  );
  
  // Filter categories by transaction type
  const filteredCategories = categoriesData?.filter((c) => c.type === transactionType) ?? [];
  const hasCategories = filteredCategories.length > 0;
  
  useEffect(() => {
    setShowCreateCategory(false);
    setNewCategoryName("");
    setNewCategoryIcon(undefined);
  }, [transactionType]);
  
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const newCategory = await createCategory.mutateAsync({
        name: newCategoryName.trim(),
        type: transactionType,
        iconName: newCategoryIcon,
      });
      
      toast.success(tGeneral("success"));
      setShowCreateCategory(false);
      setNewCategoryName("");
      setNewCategoryIcon(undefined);
      
      // Refresh categories and auto-select the new one
      refetchCategories().then(() => {
        onCategoryChange(newCategory.id);
      }).catch(() => {
        // If refetch fails, still select the category (it was created successfully)
        onCategoryChange(newCategory.id);
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tGeneral("error"));
    }
  };
  
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between">
        <Label>{tGeneral("category")}</Label>
        {hasCategories && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateCategory(true)}
            className="h-auto py-1 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            {tCategories("add_category")}
          </Button>
        )}
      </div>
      
      {!hasCategories && !showCreateCategory && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <AlertDescription className="flex items-center justify-between text-amber-900 dark:text-amber-100">
            <span>{tCategories("no_categories_desc")}</span>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setShowCreateCategory(true)}
              className="ml-2 h-7 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-3 h-3 mr-1" />
              {tCategories("add_category")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {showCreateCategory ? (
        <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{tCategories("create_category")}</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateCategory(false);
                setNewCategoryName("");
                setNewCategoryIcon(undefined);
              }}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <Input
              placeholder={tCategories("category_name")}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCategoryName.trim()) {
                  e.preventDefault();
                  void handleCreateCategory();
                }
              }}
              className="w-full"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <IconPicker
                  value={newCategoryIcon}
                  onValueChange={(val) => setNewCategoryIcon(val)}
                  triggerPlaceholder={t("select_icon")}
                  modal={true}
                >
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    {newCategoryIcon ? (
                      <>
                        <Icon name={newCategoryIcon} className="w-4 h-4 mr-2" />
                        {newCategoryIcon}
                      </>
                    ) : (
                      t("select_icon")
                    )}
                  </Button>
                </IconPicker>
              </div>
              <LoadingButton
                type="button"
                onClick={handleCreateCategory}
                loading={createCategory.isPending}
                disabled={!newCategoryName.trim() || createCategory.isPending}
                size="sm"
              >
                {tGeneral("save")}
              </LoadingButton>
            </div>
          </div>
        </div>
      ) : hasCategories ? (
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={tGeneral("select_category")} />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  {category.iconName && (
                    <Icon name={category.iconName as IconName} className="w-4 h-4" />
                  )}
                  <span>{category.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}

