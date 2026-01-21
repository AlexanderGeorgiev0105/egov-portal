import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { listMyHealthRequests } from "../../../api/healthRequestsApi";

import {
  HEALTH_REQUEST_STATUSES,
  healthRequestKindLabel,
  healthRequestStatusLabel,
  formatDateTimeBG,
} from "../../../utils/health/healthModel";

import { HealthShell } from "../../../ui/health";

export default function HealthRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [showAll, setShowAll] = useState(true);

  async function refresh() {
    try {
      const r = await listMyHealthRequests();
      setRequests(Array.isArray(r) ? r : []);
    } catch (e) {
      console.error(e);
      setRequests([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const visible = useMemo(() => {
    if (showAll) return requests;
    return requests.filter((r) => r.status === HEALTH_REQUEST_STATUSES.PENDING);
  }, [requests, showAll]);

  return (
    <HealthShell>
      <div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link className="btn" to="/user/health">
            ← Назад
          </Link>
          <h1 style={{ margin: 0 }}>Заявки</h1>

          <label style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            <span>Покажи всички</span>
          </label>
        </div>

        <div className="card" style={{ marginTop: 12, textAlign: "left" }}>
          <h3 style={{ marginTop: 0 }}>Моите заявки</h3>

          {visible.length === 0 ? (
            <div className="hp-muted">Няма заявки.</div>
          ) : (
            <table className="table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Тип</th>
                  <th>Статус</th>
                  <th>Бележка</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDateTimeBG(r.createdAt)}</td>
                    <td>{healthRequestKindLabel(r.kind)}</td>
                    <td>{healthRequestStatusLabel(r.status)}</td>
                    <td>{r.adminNote || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: 8, fontSize: 12 }} className="hp-muted">
            * „Записани часове“ работи след като заявката за личен лекар бъде одобрена.
          </div>
        </div>
      </div>
    </HealthShell>
  );
}
