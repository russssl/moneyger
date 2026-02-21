import { authenticated, getUserData } from "../authenticate";
import { Hono } from "hono";
import { type AuthVariables } from "../authenticate";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { categories } from "@/server/db/category";
import { transactions } from "@/server/db/transaction";
import db from "@/server/db";
import { DEFAULT_CATEGORIES } from "@/server/defaultCategories";

const categoriesRouter = new Hono<AuthVariables>();

// Get default category templates (for setup modal and settings)
categoriesRouter.get("/defaults", authenticated, async (c) => {
  return c.json(DEFAULT_CATEGORIES);
});

// Get categories
categoriesRouter.get("/", authenticated, zValidator("query", z.object({
  type: z.string().optional(),
})), async (c) => {
  const { user } = await getUserData(c);
  const { type } = c.req.valid("query");

  const categoriesData = await db.query.categories.findMany({
    where: and(
      eq(categories.createdBy, user.id),
      type ? eq(categories.type, type) : undefined,
    ),
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });
  return c.json(categoriesData);
});

// Create category
categoriesRouter.post("/", authenticated, zValidator("json", z.object({
  name: z.string().min(1),
  type: z.enum(["income", "expense"]),
  iconName: z.string().optional(),
})), async (c) => {
  const { user } = await getUserData(c);
  const { name, type, iconName } = c.req.valid("json");

  const [newCategory] = await db.insert(categories).values({
    name,
    type,
    iconName,
    createdBy: user.id,
  }).returning();

  return c.json(newCategory);
});

// Batch create categories
categoriesRouter.post("/batch", authenticated, zValidator("json", z.object({
  categories: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(["income", "expense"]),
    iconName: z.string().optional(),
  })),
})), async (c) => {
  const { user } = await getUserData(c);
  const { categories: categoriesData } = c.req.valid("json");

  const categoriesToInsert = categoriesData.map((cat) => ({
    name: cat.name,
    type: cat.type,
    iconName: cat.iconName,
    createdBy: user.id,
  }));

  const insertedCategories = await db.insert(categories).values(categoriesToInsert).returning();

  return c.json(insertedCategories);
});

// Update category
categoriesRouter.put("/:id", authenticated, zValidator("json", z.object({
  name: z.string().min(1),
  iconName: z.string().optional(),
})), async (c) => {
  const { user } = await getUserData(c);
  const id = c.req.param("id");
  const { name, iconName } = c.req.valid("json");

  const [updatedCategory] = await db.update(categories)
    .set({ name, iconName })
    .where(and(eq(categories.id, id), eq(categories.createdBy, user.id)))
    .returning();

  if (!updatedCategory) {
    return c.json({ error: "Category not found" }, 404);
  }

  return c.json(updatedCategory);
});

// Delete category
categoriesRouter.delete("/:id", authenticated, async (c) => {
  const { user } = await getUserData(c);
  const id = c.req.param("id");

  // Check if category is used in transactions
  const categoryInUse = await db.query.transactions.findFirst({
    where: eq(transactions.categoryId, id),
  });

  if (categoryInUse) {
    return c.json({ error: "Cannot delete category that is in use" }, 400);
  }

  const [deletedCategory] = await db.delete(categories)
    .where(and(eq(categories.id, id), eq(categories.createdBy, user.id)))
    .returning();

  if (!deletedCategory) {
    return c.json({ error: "Category not found" }, 404);
  }

  return c.json(deletedCategory);
});

export default categoriesRouter;