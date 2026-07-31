import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) setError(error);
      } else {
        const { error, needsConfirmation } = await signUp(email, password);
        if (error) setError(error);
        else if (needsConfirmation) setConfirmSent(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div className="card" style={{ width: "min(360px, 100%)" }}>
        <div className="card-head">
          <h2>📚 독서 기록</h2>
        </div>

        {confirmSent ? (
          <div className="notice">
            확인 이메일을 보냈습니다. 메일함에서 링크를 눌러 인증을 완료한 뒤 로그인해 주세요.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="notice err">{error}</p>}
            <button type="submit" className="primary" style={{ width: "100%" }} disabled={submitting}>
              {submitting ? "처리 중..." : mode === "signin" ? "로그인" : "회원가입"}
            </button>
          </form>
        )}

        <p className="tiny dim" style={{ marginTop: "1rem", textAlign: "center" }}>
          {mode === "signin" ? (
            <>
              계정이 없으신가요?{" "}
              <button
                type="button"
                className="btn-sm"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
              >
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{" "}
              <button
                type="button"
                className="btn-sm"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setConfirmSent(false);
                }}
              >
                로그인
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
