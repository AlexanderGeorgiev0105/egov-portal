import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listMyProperties, hasTaxAssessment } from "../../../api/propertyApi";
import { listMyPropertyRequests, createTaxAssessmentRequest } from "../../../api/propertyRequestsApi";

import { useUiAlert } from "../../../ui/UiAlertProvider";
import { PropertyShell, PropertyHead, Card, MiniCard, Btn, Select, Input, FieldLabel } from "../../../ui/property";

function getPurposeOptionsByType(type) {
  const t = String(type || "").toLowerCase();
  const commonOther = ["Друго"];

  if (t.includes("апартамент") || t.includes("къща")) {
    return ["Жилищно", "Търговско (магазин, заведение)", "Офис", "Склад / Производствено", ...commonOther];
  }

  if (t.includes("земя")) return ["Земеделско", "Парцел", ...commonOther];
  if (t.includes("гараж")) return ["Гараж", "Паркомясто", ...commonOther];

  return ["Жилищно", "Търговско (магазин, заведение)", "Офис", "Друго"];
}

export default function PropertyTaxAssessmentPage() {
  const navigate = useNavigate();
  const { showAlert } = useUiAlert();

  const [properties, setProperties] = useState([]);
  const [myReqs, setMyReqs] = useState([]);
  const [hasTaxMap, setHasTaxMap] = useState({});

  const [propertyId, setPropertyId] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [purpose, setPurpose] = useState("");
  const [purposeOther, setPurposeOther] = useState("");
  const [adjoiningParts, setAdjoiningParts] = useState("Не");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setError("");
    try {
      const [props, reqs] = await Promise.all([listMyProperties(), listMyPropertyRequests()]);

      const list = Array.isArray(props) ? props : [];
      setProperties(list);
      setMyReqs(Array.isArray(reqs) ? reqs : []);

      const settled = await Promise.allSettled(list.map((p) => hasTaxAssessment(p.id)));
      const map = {};
      for (let i = 0; i < list.length; i++) {
        map[list[i].id] = settled[i].status === "fulfilled" ? !!settled[i].value : false;
      }
      setHasTaxMap(map);
    } catch (e) {
      setError(e?.message || "Грешка при зареждане.");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingTaxReqByProperty = useMemo(() => {
    const map = new Map();
    for (const r of myReqs) {
      if (r.kind === "TAX_ASSESSMENT" && r.status === "PENDING") {
        const pid = r.propertyId || r.payload?.propertyId;
        if (pid) map.set(pid, r);
      }
    }
    return map;
  }, [myReqs]);

  const eligibleProperties = useMemo(() => {
    return properties.filter((p) => !hasTaxMap?.[p.id] && !pendingTaxReqByProperty.has(p.id));
  }, [properties, pendingTaxReqByProperty, hasTaxMap]);

  const selectedProperty = useMemo(() => {
    return properties.find((p) => p.id === propertyId) || null;
  }, [properties, propertyId]);

  const purposeOptions = useMemo(() => {
    if (!selectedProperty) return [];
    return getPurposeOptionsByType(selectedProperty.type);
  }, [selectedProperty]);

  useEffect(() => {
    setPurpose("");
    setPurposeOther("");
  }, [propertyId]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!propertyId) return setError("Моля, избери имот.");
    if (pendingTaxReqByProperty.has(propertyId)) return setError("За този имот вече има подадена заявка за данъчна оценка и се чака проверка.");
    if (!selectedProperty) return setError("Имотът не е намерен.");
    if (!neighborhood.trim()) return setError("Моля, попълни квартал.");
    if (!purpose) return setError("Моля, избери предназначение.");
    if (purpose === "Друго" && !purposeOther.trim()) return setError("Моля, опиши 'Друго' предназначение.");

    setSubmitting(true);
    try {
      await createTaxAssessmentRequest({
        propertyId: selectedProperty.id,
        neighborhood: neighborhood.trim(),
        purpose,
        purposeOther: purpose === "Друго" ? purposeOther.trim() : "",
        hasAdjoiningParts: adjoiningParts === "Да",
      });

      await showAlert("Заявката за данъчна оценка е изпратена към администратор.", { title: "Успешно" });
      navigate("/user/property");
    } catch (e2) {
      setError(e2?.message || "Грешка при изпращане.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PropertyShell>
      <PropertyHead
        title="Данъчна оценка"
        subtitle="Подай заявка за данъчна оценка. Администраторът ще я прегледа и потвърди/отхвърли."
      />

      {error && (
        <div className="pp-alert pp-alert--error" style={{ marginBottom: 12 }}>
          <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
        </div>
      )}

      {properties.length === 0 ? (
        <Card>Нямаш добавени/одобрени имоти.</Card>
      ) : eligibleProperties.length === 0 ? (
        <div className="pp-alert pp-alert--warn">
          Няма налични непотвърдени имоти за данъчна оценка (или вече има подадени заявки, които чакат проверка).
        </div>
      ) : (
        <Card style={{ maxWidth: 860 }}>
          <form onSubmit={onSubmit} className="pp-form">
            <label>
              <FieldLabel>Изберете имот (само непотвърдени)</FieldLabel>
              <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
                <option value="">— Избери —</option>
                {eligibleProperties.map((p) => (
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

            <Input
              placeholder="Квартал"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              disabled={submitting}
            />

            <label>
              <FieldLabel>Предназначение</FieldLabel>
              <Select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                disabled={!selectedProperty || submitting}
                style={!selectedProperty ? { opacity: 0.6 } : undefined}
              >
                <option value="">— Избери —</option>
                {purposeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </label>

            {purpose === "Друго" && (
              <Input
                placeholder="Опиши друго предназначение"
                value={purposeOther}
                onChange={(e) => setPurposeOther(e.target.value)}
                disabled={submitting}
              />
            )}

            <label>
              <FieldLabel>Прилежащи части</FieldLabel>
              <Select value={adjoiningParts} onChange={(e) => setAdjoiningParts(e.target.value)} disabled={submitting}>
                <option value="Да">Да</option>
                <option value="Не">Не</option>
              </Select>
            </label>

            <div className="pp-actionsRow">
              <Btn variant="primary" type="submit" disabled={submitting}>
                {submitting ? "Изпращане..." : "Изпрати заявка към админ"}
              </Btn>
              <Btn type="button" onClick={() => navigate("/user/property")} disabled={submitting}>
                Отказ
              </Btn>
            </div>
          </form>
        </Card>
      )}
    </PropertyShell>
  );
}
