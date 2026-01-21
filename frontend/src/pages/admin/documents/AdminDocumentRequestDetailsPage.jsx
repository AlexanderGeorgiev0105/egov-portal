import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getAdminDocumentRequest,
  approveAdminDocumentRequest,
  rejectAdminDocumentRequest,
  downloadAdminRequestPhoto,
} from "../../../api/adminDocumentsApi";

import {
  DOCUMENT_REQUEST_STATUSES,
  DOCUMENT_REQUEST_KINDS,
  DOCUMENT_TYPES,
  documentTypeLabel,
  genderLabel,
  requestStatusLabel,
  kindLabel,
  isExpired,
  formatDateBG,
} from "../../../utils/documents/documentsModel";

// ✅ Property UI (коригирай пътя при нужда)
import { PropertyShell, PropertyHead, Card, HeadRow, Btn, Badge } from "../../../ui/property/PropertyUI";

// ✅ UiAlert
import { useUiAlert } from "../../../ui/UiAlertProvider";

export default function AdminDocumentRequestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useUiAlert();

  const [req, setReq] = useState(null);
  const [error, setError] = useState("");

  const [previews, setPreviews] = useState([]); // [{url,name,type}]
  const [viewer, setViewer] = useState(null); // {url,name,type} | null

  useEffect(() => {
    let alive = true;

    (async () => {
      setError("");
      try {
        const r = await getAdminDocumentRequest(id);
        if (!alive) return;
        setReq(r || null);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Грешка при зареждане на заявката.");
        setReq(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const p = req?.payload;
  const expired = useMemo(() => isExpired(p?.validUntil), [p?.validUntil]);

  // ESC closes viewer
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setViewer(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Load request photos (admin endpoint) -> blobs
  useEffect(() => {
    let alive = true;

    previews.forEach((x) => x.url?.startsWith("blob:") && URL.revokeObjectURL(x.url));
    setPreviews([]);

    async function load() {
      if (!req?.id) return;

      const out = [];
      try {
        const b1 = await downloadAdminRequestPhoto(req.id, 1);
        if (b1 && alive) out.push({ url: URL.createObjectURL(b1), name: "Снимка 1", type: b1.type || "image/*" });
      } catch {}
      try {
        const b2 = await downloadAdminRequestPhoto(req.id, 2);
        if (b2 && alive) out.push({ url: URL.createObjectURL(b2), name: "Снимка 2", type: b2.type || "image/*" });
      } catch {}

      if (!alive) {
        out.forEach((x) => x.url?.startsWith("blob:") && URL.revokeObjectURL(x.url));
        return;
      }
      setPreviews(out);
    }

    load();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req?.id]);

  useEffect(() => {
    return () => {
      previews.forEach((x) => x.url?.startsWith("blob:") && URL.revokeObjectURL(x.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approve() {
    try {
      await approveAdminDocumentRequest(req.id, "Одобрено.");
      navigate("/admin/document-requests");
    } catch (e) {
      showAlert(e?.message || "Грешка при одобряване.", { title: "Грешка" });
    }
  }

  async function reject() {
    try {
      await rejectAdminDocumentRequest(req.id, "Отказано.");
      navigate("/admin/document-requests");
    } catch (e) {
      showAlert(e?.message || "Грешка при отказ.", { title: "Грешка" });
    }
  }

  if (!req) {
    return (
      <PropertyShell>
        <HeadRow>
          <Btn to="/admin/document-requests">← Назад</Btn>
        </HeadRow>

        <PropertyHead title="Детайли на заявка" />

        {error ? (
          <div className="pp-alert pp-alert--error" style={{ marginTop: 12 }}>
            <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
          </div>
        ) : (
          <p className="pp-muted" style={{ marginTop: 10 }}>
            Заявката не е намерена.
          </p>
        )}
      </PropertyShell>
    );
  }

  const isPending = req.status === DOCUMENT_REQUEST_STATUSES.PENDING;

  return (
    <PropertyShell>
      <HeadRow style={{ justifyContent: "space-between" }}>
        <Btn to="/admin/document-requests">← Назад</Btn>

        <Badge tone={req.status === DOCUMENT_REQUEST_STATUSES.PENDING ? "default" : "neutral"}>
          {requestStatusLabel(req.status)}
        </Badge>
      </HeadRow>

      <HeadRow>
        <PropertyHead title="Детайли на заявка" subtitle={kindLabel(req.kind)} />
      </HeadRow>

      <Card style={{ marginTop: 12 }}>
        <div className="pp-grid2">
          <div>
            <strong>ID:</strong> {req.id}
          </div>
          <div>
            <strong>Дата:</strong> {new Date(req.createdAt).toLocaleString()}
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <strong>Потребител:</strong> {req.userFullName || "—"} (ЕГН: {req.userEgn || req.userId})
          </div>
          {req.adminNote ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <strong>Бележка:</strong> {req.adminNote}
            </div>
          ) : null}
        </div>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <div className="pp-cardTitle" style={{ marginBottom: 10 }}>
          Данни за документа
        </div>

        {req.kind === DOCUMENT_REQUEST_KINDS.REMOVE_DOCUMENT ? (
          <div style={{ display: "grid", gap: 6 }}>
            <div>
              <strong>Тип:</strong> {documentTypeLabel(p?.type)}
            </div>
            <div>
              <strong>Номер:</strong> {p?.docNumber || "—"}
            </div>
            <div>
              <strong>Валиден до:</strong> {p?.validUntil ? formatDateBG(p.validUntil) : "—"}
            </div>
            <div>
              <strong>Причина:</strong> {p?.reason || "—"}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            <div>
              <strong>Тип:</strong> {documentTypeLabel(p?.type)}
            </div>
            <div>
              <strong>Номер:</strong> {p?.docNumber || "—"}
            </div>

            <div>
              <strong>Статус:</strong>{" "}
              <span style={{ fontWeight: 900, color: expired ? "#b91c1c" : "#16a34a" }}>
                {expired ? "Невалиден" : "Валиден"}
              </span>
            </div>

            <div>
              <strong>Валиден до:</strong> {p?.validUntil ? formatDateBG(p.validUntil) : "—"}
            </div>

            <hr style={{ border: 0, borderTop: "1px solid rgba(15,23,42,0.08)", margin: "10px 0" }} />

            <div>
              <strong>Име:</strong> {p?.firstName}
            </div>
            <div>
              <strong>Презиме:</strong> {p?.middleName}
            </div>
            <div>
              <strong>Фамилия:</strong> {p?.lastName}
            </div>
            <div>
              <strong>ЕГН:</strong> {p?.egn}
            </div>
            <div>
              <strong>Пол:</strong> {genderLabel(p?.gender)}
            </div>
            <div>
              <strong>Дата на раждане:</strong> {p?.dob || "—"}
            </div>
            <div>
              <strong>Място на раждане:</strong> {p?.birthPlace}
            </div>
            <div>
              <strong>Постоянен адрес:</strong> {p?.address}
            </div>
            <div>
              <strong>Издаден от:</strong> {p?.issuedAt}
            </div>

            {p?.type === DOCUMENT_TYPES.DRIVER_LICENSE && (
              <div>
                <strong>Категории:</strong>{" "}
                {Array.isArray(p?.categories) && p.categories.length ? p.categories.join(", ") : "—"}
              </div>
            )}
          </div>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <div className="pp-cardTitle" style={{ marginBottom: 10 }}>
          Снимки
        </div>

        {previews.length === 0 ? (
          <div className="pp-muted">Няма намерени снимки за визуализация.</div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginTop: 8,
              }}
            >
              {previews.map((pimg, i) => (
                <div key={i} className="pp-miniCard">
                  <div className="pp-muted" style={{ fontSize: 12, marginBottom: 6 }}>
                    {pimg.name}
                  </div>

                  <img
                    src={pimg.url}
                    alt={pimg.name}
                    title="Кликни за цял екран"
                    onClick={() => setViewer({ url: pimg.url, name: pimg.name, type: pimg.type })}
                    style={{
                      width: "100%",
                      borderRadius: 14,
                      display: "block",
                      maxHeight: 240,
                      objectFit: "contain",
                      background: "rgba(15,23,42,0.04)",
                      cursor: "zoom-in",
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="pp-muted" style={{ marginTop: 8, fontSize: 12 }}>
              * Клик върху снимка = цял екран. ESC или ✕ затваря.
            </div>
          </>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <div className="pp-cardTitle" style={{ marginBottom: 10 }}>
          Админ действие
        </div>

        <div className="pp-actionsRow">
          <Btn
            variant="primary"
            onClick={approve}
            disabled={!isPending}
            style={!isPending ? { opacity: 0.65, cursor: "not-allowed" } : undefined}
          >
            Одобри
          </Btn>

          <Btn
            onClick={reject}
            disabled={!isPending}
            style={!isPending ? { opacity: 0.65, cursor: "not-allowed" } : undefined}
          >
            Отхвърли
          </Btn>
        </div>
      </Card>

      {/* Viewer (property-ui modal) */}
      {viewer && (
        <div
          className="pp-overlay"
          onClick={() => setViewer(null)}
          role="dialog"
          aria-modal="true"
          style={{ zIndex: 9999 }}
        >
          <div
            className="pp-modal"
            style={{
              width: "min(1100px, 100%)",
              maxHeight: "90vh",
              overflow: "hidden",
              padding: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pp-card" style={{ padding: 0, height: "100%", display: "flex", flexDirection: "column" }}>
              <div className="pp-modalHead">
                <div style={{ fontWeight: 950, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {viewer.name}
                </div>

                <button className="pp-btn" onClick={() => setViewer(null)} type="button" title="Затвори">
                  ✕
                </button>
              </div>

              <img
                src={viewer.url}
                alt={viewer.name}
                style={{
                  width: "100%",
                  height: "100%",
                  maxHeight: "calc(90vh - 60px)",
                  objectFit: "contain",
                  background: "#0b1020",
                  display: "block",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </PropertyShell>
  );
}
