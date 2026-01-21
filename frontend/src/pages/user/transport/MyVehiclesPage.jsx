import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { listMyTransportVehicles } from "../../../api/transportApi";

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

function formatDateBG(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("bg-BG");
}

export default function MyVehiclesPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const items = await listMyTransportVehicles();
        if (!alive) return;
        setVehicles(Array.isArray(items) ? items : []);
      } catch {
        if (!alive) return;
        setVehicles([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const count = vehicles.length;

  const sorted = useMemo(() => {
    return [...vehicles].sort((a, b) => String(a?.regNumber || "").localeCompare(String(b?.regNumber || "")));
  }, [vehicles]);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Link className="btn" to="/user/vehicles">
          ← Назад
        </Link>
        <h1 style={{ margin: 0 }}>Моите превозни средства</h1>
        <span className="badge">{count} общо</span>
      </div>

      <p style={{ color: "#555" }}>
        Тук се показват <strong>одобрените</strong> от админ превозни средства. Можеш да подадеш заявка за добавяне.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        <Link
          to="/user/vehicles/add"
          className="card"
          style={{ textAlign: "left", textDecoration: "none", color: "inherit" }}
          title="Добави МПС"
        >
          <h3 style={{ marginTop: 0 }}>Добави превозно средство</h3>
          <div style={{ color: "#555" }}>
            Подай заявка с регистрационен номер, данни и PDF талон/свидетелство за регистрация.
          </div>
        </Link>

        {sorted.map((v) => {
          const active = isActiveInspection(v);
          const until = getInspectionValidUntilISO(v);

          return (
            <div
              key={v.id}
              className="card"
              onClick={() => navigate(`/user/vehicles/${v.id}`)}
              style={{
                textAlign: "left",
                cursor: "pointer",
                display: "grid",
                gap: 8,
              }}
              title="Отвори детайли"
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{v.regNumber}</div>
                <span
                  className="badge"
                  style={{
                    background: active ? "#ecfdf5" : "#fff7ed",
                    borderColor: active ? "#a7f3d0" : "#fed7aa",
                  }}
                >
                  {active ? `ГТП валиден до ${formatDateBG(until)}` : "Няма активен ГТП"}
                </span>
              </div>

              <div style={{ color: "#555" }}>
                {v.brand} {v.model} • {v.manufactureYear} • {v.powerKw} kW
              </div>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <div className="card" style={{ marginTop: 12, textAlign: "left", color: "#555" }}>
          Нямаш одобрени МПС-та. Използвай „Добави превозно средство“, за да подадеш заявка.
        </div>
      ) : null}
    </div>
  );
}
