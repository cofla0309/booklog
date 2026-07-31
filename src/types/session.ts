export interface Session {
  id: string;
  book_id: string;
  log_date: string;
  start_page: number;
  end_page: number;
  pages: number;
  minutes: number | null;
  note: string | null;
  created_at: string;
}
