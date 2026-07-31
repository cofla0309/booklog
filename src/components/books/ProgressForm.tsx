import { useEffect, useState } from "react";
import { updateProgress } from "../../data/progress";
import type { Book } from "../../types/book";

interface ProgressFormProps {
  book: Book;
  showMinutes?: boolean;
  /** Put the minutes input + button on their own row below the page input, for narrow layouts. */
  stacked?: boolean;
  onLogged: (updated: Book, completionSuggested: boolean) => void;
}

export function ProgressForm({ book, showMinutes = false, stacked = false, onLogged }: ProgressFormProps) {
  const [currentPage, setCurrentPage] = useState(String(book.current_page));
  const [minutes, setMinutes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCurrentPage(String(book.current_page));
  }, [book.current_page]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newPage = Number(currentPage) || 0;
      const updated = await updateProgress({
        bookId: book.id,
        newPage,
        minutes: minutes ? Number(minutes) : null,
      });
      const completionSuggested = Boolean(
        updated.total_pages && updated.current_page >= updated.total_pages && updated.status !== "done",
      );
      onLogged(updated, completionSuggested);
      setMinutes("");
    } finally {
      setSubmitting(false);
    }
  }

  const minutesInput = (
    <input
      type="number"
      min={0}
      max={1440}
      inputMode="numeric"
      placeholder="분"
      style={{ width: "4.5rem" }}
      value={minutes}
      onChange={(e) => setMinutes(e.target.value)}
      aria-label="읽은 시간(분, 선택)"
    />
  );

  const submitButton = (
    <button type="submit" className="btn-sm primary" disabled={submitting}>
      기록
    </button>
  );

  return (
    <form
      className="progress-form"
      onSubmit={handleSubmit}
      style={stacked ? { flexWrap: "wrap" } : undefined}
    >
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={currentPage}
        onChange={(e) => setCurrentPage(e.target.value)}
        aria-label={`${book.title} 현재 페이지`}
      />
      <span className="of">쪽까지</span>
      {showMinutes && !stacked && minutesInput}
      {!stacked && submitButton}
      {stacked && (
        <div style={{ display: "flex", alignItems: "center", gap: ".4rem", width: "100%" }}>
          {showMinutes && minutesInput}
          {submitButton}
        </div>
      )}
    </form>
  );
}
