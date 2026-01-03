"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Tag } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from "@/components/common/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFetch, useMutation } from "@/hooks/use-api";
import { type Category } from "@/server/db/category";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import LoadingButton from "@/components/common/loading-button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { IconPicker, Icon, type IconName } from "@/components/ui/icon-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoItems } from "@/components/common/no-items";
import { cn } from "@/lib/utils";

export default function CategoriesSettings() {
  const t = useTranslations("categories");
  const tGeneral = useTranslations("general");
  const tFinances = useTranslations("finances");
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
    () => `/api/categories/${editingCategory?.id}`,
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
      void refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tGeneral("error"));
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory.mutateAsync({ id: categoryToDelete.id });
      toast.success(tGeneral("success"));
      void refetch();
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

  const CategoryItem = ({ category, onEdit, onDelete }: { category: Category; onEdit: () => void; onDelete: () => void }) => (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border bg-card",
        "hover:bg-accent/50 active:bg-accent/70 transition-colors cursor-pointer",
        "group border-border/50"
      )}
      onClick={onEdit}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 flex items-center justify-center rounded-md bg-muted h-8 w-8">
          {category.iconName ? (
            <Icon name={category.iconName as IconName} className="w-4 h-4" />
          ) : (
            <Tag className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <span className="font-medium text-sm truncate">{category.name}</span>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Pencil className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tag className="h-5 w-5 mr-2" />
            {t("categories")}
          </CardTitle>
          <CardDescription>{t("manage_categories")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="expense" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="expense" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                {tGeneral("expense")}
              </TabsTrigger>
              <TabsTrigger value="income" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {tGeneral("income")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expense" className="space-y-4 mt-0">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-md" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : expenseCategories.length === 0 ? (
                <NoItems
                  icon={Tag}
                  title={t("no_categories")}
                  description={t("no_categories_desc")}
                  button={{
                    text: t("add_category"),
                    onClick: () => openCreate("expense"),
                    icon: Plus
                  }}
                />
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <Button size="sm" onClick={() => openCreate("expense")} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("add_category")}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {expenseCategories.map((category) => (
                      <CategoryItem
                        key={category.id}
                        category={category}
                        onEdit={() => openEdit(category)}
                        onDelete={() => setCategoryToDelete(category)}
                      />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="income" className="space-y-4 mt-0">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-md" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : incomeCategories.length === 0 ? (
                <NoItems
                  icon={Tag}
                  title={t("no_categories")}
                  description={t("no_categories_desc")}
                  button={{
                    text: t("add_category"),
                    onClick: () => openCreate("income"),
                    icon: Plus
                  }}
                />
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <Button size="sm" onClick={() => openCreate("income")} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("add_category")}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {incomeCategories.map((category) => (
                      <CategoryItem
                        key={category.id}
                        category={category}
                        onEdit={() => openEdit(category)}
                        onDelete={() => setCategoryToDelete(category)}
                      />
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal open={isCreateMode || !!editingCategory} onOpenChange={(open) => !open && handleCloseDialog()}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>
              {isCreateMode ? t("create_category") : t("edit_category")}
            </ModalTitle>
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody className="space-y-4">
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
                <Label>{t("category_icon")}</Label>
                <IconPicker 
                  value={formData.iconName as IconName | undefined} 
                  onValueChange={(val) => setFormData({...formData, iconName: val})}
                  triggerPlaceholder={tFinances("select_icon")}
                  modal={true}
                >
                  <Button variant="outline" className="w-full justify-start">
                    {formData.iconName ? (
                      <>
                        <Icon name={formData.iconName as IconName} className="w-4 h-4 mr-2" />
                        {formData.iconName}
                      </>
                    ) : (
                      tFinances("select_icon")
                    )}
                  </Button>
                </IconPicker>
              </div>
            </ModalBody>
            <ModalFooter className="flex flex-row justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                {tGeneral("cancel")}
              </Button>
              <LoadingButton
                type="submit"
                loading={createCategory.isPending || updateCategory.isPending}
              >
                {tGeneral("save")}
              </LoadingButton>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{tGeneral("delete")}?</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the category &quot;{categoryToDelete?.name}&quot;?
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter className="flex flex-row justify-end gap-2">
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
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
