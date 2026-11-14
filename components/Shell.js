"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "./Icons";

export default function Shell({ role, children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    try {
      const t = localStorage.getItem("theme");
      if (t) { setTheme(t); document.documentElement.dataset.theme = t; }
    } catch {}
    fetch("/api/me")
      .then((r) => r.json())
      .then((u) => (!u || u.role !== role ? router.replace("/") : setUser(u)))
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
          <Link href={role === "faculty" ? "/faculty" : "/student"} className="brand">
            <span className="logo"><Icon name="qr" size={18} /></span> QR Attendance
          </Link>
          <span className="spacer" />
          {user && (
            <>
              <div className="who">
                <b style={{ fontSize: ".9rem" }}>{user.name}</b>
                <span className="muted small" style={{ textTransform: "capitalize" }}>{user.role}</span>
              </div>
              <span className="avatar">{user.name?.[0]?.toUpperCase()}</span>
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