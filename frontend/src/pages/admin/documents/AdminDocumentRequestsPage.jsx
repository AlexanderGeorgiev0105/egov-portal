import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listAdminDocumentRequests } from "../../../api/adminDocumentsApi";
import {
  DOCUMENT_REQUEST_STATUSES,
  documentTypeLabel,
  requestStatusLabel,
  kindLabel,
} from "../../../utils/documents/documentsModel";

// ✅ Property UI (коригирай пътя при нужда)
import { PropertyShell, PropertyHead, Card, HeadRow, Btn } from "../../../ui/property/PropertyUI";

export default function AdminDocumentRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const all = await listAdminDocumentRequests(); // backend already excludes REJECTED by default
        const arr = Array.isArray(all) ? all : [];
        setRequests(arr.filter((r) => r.status !== DOCUMENT_REQUEST_STATUSES.REJECTED));
      } catch (e) {
        setError(e?.message || "Грешка при зареждане на заявки.");
      }
    })();
  }, []);

  function openReview(id) {
    navigate(`/admin/document-requests/${id}`);
  }

  return (
    <PropertyShell>
      <HeadRow style={{ justifyContent: "space-between" }}>
        <PropertyHead title="Заявки за документи" subtitle="Преглед и обработка на заявки за документи за самоличност." />
      </HeadRow>

      {error ? (
        <div className="pp-alert pp-alert--error" style={{ marginTop: 10 }}>
          <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
        </div>
      ) : null}

      {requests.length === 0 ? (
        <p className="pp-muted" style={{ marginTop: 10 }}>
          Няма заявки за документи.
        </p>
      ) : (
        <Card style={{ marginTop: 12 }}>
          <table className="pp-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Вид</th>
                <th>Тип документ</th>
                <th>Потребител</th>
                <th>Номер</th>
                <th>Статус</th>
                <th>Прегледай</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((r) => {
                const isPending = r.status === DOCUMENT_REQUEST_STATUSES.PENDING;
                const type = r.payload?.type;

                return (
                  <tr key={r.id}>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>{kindLabel(r.kind)}</td>
                    <td>{documentTypeLabel(type)}</td>
                    <td>{r.userFullName || "—"}</td>
                    <td>{r.payload?.docNumber || "—"}</td>

                    {/* ✅ статус само като текст (без badge/bubble), на 1 ред */}
                    <td>
                      <span style={{ whiteSpace: "nowrap", fontWeight: 800 }}>
                        {requestStatusLabel(r.status)}
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

          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
            * „Прегледай“ е активно само за чакащи заявки.
          </div>
        </Card>
      )}
    </PropertyShell>
  );
}
