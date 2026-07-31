import { STATUS_LABELS } from "../../lib/bookDerived";
import type { BookStatus } from "../../types/book";

export function StatusBadge({ status, overdue }: { status: BookStatus; overdue?: boolean }) {
  return (
    <span className={`badge ${status}${overdue ? " late" : ""}`}>{STATUS_LABELS[status]}</span>
  );
}
