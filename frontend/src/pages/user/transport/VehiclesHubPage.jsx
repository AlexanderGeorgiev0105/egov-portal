import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { listMyTransportRequests } from "../../../api/transportApi";
import { vehicleRequestKindLabel, vehicleRequestStatusLabel } from "../../../utils/transport/vehiclesModel";

import { TransportShell } from "../../../ui/transport";

function formatDateTimeBG(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("bg-BG");
}

export default function VehiclesHubPage() {
  const [myRequests, setMyRequests] = useState([]);
  const [requestsOpen, setRequestsOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const items = await listMyTransportRequests();
        if (!alive) return;
        setMyRequests(Array.isArray(items) ? items : []);
      } catch {
        if (!alive) return;
        setMyRequests([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const pendingCount = useMemo(() => {
    return myRequests.filter((r) => r.status === "PENDING").length;
  }, [myRequests]);

  return (
    <TransportShell>
      <div>
        <h1>Превозни средства</h1>
        <p className="tp-muted">
          Управлявай МПС-та, винетки, технически прегледи и глоби. Заявките ти се виждат вдясно.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 340px",
            gap: 12,
            alignItems: "start",
            marginTop: 12,
          }}
        >
          {/* Left - service cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            <Link
              to="/user/vehicles/my"
              className="card"
              style={{ textAlign: "left", textDecoration: "none", color: "inherit", padding: 16 }}
              title="Отвори"
            >
              <h3 style={{ marginTop: 0 }}>Моите превозни средства</h3>
              <div className="tp-muted">Добавяне и преглед на наличните МПС-та.</div>

              <div style={{ marginTop: 12 }}>
                <span className="btn primary" style={{ pointerEvents: "none" }}>
                  Отвори
                </span>
              </div>
            </Link>

            <Link
              to="/user/vehicles/vignettes"
              className="card"
              style={{ textAlign: "left", textDecoration: "none", color: "inherit", padding: 16 }}
              title="Отвори"
            >
              <h3 style={{ marginTop: 0 }}>Винетка</h3>
              <div className="tp-muted">Провери активни винетки и купи нова.</div>

              <div style={{ marginTop: 12 }}>
                <span className="btn primary" style={{ pointerEvents: "none" }}>
                  Отвори
                </span>
              </div>
            </Link>

            <Link
              to="/user/vehicles/inspection"
              className="card"
              style={{ textAlign: "left", textDecoration: "none", color: "inherit", padding: 16 }}
              title="Отвори"
            >
              <h3 style={{ marginTop: 0 }}>Техничен преглед</h3>
              <div className="tp-muted">Заяви годишен технически преглед (админ одобрение).</div>

              <div style={{ marginTop: 12 }}>
                <span className="btn primary" style={{ pointerEvents: "none" }}>
                  Отвори
                </span>
              </div>
            </Link>

            <Link
              to="/user/vehicles/fines"
              className="card"
              style={{ textAlign: "left", textDecoration: "none", color: "inherit", padding: 16 }}
              title="Отвори"
            >
              <h3 style={{ marginTop: 0 }}>Глоби</h3>
              <div className="tp-muted">Преглед и плащане на получени глоби.</div>

              <div style={{ marginTop: 12 }}>
                <span className="btn primary" style={{ pointerEvents: "none" }}>
                  Отвори
                </span>
              </div>
            </Link>
          </div>

          {/* Right - requests panel */}
          <div className="card" style={{ textAlign: "left", padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ margin: 0 }}>Заявки</h3>
              <span className="badge">{pendingCount} чакащи</span>
            </div>

            <div style={{ marginTop: 10, fontSize: 13 }} className="tp-muted">
              Последни заявки за секцията „Превозни средства“.
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {myRequests.length === 0 ? (
                <div className="tp-muted">Нямаш подадени заявки за тази секция.</div>
              ) : (
                myRequests.slice(0, 6).map((r) => (
                  <div key={r.id} className="card" style={{ borderRadius: 18, padding: 10 }}>
                    <div style={{ fontWeight: 800 }}>{vehicleRequestKindLabel(r.kind)}</div>

                    <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span className="badge">{vehicleRequestStatusLabel(r.status)}</span>
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
                  </div>
                ))
              )}
            </div>

            {/* Bottom-left button */}
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-start" }}>
              <button className="btn primary" type="button" onClick={() => setRequestsOpen(true)}>
                Виж всички
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Modal for all requests (like Health) */}
        {requestsOpen && (
          <div className="tp-modalOverlay" onClick={() => setRequestsOpen(false)}>
            <div className="tp-modal" onClick={(e) => e.stopPropagation()}>
              <div className="tp-modalHead">
                <div className="tp-modalTitle">Всички заявки</div>
                <button className="tp-modalClose" type="button" onClick={() => setRequestsOpen(false)}>
                  ✕
                </button>
              </div>

              <div className="tp-modalBody">
                {myRequests.length === 0 ? (
                  <div className="tp-muted">Няма заявки.</div>
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
                      {myRequests.map((r) => (
                        <tr key={r.id}>
                          <td>{formatDateTimeBG(r.createdAt)}</td>
                          <td>{vehicleRequestKindLabel(r.kind)}</td>
                          <td>{vehicleRequestStatusLabel(r.status)}</td>
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
    </TransportShell>
  );
}
