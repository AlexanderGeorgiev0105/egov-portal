// src/utils/healthAppointmentsStorage.js

const KEY = "demo_health_appointments_v1";

export function loadHealthAppointments() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveHealthAppointments(list) {
  localStorage.setItem(KEY, JSON.stringify(Array.isArray(list) ? list : []));
}

export function loadHealthAppointmentsByUser(userId) {
  return loadHealthAppointments().filter((a) => a.userId === userId);
}

export function loadHealthAppointmentsByDoctorAndDate(doctorPracticeNumber, date /* yyyy-mm-dd */) {
  const pn = String(doctorPracticeNumber || "");
  const d = String(date || "");
  return loadHealthAppointments().filter((a) => a.doctorPracticeNumber === pn && a.date === d);
}

function assertRequired(appt) {
  if (!appt) throw new Error("Невалиден запис.");
  if (!appt.userId) throw new Error("Липсва userId.");
  if (!appt.doctorPracticeNumber) throw new Error("Липсва № практика на лекаря.");
  if (!appt.date) throw new Error("Липсва дата.");
  if (!appt.time) throw new Error("Липсва час.");
}

export function addHealthAppointment(appt) {
  assertRequired(appt);

  const current = loadHealthAppointments();

  // Prevent double booking for the doctor on same date+time
  const exists = current.some(
    (a) =>
      a.doctorPracticeNumber === String(appt.doctorPracticeNumber) &&
      a.date === String(appt.date) &&
      a.time === String(appt.time)
  );
  if (exists) throw new Error("Този час вече е зает.");

  // Optional: prevent the same user from booking same date+time (even if doctor differs)
  const userClash = current.some(
    (a) => a.userId === appt.userId && a.date === String(appt.date) && a.time === String(appt.time)
  );
  if (userClash) throw new Error("Вече имаш запазен час за този ден и час.");

  const updated = [...current, appt];
  saveHealthAppointments(updated);
  return updated;
}

export function removeHealthAppointment(id) {
  const current = loadHealthAppointments();
  const updated = current.filter((a) => a.id !== id);
  saveHealthAppointments(updated);
  return updated;
}

export function clearAllHealthAppointments() {
  localStorage.removeItem(KEY);
}
