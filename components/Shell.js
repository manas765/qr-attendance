"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "./Icons";

const HOME = { admin: "/admin", faculty: "/faculty", student: "/student" };

export default function Shell({ role, children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    try {
      const t = localStorage.getItem("theme");
      if (t) { setTheme(t); document.documentElement.dataset.theme = t; }
    } catch {}
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => {
        if (!u || (role !== "any" && u.role !== role)) router.replace("/");
        else setUser(u);
      })
      .catch(() => router.replace("/"));
  }, [role, router]);

  function toggleTheme() {
    const t = theme === "dark" ? "light" : "dark";
    setTheme(t);
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch {}
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <>
      <header className="nav">
        <div className="nav-in">
          <Link href={user ? HOME[user.role] : "/"} className="brand">
            <span className="logo"><Icon name="qr" size={18} /></span>
            <span className="hide-sm">QR Attendance</span>
          </Link>
          <span className="spacer" />
          {user?.role === "faculty" && (
            <Link href="/faculty/alerts" className="btn btn-sm">Alerts</Link>
          )}
          {user && (
            <>
              <div className="who">
                <b style={{ fontSize: ".9rem" }}>{user.name}</b>
                <span className="muted small" style={{ textTransform: "capitalize" }}>{user.role}</span>
              </div>
              <Link href="/account" className="avatar" aria-label="Account" style={{ textDecoration: "none", color: "inherit" }}>
                {user.name?.[0]?.toUpperCase()}
              </Link>
            </>
          )}
          <button className="btn btn-icon" onClick={toggleTheme} aria-label="Toggle theme">
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
          <button className="btn btn-icon" onClick={logout} aria-label="Logout"><Icon name="logout" size={18} /></button>
        </div>
      </header>
      <main className="container">
        {user ? children : (
          <div className="grid c4">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 90 }} />)}
          </div>
        )}
      </main>
    </>
  );
}