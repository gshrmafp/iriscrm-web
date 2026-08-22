import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/features/catalog/api";

export const catalogKeys = {
  items: ["catalog", "items"] as const,
  itemsList: (filters: api.ListCatalogItemsFilters) => ["catalog", "items", "list", filters] as const,
};

export function useCatalogItems(filters: api.ListCatalogItemsFilters = {}) {
  return useQuery({
    queryKey: catalogKeys.itemsList(filters),
    queryFn: () => api.listCatalogItems(filters),
  });
}

// The catalog is a small, fixed reference dataset — pickers (quotation
// builder, price rules, win dialog) need the full list, not one page of it.
// active:true excludes deactivated items from those pickers — the admin
// catalog management table uses useCatalogItems() (below) instead, which
// doesn't set this, so admins can still see/reactivate inactive items there.
const ALL_ITEMS_FILTERS: api.ListCatalogItemsFilters = {
  pageSize: 500,
  sortBy: "name",
  sortOrder: "asc",
  active: true,
};

export function useAllCatalogItems() {
  const query = useQuery({
    queryKey: catalogKeys.itemsList(ALL_ITEMS_FILTERS),
    queryFn: () => api.listCatalogItems(ALL_ITEMS_FILTERS),
  });
  return { ...query, data: query.data?.items };
}

export function useCreateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCatalogItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.items });
    },
  });
}

export function useUpdateCatalogItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: api.UpdateCatalogItemPayload) =>
      api.updateCatalogItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.items });
    },
  });
}

export function useResolveItemPrice(id: string, regionId?: string) {
  return useQuery({
    queryKey: ["catalog", "items", id, "price", regionId],
    queryFn: () => api.resolveItemPrice(id, regionId),
    enabled: !!id,
  });
}

export function useCreatePriceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPriceRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.items });
    },
  });
}
