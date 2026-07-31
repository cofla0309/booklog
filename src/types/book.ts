export type BookStatus = "wishlist" | "reading" | "done" | "paused";

export interface Book {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  publisher: string | null;
  isbn: string | null;
  category: string | null;
  status: BookStatus;
  rating: number | null;
  memo: string | null;
  start_date: string | null;
  end_date: string | null;
  due_date: string | null;
  total_pages: number | null;
  current_page: number;
  created_at: string;
  updated_at: string;
}

export type NewBook = Pick<Book, "title"> &
  Partial<
    Pick<
      Book,
      | "author"
      | "cover_url"
      | "publisher"
      | "isbn"
      | "category"
      | "status"
      | "rating"
      | "memo"
      | "start_date"
      | "end_date"
      | "due_date"
      | "total_pages"
    >
  >;

export type BookUpdate = Partial<Omit<Book, "id" | "created_at" | "updated_at">>;
