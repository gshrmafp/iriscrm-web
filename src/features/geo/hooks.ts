import { useMutation } from "@tanstack/react-query";
import * as api from "@/features/geo/api";

export function useReverseGeocode() {
  return useMutation({
    mutationFn: ({ lat, lng }: { lat: number; lng: number }) => api.reverseGeocode(lat, lng),
  });
}
