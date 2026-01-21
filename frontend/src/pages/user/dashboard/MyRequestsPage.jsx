import { useEffect, useState } from "react";
import { loadRequests, updateRequestStatus } from "../../../utils/requests/requestsStorage";
import {
  REQUEST_STATUSES,
  getStatusLabel,
  formatDateTime,
  canUserCancel,
} from "../../../utils/requests/requestModel";

export default function MyRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setRequests(loadRequests());
      setLoading(false);
    }, 200);
  }, []);

  function cancelRequest(requestId) {
    const updated = updateRequestStatus(requestId, REQUEST_STATUSES.CANCELLED);
    setRequests(updated);
  }

  if (loading) {
    return (
      <div>
        <h1>My Requests</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div>
        <h1>My Requests</h1>
        <p>Все още нямате подадени заявки.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>My Requests</h1>

      <table className="table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Услуга</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((r) => (
            <tr key={r.id}>
              <td>{formatDateTime(r.createdAt)}</td>
              <td>{r.service.title}</td>
              <td>{getStatusLabel(r.status)}</td>
              <td>
                {canUserCancel(r.status) && (
                  <button className="btn" onClick={() => cancelRequest(r.id)}>
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
