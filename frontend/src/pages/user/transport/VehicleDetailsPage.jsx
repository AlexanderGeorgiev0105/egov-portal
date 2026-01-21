import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  downloadVehicleInspectionDoc,
  downloadVehicleRegistrationDoc,
  getMyTransportVehicle,
  payVehicleTax,
} from "../../../api/transportApi";

import {
  calculateAnnualVehicleTax,
  calculateTaxLateInterest,
  getVehicleTaxDueDateISO,
  round2,
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

function getInspectionValidUntilISO(vehicle) {
  return (
    vehicle?.techInspection?.validUntilISO ||
    vehicle?.techInspection?.validUntil ||
    vehicle?.techInspectionValidUntil ||
    vehicle?.inspectionValidUntil ||
    ""
  );
}

function isActiveInspection(vehicle) {
  const until = getInspectionValidUntilISO(vehicle);
  if (!until) return false;
  const d = new Date(`${until}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  return new Date().getTime() <= d.getTime();
}

function computeRecommendedTaxYear(vehicle) {
  const now = new Date();
  const y = now.getFullYear();
  const dueThisYear = new Date(`${y}-12-01T00:00:00`);

  if (now.getTime() < dueThisYear.getTime()) {
    const prev = y - 1;
    const paidPrev = Boolean(vehicle?.taxPayments && vehicle.taxPayments[String(prev)]?.paidAt);
    return paidPrev ? y : prev;
  }

  return y;
}

export default function VehicleDetailsPage() {
  const { vehicleId } = useParams();

  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const didInitTaxYearRef = useRef(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      setError("");
      try {
        const v = await getMyTransportVehicle(vehicleId);
        if (!alive) return;
        setVehicle(v || null);

        if (!didInitTaxYearRef.current) {
          didInitTaxYearRef.current = true;
          setTaxYear(computeRecommendedTaxYear(v));
        }

        if (!v) setError("МПС-то не е намерено.");
      } catch (e) {
        if (!alive) return;
        setVehicle(null);
        setError(e?.message || "Грешка при зареждане на МПС.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [vehicleId]);

  const taxDueISO = useMemo(() => getVehicleTaxDueDateISO(taxYear), [taxYear]);

  const tax = useMemo(() => {
    if (!vehicle) return null;
    return calculateAnnualVehicleTax(
      {
        powerKw: vehicle.powerKw,
        manufactureYear: vehicle.manufactureYear,
        euroCategory: vehicle.euroCategory,
      },
      new Date()
    );
  }, [vehicle]);

  const payment = useMemo(() => {
    if (!vehicle) return null;
    const map = vehicle.taxPayments || {};
    return map[String(taxYear)] || null;
  }, [vehicle, taxYear]);

  const interest = useMemo(() => {
    if (!tax) return null;
    const asOf = payment?.paidAt ? new Date(payment.paidAt) : new Date();
    return calculateTaxLateInterest(tax.amount, taxDueISO, asOf);
  }, [tax, taxDueISO, payment?.paidAt]);

  function openBlob(blob) {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function openRegistrationPdf() {
    try {
      const blob = await downloadVehicleRegistrationDoc(vehicleId);
      openBlob(blob);
    } catch {
      // ignore
    }
  }

  async function openInspectionPdf() {
    try {
      const blob = await downloadVehicleInspectionDoc(vehicleId);
      openBlob(blob);
    } catch {
      // ignore
    }
  }

  async function payTaxNow() {
    if (!vehicle || !tax) return;
    if (payment?.paidAt) return;

    setPaying(true);
    setError("");
    try {
      await payVehicleTax(vehicle.id, taxYear);
      const refreshed = await getMyTransportVehicle(vehicle.id);
      setVehicle(refreshed || vehicle);
    } catch (e) {
      setError(e?.message || "Грешка при плащане.");
    } finally {
      setPaying(false);
    }
  }

  if (error) {
    return (
      <TransportShell>
        <div>
          <Link className="btn" to="/user/vehicles/my">
            ← Назад
          </Link>
          <div className="tp-alert tp-alert--error" style={{ marginTop: 12, textAlign: "left" }}>
            <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
          </div>
        </div>
      </TransportShell>
    );
  }

  if (!vehicle) return null;

  const activeGtp = isActiveInspection(vehicle);
  const inspectionUntilISO = getInspectionValidUntilISO(vehicle);

  return (
    <TransportShell>
      <div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link className="btn" to="/user/vehicles/my">
            ← Назад
          </Link>
          <h1 style={{ margin: 0 }}>{vehicle.regNumber}</h1>
        </div>

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
            <h3 style={{ marginTop: 0 }}>Информация за МПС</h3>

            <div style={{ display: "grid", gap: 6 }}>
              <div>
                <strong>Марка/модел:</strong> {vehicle.brand} {vehicle.model}
              </div>
              <div>
                <strong>Година:</strong> {vehicle.manufactureYear}
              </div>
              <div>
                <strong>Мощност:</strong> {vehicle.powerKw} kW
              </div>
              <div>
                <strong>Евро категория:</strong> {vehicle.euroCategory}
              </div>

              <div style={{ marginTop: 6 }}>
                <strong>Технически преглед:</strong>{" "}
                {activeGtp ? (
                  <span style={{ color: "#065f46", fontWeight: 800 }}>
                    валиден до {formatDateBG(inspectionUntilISO)}
                  </span>
                ) : (
                  <span style={{ color: "#9a3412", fontWeight: 800 }}>няма активен</span>
                )}
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" type="button" onClick={openRegistrationPdf}>
                Отвори талон (PDF)
              </button>

              <button className="btn" type="button" onClick={openInspectionPdf}>
                Отвори ГТП документ (PDF)
              </button>
            </div>
          </div>

          <div className="card" style={{ textAlign: "left" }}>
            <h3 style={{ marginTop: 0 }}>Годишен данък</h3>

            {!tax ? (
              <div className="tp-muted">Няма данни за изчисление.</div>
            ) : (
              <>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{formatMoneyBGN(tax.amount)}</div>
                <div style={{ marginTop: 6 }} className="tp-muted">
                  Падеж: <strong>{formatDateBG(taxDueISO)}</strong> (плаща се 1 път годишно)
                </div>

                <div className="card" style={{ marginTop: 10, padding: 10, borderRadius: 18 }}>
                  <div style={{ fontWeight: 800 }}>Лихва при закъснение</div>
                  <div style={{ marginTop: 6, fontSize: 13 }} className="tp-muted">
                    След 1 месец гратис се начислява <strong>0.1% на ден</strong>.
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div>
                      <strong>Гратис до:</strong> {formatDateBG(interest?.graceUntilISO)}
                    </div>
                    <div>
                      <strong>Просрочени дни:</strong> {interest?.overdueDays ?? 0}
                    </div>
                    <div>
                      <strong>Лихва:</strong> {formatMoneyBGN(interest?.interest ?? 0)}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <strong>Общо:</strong> {formatMoneyBGN(interest?.total ?? round2(tax.amount))}
                    </div>
                  </div>
                </div>

                {payment?.paidAt ? (
                  <div className="card" style={{ marginTop: 12, borderColor: "#a7f3d0", background: "#ecfdf5" }}>
                    <strong style={{ color: "#065f46" }}>Платено</strong>
                    <div style={{ marginTop: 6, color: "#065f46" }}>
                      Дата: {new Date(payment.paidAt).toLocaleString("bg-BG")}
                    </div>
                  </div>
                ) : (
                  <button className="btn primary" onClick={payTaxNow} style={{ marginTop: 12 }} disabled={paying}>
                    {paying ? "Плащане..." : "Плати"}
                  </button>
                )}

                <div style={{ marginTop: 10, fontSize: 12 }} className="tp-muted">
                  {tax.note}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </TransportShell>
  );
}
