import { useEffect, useState } from "react";
import {
  deleteYearlyGoal,
  getAppSettings,
  getYearlyGoal,
  updateAppSettings,
  upsertYearlyGoal,
} from "../data/settings";
import { listBooks } from "../data/books";
import { listAllSessions } from "../data/sessions";
import { downloadCsv } from "../lib/csvExport";
import { STATUS_LABELS } from "../lib/bookDerived";

const currentYear = new Date().getFullYear();

export function SettingsPage() {
  const [yearlyBooks, setYearlyBooks] = useState("");
  const [dailyPages, setDailyPages] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState("");
  const [doneThisYear, setDoneThisYear] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([getAppSettings(), getYearlyGoal(currentYear), listBooks({ status: "done" })]).then(
      ([settings, goal, done]) => {
        setDailyPages(settings.pages_per_day != null ? String(settings.pages_per_day) : "");
        setDailyMinutes(settings.minutes_per_day != null ? String(settings.minutes_per_day) : "");
        setYearlyBooks(goal ? String(goal.target_books) : "");
        setDoneThisYear(done.filter((b) => b.end_date?.startsWith(String(currentYear))).length);
      },
    );
  }, []);

  async function handleSaveGoals(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAppSettings({
        pages_per_day: dailyPages ? Number(dailyPages) : null,
        minutes_per_day: dailyMinutes ? Number(dailyMinutes) : null,
      });
      if (yearlyBooks) {
        await upsertYearlyGoal(currentYear, Number(yearlyBooks));
      } else {
        await deleteYearlyGoal(currentYear);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleExportBooks() {
    const books = await listBooks({ status: "all" });
    downloadCsv(
      "books.csv",
      books.map((b) => ({
        title: b.title,
        author: b.author ?? "",
        publisher: b.publisher ?? "",
        isbn: b.isbn ?? "",
        category: b.category ?? "",
        status: STATUS_LABELS[b.status],
        total_pages: b.total_pages ?? "",
        current_page: b.current_page,
        rating: b.rating ?? "",
        started_on: b.start_date ?? "",
        finished_on: b.end_date ?? "",
        due_date: b.due_date ?? "",
        memo: b.memo ?? "",
      })),
    );
  }

  async function handleExportSessions() {
    const sessions = await listAllSessions();
    downloadCsv(
      "sessions.csv",
      sessions.map((s) => ({
        log_date: s.log_date,
        book_id: s.book_id,
        start_page: s.start_page,
        end_page: s.end_page,
        pages: s.pages,
        minutes: s.minutes ?? "",
        note: s.note ?? "",
      })),
    );
  }

  return (
    <div>
      <div className="page-head">
        <h1>설정</h1>
      </div>

      {/* 목표 */}
      <div className="card">
        <div className="card-head">
          <h2>목표</h2>
          <span className="tiny dim">비워 두면 그 목표는 꺼집니다</span>
        </div>

        <form onSubmit={handleSaveGoals}>
          <div className="grid grid-3">
            <div className="field">
              <label htmlFor="g-year">{currentYear}년 완독 권수</label>
              <input
                id="g-year"
                type="number"
                min={1}
                max={1000}
                inputMode="numeric"
                placeholder="예: 24"
                value={yearlyBooks}
                onChange={(e) => setYearlyBooks(e.target.value)}
              />
              <div className="tiny dim" style={{ marginTop: ".25rem" }}>
                현재 {doneThisYear}권 완독
              </div>
            </div>
            <div className="field">
              <label htmlFor="g-pages">하루 페이지</label>
              <input
                id="g-pages"
                type="number"
                min={1}
                max={2000}
                inputMode="numeric"
                placeholder="예: 30"
                value={dailyPages}
                onChange={(e) => setDailyPages(e.target.value)}
              />
              <div className="tiny dim" style={{ marginTop: ".25rem" }}>
                연속 기록의 기준이 됩니다
              </div>
            </div>
            <div className="field">
              <label htmlFor="g-min">하루 시간(분)</label>
              <input
                id="g-min"
                type="number"
                min={1}
                max={1440}
                inputMode="numeric"
                placeholder="예: 30"
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(e.target.value)}
              />
              <div className="tiny dim" style={{ marginTop: ".25rem" }}>
                진도 기록 시 분을 같이 넣어야 집계됩니다
              </div>
            </div>
          </div>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? "저장 중..." : saved ? "저장됨 ✓" : "목표 저장"}
          </button>
        </form>

        <p
          className="tiny dim"
          style={{ margin: ".9rem 0 0", borderTop: "1px solid var(--grid)", paddingTop: ".7rem" }}
        >
          책별 마감일은 여기가 아니라 각 책의 상세 화면에서 정합니다. 마감일을 넣으면 "남은 며칠 · 하루 몇
          쪽 필요"가 자동으로 계산됩니다.
        </p>
      </div>

      {/* 알라딘 */}
      <div className="card">
        <div className="card-head">
          <h2>알라딘 책 검색</h2>
        </div>
        <p className="sub" style={{ marginTop: 0 }}>
          책 추가 화면에서 검색하면 제목·저자·출판사·표지·총 페이지가 자동으로 채워집니다. 이 앱은
          클라우드(Supabase Edge Function)에서 TTB 키를 관리하므로, 이 화면에서 직접 키를 입력하는 대신
          개발자가 서버 시크릿으로 등록해야 검색이 동작합니다. 키가 없어도 수동 입력으로 앱은 그대로
          동작합니다.
        </p>
      </div>

      {/* 데이터 */}
      <div className="card">
        <div className="card-head">
          <h2>데이터</h2>
        </div>
        <div className="grid grid-2">
          <div>
            <div className="label">내보내기</div>
            <p className="tiny dim" style={{ margin: ".2rem 0 .5rem" }}>
              엑셀에서 바로 열리는 CSV(UTF-8 BOM).
            </p>
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-sm" onClick={handleExportBooks}>
                책 목록 CSV
              </button>
              <button type="button" className="btn btn-sm" onClick={handleExportSessions}>
                날짜별 기록 CSV
              </button>
            </div>
          </div>
          <div>
            <div className="label">백업</div>
            <p className="tiny dim" style={{ margin: ".2rem 0 .5rem" }}>
              데이터는 Supabase 클라우드에 저장되어 자동으로 백업됩니다. 로컬 파일 백업은 필요 없습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 접속 안내 */}
      <div className="card">
        <div className="card-head">
          <h2>접속</h2>
        </div>
        <p className="sub" style={{ marginTop: 0 }}>
          이 앱은 클라우드에 배포되어 인터넷이 연결된 어디서든 같은 주소로 접속할 수 있습니다. 로그인
          절차가 없으니 링크를 아는 사람은 누구나 열 수 있습니다 — 믿을 수 있는 사람과만 공유하세요.
        </p>
      </div>
    </div>
  );
}
