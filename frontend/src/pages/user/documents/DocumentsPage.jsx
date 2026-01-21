import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import {
  listMyDocuments,
  listMyDocumentRequests,
  createRemoveDocumentRequest,
} from "../../../api/documentsApi";

import {
  DOCUMENT_REQUEST_KINDS,
  DOCUMENT_REQUEST_STATUSES,
  REMOVE_DOCUMENT_REASONS,
  documentTypeLabel,
  formatDateBG,
  isExpired,
  kindLabel,
} from "../../../utils/documents/documentsModel";

import { useUiAlert } from "../../../ui/UiAlertProvider";
import { DocumentsShell } from "../../../ui/documents";

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString("bg-BG");
  } catch {
    return iso;
  }
}

function docRequestStatusBg(status) {
  switch (status) {
    case DOCUMENT_REQUEST_STATUSES.PENDING:
      return "Чака проверка";
    case DOCUMENT_REQUEST_STATUSES.APPROVED:
      return "Одобрено";
    case DOCUMENT_REQUEST_STATUSES.REJECTED:
      return "Отказано";
    default:
      return status;
  }
}

export default function DocumentsPage() {
  const navigate = useNavigate();
  const { showAlert } = useUiAlert();

  const [documents, setDocuments] = useState([]);
  const [docRequests, setDocRequests] = useState([]);

  const [isRequestsOpen, setIsRequestsOpen] = useState(false);

  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [removeDoc, setRemoveDoc] = useState(null);
  const [removeReason, setRemoveReason] = useState(REMOVE_DOCUMENT_REASONS[0] || "Подновяване");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setError("");
    try {
      const [docs, reqs] = await Promise.all([listMyDocuments(), listMyDocumentRequests()]);
      setDocuments(Array.isArray(docs) ? docs : []);
      setDocRequests(Array.isArray(reqs) ? reqs : []);
    } catch (e) {
      setError(e?.message || "Грешка при зареждане на документи.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = useMemo(
    () => docRequests.filter((r) => r.status === DOCUMENT_REQUEST_STATUSES.PENDING).length,
    [docRequests]
  );

  function openRequests() {
    refresh();
    setIsRequestsOpen(true);
  }
  function closeRequests() {
    setIsRequestsOpen(false);
  }

  function openDetails(id) {
    navigate(`/user/documents/details/${id}`);
  }

  function hasPendingRemoveRequest(documentId) {
    return docRequests.some((r) => {
      if (r.kind !== DOCUMENT_REQUEST_KINDS.REMOVE_DOCUMENT) return false;
      if (r.status !== DOCUMENT_REQUEST_STATUSES.PENDING) return false;

      // backend може да върне documentId (field) + payload.documentId (string)
      const pid = r.documentId || r.payload?.documentId;
      return String(pid || "") === String(documentId);
    });
  }

  function openRemoveModal(doc, e) {
    e?.stopPropagation?.();
    setRemoveDoc(doc);
    setRemoveReason(REMOVE_DOCUMENT_REASONS[0] || "Подновяване");
    setIsRemoveOpen(true);
  }

  function closeRemoveModal() {
    setIsRemoveOpen(false);
    setRemoveDoc(null);
  }

  async function submitRemoveRequest(e) {
    e.preventDefault();
    if (!removeDoc) return;

    if (hasPendingRemoveRequest(removeDoc.id)) {
      await showAlert("Вече има подадена заявка за премахване на този документ и се чака проверка.", {
        title: "Важно",
      });
      closeRemoveModal();
      return;
    }

    try {
      await createRemoveDocumentRequest({ documentId: removeDoc.id, reason: removeReason });
      closeRemoveModal();
      await refresh();
      await showAlert("Заявката за премахване е изпратена към администратор.", { title: "Успешно" });
    } catch (ex) {
      await showAlert(ex?.message || "Грешка при изпращане на заявката.", { title: "Грешка" });
    }
  }

  return (
    <DocumentsShell>
      <div>
        <h1>Документи за самоличност</h1>
        <p style={{ color: "#555" }}>
          Тук виждаш добавените документи и заявките към администратор. Последните заявки се виждат вдясно.
        </p>

        {error ? (
          <div className="card" style={{ borderColor: "#fecaca", background: "#fff1f2", marginTop: 12 }}>
            <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
          </div>
        ) : null}

        <div className="hub-layout" style={{ marginTop: 12 }}>
          {/* Left */}
          <div>
            {/* Actions row */}
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                margin: "0 0 12px",
                alignItems: "center",
              }}
            >
              <Link className="btn btn-primary" to="/user/documents/add">
                Добави документ
              </Link>
            </div>

            {/* Documents list */}
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Моите документи</h3>

              {loading ? (
                <p style={{ color: "#555", marginBottom: 0 }}>Зареждане…</p>
              ) : documents.length === 0 ? (
                <p style={{ color: "#555", marginBottom: 0 }}>
                  Все още нямаш одобрени документи. Подай заявка за добавяне.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {documents.map((d) => {
                    const expired = isExpired(d.validUntil);
                    const pendingRemove = hasPendingRemoveRequest(d.id);

                    return (
                      <div
                        key={d.id}
                        className="card"
                        onClick={() => openDetails(d.id)}
                        style={{
                          cursor: "pointer",
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 900 }}>
                            {documentTypeLabel(d.type)} • № {d.docNumber || "—"}
                          </div>
                          <div style={{ color: "#555", fontSize: 13 }}>
                            {expired ? (
                              <span style={{ fontWeight: 800, color: "#b91c1c" }}>Невалиден</span>
                            ) : (
                              <span style={{ color: "#16a34a", fontWeight: 800 }}>Валиден</span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 12, opacity: 0.75 }}>Валиден до</div>
                            <div style={{ fontWeight: 900 }}>
                              {d.validUntil ? formatDateBG(d.validUntil) : "—"}
                            </div>
                          </div>

                          {pendingRemove ? (
                            <button
                              className="btn"
                              disabled
                              onClick={(e) => e.stopPropagation()}
                              style={{ opacity: 0.65, cursor: "not-allowed" }}
                              title="Вече има подадена заявка за премахване и се чака проверка."
                            >
                              Заявен за премахване
                            </button>
                          ) : (
                            <button className="btn" onClick={(e) => openRemoveModal(d, e)}>
                              Премахни
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right - requests panel */}
          <div className="card" style={{ textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ margin: 0 }}>Заявки</h3>
              <span className="badge">{pendingCount} чакащи</span>
            </div>

            <div style={{ marginTop: 10, color: "#555", fontSize: 13 }}>
              Последни заявки за секцията „Документи“.
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {loading ? (
                <div style={{ color: "#555" }}>Зареждане…</div>
              ) : docRequests.length === 0 ? (
                <div style={{ color: "#555" }}>Нямаш подадени заявки за тази секция.</div>
              ) : (
                docRequests.slice(0, 8).map((r) => (
                  <div
                    key={r.id}
                    className="card"
                    style={{
                      borderRadius: 18,
                      padding: 10,
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>{kindLabel(r.kind)}</div>

                    <div style={{ marginTop: 6, color: "#555", fontSize: 13 }}>
                      {documentTypeLabel(r.payload?.type)}
                      {r.payload?.docNumber ? ` • № ${r.payload.docNumber}` : ""}
                      {r.kind === DOCUMENT_REQUEST_KINDS.REMOVE_DOCUMENT && r.payload?.reason
                        ? ` • ${r.payload.reason}`
                        : ""}
                    </div>

                    <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span className="badge">{docRequestStatusBg(r.status)}</span>
                      <span className="badge" style={{ background: "#f3f4f6", borderColor: "#e5e7eb" }}>
                        {formatDateTime(r.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 10 }}>
              <button className="btn btn-primary" onClick={openRequests} title="Виж всички заявки">
                Виж всички
              </button>
            </div>
          </div>
        </div>

        {/* Requests modal */}
        {isRequestsOpen && (
          <div
            onClick={closeRequests}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              zIndex: 1000,
              display: "flex",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              className="card"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(980px, 100%)",
                maxHeight: "85vh",
                overflow: "auto",
                background: "#fff",
                padding: 0,
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #eef0f6",
                  background: "#fff",
                }}
              >
                <div style={{ fontWeight: 800 }}>Заявки</div>
                <button className="btn" onClick={closeRequests} title="Затвори">
                  ✕
                </button>
              </div>

              <div style={{ padding: 12 }}>
                {docRequests.length === 0 ? (
                  <p style={{ color: "#555" }}>Нямаш подадени заявки.</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Дата</th>
                        <th>Вид</th>
                        <th>Документ</th>
                        <th>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docRequests.map((r) => (
                        <tr key={r.id}>
                          <td>{formatDateTime(r.createdAt)}</td>
                          <td>{kindLabel(r.kind)}</td>
                          <td>
                            {documentTypeLabel(r.payload?.type)} {r.payload?.docNumber ? `• № ${r.payload.docNumber}` : ""}
                            {r.kind === DOCUMENT_REQUEST_KINDS.REMOVE_DOCUMENT && r.payload?.reason ? (
                              <div style={{ fontSize: 12, opacity: 0.75 }}>Причина: {r.payload.reason}</div>
                            ) : null}
                          </td>
                          <td>{docRequestStatusBg(r.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
                  Документите се добавят/премахват чрез заявки към администратор.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remove request modal */}
        {isRemoveOpen && removeDoc && (
          <div
            onClick={closeRemoveModal}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              zIndex: 1100,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: 16,
            }}
          >
            <div
              className="card"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(620px, 100%)",
                background: "#fff",
                padding: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #eef0f6",
                  background: "#fff",
                }}
              >
                <div style={{ fontWeight: 800 }}>Заявка за премахване</div>
                <button className="btn" onClick={closeRemoveModal} title="Затвори">
                  ✕
                </button>
              </div>

              <div style={{ padding: 12 }}>
                <div className="card" style={{ background: "#fff" }}>
                  <div style={{ fontWeight: 900 }}>
                    {documentTypeLabel(removeDoc.type)} • № {removeDoc.docNumber || "—"}
                  </div>
                  <div style={{ color: "#555" }}>
                    Валиден до: {removeDoc.validUntil ? formatDateBG(removeDoc.validUntil) : "—"}
                  </div>
                </div>

                <form onSubmit={submitRemoveRequest} style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <label>
                    <div style={{ fontSize: 13, marginBottom: 6, opacity: 0.8 }}>Причина за изтриване</div>
                    <select
                      className="input"
                      value={removeReason}
                      onChange={(e) => setRemoveReason(e.target.value)}
                      style={{ width: "100%", padding: 10, borderRadius: 10 }}
                    >
                      {REMOVE_DOCUMENT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button className="btn btn-primary" type="submit">
                    Изпрати заявка
                  </button>

                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    * Документът се премахва след одобрение от администратор.
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DocumentsShell>
  );
}
