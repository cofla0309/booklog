import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { format, subDays } from "date-fns";
import { ProgressRing } from "../components/charts/ProgressRing";
import { ColumnChart } from "../components/charts/ColumnChart";
import { BookTile } from "../components/books/BookTile";
import { StopwatchWidget } from "../components/books/StopwatchWidget";
import { AddBookModal } from "../components/books/AddBookModal";
import { FinishBookModal } from "../components/books/FinishBookModal";
import { CompletionCalendar } from "../components/stats/CompletionCalendar";
import { useDailyGoal } from "../hooks/useDailyGoal";
import { useYearlyGoal } from "../hooks/useYearlyGoal";
import { useStreak } from "../hooks/useStreak";
import { useBooks } from "../hooks/useBooks";
import { listBooks, statusCounts } from "../data/books";
import { listRecentSessions, listSessionsForRange, type RecentSession } from "../data/sessions";
import { buildDailySeries, type DailyPoint } from "../lib/dailySeries";
import { fmt } from "../lib/svgChartHelpers";
import type { Book } from "../types/book";

const currentYear = new Date().getFullYear();

export function DashboardPage() {
  const { settings, pagesToday, minutesToday, refetch: refetchDaily } = useDailyGoal();
  const { progress: yearly, refetch: refetchYearly } = useYearlyGoal(currentYear);
  const { current: streakCurrent, longest: streakLongest, refetch: refetchStreak } = useStreak();
  const { books: reading, refetch: refetchReading } = useBooks({ status: "reading" });
  const [libraryCount, setLibraryCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [week, setWeek] = useState<DailyPoint[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [finishingBook, setFinishingBook] = useState<Book | null>(null);
  const [doneBooks, setDoneBooks] = useState<Book[]>([]);

  const refetchAll = useCallback(() => {
    refetchDaily();
    refetchYearly();
    refetchStreak();
    refetchReading();
    statusCounts().then((c) => {
      setLibraryCount(c.all);
      setWishlistCount(c.wishlist);
    });
    const start = format(subDays(new Date(), 13), "yyyy-MM-dd");
    const end = format(new Date(), "yyyy-MM-dd");
    listSessionsForRange(start, end).then((sessions) => setWeek(buildDailySeries(sessions, 14)));
    listRecentSessions(8).then(setRecentSessions);
    listBooks({ status: "done" }).then(setDoneBooks);
  }, [refetchDaily, refetchYearly, refetchStreak, refetchReading]);

  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  function handleLogged(updated: Book, completionSuggested: boolean) {
    refetchAll();
    if (completionSuggested) setFinishingBook(updated);
  }

  return (
    <div>
      <div className="page-head">
        <h1>{currentYear}년 독서</h1>
        <span className="spacer" />
        <StopwatchWidget books={reading} onLogged={handleLogged} />
        <button type="button" className="primary" onClick={() => setAddOpen(true)}>
          + 책 추가
        </button>
      </div>

      <div className="grid grid-hero">
        {/* 연간 목표 */}
        <div className="card">
          <div className="card-head">
            <h2>연간 목표</h2>
            <span className="spacer" />
            <Link className="tiny dim" to="/settings">
              목표 바꾸기
            </Link>
          </div>

          {yearly.target ? (
            <div style={{ display: "flex", gap: "1.2rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "none" }}>
                <ProgressRing pct={yearly.pct ?? 0} late={yearly.onTrack === false} />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                  }}
                >
                  <div>
                    <div className="hero-figure">{yearly.done}</div>
                    <div className="tiny dim">/ {yearly.target}권</div>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div className="sub">
                  {yearly.onTrack ? (
                    <span className="good strong">계획보다 {yearly.ahead?.toFixed(1)}권 앞서 있습니다.</span>
                  ) : (
                    <span className="bad strong">
                      계획보다 {Math.abs(yearly.ahead ?? 0).toFixed(1)}권 뒤처져 있습니다.
                    </span>
                  )}
                </div>
                <ul className="tiny dim" style={{ margin: ".5rem 0 0", paddingLeft: "1.1rem", lineHeight: 1.8 }}>
                  <li>
                    이 페이스면 연말에 <span className="strong">{yearly.projected}권</span> 예상
                  </li>
                  <li>
                    남은 {yearly.remaining}권 · {yearly.daysLeft}일
                    {yearly.daysPerBook != null && <> ({yearly.daysPerBook}일에 1권)</>}
                  </li>
                  <li>지금쯤 목표선은 {yearly.expectedByNow}권</li>
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <div className="hero-figure">
                  {yearly.done}
                  <span className="unit">권</span>
                </div>
                <div className="tiny dim">올해 완독</div>
              </div>
              <div className="notice" style={{ flex: 1, minWidth: 200 }}>
                연간 목표를 정하면 진척도와 예상 권수를 보여드립니다.{" "}
                <Link to="/settings">목표 세우기 →</Link>
              </div>
            </div>
          )}
        </div>

        {/* 오늘 + 연속 */}
        <div className="card">
          <div className="card-head">
            <h2>오늘</h2>
          </div>

          {settings && (settings.pages_per_day || settings.minutes_per_day) ? (
            <>
              {settings.pages_per_day != null && (
                <>
                  <div className="label">페이지</div>
                  <div style={{ display: "flex", alignItems: "center", gap: ".6rem", margin: ".15rem 0 .7rem" }}>
                    <div
                      className={`meter thick${pagesToday >= settings.pages_per_day ? " done" : ""}`}
                      style={{ flex: 1 }}
                    >
                      <span
                        style={{ width: `${Math.min(100, (pagesToday / settings.pages_per_day) * 100)}%` }}
                      />
                    </div>
                    <span className="num nowrap sub">
                      {fmt(pagesToday)} / {settings.pages_per_day}p
                    </span>
                  </div>
                </>
              )}
              {settings.minutes_per_day != null && (
                <>
                  <div className="label">시간</div>
                  <div style={{ display: "flex", alignItems: "center", gap: ".6rem", margin: ".15rem 0 .7rem" }}>
                    <div
                      className={`meter thick${minutesToday >= settings.minutes_per_day ? " done" : ""}`}
                      style={{ flex: 1 }}
                    >
                      <span
                        style={{ width: `${Math.min(100, (minutesToday / settings.minutes_per_day) * 100)}%` }}
                      />
                    </div>
                    <span className="num nowrap sub">
                      {minutesToday} / {settings.minutes_per_day}분
                    </span>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="sub" style={{ marginBottom: ".7rem" }}>
                오늘 <span className="strong num">{fmt(pagesToday)}p</span>
                {minutesToday > 0 && <> · <span className="num">{minutesToday}분</span></>}
              </div>
              <p className="notice tiny" style={{ margin: "0 0 .7rem" }}>
                하루 목표를 정하면 달성 바와 연속 기록이 켜집니다. <Link to="/settings">설정 →</Link>
              </p>
            </>
          )}

          <div style={{ display: "flex", gap: "1.4rem", borderTop: "1px solid var(--grid)", paddingTop: ".7rem" }}>
            <div>
              <div className="label">연속</div>
              <div className="strong" style={{ fontSize: "1.3rem" }}>
                {streakCurrent}일 {streakCurrent >= 3 && "🔥"}
              </div>
            </div>
            <div>
              <div className="label">최장</div>
              <div className="strong" style={{ fontSize: "1.3rem" }}>
                {streakLongest}일
              </div>
            </div>
            <div>
              <div className="label">서재</div>
              <div className="strong" style={{ fontSize: "1.3rem" }}>
                {libraryCount}권
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 읽는 중 */}
      <div className="card">
        <div className="card-head">
          <h2>읽는 중</h2>
          <span className="tiny dim">{reading.length}권</span>
          <span className="spacer" />
          <Link className="tiny dim" to="/books?status=reading">
            서재에서 보기 →
          </Link>
        </div>

        {reading.length > 0 ? (
          <>
            <div className="book-grid">
              {reading.map((book) => (
                <BookTile key={book.id} book={book} onLogged={handleLogged} />
              ))}
            </div>
            <p className="tiny dim" style={{ margin: ".9rem 0 0" }}>
              현재 페이지를 바꿔 "기록"을 누르면 그날 읽은 만큼이 자동으로 쌓입니다.
            </p>
          </>
        ) : (
          <div className="empty-state">
            <div className="big">📖</div>
            <p>읽는 중인 책이 없습니다.</p>
            <button type="button" className="primary" onClick={() => setAddOpen(true)}>
              + 책 추가
            </button>
            {wishlistCount > 0 && (
              <p className="tiny" style={{ marginTop: ".8rem" }}>
                <Link to="/books?status=wishlist">읽고싶은 책 {wishlistCount}권</Link> 에서 시작해도 됩니다.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 최근 2주 + 최근 기록 */}
      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h2>최근 2주</h2>
            <span className="spacer" />
            <Link className="tiny dim" to="/stats">
              전체 통계 →
            </Link>
          </div>
          <ColumnChart
            data={week}
            value={(d) => d.pages}
            label={(d) => d.label}
            unit="p"
            height={170}
            labelEvery={2}
            tooltip={(d) => (
              <>
                {d.date}
                <br />
                <span className="t-val">{fmt(d.pages)}p</span>
                {d.minutes > 0 && ` · ${d.minutes}분`}
              </>
            )}
          />
        </div>

        <div className="card">
          <div className="card-head">
            <h2>최근 기록</h2>
          </div>
          {recentSessions.length > 0 ? (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>책</th>
                    <th className="num">페이지</th>
                    <th className="num">시간</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((s) => (
                    <tr key={s.id}>
                      <td className="num dim">{s.log_date.slice(5)}</td>
                      <td style={{ maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis" }}>
                        <Link to={`/books/${s.book_id}`} style={{ textDecoration: "none" }}>
                          {s.title}
                        </Link>
                      </td>
                      <td className="num">
                        {s.pages >= 0 ? "+" : ""}
                        {fmt(s.pages)}p
                      </td>
                      <td className="num dim">{s.minutes ? `${s.minutes}분` : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state tiny">아직 기록이 없습니다. 위에서 진도를 한 번 기록해 보세요.</p>
          )}
        </div>
      </div>

      <CompletionCalendar books={doneBooks} />

      <AddBookModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={() => refetchAll()} />
      <FinishBookModal
        book={finishingBook}
        onClose={() => setFinishingBook(null)}
        onFinished={() => refetchAll()}
      />
    </div>
  );
}
