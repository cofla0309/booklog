import { supabase } from "../lib/supabase";
import { decorateBook, type DecoratedBook } from "../lib/bookDerived";
import type { Book, BookStatus, BookUpdate, NewBook } from "../types/book";

export type BookSort = "recent" | "title" | "author" | "rating" | "finished" | "progress";

export interface ListBooksParams {
  status?: BookStatus | "all";
  q?: string;
  sort?: BookSort;
}

export async function listBooks(params: ListBooksParams = {}): Promise<DecoratedBook[]> {
  let query = supabase.from("books").select("*");
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.q) {
    const like = `%${params.q}%`;
    query = query.or(`title.ilike.${like},author.ilike.${like},publisher.ilike.${like}`);
  }
  switch (params.sort) {
    case "title":
      query = query.order("title", { ascending: true });
      break;
    case "author":
      query = query.order("author", { ascending: true, nullsFirst: false });
      break;
    case "rating":
      query = query.order("rating", { ascending: false, nullsFirst: false });
      break;
    case "finished":
      query = query.order("end_date", { ascending: false, nullsFirst: false });
      break;
    case "progress":
      break;
    default:
      query = query.order("updated_at", { ascending: false });
  }
  const { data, error } = await query;
  if (error) throw error;
  let books = (data ?? []).map(decorateBook);
  if (params.sort === "progress") {
    books = books.sort((a, b) => (b.progressPct ?? -1) - (a.progressPct ?? -1));
  }
  return books;
}

export async function getBook(id: string): Promise<DecoratedBook | null> {
  const { data, error } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? decorateBook(data) : null;
}

export async function createBook(book: NewBook): Promise<Book> {
  const payload: NewBook & { current_page?: number } = { ...book };
  const today = new Date().toISOString().slice(0, 10);
  if ((payload.status === "reading" || payload.status === "done") && !payload.start_date) {
    payload.start_date = today;
  }
  if (payload.status === "done") {
    if (!payload.end_date) payload.end_date = today;
    if (payload.total_pages) payload.current_page = payload.total_pages;
  }
  const { data, error } = await supabase.from("books").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateBook(id: string, patch: BookUpdate): Promise<Book> {
  const { data, error } = await supabase
    .from("books")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setStatus(id: string, status: BookStatus, current: Book): Promise<Book> {
  const patch: BookUpdate = { status };
  const today = new Date().toISOString().slice(0, 10);
  if (status === "done") {
    if (!current.end_date) patch.end_date = today;
    if (current.total_pages) patch.current_page = current.total_pages;
  } else if (status === "reading") {
    if (!current.start_date) patch.start_date = today;
    if (current.status === "done") patch.end_date = null;
  }
  return updateBook(id, patch);
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;
}

export async function statusCounts(): Promise<Record<BookStatus | "all", number>> {
  const { data, error } = await supabase.from("books").select("status");
  if (error) throw error;
  const counts: Record<BookStatus | "all", number> = {
    wishlist: 0,
    reading: 0,
    done: 0,
    paused: 0,
    all: 0,
  };
  for (const row of data ?? []) {
    counts[row.status as BookStatus] += 1;
    counts.all += 1;
  }
  return counts;
}

export async function listCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("books")
    .select("category")
    .not("category", "is", null)
    .order("category");
  if (error) throw error;
  return [...new Set((data ?? []).map((row) => row.category as string).filter(Boolean))];
}

export async function countDoneBooksInYear(year: number): Promise<number> {
  return countDoneBooksInRange(`${year}-01-01`, `${year}-12-31`);
}

export async function countDoneBooksInRange(startDate: string, endDate: string): Promise<number> {
  const { count, error } = await supabase
    .from("books")
    .select("id", { count: "exact", head: true })
    .eq("status", "done")
    .gte("end_date", startDate)
    .lte("end_date", endDate);
  if (error) throw error;
  return count ?? 0;
}
