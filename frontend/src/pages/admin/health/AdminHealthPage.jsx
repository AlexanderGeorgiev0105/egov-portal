import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  listAdminHealthDoctors,
  createAdminHealthDoctor,
  deleteAdminHealthDoctor,
} from "../../../api/adminHealthDoctorsApi";
import { SHIFT_OPTIONS, shiftLabel } from "../../../utils/health/healthModel";

// ✅ Property UI (пътя при теб може да е различен – коригирай само import-а)
import {
  PropertyShell,
  PropertyHead,
  Card,
  HeadRow,
  Btn,
  FieldLabel,
  Input,
  Select,
} from "../../../ui/property/PropertyUI";

// ✅ UiAlert
import { useUiAlert } from "../../../ui/UiAlertProvider";

function onlyDigits(v) {
  return (v || "").replace(/\D+/g, "");
}

export default function AdminHealthPage() {
  const navigate = useNavigate();
  const { showAlert } = useUiAlert();

  const [doctors, setDoctors] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    practiceNumber: "",
    rzokNo: "",
    healthRegion: "",
    shift: "1",
    mobile: "",
    oblast: "",
    city: "",
    street: "",
  });

  async function refresh() {
    try {
      const list = await listAdminHealthDoctors();
      setDoctors(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setDoctors([]);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  // ESC closes modal
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setModalOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function setField(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  function resetForm() {
    setForm({
      firstName: "",
      lastName: "",
      practiceNumber: "",
      rzokNo: "",
      healthRegion: "",
      shift: "1",
      mobile: "",
      oblast: "",
      city: "",
      street: "",
    });
  }

  function validate() {
    const errors = [];

    if (!form.firstName.trim()) errors.push("Име е задължително.");
    if (!form.lastName.trim()) errors.push("Фамилия е задължително.");

    const practiceDigits = onlyDigits(form.practiceNumber);
    if (practiceDigits.length !== 10) errors.push("Номер на практиката трябва да е 10 цифри.");

    const rzokDigits = onlyDigits(form.rzokNo);
    if (!rzokDigits) errors.push("РЗОК № е задължително (цифри).");

    const regionDigits = onlyDigits(form.healthRegion);
    if (!regionDigits) errors.push("Здравен Район е задължително (цифри).");

    if (!SHIFT_OPTIONS.includes(String(form.shift))) errors.push("Смяна трябва да е 1 или 2.");
    if (!form.mobile.trim()) errors.push("Мобилен номер е задължителен.");
    if (!form.oblast.trim()) errors.push("Област е задължителна.");
    if (!form.city.trim()) errors.push("Град е задължителна.");
    if (!form.street.trim()) errors.push("Улица е задължителна.");

    if (errors.length) {
      showAlert(errors.join("\n"), { title: "Грешка" });
      return false;
    }
    return true;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const practiceNumber = onlyDigits(form.practiceNumber);

    // client-side duplicate check
    const exists = doctors.some((d) => String(d.practiceNumber) === practiceNumber);
    if (exists) {
      showAlert("Вече има личен лекар с този номер на практика.", { title: "Съобщение" });
      return;
    }

    try {
      await createAdminHealthDoctor({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        practiceNumber,
        rzokNo: onlyDigits(form.rzokNo),
        healthRegion: onlyDigits(form.healthRegion),
        shift: String(form.shift),
        mobile: form.mobile.trim(),
        oblast: form.oblast.trim(),
        city: form.city.trim(),
        street: form.street.trim(),
      });

      resetForm();
      setModalOpen(false);
      showAlert("Личният лекар е добавен.", { title: "Съобщение" });
      refresh();
    } catch (err) {
      console.error(err);
      showAlert(err?.message || "Грешка при запис.", { title: "Грешка" });
    }
  }

  async function onRemove(id) {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Сигурен ли си, че искаш да премахнеш този лекар от системата?")) return;

    try {
      await deleteAdminHealthDoctor(id);
      refresh();
    } catch (err) {
      console.error(err);
      showAlert(err?.message || "Грешка при изтриване.", { title: "Грешка" });
    }
  }

  return (
    <PropertyShell>
      <HeadRow style={{ justifyContent: "space-between" }}>
        <PropertyHead title="Здраве" subtitle="Лични лекари + обработка на заявки." />
      </HeadRow>

      <Card style={{ marginTop: 12, textAlign: "left" }}>
        {/* ✅ Заявки е най-вдясно; Добави е след "Лични лекари" */}
        <HeadRow style={{ alignItems: "center" }}>
          <div className="pp-cardTitle" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span>Лични лекари</span>

            <Btn variant="primary" type="button" onClick={() => setModalOpen(true)}>
            Добави личен лекар
            </Btn>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <Btn variant="primary" type="button" onClick={() => navigate("/admin/health-requests")}>
            Заявки →
            </Btn>
          </div>
        </HeadRow>

        {doctors.length === 0 ? (
          <p className="pp-muted" style={{ marginBottom: 0, marginTop: 10 }}>
            Няма добавени лични лекари.
          </p>
        ) : (
          <table className="pp-table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Номер на практиката</th>
                <th>Име</th>
                <th>Смяна</th>
                <th>Моб.</th>
                <th>Адрес</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id}>
                  <td>{d.practiceNumber || "—"}</td>
                  <td>
                    {d.firstName} {d.lastName}
                  </td>
                  <td>{shiftLabel(d.shift)}</td>
                  <td>{d.mobile || "—"}</td>
                  <td>
                    {d.oblast || "—"}, {d.city || "—"}, {d.street || "—"}
                  </td>
                  <td>
                    <Btn onClick={() => onRemove(d.id)} type="button">
                      Премахни
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          * Номерът на практиката е ключът, по който потребителят търси личния лекар.
        </div>
      </Card>

      {/* Modal (size preserved: width min(760px, 96vw)) */}
      {modalOpen && (
        <div
          className="pp-overlay"
          onClick={() => {
            setModalOpen(false);
            resetForm();
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="pp-modal"
            style={{
              width: "min(760px, 96vw)",
              maxHeight: "92vh",
              overflow: "hidden",
              padding: 0,
              borderRadius: 26,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pp-card"
              style={{
                padding: 0,
                height: "100%",
                overflow: "hidden",
                borderRadius: 26,
              }}
            >
              <div
                className="pp-modalHead"
                style={{
                  borderTopLeftRadius: 26,
                  borderTopRightRadius: 26,
                }}
              >
                <div style={{ fontWeight: 950, letterSpacing: 0.2 }}>Добави личен лекар</div>

                <button
                  className="pp-btn"
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  title="Затвори"
                  style={{ padding: "8px 10px", borderRadius: 14 }}
                >
                  ✕
                </button>
              </div>

              <div className="pp-modalBody" style={{ overflow: "auto", maxHeight: "calc(92vh - 58px)" }}>
                <form onSubmit={onSubmit} className="pp-form" style={{ gap: 12 }}>
                  <div className="pp-grid2">
                    <div>
                      <FieldLabel>Име</FieldLabel>
                      <Input
                        value={form.firstName}
                        onChange={(e) => setField("firstName", e.target.value)}
                        placeholder="Име"
                      />
                    </div>

                    <div>
                      <FieldLabel>Фамилия</FieldLabel>
                      <Input
                        value={form.lastName}
                        onChange={(e) => setField("lastName", e.target.value)}
                        placeholder="Фамилия"
                      />
                    </div>
                  </div>

                  <div className="pp-grid2">
                    <div>
                      <FieldLabel>Номер на практиката (10 цифри)</FieldLabel>
                      <Input
                        value={form.practiceNumber}
                        onChange={(e) => setField("practiceNumber", onlyDigits(e.target.value).slice(0, 10))}
                        placeholder="1234567890"
                        inputMode="numeric"
                        maxLength={10}
                      />
                    </div>

                    <div>
                      <FieldLabel>Смяна</FieldLabel>
                      <Select value={form.shift} onChange={(e) => setField("shift", e.target.value)}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </Select>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 12,
                    }}
                  >
                    <div>
                      <FieldLabel>РЗОК № (цифри)</FieldLabel>
                      <Input
                        value={form.rzokNo}
                        onChange={(e) => setField("rzokNo", onlyDigits(e.target.value))}
                        placeholder="РЗОК №"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <FieldLabel>Здравен Район (цифри)</FieldLabel>
                      <Input
                        value={form.healthRegion}
                        onChange={(e) => setField("healthRegion", onlyDigits(e.target.value))}
                        placeholder="Здравен Район"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <FieldLabel>Моб. номер</FieldLabel>
                      <Input value={form.mobile} onChange={(e) => setField("mobile", e.target.value)} placeholder="08..." />
                    </div>
                  </div>

                  <div className="pp-grid2">
                    <div>
                      <FieldLabel>Област</FieldLabel>
                      <Input value={form.oblast} onChange={(e) => setField("oblast", e.target.value)} placeholder="Област" />
                    </div>
                    <div>
                      <FieldLabel>Град</FieldLabel>
                      <Input value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="гр. ..." />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Улица</FieldLabel>
                    <Input value={form.street} onChange={(e) => setField("street", e.target.value)} placeholder="ул. ..." />
                  </div>

                  <div className="pp-actionsRow" style={{ marginTop: 4 }}>
                    <Btn variant="primary" type="submit">
                      Добави
                    </Btn>
                    <Btn
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        resetForm();
                      }}
                    >
                      Откажи
                    </Btn>
                  </div>

                  <div className="pp-muted" style={{ fontSize: 12 }}>
                    * Затваря се с ESC или клик извън прозореца.
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </PropertyShell>
  );
}
