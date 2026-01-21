import React, { useEffect, useMemo, useState } from "react";
import {
  getRegistrationRequests,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  getRegistrationIdCardFront,
  getRegistrationIdCardBack,
} from "../../../auth/mockAuth";

// ✅ Property UI (ако пътят е различен – коригирай само import-а)
import { PropertyShell, PropertyHead, Card, HeadRow, Btn } from "../../../ui/property/PropertyUI";

// ✅ UiAlert
import { useUiAlert } from "../../../ui/UiAlertProvider";

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj && obj[k] != null && obj[k] !== "") return obj[k];
  }
  return "";
}

function normalizeRow(r) {
  // поддържа и snake_case, и camelCase, и алтернативни имена
  return {
    id: pick(r, "id", "userId", "user_id"),
    fullName: pick(r, "fullName", "full_name", "name"),
    egn: pick(r, "egn"),
    gender: pick(r, "gender"),
    dob: pick(r, "dob", "dateOfBirth", "date_of_birth"),
    docNumber: pick(r, "docNumber", "doc_number", "documentNumber", "document_number"),
    docValidUntil: pick(r, "docValidUntil", "doc_valid_until", "documentValidUntil", "document_valid_until"),
    issuedAt: pick(r, "issuedAt", "issued_at", "issuedBy", "issued_by"),
    birthPlace: pick(r, "birthPlace", "birth_place"),
    address: pick(r, "address"),
    phone: pick(r, "phone", "phoneNumber", "phone_number"),
    email: pick(r, "email"),
    createdAt: pick(r, "submittedAt", "createdAt", "created_at"),
    _raw: r, // за дебъг
  };
}

