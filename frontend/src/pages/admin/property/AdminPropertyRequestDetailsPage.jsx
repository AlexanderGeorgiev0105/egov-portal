import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getAdminPropertyRequest,
  approveAdminPropertyRequest,
  rejectAdminPropertyRequest,
  approveSketchWithPdf,
  downloadPropertyRequestOwnershipDoc,
} from "../../../api/adminPropertyApi";

// ✅ Property UI (пътя при теб може да е различен – ти вече си го нагласил)
import { PropertyShell, PropertyHead, Card, HeadRow, Btn, Badge, Input } from "../../../ui/property/PropertyUI";

// ✅ UiAlert
import { useUiAlert } from "../../../ui/UiAlertProvider";

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

function statusLabel(status) {
  switch (status) {
    case "PENDING":
      return "Чака проверка";
    case "APPROVED":
      return "Одобрена";
    case "REJECTED":
      return "Отказана";
    default:
      return status || "—";
  }
}

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "—";
  }
}

function docTypeLabel(docType) {
  if (docType === "SKICA") return "Скица";
  if (docType === "SCHEMA") return "Схема";
  return docType || "—";
}

export default function AdminPropertyRequestDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { showAlert } = useUiAlert();

  const [req, setReq] = useState(null);
  const [error, setError] = useState("");
  const [pdfFile, setPdfFile] = useState(null);

  const [ownershipUrl, setOwnershipUrl] = useState("");

  async function refresh() {
    setError("");
    try {
      const r = await getAdminPropertyRequest(id);
      setReq(r);
    } catch (e) {
      setError(e?.message || "Грешка при зареждане.");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    return () => {
      if (ownershipUrl) URL.revokeObjectURL(ownershipUrl);
    };
  }, [ownershipUrl]);

  const p = useMemo(() => req?.payload || null, [req]);

  async function onApprove() {
    if (!req) return;
    try {
      await approveAdminPropertyRequest(req.id);
      await showAlert("Одобрено.", { title: "Съобщение" });
      nav("/admin/property-requests");
    } catch (e) {
      await showAlert(e?.message || "Грешка при одобряване.", { title: "Грешка" });
    }
  }

  async function onReject() {
    if (!req) return;
    try {
      await rejectAdminPropertyRequest(req.id, "");
      await showAlert("Отказано.", { title: "Съобщение" });
      nav("/admin/property-requests");
    } catch (e) {
      await showAlert(e?.message || "Грешка при отказ.", { title: "Грешка" });
    }
  }

  async function onApproveSketch() {
    if (!req) return;
    if (!pdfFile) {
      await showAlert("Избери PDF файл.", { title: "Съобщение" });
      return;
    }
    try {
      await approveSketchWithPdf(req.id, pdfFile);
      await showAlert("Скицата е одобрена и PDF е качен.", { title: "Съобщение" });
      nav("/admin/property-requests");
    } catch (e) {
      await showAlert(e?.message || "Грешка при одобряване на скица.", { title: "Грешка" });
    }
  }

  async function onOpenOwnershipDoc(e) {
    e?.preventDefault?.();
    if (!req) return;
    try {
      const blob = await downloadPropertyRequestOwnershipDoc(req.id);
      const url = URL.createObjectURL(blob);
      setOwnershipUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      await showAlert(err?.message || "Грешка при отваряне на документа.", { title: "Грешка" });
    }
  }

  if (error) {
    return (
      <PropertyShell>
        <HeadRow>
          <Btn to="/admin/property-requests">← Назад</Btn>
        </HeadRow>

        <PropertyHead title="Детайли на заявка" />

        <div className="pp-alert pp-alert--error" style={{ marginTop: 12 }}>
          <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
        </div>
      </PropertyShell>
    );
  }

  if (!req) {
    return (
      <PropertyShell>
        <HeadRow>
          <Btn to="/admin/property-requests">← Назад</Btn>
        </HeadRow>

        <PropertyHead title="Детайли на заявка" />
        <p className="pp-muted">Заявката не е намерена.</p>
      </PropertyShell>
    );
  }

  const isPending = req.status === "PENDING";
  const isSketch = req.kind === "SKETCH";

  return (
    <PropertyShell>
      <HeadRow>
        <Btn to="/admin/property-requests">← Назад</Btn>
      </HeadRow>

      <HeadRow style={{ justifyContent: "space-between" }}>
        <PropertyHead title="Детайли на заявка" subtitle={kindLabel(req.kind)} />
        <Badge tone={req.status === "PENDING" ? "default" : "neutral"}>{statusLabel(req.status)}</Badge>
      </HeadRow>

      {/* ✅ Премахнати "Обработена" и "Бележка от админ" */}
      <Card style={{ marginTop: 12 }}>
        <div className="pp-grid2">
          <div>
            <strong>ID:</strong> {req.id}
          </div>

          <div>
            <strong>ЕГН:</strong> {req.userEgn || req.userId}
          </div>

          <div>
            <strong>Подадена:</strong> {formatDateTime(req.createdAt)}
          </div>
        </div>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <div className="pp-cardTitle" style={{ marginBottom: 10 }}>
          Информация за имота
        </div>

        <div className="pp-grid2">
          <div>
            <strong>Вид имот:</strong> {p?.type || "—"}
          </div>
          <div>
            <strong>Област:</strong> {p?.oblast || "—"}
          </div>
          <div>
            <strong>Населено място:</strong> {p?.place || "—"}
          </div>
          <div>
            <strong>Квадратура:</strong> {p?.areaSqm || "—"} m²
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <strong>Адрес:</strong> {p?.address || "—"}
          </div>

          <div>
            <strong>Година на закупуване:</strong> {p?.purchaseYear || "—"}
          </div>

          <div>
            <strong>Документ:</strong>{" "}
            {req.kind === "ADD_PROPERTY" ? (
              <a className="pp-link" href={ownershipUrl || "#"} onClick={onOpenOwnershipDoc}>
                Документ (PDF)
              </a>
            ) : (
              p?.ownershipDoc?.name || (req.propertyId ? "Документ (PDF)" : "—")
            )}
          </div>
        </div>
      </Card>

      {req.kind === "REMOVE_PROPERTY" && (
        <Card style={{ marginTop: 12 }}>
          <div className="pp-cardTitle" style={{ marginBottom: 10 }}>
            Премахване на имот
          </div>
          <div>
            <strong>Причина за премахване:</strong> {p?.reason || "—"}
          </div>
        </Card>
      )}

      {req.kind === "TAX_ASSESSMENT" && (
        <Card style={{ marginTop: 12 }}>
          <div className="pp-cardTitle" style={{ marginBottom: 10 }}>
            Данъчна оценка
          </div>

          <div className="pp-grid2">
            <div>
              <strong>Квартал:</strong> {p?.neighborhood || p?.district || "—"}
            </div>
            <div>
              <strong>Предназначение:</strong> {p?.purpose || "—"}
            </div>
            <div>
              <strong>Прилежащи части:</strong> {p?.hasAdjParts ? "Да" : "Не"}
            </div>
          </div>
        </Card>
      )}

      {isSketch && (
        <Card style={{ marginTop: 12 }}>
          <div className="pp-cardTitle" style={{ marginBottom: 10 }}>
            Скица
          </div>

          <div className="pp-grid2">
            <div>
              <strong>Тип документ:</strong> {docTypeLabel(p?.docType)}
            </div>
            <div>
              <strong>Срок:</strong> {p?.termDays === 3 ? "Бърз (до 3 дни)" : "Стандартен (до 7 дни)"}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <strong>Качи PDF:</strong>
              <div style={{ marginTop: 8 }}>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card style={{ marginTop: 12 }}>
        <div className="pp-cardTitle" style={{ marginBottom: 10 }}>
          Админ действие
        </div>

        <div className="pp-actionsRow">
          {!isSketch && (
            <Btn variant="primary" disabled={!isPending} onClick={onApprove}>
              Одобри
            </Btn>
          )}

          {isSketch && (
            <Btn variant="primary" disabled={!isPending} onClick={onApproveSketch}>
              Одобри + Качи PDF
            </Btn>
          )}

          <Btn disabled={!isPending} onClick={onReject}>
            Отхвърли
          </Btn>
        </div>
      </Card>
    </PropertyShell>
  );
}
