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

export interface ForwardGeocodeResult {
  lat: number;
  lng: number;
  address: string;
}

// Turns a manually-typed address into a lat/lng pair — used when GPS is
// unavailable/denied but the user still types a location, since the Lead's
// gpsLatitude/gpsLongitude are required alongside visitLocation.
export async function forwardGeocode(query: string): Promise<ForwardGeocodeResult | null> {
  const { data } = await apiClient.get<ForwardGeocodeResult | null>("/geo/forward-geocode", {
    params: { q: query },
  });
  return data;
}
