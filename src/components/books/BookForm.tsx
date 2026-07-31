import { useState } from "react";
import type { BookStatus } from "../../types/book";

export interface BookFormValues {
  title: string;
  author: string;
  cover_url: string;
  publisher: string;
  isbn: string;
  category: string;
  status: BookStatus;
  total_pages: string;
  due_date: string;
}

export interface BookFormSubmitValues {
  title: string;
  author: string | null;
  cover_url: string | null;
  publisher: string | null;
  isbn: string | null;
  category: string | null;
  status: BookStatus;
  total_pages: number | null;
  due_date: string | null;
}

interface BookFormProps {
  initial?: Partial<BookFormValues>;
  submitLabel: string;
  categories?: string[];
  onSubmit: (values: BookFormSubmitValues) => Promise<void>;
  onCancel?: () => void;
}

export function BookForm({ initial, submitLabel, categories = [], onSubmit, onCancel }: BookFormProps) {
  const [values, setValues] = useState<BookFormValues>({
    title: initial?.title ?? "",
    author: initial?.author ?? "",
    cover_url: initial?.cover_url ?? "",
    publisher: initial?.publisher ?? "",
    isbn: initial?.isbn ?? "",
    category: initial?.category ?? "",
    status: initial?.status ?? "wishlist",
    total_pages: initial?.total_pages ?? "",
    due_date: initial?.due_date ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof BookFormValues>(key: K, value: BookFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        author: values.author.trim() || null,
        cover_url: values.cover_url.trim() || null,
        publisher: values.publisher.trim() || null,
        isbn: values.isbn.trim() || null,
        category: values.category.trim() || null,
        status: values.status,
        total_pages: values.total_pages ? Number(values.total_pages) : null,
        due_date: values.due_date || null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="m-title">제목 *</label>
        <input
          id="m-title"
          required
          maxLength={300}
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="m-author">저자</label>
          <input id="m-author" value={values.author} onChange={(e) => set("author", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="m-publisher">출판사</label>
          <input
            id="m-publisher"
            value={values.publisher}
            onChange={(e) => set("publisher", e.target.value)}
          />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="m-pages">총 페이지</label>
          <input
            id="m-pages"
            type="number"
            min={1}
            max={100000}
            inputMode="numeric"
            value={values.total_pages}
            onChange={(e) => set("total_pages", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="m-category">카테고리</label>
          <input
            id="m-category"
            list="category-list"
            placeholder="소설 / 경제 / 기술…"
            value={values.category}
            onChange={(e) => set("category", e.target.value)}
          />
          <datalist id="category-list">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="m-status">상태</label>
          <select
            id="m-status"
            value={values.status}
            onChange={(e) => set("status", e.target.value as BookStatus)}
          >
            <option value="wishlist">읽고싶은</option>
            <option value="reading">읽는 중</option>
            <option value="done">완독</option>
            <option value="paused">중단</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="m-due">마감일 (선택)</label>
          <input
            id="m-due"
            type="date"
            value={values.due_date}
            onChange={(e) => set("due_date", e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="m-isbn">ISBN (선택)</label>
        <input
          id="m-isbn"
          inputMode="numeric"
          value={values.isbn}
          onChange={(e) => set("isbn", e.target.value)}
        />
      </div>

      <div className="modal-foot" style={{ padding: "0", border: 0 }}>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            취소
          </button>
        )}
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? "저장 중..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
