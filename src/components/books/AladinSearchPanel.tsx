import { useState } from "react";
import { searchAladin } from "../../lib/aladin";
import type { AladinItem } from "../../types/aladin";

interface AladinSearchPanelProps {
  onSelect: (item: AladinItem) => void;
}

export function AladinSearchPanel({ onSelect }: AladinSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AladinItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await searchAladin(query.trim());
      setResults(res.items);
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "검색에 실패했어요. 알라딘 TTB 키가 아직 설정되지 않았을 수 있어요.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="field-row" style={{ marginBottom: ".8rem" }}>
        <input
          type="search"
          placeholder="제목이나 저자로 검색 (예: 사피엔스)"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="primary" style={{ flex: "none" }} disabled={loading}>
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      {error && <p className="notice warn">{error} 검색 없이 아래 폼에 직접 입력해도 돼요.</p>}
      {searched && !error && results.length === 0 && (
        <p className="notice">검색 결과가 없어요. 직접 입력해보세요.</p>
      )}

      {results.length > 0 && (
        <div style={{ maxHeight: "18rem", overflowY: "auto" }}>
          {results.map((item) => (
            <button
              key={item.isbn13 || item.title}
              type="button"
              onClick={() => onSelect(item)}
              className="result-row"
              style={{
                width: "100%",
                textAlign: "left",
                background: "none",
                border: 0,
                borderTop: "1px solid var(--grid)",
                minHeight: "auto",
              }}
            >
              {item.coverUrl ? (
                <img className="cover" src={item.coverUrl} alt="" loading="lazy" />
              ) : (
                <div className="cover cover-ph">📕</div>
              )}
              <div className="body">
                <div className="book-title">{item.title}</div>
                <div className="tiny dim">
                  {item.author} · {item.publisher}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
