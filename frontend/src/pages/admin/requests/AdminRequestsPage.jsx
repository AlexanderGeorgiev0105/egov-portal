import { useEffect, useState } from "react";

import { loadRequests, updateRequestStatus, clearAllRequests } from "../../../utils/requests/requestsStorage";

import {
  REQUEST_STATUSES,
  getStatusLabel,
  formatDateTime,
  canAdminProcess,
  canAdminApproveOrReject,
} from "../../../utils/requests/requestModel";

// ✅ Property UI (ако пътят е различен – коригирай само import-а)
import { PropertyShell, PropertyHead, Card, HeadRow, Btn } from "../../../ui/property/PropertyUI";

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setRequests(loadRequests());
      setLoading(false);
    }, 200);
  }, []);

  function markProcessing(id) {
    const updated = updateRequestStatus(id, REQUEST_STATUSES.PROCESSING);
    setRequests(updated);
  }

  function approve(id) {
    const updated = updateRequestStatus(id, REQUEST_STATUSES.APPROVED);
    setRequests(updated);
  }

  function reject(id) {
    const updated = updateRequestStatus(id, REQUEST_STATUSES.REJECTED);
    setRequests(updated);
  }

  function clearDemoData() {
    if (window.confirm("Сигурен ли си, че искаш да изтриеш всички demo заявки?")) {
      clearAllRequests();
      setRequests([]);
    }
  }

  if (loading) {
    return (
      <PropertyShell>
        <PropertyHead title="Admin Requests" subtitle="Loading..." />
      </PropertyShell>
    );
  }

  if (requests.length === 0) {
    return (
      <PropertyShell>
        <PropertyHead title="Admin Requests" subtitle="Няма подадени заявки." />
      </PropertyShell>
    );
  }

  return (
    <PropertyShell>
      <HeadRow style={{ justifyContent: "space-between" }}>
        <PropertyHead title="Admin Requests" subtitle="Преглед и обработка на заявки." />

        <Btn onClick={clearDemoData} type="button">
          Clear demo data
        </Btn>
      </HeadRow>

      <Card style={{ marginTop: 12 }}>
        <table className="pp-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Услуга</th>
              <th>Заявител</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>

          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{formatDateTime(r.createdAt)}</td>
                <td>{r.service.title}</td>
                <td>{r.applicant.fullName}</td>
                <td>{getStatusLabel(r.status)}</td>
                <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {canAdminProcess(r.status) && (
                    <Btn onClick={() => markProcessing(r.id)} type="button">
                      Mark Processing
                    </Btn>
                  )}

                  {canAdminApproveOrReject(r.status) && (
                    <>
                      <Btn variant="primary" onClick={() => approve(r.id)} type="button">
                        Approve
                      </Btn>
                      <Btn onClick={() => reject(r.id)} type="button">
                        Reject
                      </Btn>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PropertyShell>
  );
}
