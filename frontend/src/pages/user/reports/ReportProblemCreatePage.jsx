import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { createProblemReport } from "../../../api/reportsApi";
import {
  normalizeCategoryFromRouteParam,
  categoryLabel,
} from "../../../utils/reports/problemReportsModel";

import { useUiAlert } from "../../../ui/UiAlertProvider";
import { ReportsShell } from "../../../ui/reports";

export default function ReportProblemCreatePage() {
  const { showAlert } = useUiAlert();

  const navigate = useNavigate();
  const params = useParams();
  const category = useMemo(
    () => normalizeCategoryFromRouteParam(params.category),
    [params.category]
  );

  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!category) {
      const msg = "Невалиден тип проблем.";
      setError(msg);
      showAlert(msg, { title: "Грешка" });
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      const msg = "Моля, опиши проблема с поне 10 символа.";
      setError(msg);
      showAlert(msg, { title: "Важно" });
      return;
    }

    setSubmitting(true);
    try {
      await createProblemReport({
        category,
        description: description.trim(),
      });
      navigate("/user/reports");
    } catch (e2) {
      const msg = e2?.message || "Грешка при подаване на сигнал.";
      setError(msg);
      showAlert(msg, { title: "Грешка" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ReportsShell>
      <div style={{ textAlign: "left" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ marginBottom: 6 }}>Нов сигнал</h1>
            <div style={{ color: "#6b7280" }}>
              Тип: <b>{category ? categoryLabel(category) : "—"}</b>
            </div>
          </div>

          <Link className="btn" to="/user/reports">
            ← Назад
          </Link>
        </div>

        <form onSubmit={onSubmit} style={{ marginTop: 12, maxWidth: 900 }}>
          <div className="card">
            <label style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Описание на проблема</div>
              <textarea
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={10}
                placeholder="Опиши къде се намира проблемът, какво точно се случва, от кога е и т.н."
                style={{ resize: "vertical" }}
                disabled={submitting}
              />
            </label>

            {error && (
              <div style={{ color: "#b91c1c", marginTop: 10, fontSize: 13 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <Link className="btn" to="/user/reports">
                Откажи
              </Link>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Изпращане..." : "Подай сигнал"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ReportsShell>
  );
}
