import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listAdminPropertyRequests } from "../../../api/adminPropertyApi";

// ✅ Property UI (пътя при теб може да е различен – ти вече си го нагласил)
import { PropertyShell, PropertyHead, Card, HeadRow, Btn } from "../../../ui/property/PropertyUI";

function getStatusLabel(status) {
  switch (status) {
    case "PENDING":
      return "Чака проверка";
    case "APPROVED":
      return "Одобрена";
    case "REJECTED":
      return "Отказана";
    default:
      return status;
  }
}

function kindLabel(kind) {
  switch (kind) {
    case "ADD_PROPERTY":
      return "Добавяне на имот";
    case "REMOVE_PROPERTY":
      return "Премахване на имот";
    case "TAX_ASSESSMENT":
      return "Данъчна оценка";
    case "SKETCH":
      return "Скица на имот";
    default:
      return kind || "Заявка";
  }
}

function timeLeftLabel(r) {
  if (r.kind !== "SKETCH") return "—";
  const termDays = r.payload?.termDays === 3 ? 3 : 7;
  const createdMs = new Date(r.createdAt).getTime();
  const dueMs = createdMs + termDays * 24 * 60 * 60 * 1000;
  const leftMs = dueMs - Date.now();

  if (Number.isNaN(createdMs)) return "—";
  if (leftMs <= 0) return "Изтекъл";

  const totalMinutes = Math.floor(leftMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
  const mins = totalMinutes % 60;

  if (days > 0) return `${days}д ${hours}ч`;
  if (hours > 0) return `${hours}ч ${mins}м`;
  return `${mins}м`;
}

export default function AdminPropertyRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setError("");
      try {
        const all = await listAdminPropertyRequests("PENDING");
        if (!alive) return;
        const list = Array.isArray(all) ? all : [];
        setRequests(list.filter((r) => r.status !== "REJECTED"));
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Грешка при зареждане.");
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  function openReview(id) {
    navigate(`/admin/property-requests/${id}`);
  }

  return (
    <PropertyShell>
      <HeadRow style={{ justifyContent: "space-between" }}>
        <PropertyHead title="Заявки за имоти" subtitle="Преглед и обработка на заявки за имущество." />
      </HeadRow>

      {error && (
        <div className="pp-alert pp-alert--error" style={{ marginBottom: 12 }}>
          <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
        </div>
      )}

      {requests.length === 0 ? (
        <p className="pp-muted">Няма заявки за имоти.</p>
      ) : (
        <Card style={{ marginTop: 6 }}>
          <table className="pp-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Вид</th>
                <th>ЕГН</th>
                <th>Имот</th>
                <th>Документ</th>
                <th>Статус</th>
                <th>Остава</th>
                <th>Прегледай</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((r) => {
                const isPending = r.status === "PENDING";
                return (
                  <tr key={r.id}>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>{kindLabel(r.kind)}</td>

                    {/* ✅ FIX: реално ЕГН */}
                    <td>{r.userEgn || r.userId}</td>

                    <td>
                      {r.payload?.type ? `${r.payload.type} • ${r.payload.oblast} • ${r.payload.place}` : "—"}
                      {r.payload?.address && (
                        <div className="pp-muted" style={{ fontSize: 12, opacity: 0.85 }}>
                          {r.payload.address}
                          {r.payload?.areaSqm ? ` • ${r.payload.areaSqm} m²` : ""}
                          {r.payload?.purchaseYear ? ` • ${r.payload.purchaseYear}` : ""}
                        </div>
                      )}
                    </td>

                    {/* ✅ FIX: документ да има за всички видове */}
                    <td>
                      {r.kind === "ADD_PROPERTY"
                        ? "Документ (PDF)"
                        : r.payload?.ownershipDoc?.name || (r.propertyId ? "Документ (PDF)" : "—")}
                    </td>

                    {/* ✅ Статусът да е само текст, на 1 ред */}
                    <td>
                      <span
                        style={{
                          whiteSpace: "nowrap",
                          fontWeight: 800,
                          color: "#0f172a",
                          fontSize: 14,
                          lineHeight: 1.2,
                        }}
                      >
                        {getStatusLabel(r.status)}
                      </span>
                    </td>

                    <td>{timeLeftLabel(r)}</td>

                    <td>
                      <Btn
                        variant="primary"
                        onClick={() => openReview(r.id)}
                        disabled={!isPending}
                        title={!isPending ? "Вече е обработена" : "Преглед на заявката"}
                        style={!isPending ? { opacity: 0.65, cursor: "not-allowed" } : undefined}
                      >
                        Прегледай
                      </Btn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </PropertyShell>
  );
}
