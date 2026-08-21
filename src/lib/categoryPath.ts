import categoriesData from "./categories.json";

type SubSubCategory = { id: string; name: string };
type SubCategory = { id: string; name: string; subsubcategories?: SubSubCategory[] };
type Category = { name: string; subcategories?: SubCategory[] };
type CategoriesData = Record<string, Category>;

const taxonomy = categoriesData as CategoriesData;

export type ItemCategoryIds = {
  categoryId: string | null;
  subcategoryId: string | null;
  subsubcategoryId: string | null;
};

/** Human-readable path, e.g. "Electronics › Mobile Phones & Accessories › Smartphones". */
export function formatCategoryPath(ids: ItemCategoryIds): string | null {
  const categoryId = ids.categoryId?.trim() || null;
  if (!categoryId) return null;

  const category = taxonomy[categoryId];
  const parts: string[] = [category?.name || categoryId];

  const subcategoryId = ids.subcategoryId?.trim() || null;
  if (subcategoryId) {
    const sub = category?.subcategories?.find((s) => s.id === subcategoryId);
    parts.push(sub?.name || subcategoryId);

    const leafId = ids.subsubcategoryId?.trim() || null;
    if (leafId) {
      const leaf = sub?.subsubcategories?.find((l) => l.id === leafId);
      parts.push(leaf?.name || leafId);
    }
  }

  return parts.join(" › ");
}

export function readCategoryIds(data: Record<string, unknown>): ItemCategoryIds {
  const asString = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  };

  return {
    categoryId: asString(data.categoryId ?? data.categoryid),
    subcategoryId: asString(data.subcategoryId ?? data.subcategoryid),
    subsubcategoryId: asString(data.subsubcategoryId ?? data.subsubcategoryid),
  };
}
