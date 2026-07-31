import { useEffect, useRef, useState } from "react";
import { AladinSearchPanel } from "./AladinSearchPanel";
import { BookForm, type BookFormValues } from "./BookForm";
import { createBook, listCategories } from "../../data/books";
import { lookupAladinByIsbn } from "../../lib/aladin";
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
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  async function handleSelect(item: AladinItem) {
    // Aladin's search endpoint never returns page count (subInfo is always
    // empty there) — only ItemLookUp by ISBN does, so fetch that before
    // prefilling the form.
    let totalPages = item.totalPages;
    if (item.isbn13) {
      setLoadingDetail(true);
      try {
        const { item: detail } = await lookupAladinByIsbn(item.isbn13);
        if (detail?.totalPages) totalPages = detail.totalPages;
      } catch {
        // best-effort enrichment; fall back to the search result's fields
      } finally {
        setLoadingDetail(false);
      }
    }

    setPrefill({
      title: item.title,
      author: item.author,
      cover_url: item.coverUrl,
      publisher: item.publisher,
      isbn: item.isbn13,
      category: item.category,
      total_pages: totalPages ? String(totalPages) : "",
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
        {loadingDetail && <p className="tiny dim">상세 정보(페이지 수 등) 불러오는 중...</p>}
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
