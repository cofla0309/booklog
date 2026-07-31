import { supabase } from "../lib/supabase";
import type { AppSettings, YearlyGoal } from "../types/settings";

export async function getAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("pages_per_day, minutes_per_day")
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const { data: created, error: insertError } = await supabase
    .from("app_settings")
    .insert({})
    .select("pages_per_day, minutes_per_day")
    .single();
  if (insertError) throw insertError;
  return created;
}

export async function updateAppSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not signed in");

  const { data, error } = await supabase
    .from("app_settings")
    .update(patch)
    .eq("user_id", user.id)
    .select("pages_per_day, minutes_per_day")
    .single();
  if (error) throw error;
  return data;
}

export async function getYearlyGoal(year: number): Promise<YearlyGoal | null> {
  const { data, error } = await supabase
    .from("yearly_goals")
    .select("*")
    .eq("year", year)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertYearlyGoal(year: number, targetBooks: number): Promise<YearlyGoal> {
  const { data, error } = await supabase
    .from("yearly_goals")
    .upsert({ year, target_books: targetBooks }, { onConflict: "user_id,year" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteYearlyGoal(year: number): Promise<void> {
  const { error } = await supabase.from("yearly_goals").delete().eq("year", year);
  if (error) throw error;
}
