import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  approveAdminTransportRequest,
  downloadTransportRequestInspectionDoc,
  downloadTransportRequestRegistrationDoc,
  getAdminTransportRequest,
  rejectAdminTransportRequest,
} from "../../../api/adminTransportApi";

import {
  VEHICLE_REQUEST_KINDS,
  VEHICLE_REQUEST_STATUSES,
  vehicleRequestKindLabel,
  vehicleRequestStatusLabel,
} from "../../../utils/transport/vehiclesModel";

// ✅ Property UI (коригирай пътя при нужда)
import { PropertyShell, PropertyHead, Card, HeadRow, Btn, Badge } from "../../../ui/property/PropertyUI";

// ✅ UiAlert
import { useUiAlert } from "../../../ui/UiAlertProvider";

function formatDateBG(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("bg-BG");
}

function pickFirst(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function getInspectionDateISO(payload) {
  return pickFirst(
    payload?.inspectionDateISO,
    payload?.inspectionDate,
    payload?.inspection_date_iso,
    payload?.inspection_date
  );
}

function addOneYearISO(dateISO) {
  if (!dateISO) return "";
  const d = new Date(`${dateISO}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setFullYear(d.getFullYear() + 1);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getValidUntilISO(payload) {
  const direct = pickFirst(
    payload?.validUntilISO,
    payload?.validUntil,
    payload?.valid_until_iso,
    payload?.valid_until
  );

  if (direct) return direct;

  const insp = getInspectionDateISO(payload);
  return insp ? addOneYearISO(insp) : "";
}

export default function AdminTransportRequestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useUiAlert();

  const [req, setReq] = useState(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const r = await getAdminTransportRequest(id);
        if (!alive) return;
        setReq(r || null);
      } catch (e) {
        if (!alive) return;
        setReq(null);
        showAlert(e?.message || "Грешка при зареждане на заявката.", { title: "Грешка" });
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, showAlert]);

  const p = req?.payload;

  const canAct = useMemo(() => req?.status === VEHICLE_REQUEST_STATUSES.PENDING, [req]);

  function openBlob(blob) {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function openPdf(kind) {
    try {
      if (kind === "registration") {
        const blob = await downloadTransportRequestRegistrationDoc(req.id);
        openBlob(blob);
        return;
      }
      if (kind === "inspection") {
        const blob = await downloadTransportRequestInspectionDoc(req.id);
        openBlob(blob);
        return;
      }
    } catch (e) {
      showAlert("Грешка при отваряне на документа.", { title: "Грешка" });
    }
  }

  async function reject(note = "Отказано.") {
    if (!req) return;
    setActing(true);
    try {
      await rejectAdminTransportRequest(req.id, note);
      navigate("/admin/transport/requests");
    } catch (e) {
      showAlert(e?.message || "Грешка при отказ.", { title: "Грешка" });
    } finally {
      setActing(false);
    }
  }

  async function approve() {
    if (!req) return;
    setActing(true);
    try {
      await approveAdminTransportRequest(req.id);
      navigate("/admin/transport/requests");
    } catch (e) {
      showAlert(e?.message || "Грешка при одобрение.", { title: "Грешка" });
    } finally {
      setActing(false);
    }
  }

  if (!req) {
    return (
      <PropertyShell>
        <HeadRow>
          <Btn to="/admin/transport/requests">← Назад</Btn>
        </HeadRow>

        <PropertyHead title="Детайли на заявка" />
        <p className="pp-muted">Заявката не е намерена.</p>
      </PropertyShell>
    );
  }

  const regNumberForDetails = pickFirst(p?.regNumber, req.regNumber);
  const inspectionDateISO = getInspectionDateISO(p);
  const validUntilISO = getValidUntilISO(p);

  return (
    <PropertyShell>
      <HeadRow style={{ justifyContent: "space-between" }}>
        <Btn to="/admin/transport/requests">← Назад</Btn>

        <Badge tone={req.status === VEHICLE_REQUEST_STATUSES.PENDING ? "default" : "neutral"}>
          {vehicleRequestStatusLabel(req.status)}
        </Badge>
      </HeadRow>

      <HeadRow>
        <PropertyHead title="Детайли на заявка" subtitle={vehicleRequestKindLabel(req.kind)} />
      </HeadRow>

      <Card style={{ marginTop: 12 }}>
        <div className="pp-grid2">
          <div>
            <strong>ID:</strong> {req.id}
          </div>
          <div>
            <strong>Дата:</strong> {req.createdAt ? new Date(req.createdAt).toLocaleString("bg-BG") : "—"}
          </div>
          <div>
            <strong>Тип:</strong> {vehicleRequestKindLabel(req.kind)}
          </div>
          <div>
            <strong>ЕГН:</strong> {req.ownerEgn || req.egn || "—"}
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

        {req.kind === VEHICLE_REQUEST_KINDS.ADD_VEHICLE ? (
          <div style={{ display: "grid", gap: 6 }}>
            <div>
              <strong>Рег. №:</strong> {p?.regNumber || "—"}
            </div>
            <div>
              <strong>Марка/Модел:</strong> {p?.brand || "—"} {p?.model || ""}
            </div>
            <div>
              <strong>Година:</strong> {p?.manufactureYear ?? "—"}
            </div>
            <div>
              <strong>Мощност:</strong> {p?.powerKw ?? "—"} kW
            </div>
            <div>
              <strong>Euro:</strong> {p?.euroCategory || "—"}
            </div>

            <div style={{ marginTop: 8 }}>
              <strong>Документ:</strong>{" "}
              <Btn variant="primary" onClick={() => openPdf("registration")} type="button">
                Отвори PDF
              </Btn>
            </div>
          </div>
        ) : req.kind === VEHICLE_REQUEST_KINDS.TECH_INSPECTION ? (
          <div style={{ display: "grid", gap: 6 }}>
            <div>
              <strong>Рег. №:</strong> {regNumberForDetails || "—"}
            </div>

            <div>
              <strong>Дата на преглед:</strong> {formatDateBG(inspectionDateISO)}
            </div>

            <div>
              <strong>Валиден до:</strong> {formatDateBG(validUntilISO)}
            </div>

            <div style={{ marginTop: 8 }}>
              <strong>Документ:</strong>{" "}
              <Btn variant="primary" onClick={() => openPdf("inspection")} type="button">
                Отвори PDF
              </Btn>
            </div>
          </div>
        ) : (
          <div className="pp-muted">Непознат тип заявка.</div>
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
            disabled={!canAct || acting}
            style={!canAct || acting ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
          >
            {acting ? "..." : "Одобри"}
          </Btn>

          <Btn
            onClick={() => reject("Отказано.")}
            disabled={!canAct || acting}
            style={!canAct || acting ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
          >
            {acting ? "..." : "Отхвърли"}
          </Btn>
        </div>

        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
          * Одобри/Отхвърли работят само при „Чака проверка“.
        </div>
      </Card>
    </PropertyShell>
  );
}
