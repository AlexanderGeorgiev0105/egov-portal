import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { listMyFines, payFine } from "../../../api/transportApi";
import { computeFinePricing, fineLabel } from "../../../utils/transport/vehiclesModel";

import { TransportShell } from "../../../ui/transport";

function formatMoneyBGN(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${x.toFixed(2)} лв.`;
}

function formatDateTimeBG(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("bg-BG");
}

export default function FinesPage() {
  const [fines, setFines] = useState([]);
  const [error, setError] = useState("");

  async function refresh() {
    setError("");
    try {
      const items = await listMyFines();
      setFines(Array.isArray(items) ? items : []);
    } catch (e) {
      setFines([]);
      setError(e?.message || "Грешка при зареждане на глоби.");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    return [...fines].sort((a, b) => new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0));
  }, [fines]);

  async function payFineNow(fineId) {
    setError("");
    try {
      await payFine(fineId);
      await refresh();
    } catch (e) {
      setError(e?.message || "Грешка при плащане.");
    }
  }

  return (
    <TransportShell>
      <div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link className="btn" to="/user/vehicles">
            ← Назад
          </Link>
          <h1 style={{ margin: 0 }}>Глоби</h1>
        </div>

        <p className="tp-muted">
          За първите <strong>14 дни</strong> от получаването глобата е <strong>20% по-евтина</strong>.
        </p>

        {error ? (
          <div className="tp-alert tp-alert--error" style={{ marginBottom: 12, textAlign: "left" }}>
            <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
          </div>
        ) : null}

        {sorted.length === 0 ? (
          <div className="card" style={{ textAlign: "left" }}>
            <span className="tp-muted">Нямаш получени глоби.</span>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {sorted.map((f) => {
              const pricing = computeFinePricing(f, new Date());
              return (
                <div key={f.id} className="card" style={{ textAlign: "left" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{fineLabel(f.type)}</div>
                    {f.paid ? (
                      <span className="badge" style={{ background: "#ecfdf5", borderColor: "#a7f3d0" }}>
                        Платено
                      </span>
                    ) : (
                      <span className="badge" style={{ background: "#fff7ed", borderColor: "#fed7aa" }}>
                        Неплатено
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: 8 }} className="tp-muted">
                    Получена: <strong>{formatDateTimeBG(f.issuedAt)}</strong>
                  </div>

                  <div style={{ marginTop: 10, fontSize: 28, fontWeight: 900 }}>{formatMoneyBGN(pricing.finalAmount)}</div>

                  {!f.paid ? (
                    <div style={{ marginTop: 6, fontSize: 12 }} className="tp-muted">
                      {pricing.isDiscountActive ? (
                        <>
                          -20% отстъпка активна (оставащи дни: <strong>{pricing.daysLeft}</strong>).
                          <div>Оригинална сума: {formatMoneyBGN(pricing.baseAmount)}</div>
                        </>
                      ) : (
                        <>Отстъпката (14 дни) не е активна. Оригинална сума: {formatMoneyBGN(pricing.baseAmount)}</>
                      )}
                    </div>
                  ) : (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#065f46" }}>
                      Платена на: <strong>{formatDateTimeBG(f.paidAt)}</strong>
                    </div>
                  )}

                  {!f.paid ? (
                    <button className="btn primary" style={{ marginTop: 12 }} onClick={() => payFineNow(f.id)}>
                      Плати
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TransportShell>
  );
}
