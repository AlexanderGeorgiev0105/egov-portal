import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getMe } from "../../../auth/mockAuth";

function formatDateBG(iso) {
  const raw = String(iso || "").trim();
  if (!raw) return "-";
  // If it's already ISO date "YYYY-MM-DD"
  const d = new Date(raw.includes("T") ? raw : raw + "T00:00:00");
  if (isNaN(d.getTime())) return raw;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function genderLabel(g) {
  const v = String(g || "").toLowerCase();
  if (v === "male") return "Мъж";
  if (v === "female") return "Жена";
  if (v === "other") return "Друго";
  return g || "-";
}

export default function PersonalDataPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const me = await getMe();
      setUser(me || null);
    } catch (e) {
      setUser(null);
      setErr(e?.message || "Грешка при зареждане на личните данни.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ marginBottom: 0 }}>Лични данни</h1>
          <Link to="/user" style={{ color: "#2563eb", textDecoration: "none" }}>
            ← Назад
          </Link>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          Зареждане...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <h1>Лични данни</h1>
        <div className="card">
          <div style={{ marginBottom: 10 }}>
            {err || "Няма активен потребител или нямаш достъп."}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn" onClick={load}>
              Опитай пак
            </button>

            <Link to="/login" className="btn" style={{ textDecoration: "none" }}>
              Към вход
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ marginBottom: 0 }}>Лични данни</h1>
        <Link to="/user" style={{ color: "#2563eb", textDecoration: "none" }}>
          ← към Dashboard
        </Link>
      </div>

      {err && <div style={{ marginTop: 12, color: "crimson" }}>{err}</div>}

      <div className="card" style={{ marginTop: 12 }}>
        <Row label="Три имена" value={user.fullName || "-"} />
        <Row label="ЕГН" value={user.egn || "-"} />
        <Row label="Пол" value={genderLabel(user.gender)} />
        <Row label="Дата на раждане" value={formatDateBG(user.dob)} />
        <Row label="Място на раждане" value={user.birthPlace || "-"} />
        <Row label="Адрес" value={user.address || "-"} />
        <Row label="Телефонен номер" value={user.phone || "-"} />
        <Row label="Имейл адрес" value={user.email || "-"} />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px minmax(0, 1fr)",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid #eef0f6",
      }}
    >
      <div style={{ color: "#555" }}>{label}</div>
      <div style={{ minWidth: 0 }}>{value}</div>
    </div>
  );
}
