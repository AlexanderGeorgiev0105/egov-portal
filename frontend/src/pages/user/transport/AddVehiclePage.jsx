import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getCurrentUser } from "../../../utils/auth/currentUser";
import { getCurrentUserId } from "../../../utils/auth/demoUser";

import {
  EURO_OPTIONS,
  euroLabel,
  VEHICLE_REQUEST_KINDS,
  VEHICLE_REQUEST_STATUSES,
} from "../../../utils/transport/vehiclesModel";

import {
  isValidEGN,
  isValidBulgarianRegNumber,
  normalizeBulgarianRegNumber,
  validatePdfFile,
} from "../../../utils/auth/validators";

import { createAddVehicleRequest, listMyTransportRequests, listMyTransportVehicles } from "../../../api/transportApi";
import { TransportShell } from "../../../ui/transport";

function currentYear() {
  return new Date().getFullYear();
}

export default function AddVehiclePage() {
  const navigate = useNavigate();

  const currentUser = getCurrentUser();
  const userKey = currentUser?.egn || getCurrentUserId();

  const [form, setForm] = useState({
    regNumber: "",
    brand: "",
    model: "",
    manufactureYear: "",
    powerKw: "",
    euroCategory: EURO_OPTIONS[0],
  });

  const [pdf, setPdf] = useState(null);

  const [myVehicles, setMyVehicles] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [veh, reqs] = await Promise.all([
          listMyTransportVehicles().catch(() => []),
          listMyTransportRequests().catch(() => []),
        ]);
        if (!alive) return;
        setMyVehicles(Array.isArray(veh) ? veh : []);
        setMyRequests(Array.isArray(reqs) ? reqs : []);
      } catch {
        if (!alive) return;
        setMyVehicles([]);
        setMyRequests([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const normalizedPlate = useMemo(() => normalizeBulgarianRegNumber(form.regNumber), [form.regNumber]);

  const hasDuplicateVehicle = useMemo(() => {
    if (!normalizedPlate) return false;
    return myVehicles.some((v) => normalizeBulgarianRegNumber(v.regNumber) === normalizedPlate);
  }, [myVehicles, normalizedPlate]);

  const hasPendingSamePlate = useMemo(() => {
    if (!normalizedPlate) return false;
    return myRequests.some(
      (r) =>
        r.kind === VEHICLE_REQUEST_KINDS.ADD_VEHICLE &&
        r.status === VEHICLE_REQUEST_STATUSES.PENDING &&
        normalizeBulgarianRegNumber(r.payload?.regNumber) === normalizedPlate
    );
  }, [myRequests, normalizedPlate]);

  function setField(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  function validate() {
    if (!isValidEGN(String(userKey))) return "Няма валидно ЕГН за текущия профил (трябва да е 10 цифри).";

    const plate = normalizeBulgarianRegNumber(form.regNumber);
    if (!plate) return "Регистрационен номер е задължителен.";
    if (!isValidBulgarianRegNumber(plate))
      return "Невалиден регистрационен номер. Пример: CA1111CA (главни букви, без интервали).";

    if (!form.brand.trim()) return "Марка е задължително поле.";
    if (!form.model.trim()) return "Модел е задължително поле.";

    const y = Number(form.manufactureYear);
    if (!Number.isFinite(y) || y < 1900 || y > currentYear())
      return `Година на производство трябва да е между 1900 и ${currentYear()}.`;

    const kw = Number(form.powerKw);
    if (!Number.isFinite(kw) || kw <= 0 || kw > 2000) return "Мощност (kW) трябва да е положително число.";

    if (!form.euroCategory) return "Евро категория е задължително поле.";

    if (hasDuplicateVehicle) return "Вече имаш одобрено МПС с този регистрационен номер.";
    if (hasPendingSamePlate) return "Вече имаш чакаща заявка за МПС с този регистрационен номер.";

    const pdfErr = validatePdfFile(pdf, 10 * 1024 * 1024);
    if (pdfErr) return pdfErr;

    return "";
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        regNumber: normalizeBulgarianRegNumber(form.regNumber),
        brand: form.brand.trim(),
        model: form.model.trim(),
        manufactureYear: Number(form.manufactureYear),
        powerKw: Number(form.powerKw),
        euroCategory: form.euroCategory,
      };

      await createAddVehicleRequest(payload, pdf);

      navigate("/user/vehicles");
    } catch (err) {
      setError(err?.message || "Грешка при изпращане на заявката.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <TransportShell>
      <div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link className="btn" to="/user/vehicles/my">
            ← Назад
          </Link>
          <h1 style={{ margin: 0 }}>Добави превозно средство</h1>
        </div>

        <p className="tp-muted">
          Попълни данните и прикачи <strong>PDF талон/свидетелство за регистрация</strong>. Заявката отива при админ за
          одобрение.
        </p>

        {error ? (
          <div className="tp-alert tp-alert--error" style={{ marginBottom: 12, textAlign: "left" }}>
            <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
          </div>
        ) : null}

        <form onSubmit={submit} className="card" style={{ textAlign: "left", display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontWeight: 700 }}>Регистрационен номер *</label>
              <input
                className="input"
                value={form.regNumber}
                onChange={(e) => setField("regNumber", e.target.value)}
                placeholder="CA1111CA"
              />
              <div style={{ fontSize: 12, marginTop: 4 }} className="tp-muted">
                Допустим формат: 1–2 букви + 4 цифри + 2 букви (напр. CA1111CA).
              </div>
            </div>

            <div>
              <label style={{ fontWeight: 700 }}>Евро категория *</label>
              <select className="select" value={form.euroCategory} onChange={(e) => setField("euroCategory", e.target.value)}>
                {EURO_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {euroLabel(opt)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 700 }}>Марка *</label>
              <input className="input" value={form.brand} onChange={(e) => setField("brand", e.target.value)} placeholder="Toyota" />
            </div>

            <div>
              <label style={{ fontWeight: 700 }}>Модел *</label>
              <input className="input" value={form.model} onChange={(e) => setField("model", e.target.value)} placeholder="Corolla" />
            </div>

            <div>
              <label style={{ fontWeight: 700 }}>Година на производство *</label>
              <input
                className="input"
                type="number"
                value={form.manufactureYear}
                onChange={(e) => setField("manufactureYear", e.target.value)}
                placeholder="2018"
                min={1900}
                max={currentYear()}
              />
            </div>

            <div>
              <label style={{ fontWeight: 700 }}>Мощност (kW) *</label>
              <input
                className="input"
                type="number"
                value={form.powerKw}
                onChange={(e) => setField("powerKw", e.target.value)}
                placeholder="77"
                min={1}
              />
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 700 }}>Документ (талон/свидетелство) – PDF *</label>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setPdf(e.target.files?.[0] || null)}
              style={{ marginTop: 6 }}
            />
            <div style={{ fontSize: 12, marginTop: 4 }} className="tp-muted">
              Максимум 10MB. При одобрение админът ще вижда PDF-а.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn primary" disabled={saving} type="submit">
              {saving ? "Изпращане..." : "Изпрати заявката"}
            </button>
            <Link className="btn" to="/user/vehicles">
              Откажи
            </Link>
          </div>
        </form>
      </div>
    </TransportShell>
  );
}
