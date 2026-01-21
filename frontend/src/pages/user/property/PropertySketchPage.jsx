import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listMyProperties, hasSketch } from "../../../api/propertyApi";
import { createSketchRequest, listMyPropertyRequests } from "../../../api/propertyRequestsApi";

import { useUiAlert } from "../../../ui/UiAlertProvider";
import { PropertyShell, HeadRow, Card, MiniCard, Btn, Select, FieldLabel } from "../../../ui/property";

const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25MB

function termLabel(days) {
  return days === 3 ? "Бърз (до 3 дни)" : "Стандартен (до 7 дни)";
}

function docTypeLabel(code) {
  if (code === "SKICA") return "Скица";
  if (code === "SCHEMA") return "Схема";
  return code || "—";
}

export default function PropertySketchPage() {
  const navigate = useNavigate();
  const { showAlert } = useUiAlert();

  const [properties, setProperties] = useState([]);
  const [requests, setRequests] = useState([]);

  const [hasSketchMap, setHasSketchMap] = useState({});

  const [selectedId, setSelectedId] = useState("");
  const [docType, setDocType] = useState("SKICA");
  const [termDays, setTermDays] = useState(7);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setError("");
    try {
      const [props, reqs] = await Promise.all([listMyProperties(), listMyPropertyRequests()]);

      const list = Array.isArray(props) ? props : [];
      setProperties(list);
      setRequests(Array.isArray(reqs) ? reqs : []);

      const settled = await Promise.allSettled(list.map((p) => hasSketch(p.id)));
      const map = {};
      for (let i = 0; i < list.length; i++) {
        map[list[i].id] = settled[i].status === "fulfilled" ? !!settled[i].value : false;
      }
      setHasSketchMap(map);
    } catch (e) {
      setError(e?.message || "Грешка при зареждане.");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingSketchByPropertyId = useMemo(() => {
    const map = {};
    for (const r of requests) {
      if (r.kind === "SKETCH" && r.status === "PENDING") {
        const pid = r.propertyId || r.payload?.propertyId;
        if (pid) map[pid] = true;
      }
    }
    return map;
  }, [requests]);

  const eligible = useMemo(() => {
    return properties.filter((p) => !hasSketchMap?.[p.id] && !pendingSketchByPropertyId[p.id]);
  }, [properties, pendingSketchByPropertyId, hasSketchMap]);

  const selectedProperty = useMemo(() => {
    return properties.find((p) => p.id === selectedId) || null;
  }, [properties, selectedId]);

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!selectedId) {
      setError("Моля, избери имот.");
      return;
    }

    if (!selectedProperty) {
      setError("Невалиден имот.");
      return;
    }

    if (hasSketchMap?.[selectedId]) {
      setError("За този имот вече има потвърдена скица/схема.");
      return;
    }

    if (pendingSketchByPropertyId[selectedId]) {
      setError("Вече има подадена заявка за скица за този имот. Изчакай админът да я обработи.");
      return;
    }

    setSubmitting(true);
    try {
      await createSketchRequest({ propertyId: selectedProperty.id, docType, termDays });

      await refresh();
      await showAlert("Заявката за скица е изпратена към администратор.", { title: "Успешно" });
      navigate("/user/property");
    } catch (e2) {
      setError(e2?.message || "Грешка при изпращане.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PropertyShell>
      <HeadRow>
        <Btn to="/user/property">← Назад</Btn>
        <div>
          <h1 className="pp-title" style={{ margin: 0 }}>
            Скица на имот
          </h1>
          <div className="pp-subtitle">
            Избери имот, който <strong>няма</strong> потвърдена скица/схема и за който <strong>няма</strong> вече подадена
            заявка.
          </div>
        </div>
      </HeadRow>

      {error && (
        <div className="pp-alert pp-alert--error" style={{ marginTop: 12 }}>
          <strong style={{ color: "#b91c1c" }}>Грешка:</strong> {error}
        </div>
      )}

      {eligible.length === 0 ? (
        <Card style={{ marginTop: 12 }}>
          <strong>Няма налични имоти за заявяване на скица.</strong>
          <div style={{ marginTop: 6 }} className="pp-muted">
            Възможни причини:
            <ul style={{ marginTop: 6 }}>
              <li>Всички имоти вече имат потвърдена скица/схема;</li>
              <li>Има чакащи заявки за скица по всички имоти.</li>
            </ul>
          </div>
        </Card>
      ) : (
        <Card style={{ marginTop: 12, maxWidth: 920 }}>
          <h3 className="pp-cardTitle" style={{ marginTop: 0 }}>
            Изберете имот
          </h3>

          <form onSubmit={submit} className="pp-form">
            <label>
              <FieldLabel>Имот</FieldLabel>
              <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={submitting}>
                <option value="">— Избери —</option>
                {eligible.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.type} • {p.oblast} • {p.place} • {p.address}
                  </option>
                ))}
              </Select>
            </label>

            {selectedProperty && (
              <MiniCard>
                <div style={{ fontWeight: 900 }}>
                  {selectedProperty.type} • {selectedProperty.oblast} • {selectedProperty.place}
                </div>
                <div className="pp-muted">{selectedProperty.address}</div>
                <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span>Кв.: {selectedProperty.areaSqm} m²</span>
                  <span>Година: {selectedProperty.purchaseYear}</span>
                  <span style={{ color: "#6b7280" }}>Документ: —</span>
                </div>
              </MiniCard>
            )}

            <div className="pp-grid2">
              <label>
                <FieldLabel>Тип документ</FieldLabel>
                <Select value={docType} onChange={(e) => setDocType(e.target.value)} disabled={submitting}>
                  <option value="SKICA">Скица</option>
                  <option value="SCHEMA">Схема</option>
                </Select>
              </label>

              <label>
                <FieldLabel>Срок</FieldLabel>
                <Select value={termDays} onChange={(e) => setTermDays(Number(e.target.value))} disabled={submitting}>
                  <option value={3}>Бърз (до 3 дни)</option>
                  <option value={7}>Стандартен (до 7 дни)</option>
                </Select>
              </label>
            </div>

            <Btn variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Изпращане..." : "Изпрати заявка към админ"}
            </Btn>

            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Админът ще види заявката в “Admin: Property Requests”.
              <br />
              При “Approve” админът трябва да качи PDF (до {Math.round(MAX_PDF_BYTES / 1024 / 1024)}MB), за да потвърди
              заявката.
              <br />
              Избрано: <strong>{docTypeLabel(docType)}</strong>, <strong>{termLabel(termDays)}</strong>
            </div>
          </form>
        </Card>
      )}
    </PropertyShell>
  );
}
