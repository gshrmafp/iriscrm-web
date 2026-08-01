import { apiClient } from "@/lib/api-client";
import type { paths } from "@/types/api.generated";
import type { CatalogItem, PriceRule, ResolvedPrice } from "@/types/entities";

type CreateCatalogItemPayload =
  paths["/catalog/items"]["post"]["requestBody"]["content"]["application/json"];
type UpdateCatalogItemPayload =
  paths["/catalog/items/{id}"]["patch"]["requestBody"]["content"]["application/json"];
type CreatePriceRulePayload =
  paths["/catalog/price-rules"]["post"]["requestBody"]["content"]["application/json"];

export type {
  CreateCatalogItemPayload,
  UpdateCatalogItemPayload,
  CreatePriceRulePayload,
};

export interface ListCatalogItemsFilters {
  category?: string;
  taxClass?: string;
  active?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "basePrice" | "createdAt" | "category";
  sortOrder?: "asc" | "desc";
}
export interface PaginatedCatalogItems {
  items: CatalogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listCatalogItems(
  filters: ListCatalogItemsFilters = {},
): Promise<PaginatedCatalogItems> {
  const { data } = await apiClient.get<PaginatedCatalogItems>("/catalog/items", { params: filters });
  return data;
}

export async function createCatalogItem(
  payload: CreateCatalogItemPayload,
): Promise<CatalogItem> {
  const { data } = await apiClient.post<CatalogItem>(
    "/catalog/items",
    payload,
  );
  return data;
}

export async function updateCatalogItem(
  id: string,
  payload: UpdateCatalogItemPayload,
): Promise<CatalogItem> {
  const { data } = await apiClient.patch<CatalogItem>(
    `/catalog/items/${id}`,
    payload,
  );
  return data;
}

export async function resolveItemPrice(
  id: string,
  regionId?: string,
): Promise<ResolvedPrice> {
  const { data } = await apiClient.get<ResolvedPrice>(
    `/catalog/items/${id}/price`,
    { params: regionId ? { regionId } : undefined },
  );
  return data;
}

export async function createPriceRule(
  payload: CreatePriceRulePayload,
): Promise<PriceRule> {
  const { data } = await apiClient.post<PriceRule>(
    "/catalog/price-rules",
    payload,
  );
  return data;
}
