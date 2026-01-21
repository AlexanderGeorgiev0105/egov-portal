import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getMyProperty,
  getTaxAssessment,
  getSketchMeta,
  downloadSketchPdf,
  downloadOwnershipDoc,
  getOwnershipDocMeta,
} from "../../../api/propertyApi";

import { getMe } from "../../../api/userApi";
import { useUiAlert } from "../../../ui/UiAlertProvider";
import { PropertyShell, HeadRow, Card, Btn } from "../../../ui/property";

function money(v) {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("bg-BG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function docTypeLabel(docType) {
  if (docType === "SKICA") return "Скица";
  if (docType === "SCHEMA") return "Схема";
  return docType || "—";
}

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const { showAlert } = useUiAlert();

  const [me, setMe] = useState(null);
  const [property, setProperty] = useState(null);
  const [tax, setTax] = useState(null);
  const [sketch, setSketch] = useState(null);
  const [ownershipMeta, setOwnershipMeta] = useState(null);

  const [error, setError] = useState("");

  const [sketchUrl, setSketchUrl] = useState("");
  const [ownershipUrl, setOwnershipUrl] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setError("");
      setProperty(null);
      setTax(null);
      setSketch(null);
      setOwnershipMeta(null);

      try {
        try {
          const u = await getMe();
          if (!alive) return;
          setMe(u);
        } catch {
          setMe(null);
        }

        const p = await getMyProperty(id);
        if (!alive) return;
        setProperty(p);

        try {
          const t = await getTaxAssessment(id);
          if (!alive) return;
          setTax(t);
        } catch (e) {
          if (e?.status !== 404) throw e;
        }

        try {
          const s = await getSketchMeta(id);
          if (!alive) return;
          setSketch(s);
        } catch (e) {
          if (e?.status !== 404 && e?.status !== 405) throw e;
        }

        try {
          const meta = await getOwnershipDocMeta(id);
          if (!alive) return;
          setOwnershipMeta(meta);
        } catch {
          setOwnershipMeta(null);
        }
      } catch (e2) {
        if (!alive) return;
        setError(e2?.message || "Грешка при зареждане.");
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (sketchUrl) URL.revokeObjectURL(sketchUrl);
    };
  }, [sketchUrl]);

  useEffect(() => {
    return () => {
      if (ownershipUrl) URL.revokeObjectURL(ownershipUrl);
    };
  }, [ownershipUrl]);

  const isConfirmed = !!tax;
  const confirmLabel = isConfirmed ? "Активен" : "Неактивен";
  const confirmReason = isConfirmed ? "" : "Добавете данъчна оценка, за да потвърдите статуса на имота";

  const ownerName = me?.fullName || me?.name || me?.username || "—";
  const ownerEgn = me?.egn || me?.EGN || "—";

  async function onDownloadSketch(e) {
    e.preventDefault();
    try {
      const blob = await downloadSketchPdf(id);
      const url = URL.createObjectURL(blob);
      setSketchUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });

      const a = document.createElement("a");
      a.href = url;
      a.download = "sketch.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      await showAlert(err?.message || "Грешка при сваляне на PDF.", { title: "Грешка" });
    }
  }

  async function onOpenOwnershipDoc(e) {
    e.preventDefault();

    const w = window.open("about:blank", "_blank");
    if (w) {
      try {
        w.opener = null;
      } catch {}
      w.document.title = "Документ за собственост";
      w.document.body.innerHTML = "<p style='font-family:Arial'>Зареждане...</p>";
    }

    try {
      const blob = await downloadOwnershipDoc(id);
      const realBlob = blob instanceof Blob ? blob : new Blob([blob], { type: "application/pdf" });
      const url = URL.createObjectURL(realBlob);

      setOwnershipUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });

      if (w) w.location.href = url;
      else window.location.href = url;
    } catch (err) {
      if (w) {
        w.document.body.innerHTML =
          "<p style='font-family:Arial;color:#b91c1c'>Грешка при отваряне на документа.</p>";
      }
      await showAlert(err?.message || "Грешка при отваряне на документа.", { title: "Грешка" });
    }
  }

  const ownershipLinkText =
    ownershipMeta?.filename && ownershipMeta.filename !== "Документ за собственост" ? ownershipMeta.filename : "Отвори документ";

  if (error) {
    return (
      <PropertyShell>
        <HeadRow>
          <h1 className="pp-title" style={{ margin: 0 }}>
            Детайли за имота
          </h1>
        </HeadRow>

        <div className="pp-alert pp-alert--error" style={{ marginTop: 12 }}>
          <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
        </div>

        <Btn to="/user/property">← Назад</Btn>
      </PropertyShell>
    );
  }

  if (!property) {
    return (
      <PropertyShell>
        <HeadRow>
          <h1 className="pp-title" style={{ margin: 0 }}>
            Детайли за имота
          </h1>
          <div className="pp-subtitle">Имотът не е намерен.</div>
        </HeadRow>

        <Btn to="/user/property">← Назад</Btn>
      </PropertyShell>
    );
  }

  return (
    <PropertyShell>
      <HeadRow>
        <Btn to="/user/property">← Назад</Btn>
        <h1 className="pp-title" style={{ margin: 0 }}>
          Детайли за имота
        </h1>
      </HeadRow>

      <Card style={{ marginTop: 12 }}>
        <h3 className="pp-cardTitle" style={{ marginTop: 0 }}>
          Основна информация
        </h3>

        <div style={{ display: "grid", gap: 6 }}>
          <div>
            <strong>ID на имота:</strong> {property.id}
          </div>

          <div>
            <strong>Собственик:</strong> {ownerName}
          </div>
          <div>
            <strong>ЕГН:</strong> {ownerEgn}
          </div>

          <div style={{ marginTop: 6 }}>
            <strong>Статус:</strong>{" "}
            <span style={{ fontWeight: 900, color: isConfirmed ? "#16a34a" : "#dc2626" }}>{confirmLabel}</span>
          </div>

          <div style={{ fontSize: 13, opacity: 0.8 }}>{confirmReason}</div>

          <hr style={{ border: 0, borderTop: "1px solid rgba(15, 23, 42, 0.08)", margin: "10px 0" }} />

          <div>
            <strong>Вид имот:</strong> {property.type}
          </div>
          <div>
            <strong>Област:</strong> {property.oblast}
          </div>
          <div>
            <strong>Населено място:</strong> {property.place}
          </div>
          <div>
            <strong>Адрес:</strong> {property.address}
          </div>
          <div>
            <strong>Квадратура:</strong> {property.areaSqm} m²
          </div>
          <div>
            <strong>Година на закупуване:</strong> {property.purchaseYear}
          </div>

          <div>
            <strong>Документ за собственост:</strong>{" "}
            {!ownershipMeta ? (
              "—"
            ) : (
              <a href={ownershipUrl || "#"} onClick={onOpenOwnershipDoc} className="pp-link">
                {ownershipLinkText}
              </a>
            )}
          </div>
        </div>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <h3 className="pp-cardTitle" style={{ marginTop: 0 }}>
          Данъчна оценка
        </h3>

        {!tax ? (
          <p className="pp-muted" style={{ marginBottom: 0 }}>
            Няма
          </p>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            <div>
              <strong>Цена на имота:</strong> {money(tax?.price)} лв.
            </div>
            <div>
              <strong>Годишен данък:</strong> {money(tax?.yearlyTax)} лв.
            </div>
            <div>
              <strong>Такса смет:</strong> {money(tax?.trashFee)} лв.
            </div>
            <div>
              <strong>Предназначение на имота:</strong> {tax?.purpose}
            </div>
            <div>
              <strong>Прилежащи части:</strong> {tax?.hasAdjoiningParts ? "Да" : "Не"}
            </div>
          </div>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <h3 className="pp-cardTitle" style={{ marginTop: 0 }}>
          Скица на имота
        </h3>

        {!sketch ? (
          <p className="pp-muted" style={{ marginBottom: 0 }}>
            Няма
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div>
                <strong>Тип на документа:</strong> {docTypeLabel(sketch.docType)}
              </div>
              <div>
                <strong>Срок:</strong> {sketch.termDays === 3 ? "Бърз (до 3 дни)" : "Стандартен (до 7 дни)"}
              </div>
            </div>

            <div>
              <Btn variant="primary" to={sketchUrl || "#"} onClick={onDownloadSketch}>
                ⬇️ Свали PDF
              </Btn>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>PDF се сваля от backend-а.</div>
            </div>
          </div>
        )}
      </Card>
    </PropertyShell>
  );
}
