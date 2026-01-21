import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { listMyProblemReports } from "../../../api/reportsApi";
import {
  PROBLEM_CATEGORIES,
  categoryLabel,
  statusLabel,
  formatDateTimeBG,
} from "../../../utils/reports/problemReportsModel";

import { useUiAlert } from "../../../ui/UiAlertProvider";
import { ReportsShell } from "../../../ui/reports";

function statusBadgeStyle(status) {
  switch (status) {
    case "IN_REVIEW":
      return { background: "#fffbeb", borderColor: "#fde68a" };
    case "RESOLVED":
      return { background: "#ecfdf5", borderColor: "#a7f3d0" };
    case "REJECTED":
      return { background: "#fef2f2", borderColor: "#fecaca" };
    default:
      return {};
  }
}

export default function ReportProblemHubPage() {
  const { showAlert } = useUiAlert();

  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const sortedReports = useMemo(() => {
    const copy = Array.isArray(reports) ? [...reports] : [];
    return copy.sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );
  }, [reports]);

  async function refresh() {
    setLoadError("");
    setLoading(true);
    try {
      const list = await listMyProblemReports();
      setReports(Array.isArray(list) ? list : []);
    } catch (e) {
      const msg = e?.message || "Грешка при зареждане на сигналите.";
      setReports([]);
      setLoadError(msg);
      showAlert(msg, { title: "Грешка" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryCards = [
    { key: PROBLEM_CATEGORIES.ROAD_INFRASTRUCTURE, emoji: "" },
    { key: PROBLEM_CATEGORIES.UTILITIES, emoji: "" },
    { key: PROBLEM_CATEGORIES.PUBLIC_ORDER, emoji: "" },
    { key: PROBLEM_CATEGORIES.CLEANLINESS_WASTE, emoji: "" },
    { key: PROBLEM_CATEGORIES.APP_ISSUE, emoji: "" },
    { key: PROBLEM_CATEGORIES.OTHER, emoji: "" },
  ];

  function openDetails(r) {
    setSelected(r);
    setIsDetailsOpen(true);
  }

  function closeDetails() {
    setIsDetailsOpen(false);
    setSelected(null);
  }

  return (
    <ReportsShell>
      <div>
        <h1>Докладвай проблем</h1>
        <p style={{ color: "#555" }}>
          Избери тип проблем и опиши ситуацията. След подаване сигналът ще бъде прегледан от администратор.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            gap: 12,
            alignItems: "start",
          }}
        >
          {/* Left */}
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
                maxWidth: 780,
                margin: "0 auto",
              }}
            >
              {categoryCards.map((c) => (
                <Link
                  key={c.key}
                  to={`/user/reports/new/${c.key}`}
                  className="card"
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    textAlign: "left",
                    minHeight: 120,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    justifyContent: "center",
                  }}
                >
                  <div style={{ fontSize: 26 }}>{c.emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{categoryLabel(c.key)}</div>
                  <div style={{ color: "#6b7280" }}></div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="card" style={{ textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800 }}>Моите сигнали</div>
              <button className="btn" onClick={refresh} title="Обнови" disabled={loading}>
                ↻
              </button>
            </div>

            {loadError && (
              <div style={{ marginTop: 10, color: "#b91c1c", fontSize: 13 }}>
                {loadError}
              </div>
            )}

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {loading ? (
                <div style={{ color: "#6b7280" }}>Зареждане...</div>
              ) : sortedReports.length === 0 ? (
                <div style={{ color: "#6b7280" }}>Все още нямаш подадени сигнали.</div>
              ) : (
                sortedReports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => openDetails(r)}
                    className="card"
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                      border: "1px solid #e6e8ef",
                      padding: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {categoryLabel(r.category)}
                      </div>
                      <span className="badge" style={statusBadgeStyle(r.status)}>
                        {statusLabel(r.status)}
                      </span>
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                      {formatDateTimeBG(r.createdAt)}
                    </div>
                    <div
                      style={{
                        color: "#374151",
                        fontSize: 13,
                        marginTop: 6,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {String(r.description || "").trim() || "—"}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Details modal */}
        {isDetailsOpen && selected && (
          <div
            onClick={closeDetails}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 12,
              zIndex: 50,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="card"
              style={{
                width: "min(720px, 100%)",
                maxHeight: "80vh",
                overflow: "auto",
                textAlign: "left",
                padding: 0,
              }}
            >
              <div
                style={{
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #eef0f6",
                  background: "#fff",
                }}
              >
                <div style={{ fontWeight: 800 }}>Сигнал</div>
                <button className="btn" onClick={closeDetails} title="Затвори">
                  ✕
                </button>
              </div>

              <div style={{ padding: 12, display: "grid", gap: 10 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <span className="badge">{categoryLabel(selected.category)}</span>
                  <span className="badge" style={statusBadgeStyle(selected.status)}>
                    {statusLabel(selected.status)}
                  </span>
                  <span style={{ color: "#6b7280", fontSize: 12 }}>
                    {formatDateTimeBG(selected.createdAt)}
                  </span>
                </div>

                <div className="card" style={{ background: "#fff" }}>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>Описание</div>
                  <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>
                    {String(selected.description || "").trim() || "—"}
                  </div>
                </div>

                {String(selected.adminNote || "").trim() && (
                  <div className="card" style={{ background: "#fff" }}>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>Коментар от администратор</div>
                    <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>
                      {String(selected.adminNote || "").trim()}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button className="btn" onClick={closeDetails}>
                    Затвори
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ReportsShell>
  );
}
