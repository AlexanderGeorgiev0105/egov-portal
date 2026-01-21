import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getMyHealthProfile } from "../../../api/healthProfileApi";
import { createRemovePersonalDoctorRequest, listMyHealthRequests } from "../../../api/healthRequestsApi";
import { getHealthDoctorByPracticeNumber } from "../../../api/healthDoctorsApi";

import { HEALTH_REQUEST_KINDS, HEALTH_REQUEST_STATUSES, shiftLabel } from "../../../utils/health/healthModel";

import { useUiAlert } from "../../../ui/UiAlertProvider";
import { HealthShell } from "../../../ui/health";

function safeParseMaybeJson(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return null;
  }
}

export default function PersonalDoctorDetailsPage() {
  const navigate = useNavigate();
  const { showAlert } = useUiAlert();

  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);

  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const [p, r] = await Promise.all([getMyHealthProfile(), listMyHealthRequests()]);
      setProfile(p || null);
      setRequests(Array.isArray(r) ? r : []);
    } catch (e) {
      console.error(e);
      setProfile(null);
      setRequests([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const doctorFromProfile = useMemo(() => {
    const snap = safeParseMaybeJson(profile?.personalDoctorSnapshot);
    return snap && typeof snap === "object" ? snap : null;
  }, [profile]);

  const [doctorLive, setDoctorLive] = useState(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setDoctorLive(null);

      const pn = String(profile?.personalDoctorPracticeNumber || "").trim();
      if (!pn) return;

      if (doctorFromProfile?.practiceNumber) return;

      try {
        const d = await getHealthDoctorByPracticeNumber(pn);
        if (!alive) return;
        setDoctorLive(d || null);
      } catch {
        if (!alive) return;
        setDoctorLive(null);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [profile?.personalDoctorPracticeNumber, doctorFromProfile?.practiceNumber]);

  const doctor = doctorFromProfile || doctorLive;
  const hasDoctor = !!doctor?.practiceNumber;

  const hasPendingRemove = useMemo(() => {
    return requests.some(
      (r) => r.kind === HEALTH_REQUEST_KINDS.REMOVE_PERSONAL_DOCTOR && r.status === HEALTH_REQUEST_STATUSES.PENDING
    );
  }, [requests]);

  async function submitRemove() {
    setError("");

    if (!hasDoctor) {
      setError("Нямаш добавен личен лекар.");
      return;
    }
    if (hasPendingRemove) {
      setError("Вече има чакаща заявка за премахване.");
      return;
    }

    try {
      await createRemovePersonalDoctorRequest({ reason: reason.trim() });
      await showAlert("Изпратена е заявка за премахване към администратор.", { title: "Успешно" });

      // ✅ Връща към HealthPage, не към Заявки
      navigate("/user/health");
    } catch (ex) {
      console.error(ex);
      setError(ex?.message || "Грешка при изпращане.");
    }
  }

  if (!hasDoctor) {
    return (
      <HealthShell>
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link className="btn" to="/user/health">
              ← Назад
            </Link>
            <h1 style={{ margin: 0 }}>Личен лекар</h1>
          </div>

          <div className="card" style={{ marginTop: 12, textAlign: "left" }}>
            Нямаш добавен личен лекар.
            <div style={{ marginTop: 10 }}>
              <Link className="btn btn-primary" to="/user/health/add-doctor">
                Добави личен лекар
              </Link>
            </div>
          </div>
        </div>
      </HealthShell>
    );
  }

  return (
    <HealthShell>
      <div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link className="btn" to="/user/health">
            ← Назад
          </Link>
          <h1 style={{ margin: 0 }}>Личен лекар</h1>
        </div>

        {error && (
          <div className="hp-alert hp-alert--error" style={{ marginTop: 12 }}>
            <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
          </div>
        )}

        <div className="card" style={{ marginTop: 12, textAlign: "left" }}>
          <h3 style={{ marginTop: 0 }}>Информация</h3>

          <div style={{ display: "grid", gap: 6 }}>
            <div>
              <strong>Име:</strong> {doctor.firstName} {doctor.lastName}
            </div>
            <div>
              <strong>№ практика:</strong> {doctor.practiceNumber}
            </div>
            <div>
              <strong>Смяна:</strong> {shiftLabel(doctor.shift)}
            </div>
            <div>
              <strong>РЗОК №:</strong> {doctor.rzokNo || "—"}
            </div>
            <div>
              <strong>Здравен Район:</strong> {doctor.healthRegion || "—"}
            </div>
            <div>
              <strong>Моб. номер:</strong> {doctor.mobile || "—"}
            </div>
            <div>
              <strong>Адрес:</strong> {doctor.oblast}, {doctor.city}, {doctor.street}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 12, textAlign: "left" }}>
          <h3 style={{ marginTop: 0 }}>Премахни личния лекар</h3>

          {hasPendingRemove ? (
            <div className="hp-muted">Има чакаща заявка за премахване.</div>
          ) : (
            <>
              <div className="hp-muted" style={{ marginBottom: 10 }}>
                Това ще изпрати заявка към администратор за премахване на личния лекар.
              </div>

              <label style={{ display: "grid", gap: 6, maxWidth: 720 }}>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Причина (по желание)</div>
                <textarea
                  className="input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="Напр. сменям лекаря, преместих се, ..."
                />
              </label>

              <div style={{ marginTop: 10 }}>
                <button className="btn btn-primary" type="button" onClick={submitRemove}>
                  Изпрати заявка за премахване
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </HealthShell>
  );
}