export default function AdminRegisterRequestsPage() {
  const { showAlert } = useUiAlert();

  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const [idFrontUrl, setIdFrontUrl] = useState("");
  const [idBackUrl, setIdBackUrl] = useState("");
  const [zoomUrl, setZoomUrl] = useState("");
  const [loadingImages, setLoadingImages] = useState(false);
  const [imagesError, setImagesError] = useState("");

  const selected = useMemo(
    () => requests.find((r) => String(r.id) === String(selectedId)) || null,
    [requests, selectedId]
  );

  // Load ID card images for the selected registration (as blobs -> object URLs)
  useEffect(() => {
    let cancelled = false;
    let localFrontUrl = "";
    let localBackUrl = "";

    // cleanup previous URLs from state
    if (idFrontUrl) URL.revokeObjectURL(idFrontUrl);
    if (idBackUrl) URL.revokeObjectURL(idBackUrl);

    setIdFrontUrl("");
    setIdBackUrl("");
    setImagesError("");

    if (!selected || !selected.id) return () => {};

    (async () => {
      setLoadingImages(true);
      try {
        const [frontRes, backRes] = await Promise.allSettled([
          getRegistrationIdCardFront(selected.id),
          getRegistrationIdCardBack(selected.id),
        ]);

        if (cancelled) return;

        if (frontRes.status === "fulfilled") {
          localFrontUrl = URL.createObjectURL(frontRes.value);
          setIdFrontUrl(localFrontUrl);
        } else {
          setImagesError((p) => p || "Не успях да заредя предната снимка.");
        }

        if (backRes.status === "fulfilled") {
          localBackUrl = URL.createObjectURL(backRes.value);
          setIdBackUrl(localBackUrl);
        } else {
          setImagesError((p) => p || "Не успях да заредя задната снимка.");
        }
      } finally {
        if (!cancelled) setLoadingImages(false);
      }
    })();

    return () => {
      cancelled = true;
      if (localFrontUrl) URL.revokeObjectURL(localFrontUrl);
      if (localBackUrl) URL.revokeObjectURL(localBackUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Close zoom modal on Escape
  useEffect(() => {
    if (!zoomUrl) return;
    const onKey = (e) => {
      if (e.key === "Escape") setZoomUrl("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomUrl]);

  useEffect(() => {
    let mounted = true;
    setLoadingList(true);

    getRegistrationRequests()
      .then((rows) => {
        if (!mounted) return;
        const normalized = Array.isArray(rows) ? rows.map(normalizeRow) : [];
        setRequests(normalized);

        // auto-select first
        const firstId = normalized[0]?.id || null;
        setSelectedId(firstId);
      })
      .catch((e) => {
        if (!mounted) return;
        showAlert(e?.message || "Грешка при зареждане на заявки.", { title: "Грешка" });
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingList(false);
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshList(keepId) {
    setLoadingList(true);
    try {
      const rows = await getRegistrationRequests();
      const normalized = Array.isArray(rows) ? rows.map(normalizeRow) : [];
      setRequests(normalized);

      // keep selection if still exists
      const exists = normalized.some((r) => String(r.id) === String(keepId));
      setSelectedId(exists ? keepId : normalized[0]?.id || null);
    } catch (e) {
      showAlert(e?.message || "Грешка при зареждане на заявки.", { title: "Грешка" });
    } finally {
      setLoadingList(false);
    }
  }

  async function onApprove(userId) {
    if (!userId) return;
    setLoadingAction(true);
    try {
      await approveRegistrationRequest(userId);
      showAlert("Заявката е одобрена успешно.", { title: "Съобщение" });
      await refreshList(userId);
    } catch (e) {
      showAlert(e?.message || "Грешка при одобрение.", { title: "Грешка" });
    } finally {
      setLoadingAction(false);
    }
  }

  async function onReject(userId) {
    if (!userId) return;
    setLoadingAction(true);
    try {
      await rejectRegistrationRequest(userId);
      showAlert("Заявката е отхвърлена/изтрита успешно.", { title: "Съобщение" });
      await refreshList(userId);
    } catch (e) {
      showAlert(e?.message || "Грешка при отхвърляне.", { title: "Грешка" });
    } finally {
      setLoadingAction(false);
    }
  }

  return (
    <PropertyShell>
      <HeadRow style={{ justifyContent: "space-between" }}>
        <PropertyHead title="Одобряване на регистрации" subtitle="Преглед и обработка на регистрационни заявки." />
      </HeadRow>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: 14,
          alignItems: "stretch",
          marginTop: 12,
        }}
      >
        {/* LEFT: list */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "14px 14px",
              borderBottom: "1px solid rgba(15,23,42,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div className="pp-cardTitle" style={{ margin: 0 }}>
              Чакащи заявки
            </div>
            <span className="pp-muted" style={{ fontSize: 13 }}>
              ({requests.length})
            </span>
          </div>

          {loadingList ? (
            <div className="pp-muted" style={{ padding: 14 }}>
              Зареждане...
            </div>
          ) : requests.length === 0 ? (
            <div className="pp-muted" style={{ padding: 14 }}>
              Няма чакащи регистрации.
            </div>
          ) : (
            <div style={{ maxHeight: "70vh", overflow: "auto" }}>
              {requests.map((r) => {
                const isActive = String(r.id) === String(selectedId);
                return (
                  <button
                    key={String(r.id)}
                    onClick={() => setSelectedId(r.id)}
                    type="button"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 14px",
                      border: "none",
                      borderBottom: "1px solid rgba(15,23,42,0.06)",
                      background: isActive ? "rgba(59,130,246,0.10)" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 900, marginBottom: 4 }}>{r.fullName || "—"}</div>
                    <div className="pp-muted" style={{ fontSize: 12 }}>
                      ЕГН: {r.egn || "—"} • Подадена: {formatDateTime(r.createdAt)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* RIGHT: details */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "14px 14px",
              borderBottom: "1px solid rgba(15,23,42,0.08)",
            }}
          >
            <div className="pp-cardTitle" style={{ margin: 0 }}>
              Детайли
            </div>
          </div>

          {!selected ? (
            <div className="pp-muted" style={{ padding: 14 }}>
              Избери заявка от списъка.
            </div>
          ) : (
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{selected.fullName || "—"}</div>
              <div className="pp-muted" style={{ fontSize: 12, marginTop: 4 }}>
                Подадена: {formatDateTime(selected.createdAt)}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <div>
                  <b>ЕГН:</b> {selected.egn || "—"}
                </div>
                <div>
                  <b>Пол:</b> {selected.gender || "—"}
                </div>
                <div>
                  <b>Дата на раждане:</b> {selected.dob || "—"}
                </div>
                <div>
                  <b>Номер на документ:</b> {selected.docNumber || "—"}
                </div>
                <div>
                  <b>Валиден до:</b> {selected.docValidUntil || "—"}
                </div>
                <div>
                  <b>Издаден от:</b> {selected.issuedAt || "—"}
                </div>
                <div>
                  <b>Място на раждане:</b> {selected.birthPlace || "—"}
                </div>
                <div>
                  <b>Адрес:</b> {selected.address || "—"}
                </div>
                <div>
                  <b>Телефон:</b> {selected.phone || "—"}
                </div>
                <div>
                  <b>Email:</b> {selected.email || "—"}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>
                  Прикачени снимки (лична карта)
                </div>

                {loadingImages && <div className="pp-muted">Зареждане на снимките...</div>}

                {!loadingImages && imagesError && (
                  <div className="pp-alert pp-alert--error">
                    <strong style={{ color: "#991b1b" }}>Грешка:</strong> {imagesError}
                  </div>
                )}

                {!loadingImages && !imagesError && (!idFrontUrl || !idBackUrl) && (
                  <div className="pp-muted">Няма налични снимки (или не са качени).</div>
                )}

                <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                  {idFrontUrl && (
                    <div style={{ width: 240 }}>
                      <div className="pp-muted" style={{ fontSize: 12, marginBottom: 6 }}>
                        Предна страна
                      </div>
                      <img
                        src={idFrontUrl}
                        alt="ID card front"
                        onClick={() => setZoomUrl(idFrontUrl)}
                        style={{
                          width: "100%",
                          height: 150,
                          objectFit: "cover",
                          borderRadius: 14,
                          border: "1px solid rgba(15,23,42,0.10)",
                          cursor: "zoom-in",
                          background: "rgba(15,23,42,0.04)",
                        }}
                      />
                    </div>
                  )}

                  {idBackUrl && (
                    <div style={{ width: 240 }}>
                      <div className="pp-muted" style={{ fontSize: 12, marginBottom: 6 }}>
                        Задна страна
                      </div>
                      <img
                        src={idBackUrl}
                        alt="ID card back"
                        onClick={() => setZoomUrl(idBackUrl)}
                        style={{
                          width: "100%",
                          height: 150,
                          objectFit: "cover",
                          borderRadius: 14,
                          border: "1px solid rgba(15,23,42,0.10)",
                          cursor: "zoom-in",
                          background: "rgba(15,23,42,0.04)",
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="pp-muted" style={{ marginTop: 8, fontSize: 12 }}>
                  Натисни върху снимка за увеличение.
                </div>
              </div>

              <div className="pp-actionsRow" style={{ marginTop: 16 }}>
                <Btn
                  variant="primary"
                  onClick={() => onApprove(selected.id)}
                  disabled={loadingAction}
                  style={loadingAction ? { opacity: 0.7, cursor: "not-allowed" } : undefined}
                >
                  {loadingAction ? "..." : "Одобри"}
                </Btn>

                <Btn
                  onClick={() => onReject(selected.id)}
                  disabled={loadingAction}
                  style={loadingAction ? { opacity: 0.7, cursor: "not-allowed" } : undefined}
                >
                  {loadingAction ? "..." : "Отхвърли"}
                </Btn>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Zoom modal (property-ui стил) */}
      {zoomUrl && (
        <div className="pp-overlay" onClick={() => setZoomUrl("")} role="dialog" aria-modal="true" style={{ zIndex: 9999 }}>
          <div
            className="pp-modal"
            style={{
              width: "min(1100px, 100%)",
              maxHeight: "90vh",
              overflow: "hidden",
              padding: 0,
              borderRadius: 26,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pp-card"
              style={{
                padding: 0,
                height: "100%",
                overflow: "hidden",
                borderRadius: 26,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="pp-modalHead" style={{ borderTopLeftRadius: 26, borderTopRightRadius: 26 }}>
                <div style={{ fontWeight: 950 }}>Преглед на снимка</div>
                <button
                  className="pp-btn"
                  onClick={() => setZoomUrl("")}
                  type="button"
                  title="Затвори"
                  style={{ padding: "8px 10px", borderRadius: 14 }}
                >
                  ✕
                </button>
              </div>

              <img
                src={zoomUrl}
                alt="Zoom"
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
