import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { buyVignette, listMyTransportVehicles, listMyVignettes } from "../../../api/transportApi";

import {
  VIGNETTE_OPTIONS,
  vignetteTypeLabel,
  getVignettePrice,
  addDaysISO,
  addMonthsISO,
  addYearsISO,
  toISODate,
} from "../../../utils/transport/vehiclesModel";

import { TransportShell } from "../../../ui/transport";

function formatMoneyBGN(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${x.toFixed(2)} лв.`;
}

function formatDateBG(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("bg-BG");
}

function computeValidUntil(validFromISO, type) {
  switch (type) {
    case "WEEKLY":
      return addDaysISO(validFromISO, 7);
    case "MONTHLY":
      return addMonthsISO(validFromISO, 1);
    case "QUARTERLY":
      return addMonthsISO(validFromISO, 3);
    case "YEARLY":
      return addYearsISO(validFromISO, 1);
    default:
      return addDaysISO(validFromISO, 7);
  }
}

function isActiveVignette(v, now = new Date()) {
  if (!v?.validFrom || !v?.validUntil) return false;
  const from = new Date(`${v.validFrom}T00:00:00`);
  const until = new Date(`${v.validUntil}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(until.getTime())) return false;
  return now.getTime() >= from.getTime() && now.getTime() <= until.getTime();
}

export default function VignettesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [myVignettes, setMyVignettes] = useState([]);

  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState(VIGNETTE_OPTIONS[0]);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [veh, vigs] = await Promise.all([
          listMyTransportVehicles().catch(() => []),
          listMyVignettes().catch(() => []),
        ]);
        if (!alive) return;
        setVehicles(Array.isArray(veh) ? veh : []);
        setMyVignettes(Array.isArray(vigs) ? vigs : []);
      } catch {
        if (!alive) return;
        setVehicles([]);
        setMyVignettes([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const regNumberById = useMemo(() => {
    const map = {};
    for (const v of vehicles) map[v.id] = v.regNumber;
    return map;
  }, [vehicles]);

  const activeByVehicle = useMemo(() => {
    const now = new Date();
    const map = {};
    for (const v of vehicles) {
      const active = myVignettes
        .filter((x) => x.vehicleId === v.id)
        .sort((a, b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0))
        .find((x) => isActiveVignette(x, now));
      map[v.id] = active || null;
    }
    return map;
  }, [vehicles, myVignettes]);

  const purchasableVehicles = useMemo(
    () => vehicles.filter((v) => !activeByVehicle[v.id]),
    [vehicles, activeByVehicle]
  );

  const price = useMemo(() => getVignettePrice(type), [type]);

  const activeVignettes = useMemo(() => {
    const out = [];
    for (const v of vehicles) {
      const a = activeByVehicle[v.id];
      if (a) out.push({ vehicle: v, vignette: a });
    }
    return out;
  }, [vehicles, activeByVehicle]);

  async function refresh() {
    try {
      const vigs = await listMyVignettes();
      setMyVignettes(Array.isArray(vigs) ? vigs : []);
    } catch {
      setMyVignettes([]);
    }
  }

  async function pay() {
    setError("");
    if (!vehicleId) {
      setError("Избери МПС.");
      return;
    }
    if (activeByVehicle[vehicleId]) {
      setError("Това МПС вече има активна винетка и не може да се купи нова.");
      return;
    }
    if (!type) {
      setError("Избери вид винетка.");
      return;
    }

    setPaying(true);
    try {
      await buyVignette({ vehicleId, type });
      setVehicleId("");
      setType(VIGNETTE_OPTIONS[0]);
      await refresh();
    } catch (e) {
      setError(e?.message || "Грешка при плащане на винетка.");
    } finally {
      setPaying(false);
    }
  }

  const demoValidFrom = useMemo(() => toISODate(new Date()), []);
  const demoValidUntil = useMemo(() => computeValidUntil(demoValidFrom, type), [demoValidFrom, type]);

  return (
    <TransportShell>
      <div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link className="btn" to="/user/vehicles">
            ← Назад
          </Link>
          <h1 style={{ margin: 0 }}>Винетки</h1>
        </div>

        <p className="tp-muted">
          Ако дадено МПС има активна винетка, <strong>не може</strong> да се купи нова, докато не изтече.
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
            <h3 style={{ marginTop: 0 }}>Активни винетки</h3>

            {activeVignettes.length === 0 ? (
              <div className="tp-muted">Няма активни винетки.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {activeVignettes.map(({ vehicle, vignette }) => (
                  <div key={vignette.id} className="card" style={{ borderRadius: 18, padding: 10 }}>
                    <div style={{ fontWeight: 900 }}>{vehicle.regNumber}</div>
                    <div className="tp-muted" style={{ marginTop: 4 }}>
                      {vignetteTypeLabel(vignette.type)} • до <strong>{formatDateBG(vignette.validUntil)}</strong>
                    </div>
                    <div style={{ marginTop: 6 }} className="tp-muted">
                      Цена: {formatMoneyBGN(vignette.price)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ textAlign: "left" }}>
            <h3 style={{ marginTop: 0 }}>Купи винетка</h3>

            {vehicles.length === 0 ? (
              <div className="tp-muted">Нямаш одобрени МПС-та. Първо добави превозно средство.</div>
            ) : purchasableVehicles.length === 0 ? (
              <div className="tp-muted">Всички МПС-та имат активни винетки.</div>
            ) : (
              <>
                <label style={{ fontWeight: 700 }}>МПС *</label>
                <select className="select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  <option value="">-- Избери --</option>
                  {purchasableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.regNumber} ({v.brand} {v.model})
                    </option>
                  ))}
                </select>

                <div style={{ height: 10 }} />

                <label style={{ fontWeight: 700 }}>Вид винетка *</label>
                <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
                  {VIGNETTE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {vignetteTypeLabel(opt)}
                    </option>
                  ))}
                </select>

                <div style={{ marginTop: 12, fontSize: 26, fontWeight: 900 }}>{formatMoneyBGN(price)}</div>

                <div style={{ marginTop: 6, fontSize: 12 }} className="tp-muted">
                  Очаквана валидност: {formatDateBG(demoValidFrom)} → {formatDateBG(demoValidUntil)}
                </div>

                <button className="btn primary" style={{ marginTop: 12 }} onClick={pay} disabled={paying}>
                  {paying ? "Плащане..." : "Плати винетка"}
                </button>
              </>
            )}
          </div>
        </div>

        {myVignettes.length > 0 ? (
          <div className="card" style={{ marginTop: 12, textAlign: "left" }}>
            <h3 style={{ marginTop: 0 }}>История</h3>
            <div className="tp-muted" style={{ fontSize: 13 }}>
              Последни покупки (включително изтекли).
            </div>

            <div style={{ marginTop: 10, overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>МПС</th>
                    <th>Тип</th>
                    <th>От</th>
                    <th>До</th>
                    <th>Цена</th>
                  </tr>
                </thead>
                <tbody>
                  {[...myVignettes]
                    .sort((a, b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0))
                    .slice(0, 10)
                    .map((v) => (
                      <tr key={v.id}>
                        <td>{v.regNumber || v.vehicleRegNumber || regNumberById[v.vehicleId] || v.vehicleId}</td>
                        <td>{vignetteTypeLabel(v.type)}</td>
                        <td>{formatDateBG(v.validFrom)}</td>
                        <td>{formatDateBG(v.validUntil)}</td>
                        <td>{formatMoneyBGN(v.price)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </TransportShell>
  );
}
