import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { servicesByCategory } from "../../../data/mockData";
import { buildRequest } from "../../../utils/requests/requestModel";
import { addRequest } from "../../../utils/requests/requestsStorage";
import { isValidEGN } from "../../../utils/auth/validators";


function findServiceById(serviceId) {
  for (const key of Object.keys(servicesByCategory)) {
    const service = servicesByCategory[key].find((s) => s.id === serviceId);
    if (service) return service;
  }
  return null;
}

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const service = useMemo(() => findServiceById(id), [id]);

  const [form, setForm] = useState({
    fullName: "",
    egn: "",
    details: "",
  });

  const [error, setError] = useState("");

  function onChange(e) {
    setError("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function onSubmit(e) {
    e.preventDefault();
  
    if (!form.fullName.trim() || !form.egn.trim()) {
      setError("Моля, попълни задължителните полета (Три имена и ЕГН).");
      return;
    }
  
    if (!isValidEGN(form.egn)) {
      setError("ЕГН трябва да е точно 10 цифри.");
      return;
    }

    const request = buildRequest({
      service,
      fullName: form.fullName,
      egn: form.egn,
      details: form.details,
    });

    addRequest(request);

    alert("Заявката е подадена успешно (demo).");

    setForm({ fullName: "", egn: "", details: "" });
  }

  if (!service) return <h1>Service not found</h1>;

  return (
    <div>
      <h1>Service Details</h1>
      <h2 style={{ marginTop: 0 }}>{service.title}</h2>
      <p style={{ color: "#555" }}>{service.description}</p>

      <h3>Подай заявка (demo)</h3>

      {error && (
        <div
          className="card"
          style={{ borderColor: "#fecaca", background: "#fff1f2", marginBottom: 10 }}
        >
          <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        style={{ maxWidth: 520, display: "grid", gap: 10 }}
      >
        <input
          className="input"
          name="fullName"
          placeholder="Три имена"
          value={form.fullName}
          onChange={onChange}
        />

        <input
          className="input"
          name="egn"
          placeholder="ЕГН"
          value={form.egn}
          onChange={onChange}
        />

        <textarea
          className="textarea"
          name="details"
          placeholder="Допълнителни данни"
          rows={4}
          value={form.details}
          onChange={onChange}
        />

        <button className="btn btn-primary" type="submit">
          Изпрати
        </button>
      </form>
    </div>
  );
}
