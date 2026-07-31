import { useEffect, useState } from "react";
import { updateProgress } from "../../data/progress";
import type { Book } from "../../types/book";

interface StopwatchWidgetProps {
  books: Book[];
  onLogged: (updated: Book, completionSuggested: boolean) => void;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function StopwatchWidget({ books, onLogged }: StopwatchWidgetProps) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showLogForm, setShowLogForm] = useState(false);
  const [bookId, setBookId] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const running = startedAt != null;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt), 500);
    return () => clearInterval(id);
  }, [running, startedAt]);

  function handleStart() {
    setStartedAt(Date.now());
    setElapsedMs(0);
  }

  function handleStop() {
    setStartedAt(null);
    setShowLogForm(true);
    const first = books[0];
    if (first) {
      setBookId(first.id);
      setPageInput(String(first.current_page));
    }
  }

  function handleCancel() {
    setShowLogForm(false);
    setElapsedMs(0);
  }

  function handleBookChange(id: string) {
    setBookId(id);
    const book = books.find((b) => b.id === id);
    if (book) setPageInput(String(book.current_page));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const book = books.find((b) => b.id === bookId);
    if (!book) return;
    setSubmitting(true);
    try {
      const minutes = Math.max(1, Math.round(elapsedMs / 60000));
      const updated = await updateProgress({
        bookId: book.id,
        newPage: Number(pageInput) || book.current_page,
        minutes,
      });
      const completionSuggested = Boolean(
        updated.total_pages && updated.current_page >= updated.total_pages && updated.status !== "done",
      );
      onLogged(updated, completionSuggested);
      setShowLogForm(false);
      setElapsedMs(0);
    } finally {
      setSubmitting(false);
    }
  }

  if (books.length === 0 && !running && !showLogForm) {
    return null;
  }

  if (showLogForm) {
    return (
      <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
        <span className="num strong">⏱ {formatElapsed(elapsedMs)}</span>
        <select
          value={bookId}
          onChange={(e) => handleBookChange(e.target.value)}
          style={{ width: "auto", maxWidth: "9rem" }}
        >
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          style={{ width: "4.5rem" }}
          aria-label="현재 페이지"
        />
        <span className="of">쪽까지</span>
        <button type="submit" className="btn-sm primary" disabled={submitting}>
          기록
        </button>
        <button type="button" className="btn-sm" onClick={handleCancel}>
          취소
        </button>
      </form>
    );
  }

  if (running) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
        <span className="num strong">⏱ {formatElapsed(elapsedMs)}</span>
        <button type="button" className="btn-sm btn-danger" onClick={handleStop}>
          정지
        </button>
      </div>
    );
  }

  return (
    <button type="button" className="btn-sm" onClick={handleStart}>
      ⏱ 스톱워치 시작
    </button>
  );
}
