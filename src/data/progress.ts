import { supabase } from "../lib/supabase";
import type { Book } from "../types/book";

export interface UpdateProgressParams {
  bookId: string;
  newPage: number;
  minutes?: number | null;
  note?: string | null;
  logDate?: string;
}

export async function updateProgress(params: UpdateProgressParams): Promise<Book> {
  const { data, error } = await supabase.rpc("update_progress", {
    p_book_id: params.bookId,
    p_new_page: params.newPage,
    p_minutes: params.minutes ?? null,
    p_note: params.note ?? null,
    p_log_date: params.logDate ?? new Date().toISOString().slice(0, 10),
  });
  if (error) throw error;
  return data;
}

export interface FinishBookParams {
  bookId: string;
  rating?: number | null;
  finishedOn?: string | null;
  memo?: string | null;
}

export async function finishBook(params: FinishBookParams): Promise<Book> {
  const { data, error } = await supabase.rpc("finish_book", {
    p_book_id: params.bookId,
    p_rating: params.rating ?? null,
    p_finished_on: params.finishedOn ?? new Date().toISOString().slice(0, 10),
    p_memo: params.memo ?? null,
  });
  if (error) throw error;
  return data;
}

export async function recomputeCurrentPage(bookId: string): Promise<void> {
  const { error } = await supabase.rpc("recompute_current_page", { p_book_id: bookId });
  if (error) throw error;
}
