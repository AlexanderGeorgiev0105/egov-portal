import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { getMyHealthProfile } from "../../../api/healthProfileApi";
import { listMyHealthRequests } from "../../../api/healthRequestsApi";

import {
  HEALTH_REQUEST_STATUSES,
  healthRequestKindLabel,
  healthRequestStatusLabel,
  formatDateTimeBG,
} from "../../../utils/health/healthModel";

import { HealthShell } from "../../../ui/health";

function safeParseMaybeJson(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return null;
  }
}

export default function HealthPage() {
  const [requests, setRequests] = useState([]);
  const [profile, setProfile] = useState(null);

  const [requestsOpen, setRequestsOpen] = useState(false);

  async function refresh() {
    try {
      const [p, r] = await Promise.all([getMyHealthProfile(), listMyHealthRequests()]);
      setProfile(p || null);
      setRequests(Array.isArray(r) ? r : []);
    } catch (e) {
      console.error(e);
      setProfile(null);
      setRequests([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const personalDoctor = useMemo(() => {
    const snap = safeParseMaybeJson(profile?.personalDoctorSnapshot);
    return snap && typeof snap === "object" ? snap : null;
  }, [profile]);

  const pendingCount = useMemo(() => {
    return requests.filter((r) => r.status === HEALTH_REQUEST_STATUSES.PENDING).length;
  }, [requests]);

  const hasDoctor = !!personalDoctor?.practiceNumber;

  return (
    <HealthShell>
      <div>
        <h1>Здраве</h1>
        <p className="hp-muted">
          Тук управляваш личен лекар, записани часове и направления. Заявките ти се виждат вдясно.
        </p>

        <div className="hub-layout" style={{ marginTop: 12 }}>
          {/* Left - cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {/* Personal doctor */}
            {hasDoctor ? (
              <Link
                to="/user/health/doctor"
                className="card"
                style={{ textAlign: "left", textDecoration: "none", color: "inherit" }}
                title="Отвори детайли"
              >
                <h3 style={{ marginTop: 0 }}>Личен лекар</h3>

                <div style={{ fontWeight: 900 }}>
                  {personalDoctor.firstName} {personalDoctor.lastName}
                </div>
                <div style={{ marginTop: 6 }} className="hp-muted">
                  № практика: <strong>{personalDoctor.practiceNumber}</strong>
                </div>
                <div style={{ marginTop: 6 }} className="hp-muted">
                  Адрес: {personalDoctor.oblast}, {personalDoctor.city}, {personalDoctor.street}
                </div>

                <div style={{ marginTop: 12 }}>
                  <span className="btn btn-primary" style={{ pointerEvents: "none" }}>
                    Детайли
                  </span>
                </div>
              </Link>
            ) : (
              <div className="card" style={{ textAlign: "left" }}>
                <h3 style={{ marginTop: 0 }}>Личен лекар</h3>
                <div className="hp-muted">Все още нямаш добавен личен лекар. Добави чрез номер на практиката.</div>

                <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="btn btn-primary" to="/user/health/add-doctor">
                    Добави личен лекар
                  </Link>
                </div>
              </div>
            )}

            {/* Appointments */}
            <div
              className="card"
              style={{
                textAlign: "left",
                opacity: hasDoctor ? 1 : 0.6,

                /* ✅ единствената промяна: бутонът да стои долу вляво */
                display: "flex",
                flexDirection: "column",
                minHeight: 160,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Записани часове</h3>
              <p className="hp-muted">
                {hasDoctor
                  ? "Избери ден и запази час при личния лекар."
                  : "Активира се след като имаш добавен личен лекар."}
              </p>

              {/* ✅ долу вляво */}
              <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-start" }}>
                <Link
                  className="btn btn-primary"
                  to={hasDoctor ? "/user/health/appointments" : "#"}
                  onClick={(e) => {
                    if (!hasDoctor) e.preventDefault();
                  }}
                  style={!hasDoctor ? { cursor: "not-allowed" } : undefined}
                >
                  Отвори
                </Link>
              </div>
            </div>

            {/* Referrals */}
            <Link
              className="card"
              to="/user/health/referrals"
              style={{ textAlign: "left", textDecoration: "none", color: "inherit" }}
              title="Отвори"
            >
              <h3 style={{ marginTop: 0 }}>Направления</h3>
              <p className="hp-muted">Виж списък с добавени направления и подай заявка за ново.</p>

              <div style={{ marginTop: 12 }}>
                <span className="btn btn-primary" style={{ pointerEvents: "none" }}>
                  Отвори
                </span>
              </div>
            </Link>
          </div>

          {/* Right - requests panel */}
          <div className="card" style={{ textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ margin: 0 }}>Заявки</h3>
              <span className="badge">{pendingCount} чакащи</span>
            </div>

            <div style={{ marginTop: 10 }} className="hp-muted">
              Последни заявки за секцията „Здраве“.
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {requests.length === 0 ? (
                <div className="hp-muted">Нямаш подадени заявки за тази секция.</div>
              ) : (
                requests.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    className="card"
                    style={{
                      borderRadius: 18,
                      padding: 10,
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>{healthRequestKindLabel(r.kind)}</div>

                    <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span className="badge">{healthRequestStatusLabel(r.status)}</span>
                      <span
                        className="badge"
                        style={{
                          background: "rgba(15, 23, 42, 0.06)",
                          borderColor: "rgba(15, 23, 42, 0.08)",
                          color: "#334155",
                        }}
                      >
                        {formatDateTimeBG(r.createdAt)}
                      </span>
                    </div>

                    {r.adminNote ? (
                      <div style={{ marginTop: 8 }} className="hp-muted">
                        <strong>Бележка:</strong> {r.adminNote}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 10 }}>
              <button className="btn btn-primary" type="button" onClick={() => setRequestsOpen(true)}>
                Виж всички
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Modal за всички заявки (без колона Бележка) */}
        {requestsOpen && (
          <div className="hp-modalOverlay" onClick={() => setRequestsOpen(false)}>
            <div className="hp-modal" onClick={(e) => e.stopPropagation()}>
              <div className="hp-modalHead">
                <div className="hp-modalTitle">Всички заявки</div>
                <button className="hp-modalClose" type="button" onClick={() => setRequestsOpen(false)}>
                  ✕
                </button>
              </div>

              <div className="hp-modalBody">
                {requests.length === 0 ? (
                  <div className="hp-muted">Няма заявки.</div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Дата</th>
                        <th>Тип</th>
                        <th>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => (
                        <tr key={r.id}>
                          <td>{formatDateTimeBG(r.createdAt)}</td>
                          <td>{healthRequestKindLabel(r.kind)}</td>
                          <td>{healthRequestStatusLabel(r.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </HealthShell>
  );
}
