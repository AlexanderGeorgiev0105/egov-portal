import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listAdminTransportRequests } from "../../../api/adminTransportApi";

import {
  VEHICLE_REQUEST_STATUSES,
  vehicleRequestKindLabel,
  vehicleRequestStatusLabel,
} from "../../../utils/transport/vehiclesModel";

// ✅ Property UI (коригирай пътя при нужда)
import { PropertyShell, PropertyHead, Card, HeadRow, Btn } from "../../../ui/property/PropertyUI";

export default function AdminTransportRequestsPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [showRejected, setShowRejected] = useState(false);

  async function load() {
    try {
      const basePromises = [
        listAdminTransportRequests("PENDING").catch(() => []),
        listAdminTransportRequests("APPROVED").catch(() => []),
      ];

      if (showRejected) basePromises.push(listAdminTransportRequests("REJECTED").catch(() => []));

      const parts = await Promise.all(basePromises);
      const merged = parts.flat().filter(Boolean);

      // de-dupe by id
      const map = new Map();
      for (const r of merged) map.set(r.id, r);
      setRequests(Array.from(map.values()));
    } catch {
      setRequests([]);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRejected]);

  const filtered = useMemo(() => {
    const base = [...requests];
    base.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (showRejected) return base;
    return base.filter((r) => r.status !== VEHICLE_REQUEST_STATUSES.REJECTED);
  }, [requests, showRejected]);

  const pendingCount = useMemo(
    () => filtered.filter((r) => r.status === VEHICLE_REQUEST_STATUSES.PENDING).length,
    [filtered]
  );

  function openReview(id) {
    navigate(`/admin/transport/requests/${id}`);
  }

  function displayTarget(r) {
    // ADD_VEHICLE: reg number is the main identifier
    if (r.kind === "ADD_VEHICLE") return r.payload?.regNumber || r.regNumber || "—";

    // TECH_INSPECTION: show reg number (snapshot in payload), NOT vehicleId
    if (r.kind === "TECH_INSPECTION")
      return (
        r.payload?.regNumber ||
        r.payload?.vehicleRegNumber ||
        r.regNumber ||
        "—"
      );

    return "—";
  }

  return (
    <PropertyShell>
      <HeadRow style={{ justifyContent: "space-between" }}>
        <PropertyHead title="Заявки за транспорт" subtitle="Преглед и обработка на заявки за МПС и технически преглед." />
        <Btn to="/admin/transport">← Назад</Btn>
      </HeadRow>

      <Card style={{ marginTop: 12 }}>
        <HeadRow style={{ alignItems: "center" }}>
          <span style={{ fontWeight: 900 }}>{pendingCount} чакащи</span>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <input type="checkbox" checked={showRejected} onChange={(e) => setShowRejected(e.target.checked)} />
            Показвай отказани
          </label>
        </HeadRow>

        {filtered.length === 0 ? (
          <p className="pp-muted" style={{ marginTop: 10, marginBottom: 0 }}>
            Няма заявки.
          </p>
        ) : (
          <table className="pp-table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тип</th>
                <th>ЕГН</th>
                <th>МПС / Рег. №</th>
                <th>Статус</th>
                <th>Прегледай</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r) => {
                const isPending = r.status === VEHICLE_REQUEST_STATUSES.PENDING;

                return (
                  <tr key={r.id}>
                    <td>{r.createdAt ? new Date(r.createdAt).toLocaleString("bg-BG") : "—"}</td>
                    <td>{vehicleRequestKindLabel(r.kind)}</td>
                    <td>{r.ownerEgn || r.egn || "—"}</td>
                    <td>{displayTarget(r)}</td>

                    {/* ✅ статус само текст (без балон), на 1 ред */}
                    <td>
                      <span style={{ whiteSpace: "nowrap", fontWeight: 800 }}>
                        {vehicleRequestStatusLabel(r.status)}
                      </span>
                    </td>

                    <td>
                      <Btn
                        variant="primary"
                        onClick={() => openReview(r.id)}
                        disabled={!isPending}
                        style={!isPending ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                        title={!isPending ? "Вече е обработена" : "Преглед"}
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

        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
          * „Прегледай“ е активно само за чакащи заявки.
        </div>
      </Card>
    </PropertyShell>
  );
}
