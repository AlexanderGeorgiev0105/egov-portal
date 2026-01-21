import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listAdminHealthRequests } from "../../../api/adminHealthRequestsApi";

import {
  HEALTH_REQUEST_STATUSES,
  healthRequestKindLabel,
  healthRequestStatusLabel,
} from "../../../utils/health/healthModel";

// ✅ Property UI
import { PropertyShell, PropertyHead, Card, HeadRow, Btn } from "../../../ui/property/PropertyUI";

export default function AdminHealthRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [showRejected, setShowRejected] = useState(false);

  async function refresh() {
    try {
      const list = await listAdminHealthRequests(); // all
      setRequests(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setRequests([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const visible = useMemo(() => {
    if (showRejected) return requests;
    return requests.filter((r) => r.status !== HEALTH_REQUEST_STATUSES.REJECTED);
  }, [requests, showRejected]);

  function openReview(id) {
    navigate(`/admin/health-requests/${id}`);
  }

  return (
    <PropertyShell>
      <HeadRow style={{ justifyContent: "space-between" }}>
        <div>
          <PropertyHead title="Заявки за здраве" subtitle="Преглед и обработка на здравни заявки." />
        </div>

        <Btn to="/admin/health">← Назад</Btn>
      </HeadRow>

      <Card style={{ marginTop: 10 }}>
        <div className="pp-headRow" style={{ marginBottom: 10 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={showRejected} onChange={(e) => setShowRejected(e.target.checked)} />
            <span>Покажи отказани</span>
          </label>

          <div className="pp-muted" style={{ marginLeft: "auto", fontSize: 12 }}>
            * „Прегледай“ е активно само за чакащи заявки.
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="pp-muted" style={{ margin: 0 }}>
            Няма заявки за здраве.
          </p>
        ) : (
          <table className="pp-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тип</th>
                <th>Потребител</th>
                <th>№ практика</th>
                <th>Лекар</th>
                <th>Статус</th>
                <th>Прегледай</th>
              </tr>
            </thead>

            <tbody>
              {visible.map((r) => {
                const isPending = r.status === HEALTH_REQUEST_STATUSES.PENDING;
                const p = r.payload || {};
                const doctor = p.doctor || {};

                return (
                  <tr key={r.id}>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>{healthRequestKindLabel(r.kind)}</td>
                    <td>{r.userFullName || "—"}</td>
                    <td>{p.practiceNumber || "—"}</td>
                    <td>{doctor.firstName ? `${doctor.firstName} ${doctor.lastName || ""}`.trim() : "—"}</td>
                    <td>
                      <span style={{ whiteSpace: "nowrap", fontWeight: 800 }}>
                        {healthRequestStatusLabel(r.status)}
                      </span>
                    </td>

                    <td>
                      <Btn
                        variant="primary"
                        onClick={() => openReview(r.id)}
                        disabled={!isPending}
                        style={!isPending ? { opacity: 0.65, cursor: "not-allowed" } : undefined}
                        title={!isPending ? "Вече е обработена" : "Преглед на заявката"}
                      >
                        Прегледай
                      </Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </PropertyShell>
  );
}
