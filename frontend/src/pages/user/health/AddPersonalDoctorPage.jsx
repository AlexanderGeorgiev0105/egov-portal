import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getHealthDoctorByPracticeNumber } from "../../../api/healthDoctorsApi";
import { getMyHealthProfile } from "../../../api/healthProfileApi";
import { createAddPersonalDoctorRequest, listMyHealthRequests } from "../../../api/healthRequestsApi";

import { HEALTH_REQUEST_KINDS, HEALTH_REQUEST_STATUSES, shiftLabel } from "../../../utils/health/healthModel";

import { useUiAlert } from "../../../ui/UiAlertProvider";
import { HealthShell } from "../../../ui/health";

function onlyDigits(v) {
  return (v || "").replace(/\D+/g, "");
}

function validateImageFile(f) {
  if (!f) return "Липсва файл.";
  if (!(f.type === "image/png" || f.type === "image/jpeg")) return "Файлът трябва да е png или jpg.";
  const max = 25 * 1024 * 1024;
  if (f.size > max) return "Файлът е твърде голям (макс 25MB).";
  return "";
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

export default function AddPersonalDoctorPage() {
  const navigate = useNavigate();
  const { showAlert } = useUiAlert();

  const [practiceNumber, setPracticeNumber] = useState("");
  const [doctor, setDoctor] = useState(null);

  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const [myRequests, setMyRequests] = useState([]);
  const [profile, setProfile] = useState(null);

  async function refresh() {
    try {
      const [p, r] = await Promise.all([getMyHealthProfile(), listMyHealthRequests()]);
      setProfile(p || null);
      setMyRequests(Array.isArray(r) ? r : []);
    } catch (e) {
      console.error(e);
      setProfile(null);
      setMyRequests([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const personalDoctor = useMemo(() => {
    const snap = safeParseMaybeJson(profile?.personalDoctorSnapshot);
    return snap && typeof snap === "object" ? snap : null;
  }, [profile]);

  const hasPersonalDoctor = !!personalDoctor?.practiceNumber;

  const hasPendingAddDoctor = useMemo(() => {
    return myRequests.some(
      (r) => r.kind === HEALTH_REQUEST_KINDS.ADD_PERSONAL_DOCTOR && r.status === HEALTH_REQUEST_STATUSES.PENDING
    );
  }, [myRequests]);

  useEffect(() => {
    let alive = true;

    setError("");
    setDoctor(null);

    async function load() {
      if (practiceNumber.length !== 10) return;

      try {
        const found = await getHealthDoctorByPracticeNumber(practiceNumber);
        if (!alive) return;
        setDoctor(found || null);
      } catch (e) {
        if (!alive) return;
        setDoctor(null);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [practiceNumber]);

  function validate() {
    if (hasPersonalDoctor) return "Вече имаш добавен личен лекар.";
    if (hasPendingAddDoctor) return "Вече има чакаща заявка за личен лекар.";
    if (practiceNumber.length !== 10) return "Номерът на практиката трябва да е точно 10 цифри.";
    if (!doctor) return "Не е намерен личен лекар с този номер на практика.";
    const fe = validateImageFile(file);
    if (fe) return `Снимка от здравната книжка: ${fe}`;
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
      await createAddPersonalDoctorRequest({ practiceNumber }, file);

      await showAlert("Заявката е изпратена към администратор.", { title: "Успешно" });
      navigate("/user/health");
    } catch (ex) {
      console.error(ex);
      setError(ex?.message || "Грешка при изпращане на заявката.");
    }
  }

  return (
    <HealthShell>
      <div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Link className="btn" to="/user/health">
            ← Назад
          </Link>
          <h1 style={{ margin: 0 }}>Добави личен лекар</h1>
        </div>

        <p className="hp-muted">
          Въведи <strong>10-цифрения номер на практиката</strong>. Данните се зареждат от системата и не могат да се
          променят.
        </p>

        {error && (
          <div className="hp-alert hp-alert--error" style={{ marginBottom: 10 }}>
            <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
          </div>
        )}

        {(hasPersonalDoctor || hasPendingAddDoctor) && (
          <div className="hp-alert hp-alert--warn" style={{ marginBottom: 10 }}>
            <strong>Внимание:</strong>{" "}
            {hasPersonalDoctor ? "Вече имаш добавен личен лекар." : "Има чакаща заявка за добавяне на личен лекар."}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ maxWidth: 720, display: "grid", gap: 10 }}>
          <label>
            <div style={{ fontSize: 13, marginBottom: 6, opacity: 0.8 }}>Номер на практика (10 цифри)</div>
            <input
              className="input"
              value={practiceNumber}
              onChange={(e) => setPracticeNumber(onlyDigits(e.target.value).slice(0, 10))}
              inputMode="numeric"
              placeholder="1234567890"
              maxLength={10}
            />
          </label>

          <div className="card" style={{ textAlign: "left" }}>
            <h3 style={{ marginTop: 0 }}>Информация за личния лекар</h3>

            {!doctor ? (
              <div className="hp-muted">
                {practiceNumber.length === 10
                  ? "Няма намерен лекар с този номер."
                  : "Въведи 10 цифри, за да се зареди лекарят."}
              </div>
            ) : (
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
            )}
          </div>

          <label>
            <div style={{ fontSize: 13, marginBottom: 6, opacity: 0.8 }}>Снимка от здравната книжка</div>
            <input type="file" accept="image/png,image/jpeg" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>

          {/* ✅ малък бутон */}
          <button
            className="btn btn-primary hp-btnCompact"
            type="submit"
            disabled={hasPersonalDoctor || hasPendingAddDoctor}
            style={hasPersonalDoctor || hasPendingAddDoctor ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
          >
            Изпрати заявка
          </button>
        </form>
      </div>
    </HealthShell>
  );
}
