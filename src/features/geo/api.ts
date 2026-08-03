import { apiClient } from "@/lib/api-client";

export interface ReverseGeocodeResult {
  address: string | null;
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const { data } = await apiClient.get<ReverseGeocodeResult>("/geo/reverse-geocode", {
    params: { lat, lng },
  });
  return data;
}
