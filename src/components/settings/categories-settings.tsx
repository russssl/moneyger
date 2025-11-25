"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFetch, useMutation } from "@/hooks/use-api";
import { Category } from "@/server/db/category";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import LoadingButton from "@/components/common/loading-button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IconPicker, Icon, type IconName } from "@/components/ui/icon-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesSettings() {
  const t = useTranslations("categories");
  const tGeneral = useTranslations("general");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [formData, setFormData] = useState<{ name: string; type: "income" | "expense"; iconName?: string }>({
    name: "",
    type: "expense",
    iconName: undefined
  });

  const { data: categories, refetch, isLoading } = useFetch<Category[]>("/api/categories");

  const createCategory = useMutation<{ name: string; type: string; iconName?: string }, Category>(
    "/api/categories",
    "POST"
  );

  const updateCategory = useMutation<{ name: string; iconName?: string }, Category>(
    (data) => `/api/categories/${editingCategory?.id}`,
    "PUT"
  );

  const deleteCategory = useMutation<{ id: string }, void>(
    (data) => `/api/categories/${data.id}`,
    "DELETE"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isCreateMode) {
        await createCategory.mutateAsync(formData);
        toast.success(tGeneral("success"));
      } else if (editingCategory) {
        await updateCategory.mutateAsync({ name: formData.name, iconName: formData.iconName });
        toast.success(tGeneral("success"));
      }
      handleCloseDialog();
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tGeneral("error"));
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory.mutateAsync({ id: categoryToDelete.id });
      toast.success(tGeneral("success"));
      refetch();
      setCategoryToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tGeneral("error"));
    }
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type as "income" | "expense",
      iconName: category.iconName || undefined
    });
    setIsCreateMode(false);
  };

  const openCreate = (type: "income" | "expense") => {
    setEditingCategory(null);
    setFormData({ name: "", type, iconName: undefined });
    setIsCreateMode(true);
  };

  const handleCloseDialog = () => {
    setIsCreateMode(false);
    setEditingCategory(null);
    setFormData({ name: "", type: "expense", iconName: undefined });
  };

  const incomeCategories = categories?.filter((c) => c.type === "income") || [];
  const expenseCategories = categories?.filter((c) => c.type === "expense") || [];

  return (
    <>
      {/* Income Categories */}
      <Card className="sm:max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-green-600">{tGeneral("income")}</CardTitle>
            <Button size="sm" onClick={() => openCreate("income")} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              {t("add_category")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              ))}
            </>
          ) : incomeCategories.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              {t("no_categories")}
            </div>
          ) : (
            incomeCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2.5 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {category.iconName && (
                    <Icon name={category.iconName as IconName} className="w-4 h-4" />
                  )}
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(category)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setCategoryToDelete(category)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Expense Categories */}
      <Card className="sm:max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-red-600">{tGeneral("expense")}</CardTitle>
            <Button size="sm" onClick={() => openCreate("expense")} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              {t("add_category")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              ))}
            </>
          ) : expenseCategories.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              {t("no_categories")}
            </div>
          ) : (
            expenseCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2.5 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {category.iconName && (
                    <Icon name={category.iconName as IconName} className="w-4 h-4" />
                  )}
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(category)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setCategoryToDelete(category)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateMode || !!editingCategory} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? t("create_category") : t("edit_category")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="category-name">{tGeneral("name")}</Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("category_name")}
                required
                className="w-full"
              />
            </div>
            {isCreateMode && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="category-type">{tGeneral("type")}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val: "income" | "expense") => setFormData({...formData, type: val})}
                >
                  <SelectTrigger id="category-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">{tGeneral("expense")}</SelectItem>
                    <SelectItem value="income">{tGeneral("income")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="category-icon">{t("category_icon")}</Label>
              <IconPicker 
                id="category-icon"
                value={formData.iconName as IconName | undefined} 
                onValueChange={(val) => setFormData({...formData, iconName: val})}
                modal={true}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                {tGeneral("cancel")}
              </Button>
              <LoadingButton
                type="submit"
                loading={createCategory.isPending || updateCategory.isPending}
              >
                {tGeneral("save")}
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tGeneral("delete")}?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete the category "{categoryToDelete?.name}"?
            This action cannot be undone.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCategoryToDelete(null)}>
              {tGeneral("cancel")}
            </Button>
            <LoadingButton 
              variant="destructive" 
              onClick={handleDelete}
              loading={deleteCategory.isPending}  
            >
              {tGeneral("delete")}
            </LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
