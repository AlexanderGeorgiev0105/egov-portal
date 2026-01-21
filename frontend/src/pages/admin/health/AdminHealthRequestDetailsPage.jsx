import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getAdminHealthRequest,
  approveAdminHealthRequest,
  rejectAdminHealthRequest,
  downloadAdminBookletImage,
  downloadAdminReferralPdfFromRequest,
} from "../../../api/adminHealthRequestsApi";

import { getHealthDoctorByPracticeNumber } from "../../../api/healthDoctorsApi";

import {
  HEALTH_REQUEST_STATUSES,
  HEALTH_REQUEST_KINDS,
  healthRequestKindLabel,
  healthRequestStatusLabel,
  shiftLabel,
} from "../../../utils/health/healthModel";

// ✅ Property UI
import { PropertyShell, PropertyHead, Card, HeadRow, Btn, Badge } from "../../../ui/property/PropertyUI";

// ✅ UiAlert
import { useUiAlert } from "../../../ui/UiAlertProvider";

function safeParseMaybeJson(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return null;
  }
}

export default function AdminHealthRequestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useUiAlert();

  const [req, setReq] = useState(null);

  const [previews, setPreviews] = useState([]); // [{url,name,type}]
  const [viewer, setViewer] = useState(null); // {url,name,type} | null

  async function refresh() {
    try {
      const r = await getAdminHealthRequest(id);
      setReq(r || null);
    } catch (e) {
      console.error(e);
      setReq(null);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const p = req?.payload || {};

  const doctor = useMemo(() => {
    if (!req) return null;

    // Prefer snapshot in payload, fallback to current doctor record by practiceNumber
    if (p.doctor && (p.doctor.firstName || p.doctor.lastName)) return p.doctor;
    return null;
  }, [req, p.doctor]);

  const [doctorFallback, setDoctorFallback] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadDoctorIfNeeded() {
      setDoctorFallback(null);

      if (!req) return;
      if (doctor) return;

      const pn = String(p.practiceNumber || "").trim();
      if (!pn) return;

      try {
        const d = await getHealthDoctorByPracticeNumber(pn);
        if (!alive) return;
        setDoctorFallback(d || null);
      } catch {
        if (!alive) return;
        setDoctorFallback(null);
      }
    }

    loadDoctorIfNeeded();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req?.id]);

  const doctorResolved = doctor || doctorFallback;

  // ESC closes viewer
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setViewer(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Load attachment previews from backend
  useEffect(() => {
    let alive = true;

    // cleanup previous blob URLs
    previews.forEach((x) => x.url?.startsWith("blob:") && URL.revokeObjectURL(x.url));
    setPreviews([]);

    async function load() {
      if (!req) return;

      const out = [];

      try {
        if (req.kind === HEALTH_REQUEST_KINDS.ADD_PERSONAL_DOCTOR) {
          const blob = await downloadAdminBookletImage(req.id);
          const url = URL.createObjectURL(blob);
          out.push({
            url,
            name: "booklet-image",
            type: blob.type || "image/jpeg",
          });
        }

        if (req.kind === HEALTH_REQUEST_KINDS.ADD_REFERRAL) {
          const blob = await downloadAdminReferralPdfFromRequest(req.id);
          const url = URL.createObjectURL(blob);
          out.push({
            url,
            name: "referral.pdf",
            type: blob.type || "application/pdf",
          });
        }
      } catch (e) {
        // if file missing or not accessible, just show none
        console.error(e);
      }

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

  // cleanup on unmount
  useEffect(() => {
    return () => {
      previews.forEach((x) => x.url?.startsWith("blob:") && URL.revokeObjectURL(x.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!req) {
    return (
      <PropertyShell>
        <HeadRow>
          <Btn to="/admin/health-requests">← Назад</Btn>
        </HeadRow>

        <PropertyHead title="Детайли на заявка" />
        <p className="pp-muted">Заявката не е намерена.</p>
      </PropertyShell>
    );
  }

  async function approve() {
    try {
      await approveAdminHealthRequest(req.id, "Одобрено.");
      navigate("/admin/health-requests"); // ✅ back to list
    } catch (e) {
      console.error(e);
      showAlert(e?.message || "Грешка при одобрение.", { title: "Грешка" });
    }
  }

  async function reject() {
    try {
      await rejectAdminHealthRequest(req.id, "Отказано.");
      navigate("/admin/health-requests"); // ✅ back to list
    } catch (e) {
      console.error(e);
      showAlert(e?.message || "Грешка при отказ.", { title: "Грешка" });
    }
  }

  const isPending = req.status === HEALTH_REQUEST_STATUSES.PENDING;

  return (
    <PropertyShell>
      <HeadRow style={{ justifyContent: "space-between" }}>
        <Btn to="/admin/health-requests">← Назад</Btn>

        <Badge tone={req.status === HEALTH_REQUEST_STATUSES.PENDING ? "default" : "neutral"}>
          {healthRequestStatusLabel(req.status)}
        </Badge>
      </HeadRow>

      <HeadRow style={{ justifyContent: "space-between" }}>
        <PropertyHead title="Детайли на заявка" subtitle={healthRequestKindLabel(req.kind)} />
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
            <strong>Потребител:</strong> {req.userFullName || "—"} (ЕГН: {req.userEgn || "—"})
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
          Детайли
        </div>

        {req.kind === HEALTH_REQUEST_KINDS.ADD_PERSONAL_DOCTOR ? (
          <div style={{ display: "grid", gap: 6 }}>
            <div>
              <strong>Номер на практиката:</strong> {p.practiceNumber || "—"}
            </div>

            <div>
              <strong>Личен лекар:</strong>{" "}
              {doctorResolved ? `${doctorResolved.firstName} ${doctorResolved.lastName}` : "—"}
            </div>

            {doctorResolved ? (
              <>
                <div>
                  <strong>Смяна:</strong> {shiftLabel(doctorResolved.shift)}
                </div>
                <div>
                  <strong>РЗОК №:</strong> {doctorResolved.rzokNo || "—"}
                </div>
                <div>
                  <strong>Здравен Район:</strong> {doctorResolved.healthRegion || "—"}
                </div>
                <div>
                  <strong>Моб. номер:</strong> {doctorResolved.mobile || "—"}
                </div>
                <div>
                  <strong>Адрес:</strong> {doctorResolved.oblast}, {doctorResolved.city}, {doctorResolved.street}
                </div>
              </>
            ) : (
              <div className="pp-muted" style={{ fontSize: 12 }}>
                * Не е намерен запис за лекаря в системата (възможно е да е изтрит след заявката).
              </div>
            )}
          </div>
        ) : req.kind === HEALTH_REQUEST_KINDS.ADD_REFERRAL ? (
          <div style={{ display: "grid", gap: 6 }}>
            <div>
              <strong>За какво е направлението:</strong> {p.title || p.details || "—"}
            </div>
            {p.note ? (
              <div>
                <strong>Бележка:</strong> {p.note}
              </div>
            ) : null}
          </div>
        ) : req.kind === HEALTH_REQUEST_KINDS.REMOVE_PERSONAL_DOCTOR ? (
          <div style={{ display: "grid", gap: 6 }}>
            <div>
              <strong>Премахване на личен лекар</strong>
            </div>
            {p.reason ? (
              <div>
                <strong>Причина:</strong> {p.reason}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="pp-muted">Непознат тип заявка: {req.kind}</div>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <div className="pp-cardTitle" style={{ marginBottom: 10 }}>
          Прикачени файлове
        </div>

        {previews.length === 0 ? (
          <div className="pp-muted">Няма прикачени файлове.</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 10,
            }}
          >
            {previews.map((f, i) => {
              const isPdf =
                (f.type || "").toLowerCase().includes("pdf") || f.name?.toLowerCase().endsWith(".pdf");
              const isImg = (f.type || "").toLowerCase().startsWith("image/");

              return (
                <div key={i} className="pp-miniCard">
                  <div className="pp-muted" style={{ fontSize: 12, marginBottom: 6 }}>
                    {f.name}
                  </div>

                  {isImg ? (
                    <img
                      src={f.url}
                      alt={f.name}
                      title="Кликни за цял екран"
                      onClick={() => setViewer({ url: f.url, name: f.name, type: f.type })}
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
                  ) : isPdf ? (
                    <Btn onClick={() => setViewer({ url: f.url, name: f.name, type: "application/pdf" })} type="button">
                      Отвори PDF преглед
                    </Btn>
                  ) : (
                    <Btn onClick={() => setViewer({ url: f.url, name: f.name, type: f.type })} type="button">
                      Преглед
                    </Btn>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {previews.length ? (
          <div className="pp-muted" style={{ marginTop: 8, fontSize: 12 }}>
            * Клик върху елемент = преглед. ESC или ✕ затваря.
          </div>
        ) : null}
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

      {/* VIEWER (img / pdf) */}
      {viewer && (
        <div className="pp-overlay" onClick={() => setViewer(null)} role="dialog" aria-modal="true" style={{ zIndex: 9999 }}>
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

              {String(viewer.type || "").toLowerCase().includes("pdf") || viewer.name?.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={viewer.url}
                  title={viewer.name}
                  style={{ width: "100%", height: "78vh", border: "none", background: "#0b1020" }}
                />
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}
    </PropertyShell>
  );
}
