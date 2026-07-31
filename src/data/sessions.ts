import { format, subDays } from "date-fns";
import { supabase } from "../lib/supabase";
import { recomputeCurrentPage } from "./progress";
import type { Session } from "../types/session";

export interface RecentSession extends Session {
  title: string;
  cover_url: string | null;
}

export async function listSessionsForBook(bookId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("book_id", bookId)
    .order("log_date", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listSessionsForRange(startDate: string, endDate: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listAllSessionDates(): Promise<Pick<Session, "log_date" | "pages" | "minutes">[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("log_date, pages, minutes")
    .order("log_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listAllSessions(): Promise<Session[]> {
  const { data, error } = await supabase.from("sessions").select("*").order("log_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getBookProgressSeries(bookId: string): Promise<{ date: string; page: number }[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("log_date, end_page")
    .eq("book_id", bookId)
    .order("log_date", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({ date: row.log_date, page: row.end_page }));
}

export async function getRecentSpeed(bookId: string, windowDays = 14): Promise<number> {
  const since = format(subDays(new Date(), windowDays - 1), "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("sessions")
    .select("pages")
    .eq("book_id", bookId)
    .gte("log_date", since);
  if (error) throw error;
  const total = (data ?? []).reduce((sum, row) => sum + row.pages, 0);
  return Math.max(0, total / windowDays);
}

export async function listRecentSessions(limit: number): Promise<RecentSession[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*, books(title, cover_url)")
    .order("log_date", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { books, ...session } = row as Session & {
      books: { title: string; cover_url: string | null } | null;
    };
    return { ...session, title: books?.title ?? "", cover_url: books?.cover_url ?? null };
  });
}

export interface UpdateSessionParams {
  sessionId: string;
  logDate: string;
  startPage: number;
  endPage: number;
  minutes?: number | null;
  note?: string | null;
}

export async function updateSession(params: UpdateSessionParams): Promise<Session> {
  const { data, error } = await supabase.rpc("update_session", {
    p_session_id: params.sessionId,
    p_log_date: params.logDate,
    p_start_page: params.startPage,
    p_end_page: params.endPage,
    p_minutes: params.minutes ?? null,
    p_note: params.note ?? null,
  });
  if (error) throw error;
  return data;
}

export async function deleteSession(sessionId: string, bookId: string): Promise<void> {
  const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
  if (error) throw error;
  await recomputeCurrentPage(bookId);
}
