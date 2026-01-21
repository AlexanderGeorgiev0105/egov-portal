import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { listMyHealthRequests, createAddReferralRequest } from "../../../api/healthRequestsApi";
import { listMyHealthReferrals, downloadMyReferralPdf } from "../../../api/healthReferralsApi";
import { openBlobInNewTab } from "../../../utils/files/filePreview";

import { HEALTH_REQUEST_KINDS, HEALTH_REQUEST_STATUSES, formatDateTimeBG } from "../../../utils/health/healthModel";

import { useUiAlert } from "../../../ui/UiAlertProvider";
import { HealthShell } from "../../../ui/health";

function validatePdfFile(f) {
  if (!f) return "Липсва файл.";
  const isPdf = f.type === "application/pdf" || String(f.name || "").toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Файлът трябва да е .pdf";
  const max = 25 * 1024 * 1024;
  if (f.size > max) return "Файлът е твърде голям (макс 25MB).";
  return "";
}

export default function HealthReferralsPage() {
  const { showAlert } = useUiAlert();

  const [requests, setRequests] = useState([]);
  const [referrals, setReferrals] = useState([]);

  const [title, setTitle] = useState("");
  const [pdf, setPdf] = useState(null);

  const [error, setError] = useState("");

  async function refresh() {
    try {
      const [reqs, refs] = await Promise.all([listMyHealthRequests(), listMyHealthReferrals()]);
      setRequests(Array.isArray(reqs) ? reqs : []);
      setReferrals(Array.isArray(refs) ? refs : []);
    } catch (e) {
      console.error(e);
      setRequests([]);
      setReferrals([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const hasPendingReferral = useMemo(() => {
    return (requests || []).some(
      (r) => r.kind === HEALTH_REQUEST_KINDS.ADD_REFERRAL && r.status === HEALTH_REQUEST_STATUSES.PENDING
    );
  }, [requests]);

  function validate() {
    if (!title.trim()) return "Моля, напиши за какво е направлението.";
    const pe = validatePdfFile(pdf);
    if (pe) return `Файл: ${pe}`;
    if (hasPendingReferral) return "Има чакаща заявка за направление. Изчакай обработка.";
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      await createAddReferralRequest({ title: title.trim() }, pdf);

      await showAlert("Заявката за направление е изпратена към администратор.", { title: "Успешно" });

      setTitle("");
      setPdf(null);
      refresh();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Грешка при изпращане на заявката.");
    }
  }

  async function openPdf(referralId) {
    try {
      const blob = await downloadMyReferralPdf(referralId);
      openBlobInNewTab(blob, "referral.pdf");
    } catch (err) {
      console.error(err);
      await showAlert(err?.message || "Грешка при отваряне на PDF.", { title: "Грешка" });
    }
  }

  return (
    <HealthShell>
      <div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link className="btn" to="/user/health">
            ← Назад
          </Link>
          <h1 style={{ margin: 0 }}>Направления</h1>
        </div>

        <div className="card" style={{ marginTop: 12, textAlign: "left" }}>
          <h3 style={{ marginTop: 0 }}>Списък с добавени електронни направления</h3>

          {referrals.length === 0 ? (
            <div className="hp-muted">Няма добавени направления.</div>
          ) : (
            <table className="table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>За какво е</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDateTimeBG(r.createdAt)}</td>
                    <td>
                      <span style={{ fontWeight: 800 }}>{r.title}</span>
                      <button className="btn" type="button" onClick={() => openPdf(r.id)} style={{ marginLeft: 10 }}>
                        Отвори PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ marginTop: 12, textAlign: "left" }}>
          <h3 style={{ marginTop: 0 }}>Добави направление (заявка)</h3>

          {error && (
            <div className="hp-alert hp-alert--error" style={{ marginBottom: 10 }}>
              <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
            </div>
          )}

          {hasPendingReferral && (
            <div className="hp-alert hp-alert--warn" style={{ marginBottom: 10 }}>
              <strong>Внимание:</strong> Има чакаща заявка за направление.
            </div>
          )}

          <form onSubmit={onSubmit} style={{ maxWidth: 720, display: "grid", gap: 10 }}>
            <label>
              <div style={{ fontSize: 13, marginBottom: 6, opacity: 0.8 }}>За какво е направлението</div>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Напр. Кардиолог, Лаборатория..."
              />
            </label>

            <label>
              <div style={{ fontSize: 13, marginBottom: 6, opacity: 0.8 }}>Прикачи направление (.pdf)</div>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setPdf(e.target.files?.[0] || null)}
              />
            </label>

            {/* ✅ малък бутон */}
            <button
              className="btn btn-primary hp-btnCompact"
              type="submit"
              disabled={hasPendingReferral}
              style={hasPendingReferral ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
            >
              Изпрати заявка
            </button>
          </form>
        </div>
      </div>
    </HealthShell>
  );
}
