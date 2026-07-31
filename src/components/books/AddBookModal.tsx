import { useEffect, useRef, useState } from "react";
import { AladinSearchPanel } from "./AladinSearchPanel";
import { BookForm, type BookFormValues } from "./BookForm";
import { createBook } from "../../data/books";
import { listCategories } from "../../data/books";
import type { AladinItem } from "../../types/aladin";
import type { Book } from "../../types/book";

interface AddBookModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (book: Book) => void;
}

export function AddBookModal({ open, onClose, onCreated }: AddBookModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [prefill, setPrefill] = useState<Partial<BookFormValues> | undefined>();
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      listCategories().then(setCategories);
      setPrefill(undefined);
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleSelect(item: AladinItem) {
    setPrefill({
      title: item.title,
      author: item.author,
      cover_url: item.coverUrl,
      publisher: item.publisher,
      isbn: item.isbn13,
      category: item.category,
      total_pages: item.totalPages ? String(item.totalPages) : "",
    });
  }

  async function handleSubmit(values: Parameters<typeof createBook>[0]) {
    const book = await createBook(values);
    onCreated(book);
    onClose();
  }

  return (
    <dialog ref={dialogRef} onClose={onClose}>
      <div className="modal-head">
        <h2>책 추가</h2>
        <span className="spacer" />
        <button type="button" className="btn-sm" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>
      <div className="modal-body">
        <AladinSearchPanel onSelect={handleSelect} />
        <div style={{ marginTop: "1rem" }}>
          <BookForm
            key={prefill?.isbn ?? "blank"}
            initial={prefill}
            categories={categories}
            submitLabel="서재에 담기"
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </dialog>
  );
}
