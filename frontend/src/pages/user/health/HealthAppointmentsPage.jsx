import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getMyHealthProfile } from "../../../api/healthProfileApi";
import {
  listBusySlots,
  listMyHealthAppointments,
  bookHealthAppointment,
  cancelHealthAppointment,
} from "../../../api/healthAppointmentsApi";

import { buildTimeSlotsForShift, formatDateBG } from "../../../utils/health/healthModel";

import { useUiAlert } from "../../../ui/UiAlertProvider";
import { HealthShell } from "../../../ui/health";

function toISODate(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function safeParseMaybeJson(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return null;
  }
}

export default function HealthAppointmentsPage() {
  const { showAlert } = useUiAlert();

  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [busyTimes, setBusyTimes] = useState([]);

  const [myAppointments, setMyAppointments] = useState([]);
  const [profile, setProfile] = useState(null);

  const doctor = useMemo(() => {
    const snap = safeParseMaybeJson(profile?.personalDoctorSnapshot);
    return snap && typeof snap === "object" ? snap : null;
  }, [profile]);

  const hasDoctor = !!doctor?.practiceNumber;

  const slots = useMemo(() => {
    if (!hasDoctor) return [];
    return buildTimeSlotsForShift(doctor.shift);
  }, [hasDoctor, doctor?.shift]);

  async function refresh() {
    try {
      const p = await getMyHealthProfile();
      setProfile(p || null);
    } catch (e) {
      console.error(e);
      setProfile(null);
    }

    if (!hasDoctor) {
      setBusyTimes([]);
      setMyAppointments([]);
      return;
    }

    try {
      const [busy, mine] = await Promise.all([listBusySlots(doctor.practiceNumber, selectedDate), listMyHealthAppointments()]);
      setBusyTimes(Array.isArray(busy) ? busy : []);
      setMyAppointments(Array.isArray(mine) ? mine : []);
    } catch (e) {
      console.error(e);
      setBusyTimes([]);
      setMyAppointments([]);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // When profile arrives and doctor becomes available, refresh busy/appointments
  useEffect(() => {
    if (hasDoctor) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctor?.practiceNumber]);

  function isFree(time) {
    return !busyTimes.includes(time);
  }

  async function book(time) {
    if (!hasDoctor) return;
    if (!isFree(time)) return;

    try {
      await bookHealthAppointment({
        doctorPracticeNumber: doctor.practiceNumber,
        doctorName: `${doctor.firstName} ${doctor.lastName}`.trim(),
        date: selectedDate,
        time,
      });
      refresh();
    } catch (ex) {
      await showAlert(ex?.message || "Грешка при запис на час.", { title: "Грешка" });
    }
  }

  async function remove(id) {
    try {
      await cancelHealthAppointment(id);
      refresh();
    } catch (ex) {
      await showAlert(ex?.message || "Грешка при премахване.", { title: "Грешка" });
    }
  }

  const myForDoctor = useMemo(() => {
    if (!hasDoctor) return [];
    return myAppointments
      .filter((a) => a.doctorPracticeNumber === doctor.practiceNumber)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [myAppointments, hasDoctor, doctor?.practiceNumber]);

  if (!hasDoctor) {
    return (
      <HealthShell>
        <div>
          <h1>Записани часове</h1>
          <p className="hp-muted">Нямаш добавен личен лекар. Добави първо личен лекар, за да записваш часове.</p>
          <Link className="btn btn-primary" to="/user/health/add-doctor">
            Добави личен лекар
          </Link>
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
          <h1 style={{ margin: 0 }}>Записани часове</h1>
        </div>

        <div className="card" style={{ marginTop: 12, textAlign: "left" }}>
          <h3 style={{ marginTop: 0 }}>Личен лекар</h3>
          <div style={{ fontWeight: 900 }}>
            {doctor.firstName} {doctor.lastName}
          </div>
          <div style={{ marginTop: 6 }} className="hp-muted">
            № практика: <strong>{doctor.practiceNumber}</strong>
          </div>
        </div>

        <div className="card" style={{ marginTop: 12, textAlign: "left" }}>
          <h3 style={{ marginTop: 0 }}>Запиши час</h3>

          <label style={{ display: "grid", gap: 6, maxWidth: 320 }}>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Избери ден</div>
            <input className="input" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </label>

          <div style={{ marginTop: 10, fontSize: 13 }} className="hp-muted">
            Свободни часове за {formatDateBG(selectedDate)}:
          </div>

          {slots.length === 0 ? (
            <div style={{ marginTop: 8 }} className="hp-muted">
              Няма налични слотове.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 10,
                marginTop: 10,
                maxWidth: 720,
              }}
            >
              {slots.map((t) => {
                const free = isFree(t);
                return (
                  <button
                    key={t}
                    className={free ? "btn btn-primary" : "btn"}
                    type="button"
                    disabled={!free}
                    onClick={() => book(t)}
                    style={!free ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                    title={!free ? "Заето" : "Запази час"}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ marginTop: 12, textAlign: "left" }}>
          <h3 style={{ marginTop: 0 }}>Моите запазени часове</h3>

          {myForDoctor.length === 0 ? (
            <div className="hp-muted">Нямаш запазени часове.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {myForDoctor.map((a) => (
                <div
                  key={a.id}
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900 }}>{a.doctorName}</div>
                    <div className="hp-muted" style={{ marginTop: 4 }}>
                      {formatDateBG(a.date)} — <strong>{a.time}</strong>
                    </div>
                  </div>

                  <button className="btn" onClick={() => remove(a.id)} type="button">
                    Премахни
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </HealthShell>
  );
}
