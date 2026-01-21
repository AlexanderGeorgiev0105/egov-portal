import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  listMyTransportRequests,
  listMyTransportVehicles,
  createTechInspectionRequest,
} from "../../../api/transportApi";

import {
  VEHICLE_REQUEST_KINDS,
  VEHICLE_REQUEST_STATUSES,
  calcInspectionValidUntil,
} from "../../../utils/transport/vehiclesModel";

import { validatePdfFile } from "../../../utils/auth/validators";
import { TransportShell } from "../../../ui/transport";

function formatDateBG(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("bg-BG");
}

function getInspectionValidUntilISO(vehicle) {
  return (
    vehicle?.techInspection?.validUntilISO ||
    vehicle?.techInspection?.validUntil ||
    vehicle?.techInspectionValidUntil ||
    vehicle?.inspectionValidUntil ||
    ""
  );
}

function isInspectionActive(vehicle) {
  const until = getInspectionValidUntilISO(vehicle);
  if (!until) return false;
  const d = new Date(`${until}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  return new Date().getTime() <= d.getTime();
}

function getTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isFutureISODate(dateISO) {
  if (!dateISO) return false;
  const sel = new Date(`${dateISO}T00:00:00`);
  const today = new Date(`${getTodayISO()}T00:00:00`);
  if (Number.isNaN(sel.getTime()) || Number.isNaN(today.getTime())) return false;
  return sel.getTime() > today.getTime();
}

export default function TechnicalInspectionPage() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  const [vehicleId, setVehicleId] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [pdf, setPdf] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const todayISO = useMemo(() => getTodayISO(), []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [veh, reqs] = await Promise.all([
          listMyTransportVehicles().catch(() => []),
          listMyTransportRequests().catch(() => []),
        ]);
        if (!alive) return;
        setVehicles(Array.isArray(veh) ? veh : []);
        setMyRequests(Array.isArray(reqs) ? reqs : []);
      } catch {
        if (!alive) return;
        setVehicles([]);
        setMyRequests([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const pendingInspectionVehicleIds = useMemo(() => {
    const set = new Set();
    for (const r of myRequests) {
      if (
        r.kind === VEHICLE_REQUEST_KINDS.TECH_INSPECTION &&
        r.status === VEHICLE_REQUEST_STATUSES.PENDING &&
        r.payload?.vehicleId
      ) {
        set.add(r.payload.vehicleId);
      }
    }
    return set;
  }, [myRequests]);

  const selectableVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (isInspectionActive(v)) return false;
      if (pendingInspectionVehicleIds.has(v.id)) return false;
      return true;
    });
  }, [vehicles, pendingInspectionVehicleIds]);

  const activeVehicles = useMemo(
    () => vehicles.filter((v) => isInspectionActive(v)),
    [vehicles]
  );

  function validate() {
    if (!vehicleId) return "Избери МПС.";
    if (!inspectionDate) return "Дата на преглед е задължителна.";

    if (isFutureISODate(inspectionDate)) {
      return "Датата на техническия преглед не може да е след днешната дата.";
    }

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
      const validUntilISO = calcInspectionValidUntil(inspectionDate);

      const payload = {
        vehicleId,
        inspectionDateISO: inspectionDate,
        validUntilISO,
      };

      await createTechInspectionRequest(payload, pdf);

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
          <Link className="btn" to="/user/vehicles">
            ← Назад
          </Link>
          <h1 style={{ margin: 0 }}>Техничен преглед</h1>
        </div>

        <p className="tp-muted">
          Заявката за технически преглед се изпраща към админ. След одобрение, статусът на МПС-то се обновява и не може
          да се заявява отново докато е валиден.
        </p>

        {error ? (
          <div className="tp-alert tp-alert--error" style={{ marginBottom: 12, textAlign: "left" }}>
            <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 360px",
            gap: 12,
            alignItems: "start",
            marginTop: 12,
          }}
        >
          <div className="card" style={{ textAlign: "left" }}>
            <h3 style={{ marginTop: 0 }}>Активни прегледи</h3>
            {activeVehicles.length === 0 ? (
              <div className="tp-muted">Няма активни технически прегледи.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {activeVehicles.map((v) => (
                  <div key={v.id} className="card" style={{ borderRadius: 18, padding: 10 }}>
                    <div style={{ fontWeight: 900 }}>{v.regNumber}</div>
                    <div style={{ marginTop: 4 }} className="tp-muted">
                      Валиден до <strong>{formatDateBG(getInspectionValidUntilISO(v))}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={submit} className="card" style={{ textAlign: "left", display: "grid", gap: 10 }}>
            <h3 style={{ marginTop: 0 }}>Заяви преглед</h3>

            {vehicles.length === 0 ? (
              <div className="tp-muted">Нямаш одобрени МПС-та. Първо добави превозно средство.</div>
            ) : selectableVehicles.length === 0 ? (
              <div className="tp-muted">
                Няма МПС, което да може да бъде заявено (или има активен преглед, или има чакаща заявка).
              </div>
            ) : (
              <>
                <label style={{ fontWeight: 700 }}>МПС *</label>
                <select className="select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  <option value="">-- Избери --</option>
                  {selectableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.regNumber} ({v.brand} {v.model})
                    </option>
                  ))}
                </select>

                <label style={{ fontWeight: 700 }}>Дата на преглед *</label>
                <input
                  className="input"
                  type="date"
                  value={inspectionDate}
                  max={todayISO}
                  onChange={(e) => setInspectionDate(e.target.value)}
                />

                <div style={{ fontSize: 12 }} className="tp-muted">
                  Прегледът ще бъде валиден до <strong>същата дата следващата година</strong>.
                </div>

                <label style={{ fontWeight: 700 }}>Документ (PDF) *</label>
                <input type="file" accept="application/pdf,.pdf" onChange={(e) => setPdf(e.target.files?.[0] || null)} />

                <button className="btn primary tp-btnCompact" disabled={saving} type="submit">
                  {saving ? "Изпращане..." : "Изпрати заявката"}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </TransportShell>
  );
}
