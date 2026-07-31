import { supabase } from "./supabase";
import type { AladinLookupResponse, AladinSearchResponse } from "../types/aladin";

export async function searchAladin(query: string): Promise<AladinSearchResponse> {
  const { data, error } = await supabase.functions.invoke<AladinSearchResponse>(
    "aladin-proxy",
    { body: { action: "search", query } },
  );
  if (error) throw error;
  return data ?? { items: [], totalResults: 0 };
}

export async function lookupAladinByIsbn(isbn13: string): Promise<AladinLookupResponse> {
  const { data, error } = await supabase.functions.invoke<AladinLookupResponse>(
    "aladin-proxy",
    { body: { action: "lookup", isbn13 } },
  );
  if (error) throw error;
  return data ?? { item: null };
}
