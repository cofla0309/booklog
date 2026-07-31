import { useEffect, useState } from "react";
import { ColumnChart } from "../components/charts/ColumnChart";
import { DualColumnChart } from "../components/charts/DualColumnChart";
import { HorizontalBarChart } from "../components/charts/HorizontalBarChart";
import { YearHeatmap, HeatLegend } from "../components/charts/YearHeatmap";
import { listBooks } from "../data/books";
import { listAllSessions } from "../data/sessions";
import { useYearlyGoal } from "../hooks/useYearlyGoal";
import { useStreak } from "../hooks/useStreak";
import { buildDailySeries } from "../lib/dailySeries";
import { fmt } from "../lib/svgChartHelpers";
import {
  availableYears,
  computeByCategory,
  computeHeatmapValues,
  computeMonthly,
  computeRatingDistribution,
  computeSummary,
} from "../lib/statsCalc";
import type { Book } from "../types/book";
import type { Session } from "../types/session";

export function StatsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [books, setBooks] = useState<Book[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { progress: yearly } = useYearlyGoal(year);
  const { current: streakCurrent, longest: streakLongest } = useStreak();

  useEffect(() => {
    setLoading(true);
    Promise.all([listBooks({ status: "all" }), listAllSessions()])
      .then(([b, s]) => {
        setBooks(b);
        setSessions(s);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="tiny dim">불러오는 중...</p>;

  const years = availableYears(books, sessions);
  const thisYear = computeSummary(books, sessions, year);
  const allTime = computeSummary(books, sessions, null);
  const monthly = computeMonthly(books, sessions, year);
  const heatmapValues = computeHeatmapValues(sessions, year);
  const daily50 = buildDailySeries(sessions, 50);
  const categories = computeByCategory(books, null);
  const ratings = computeRatingDistribution(books, null);

  const currentYear = new Date().getFullYear();
  const monthsElapsed = year === currentYear ? new Date().getMonth() + 1 : year < currentYear ? 12 : 0;
  const avgBooksPerMonth = monthsElapsed > 0 ? Math.round((thisYear.booksDone / monthsElapsed) * 10) / 10 : null;

  return (
    <div>
      <div className="page-head">
        <h1>통계</h1>
        <span className="spacer" />
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: "auto" }}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </div>

      {/* 요약 */}
      <div className="card">
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div className="label">{year}년 완독</div>
            <div className="hero-figure">
              {thisYear.booksDone}
              <span className="unit">권</span>
            </div>
            {yearly.target && (
              <div className="tiny dim">
                목표 {yearly.target}권 · {yearly.pct}%
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 260 }} className="grid grid-3">
            <div>
              <div className="label">읽은 페이지</div>
              <div className="strong num" style={{ fontSize: "1.25rem" }}>
                {fmt(thisYear.sessionPages)}p
              </div>
              <div className="tiny dim">기록된 {thisYear.readingDays}일</div>
            </div>
            <div>
              <div className="label">월 평균 완독</div>
              <div className="strong num" style={{ fontSize: "1.25rem" }}>
                {avgBooksPerMonth != null ? `${avgBooksPerMonth}권` : "–"}
              </div>
              <div className="tiny dim">이번 해 기준</div>
            </div>
            <div>
              <div className="label">연속</div>
              <div className="strong num" style={{ fontSize: "1.25rem" }}>
                {streakCurrent}일
              </div>
              <div className="tiny dim">최장 {streakLongest}일</div>
            </div>
            <div>
              <div className="label">읽은 시간</div>
              <div className="strong num" style={{ fontSize: "1.25rem" }}>
                {thisYear.sessionMinutes
                  ? `${Math.floor(thisYear.sessionMinutes / 60)}시간 ${thisYear.sessionMinutes % 60}분`
                  : "–"}
              </div>
              <div className="tiny dim">기록한 것만</div>
            </div>
            <div>
              <div className="label">평균 별점</div>
              <div className="strong num" style={{ fontSize: "1.25rem" }}>
                {thisYear.avgRating ?? "–"}
              </div>
            </div>
            <div>
              <div className="label">완독까지</div>
              <div className="strong num" style={{ fontSize: "1.25rem" }}>
                {thisYear.avgDaysToFinish ? `${thisYear.avgDaysToFinish}일` : "–"}
              </div>
              <div className="tiny dim">평균 소요</div>
            </div>
          </div>
        </div>

        <div className="tiny dim" style={{ borderTop: "1px solid var(--grid)", marginTop: "1rem", paddingTop: ".7rem" }}>
          전체 기간 누적: 완독 {allTime.booksDone}권 · 읽은 페이지 {fmt(allTime.sessionPages)}p · 기록한 날{" "}
          {allTime.readingDays}일
        </div>
      </div>

      {/* 월별 */}
      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h2>월별 읽은 시간</h2>
          </div>
          <ColumnChart
            data={monthly}
            value={(d) => d.minutes}
            label={(d) => d.label}
            unit="분"
            tooltip={(d) => (
              <>
                {d.label}
                <br />
                <span className="t-val">{d.minutes}분</span>
                {d.pages > 0 && ` · ${fmt(d.pages)}p`}
              </>
            )}
          />
        </div>
        <div className="card">
          <div className="card-head">
            <h2>월별 완독 권수</h2>
          </div>
          <ColumnChart
            data={monthly}
            value={(d) => d.books}
            label={(d) => d.label}
            unit="권"
            tooltip={(d) => (
              <>
                {d.label}
                <br />
                <span className="t-val">{d.books}권 완독</span>
              </>
            )}
          />
        </div>
      </div>

      {/* 잔디 */}
      <div className="card">
        <div className="card-head">
          <h2>{year}년 독서 달력</h2>
          <span className="spacer" />
          <HeatLegend />
        </div>
        <YearHeatmap year={year} values={heatmapValues} />
        <p className="tiny dim" style={{ margin: ".6rem 0 0" }}>칸 위에 올리면 그날 읽은 페이지가 나옵니다.</p>
      </div>

      {/* 최근 50일 */}
      <div className="card">
        <div className="card-head">
          <h2>최근 50일</h2>
        </div>
        <DualColumnChart
          data={daily50}
          valueA={(d) => d.pages}
          valueB={(d) => d.minutes}
          label={(d) => d.label}
          labelEvery={10}
          height={170}
        />
      </div>

      {/* 카테고리 · 별점 */}
      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h2>카테고리</h2>
            <span className="tiny dim">완독 기준</span>
          </div>
          <HorizontalBarChart
            data={categories}
            value={(d) => d.books}
            label={(d) => d.name}
            unit="권"
            tooltip={(d) => (
              <>
                {d.name}
                <br />
                <span className="t-val">{d.books}권</span> · {fmt(d.pages)}p
              </>
            )}
          />
        </div>
        <div className="card">
          <div className="card-head">
            <h2>별점 분포</h2>
          </div>
          <ColumnChart
            data={ratings}
            value={(d) => d.books}
            label={(d) => "★".repeat(d.rating)}
            unit="권"
            height={170}
            highlightMax={false}
            tooltip={(d) => (
              <>
                ★ {d.rating}점
                <br />
                <span className="t-val">{d.books}권</span>
              </>
            )}
          />
        </div>
      </div>
    </div>
  );
}
