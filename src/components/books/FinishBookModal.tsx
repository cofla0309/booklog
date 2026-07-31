import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Stars } from "../ui/Stars";
import { finishBook } from "../../data/progress";
import type { Book } from "../../types/book";

interface FinishBookModalProps {
  book: Book | null;
  onClose: () => void;
  onFinished: (book: Book) => void;
}

export function FinishBookModal({ book, onClose, onFinished }: FinishBookModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [rating, setRating] = useState(0);
  const [finishedOn, setFinishedOn] = useState(format(new Date(), "yyyy-MM-dd"));
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (book) {
      setRating(0);
      setFinishedOn(format(new Date(), "yyyy-MM-dd"));
      setMemo("");
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [book]);

  async function handleSave() {
    if (!book) return;
    setSaving(true);
    try {
      const updated = await finishBook({
        bookId: book.id,
        rating: rating || null,
        finishedOn,
        memo: memo || null,
      });
      onFinished(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialogRef} onClose={onClose}>
      <div className="modal-head">
        <h2>다 읽으셨나요?</h2>
        <span className="spacer" />
        <button type="button" className="btn-sm" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>
      <div className="modal-body">
        <p className="sub" style={{ marginTop: 0 }}>
          <span className="strong">{book?.title}</span> 의 마지막 쪽에 도달했습니다.
        </p>
        <div className="field">
          <label>별점</label>
          <Stars value={rating} onChange={setRating} />
        </div>
        <div className="field">
          <label htmlFor="f-date">완독일</label>
          <input id="f-date" type="date" value={finishedOn} onChange={(e) => setFinishedOn(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-memo">한줄평 (선택)</label>
          <textarea
            id="f-memo"
            placeholder="기억에 남은 것"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </div>
      <div className="modal-foot">
        <button type="button" onClick={onClose}>
          아직 아니에요
        </button>
        <button type="button" className="primary" onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "완독으로 기록"}
        </button>
      </div>
    </dialog>
  );
}
