import { NavLink } from "react-router";
import { useAuth } from "../../hooks/useAuth";

const links = [
  { to: "/", label: "대시보드" },
  { to: "/books", label: "서재" },
  { to: "/stats", label: "통계" },
  { to: "/settings", label: "설정" },
];

export function NavBar() {
  const { user, signOut } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <NavLink to="/" className="brand">
          📚 <span className="full">독서 기록</span>
        </NavLink>
        <nav className="nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => (isActive ? "on" : "")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginLeft: ".5rem" }}>
            <span className="tiny dim">{user.email}</span>
            <button type="button" className="btn-sm" onClick={() => signOut()}>
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
