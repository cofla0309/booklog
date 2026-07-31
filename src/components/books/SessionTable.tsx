import { useState } from "react";
import { fmt } from "../../lib/svgChartHelpers";
import { updateSession, deleteSession } from "../../data/sessions";
import type { Session } from "../../types/session";

interface SessionTableProps {
  bookId: string;
  sessions: Session[];
  onChanged: () => void;
}

function SessionRow({ session, bookId, onChanged }: { session: Session; bookId: string; onChanged: () => void }) {
  const [logDate, setLogDate] = useState(session.log_date);
  const [startPage, setStartPage] = useState(String(session.start_page));
  const [endPage, setEndPage] = useState(String(session.end_page));
  const [minutes, setMinutes] = useState(session.minutes != null ? String(session.minutes) : "");
  const [saving, setSaving] = useState(false);

  const pages = Number(endPage) - Number(startPage);

  async function handleSave() {
    setSaving(true);
    try {
      await updateSession({
        sessionId: session.id,
        logDate,
        startPage: Number(startPage) || 0,
        endPage: Number(endPage) || 0,
        minutes: minutes ? Number(minutes) : null,
      });
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await deleteSession(session.id, bookId);
    onChanged();
  }

  return (
    <tr>
      <td>
        <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
      </td>
      <td className="num">
        <input
          type="number"
          value={startPage}
          onChange={(e) => setStartPage(e.target.value)}
          style={{ width: "5rem" }}
        />
      </td>
      <td className="num">
        <input
          type="number"
          value={endPage}
          onChange={(e) => setEndPage(e.target.value)}
          style={{ width: "5rem" }}
        />
      </td>
      <td className={`num${pages < 0 ? " bad" : ""}`}>
        {pages >= 0 ? "+" : ""}
        {fmt(pages)}
      </td>
      <td className="num">
        <input
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          style={{ width: "4rem" }}
        />
      </td>
      <td className="nowrap">
        <button type="button" className="btn-sm" onClick={handleSave} disabled={saving}>
          저장
        </button>
        <button type="button" className="btn-sm btn-danger" onClick={handleDelete}>
          삭제
        </button>
      </td>
    </tr>
  );
}

export function SessionTable({ bookId, sessions, onChanged }: SessionTableProps) {
  if (sessions.length === 0) {
    return <p className="empty-state tiny">아직 날짜별 기록이 없습니다.</p>;
  }

  return (
    <>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th style={{ minWidth: 140 }}>날짜</th>
              <th className="num">시작</th>
              <th className="num">끝</th>
              <th className="num">읽은 쪽</th>
              <th className="num">분</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <SessionRow key={s.id} session={s} bookId={bookId} onChanged={onChanged} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="tiny dim" style={{ margin: ".7rem 0 0" }}>
        기록을 고치거나 지우면 현재 페이지는 가장 최근 기록에 맞춰 다시 계산됩니다.
      </p>
    </>
  );
}
