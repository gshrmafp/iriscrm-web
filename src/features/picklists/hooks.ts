import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/features/picklists/api";
import type { PicklistType } from "@/types/entities";

export const picklistsKeys = {
  active: (listType: PicklistType) => ["picklists", "active", listType] as const,
  all: (listType: PicklistType) => ["picklists", "all", listType] as const,
};

export function useActivePicklistOptions(listType: PicklistType) {
  return useQuery({
    queryKey: picklistsKeys.active(listType),
    queryFn: () => api.listActivePicklistOptions(listType),
  });
}

export function useAllPicklistOptions(listType: PicklistType) {
  return useQuery({
    queryKey: picklistsKeys.all(listType),
    queryFn: () => api.listAllPicklistOptions(listType),
  });
}

function useInvalidatePicklist(listType: PicklistType) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: picklistsKeys.active(listType) });
    queryClient.invalidateQueries({ queryKey: picklistsKeys.all(listType) });
  };
}

export function useCreatePicklistOption(listType: PicklistType) {
  const invalidate = useInvalidatePicklist(listType);
  return useMutation({
    mutationFn: api.createPicklistOption,
    onSuccess: invalidate,
  });
}

// Resolves a stored code (e.g. "CCTV_INSTALLATION") back to its human label
// (e.g. "CCTV Installation") for display in tables/detail views. Falls back
// to the raw code for a deactivated option no longer in the active list.
export function usePicklistLabelResolver() {
  const { data: sources = [] } = useActivePicklistOptions("LEAD_SOURCE");
  const { data: products = [] } = useActivePicklistOptions("PRODUCT_INTEREST");

  return (listType: PicklistType, code?: string | null) => {
    if (!code) return code ?? "";
    const options = listType === "LEAD_SOURCE" ? sources : products;
    return options.find((o) => o.code === code)?.label ?? code;
  };
}

export function useUpdatePicklistOption(listType: PicklistType) {
  const invalidate = useInvalidatePicklist(listType);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: api.UpdatePicklistOptionPayload }) =>
      api.updatePicklistOption(id, payload),
    onSuccess: invalidate,
  });
}
