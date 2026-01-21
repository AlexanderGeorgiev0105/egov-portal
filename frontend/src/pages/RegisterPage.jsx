import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitRegistrationRequest } from "../auth/mockAuth";

// ✅ Property UI (ако пътят е различен – коригирай само import-а)
import {
  PropertyShell,
  Card,
  HeadRow,
  Btn,
  FieldLabel,
  Input,
  Select,
} from "../ui/property/PropertyUI";

// ✅ UiAlert
import { useUiAlert } from "../ui/UiAlertProvider";

const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25MB

function formatBytes(bytes) {
  const b = Number(bytes || 0);
  if (!b) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = b;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysISO(iso, days) {
  const [y, m, d] = String(iso || "").split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + Number(days || 0));
  const yyyy = dt.getFullYear();
  const mm = pad2(dt.getMonth() + 1);
  const dd = pad2(dt.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function daysInMonth(year, month) {
  const y = Number(year);
  const m = Number(month);
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
}

function collapseSpaces(s) {
  return String(s || "").trim().replace(/\s+/g, " ");
}

function passwordError(pw) {
  const s = String(pw || "");
  if (s.length < 10) return "Паролата трябва да е поне 10 символа.";
  if (!/[A-ZА-Я]/.test(s)) return "Паролата трябва да съдържа поне 1 главна буква.";
  if (!/\d/.test(s)) return "Паролата трябва да съдържа поне 1 цифра.";
  return "";
}

function conflictMessage(ex) {
  const raw = String(ex?.message || "");
  const payload = ex?.payload;

  const blob = [
    raw,
    typeof payload === "string" ? payload : "",
    payload && typeof payload === "object" ? JSON.stringify(payload) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (blob.includes("doc_number_already_exists")) {
    return "Номерът на документа вече съществува. Моля, въведи друг.";
  }
  if (blob.includes("phone_already_exists")) {
    return "Този телефонен номер вече се използва.";
  }
  if (blob.includes("egn_already_exists")) {
    return "Потребител с това ЕГН вече съществува.";
  }
  if (blob.includes("email_already_exists")) {
    return "Този имейл адрес вече се използва.";
  }

  if (blob.includes("doc") && (blob.includes("number") || blob.includes("номер"))) {
    return "Номерът на документа вече съществува. Моля, въведи друг.";
  }
  if (blob.includes("phone") || blob.includes("телефон")) {
    return "Този телефонен номер вече се използва.";
  }
  if (blob.includes("egn") || blob.includes("егн")) {
    return "Потребител с това ЕГН вече съществува.";
  }
  if (blob.includes("email") || blob.includes("имейл")) {
    return "Този имейл адрес вече се използва.";
  }

  return "Вече има потребител с такива данни (ЕГН/Email/Телефон/Номер на документ).";
}

export default function RegisterPage() {
  const nav = useNavigate();
  const { showAlert } = useUiAlert();

  const minValidUntil = useMemo(() => addDaysISO(todayISO(), 1), []); // tomorrow

  // 18+ cutoff
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setFullYear(d.getFullYear() - 18);
    return d;
  }, []);

  const minYear = 1908;
  const maxYear = cutoff.getFullYear();
  const cutoffMonth = cutoff.getMonth() + 1;
  const cutoffDay = cutoff.getDate();

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    egn: "",
    gender: "MALE", // MALE/FEMALE only
    dobDay: "",
    dobMonth: "",
    dobYear: "",
    docNumber: "",
    docValidUntil: "",
    issuedAt: "",
    birthPlace: "",
    address: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    idFrontFile: null,
    idBackFile: null,
  });

  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const [idFrontPreview, setIdFrontPreview] = useState("");
  const [idBackPreview, setIdBackPreview] = useState("");

  function setField(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  useEffect(() => {
    if (form.idFrontFile instanceof File) {
      const url = URL.createObjectURL(form.idFrontFile);
      setIdFrontPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setIdFrontPreview("");
  }, [form.idFrontFile]);

  useEffect(() => {
    if (form.idBackFile instanceof File) {
      const url = URL.createObjectURL(form.idBackFile);
      setIdBackPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setIdBackPreview("");
  }, [form.idBackFile]);

  const maxAllowedMonth = useMemo(() => {
    if (!form.dobYear) return 12;
    return Number(form.dobYear) === maxYear ? cutoffMonth : 12;
  }, [form.dobYear, maxYear, cutoffMonth]);

  const maxAllowedDay = useMemo(() => {
    if (!form.dobYear || !form.dobMonth) return 31;
    const dim = daysInMonth(form.dobYear, form.dobMonth);
    if (Number(form.dobYear) === maxYear && Number(form.dobMonth) === cutoffMonth) {
      return Math.min(dim, cutoffDay);
    }
    return dim;
  }, [form.dobYear, form.dobMonth, maxYear, cutoffMonth, cutoffDay]);

  const dobISO = useMemo(() => {
    if (!form.dobYear || !form.dobMonth || !form.dobDay) return "";
    return `${form.dobYear}-${pad2(form.dobMonth)}-${pad2(form.dobDay)}`;
  }, [form.dobYear, form.dobMonth, form.dobDay]);

  const mismatchPw = useMemo(
    () => form.password && form.confirmPassword && form.password !== form.confirmPassword,
    [form.password, form.confirmPassword]
  );

  function validate() {
    const firstName = collapseSpaces(form.firstName);
    const middleName = collapseSpaces(form.middleName);
    const lastName = collapseSpaces(form.lastName);

    if (!firstName) return "Първо име е задължително.";
    if (!middleName) return "Бащино име е задължително.";
    if (!lastName) return "Фамилия е задължителна.";

    if (!/^\d{10}$/.test(String(form.egn || "").trim())) return "ЕГН трябва да е точно 10 цифри.";
    if (!["MALE", "FEMALE"].includes(form.gender)) return "Невалиден избор на пол.";

    if (!form.dobYear || !form.dobMonth || !form.dobDay)
      return "Датата на раждане е задължителна (ден/месец/година).";

    const y = Number(form.dobYear);
    if (y < minYear || y > maxYear) return "Невалидна година на раждане.";

    const m = Number(form.dobMonth);
    if (m < 1 || m > maxAllowedMonth) return "Избраният месец не е позволен (трябва да си навършил 18 г.).";

    const d = Number(form.dobDay);
    if (d < 1 || d > maxAllowedDay) return "Избраният ден не е позволен (трябва да си навършил 18 г.).";

    if (!/^\d{9}$/.test(String(form.docNumber || "").trim()))
      return "Номерът на документа трябва да е точно 9 цифри.";

    if (!form.docValidUntil) return "Валидност на документа е задължителна.";
    if (form.docValidUntil < minValidUntil)
      return `Документът трябва да е валиден поне до ${minValidUntil} (утре или по-късно).`;

    if (!collapseSpaces(form.issuedAt)) return "Място/орган на издаване е задължително.";
    if (!collapseSpaces(form.birthPlace)) return "Място на раждане е задължително.";
    if (!collapseSpaces(form.address)) return "Адресът е задължителен.";

    if (!/^\d{1,10}$/.test(String(form.phone || "").trim()))
      return "Телефонът трябва да съдържа само цифри и да е до 10 символа.";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(form.email || "").trim()))
      return "Email адресът е невалиден.";

    if (!(form.idFrontFile instanceof File)) return "Снимка на лична карта (предна страна) е задължителна.";
    if (!(form.idBackFile instanceof File)) return "Снимка на лична карта (задна страна) е задължителна.";

    const f1 = form.idFrontFile;
    const f2 = form.idBackFile;

    if (f1.size > MAX_IMAGE_BYTES || f2.size > MAX_IMAGE_BYTES)
      return "Снимките трябва да са максимум 25MB всяка.";

    const t1 = String(f1.type || "").toLowerCase();
    const t2 = String(f2.type || "").toLowerCase();
    if (!t1.startsWith("image/") || !t2.startsWith("image/"))
      return "Позволени са само снимки (image/*) за личната карта.";

    const pwErr = passwordError(form.password);
    if (pwErr) return pwErr;
    if (mismatchPw) return "Паролите не съвпадат.";

    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();

    const v = validate();
    if (v) {
      showAlert(v, { title: "Грешка" });
      return;
    }

    setLoading(true);
    try {
      const fullName = collapseSpaces(`${form.firstName} ${form.middleName} ${form.lastName}`);

      const payload = {
        fullName,
        egn: String(form.egn || "").trim(),
        gender: form.gender,
        dob: dobISO,
        docNumber: String(form.docNumber || "").trim(),
        docValidUntil: form.docValidUntil,
        issuedAt: collapseSpaces(form.issuedAt),
        birthPlace: collapseSpaces(form.birthPlace),
        address: collapseSpaces(form.address),
        phone: String(form.phone || "").trim(),
        email: String(form.email || "").trim(),
        password: form.password,
      };

      const fd = new FormData();
      fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      fd.append("idFront", form.idFrontFile);
      fd.append("idBack", form.idBackFile);

      await submitRegistrationRequest(fd);

      const msg =
        "Регистрацията е изпратена успешно! Профилът ти ще бъде активен след одобрение от администратор.";
      setOk(msg);
      // ✅ МАХАМЕ alert-а при успех (искаше само прозорецът)
      // showAlert(msg, { title: "Съобщение" });
    } catch (ex) {
      let msg = "";
      if (ex?.status === 409) msg = conflictMessage(ex);
      else if (ex?.status === 400) {
        const m = String(ex?.message || "").trim();
        msg = m && m.toLowerCase() !== "bad request" ? m : "Невалидни данни. Провери полетата.";
      } else msg = ex?.message || "Грешка при регистрация.";

      showAlert(msg, { title: "Грешка" });
    } finally {
      setLoading(false);
    }
  }

  const yearOptions = useMemo(() => {
    const arr = [];
    for (let y = maxYear; y >= minYear; y--) arr.push(String(y));
    return arr;
  }, [maxYear]);

  const monthOptions = useMemo(() => {
    const arr = [];
    const maxM = maxAllowedMonth;
    for (let m = 1; m <= maxM; m++) arr.push(String(m));
    return arr;
  }, [maxAllowedMonth]);

  const dayOptions = useMemo(() => {
    const arr = [];
    const maxD = maxAllowedDay;
    for (let d = 1; d <= maxD; d++) arr.push(String(d));
    return arr;
  }, [maxAllowedDay]);

  if (ok) {
    return (
      <PropertyShell>
        {/* ✅ Центриране по средата */}
        <div
          style={{
            minHeight: "calc(100vh - 120px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
          }}
        >
          <div style={{ width: "min(860px, 100%)" }}>
            <Card>
              <div className="pp-cardTitle" style={{ fontSize: 22, marginBottom: 8 }}>
                Регистрация
              </div>
              <div className="pp-alert pp-alert--success" style={{ marginTop: 10 }}>
                {ok}
              </div>

              <div className="pp-muted" style={{ marginTop: 10 }}>
                Можеш да се върнеш към вход и да изчакаш потвърждение от администратор.
              </div>

              <div className="pp-actionsRow" style={{ marginTop: 14 }}>
                <Btn variant="primary" type="button" onClick={() => nav("/login")}>
                  Назад към Login
                </Btn>
              </div>
            </Card>
          </div>
        </div>
      </PropertyShell>
    );
  }

  return (
    <PropertyShell>
      <div style={{ maxWidth: 980, margin: "0 auto", paddingTop: 22 }}>
        <Card>
          <HeadRow style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div className="pp-cardTitle" style={{ fontSize: 22, marginBottom: 2 }}>
                Регистрация
              </div>
              <div className="pp-muted">Попълни данните и качи снимки на лична карта.</div>
            </div>

            <Btn type="button" onClick={() => nav("/login")} disabled={loading}>
              Назад към Login
            </Btn>
          </HeadRow>

          {/* Имена и ЕГН */}
          <div style={{ marginTop: 14 }}>
            <div className="pp-cardTitle" style={{ fontSize: 14, marginBottom: 8 }}>
              Имена и ЕГН
            </div>

            <div className="pp-grid2">
              <div>
                <FieldLabel>Първо име</FieldLabel>
                <Input value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} autoComplete="given-name" />
              </div>

              <div>
                <FieldLabel>Бащино име</FieldLabel>
                <Input value={form.middleName} onChange={(e) => setField("middleName", e.target.value)} autoComplete="additional-name" />
              </div>

              <div>
                <FieldLabel>Фамилия</FieldLabel>
                <Input value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} autoComplete="family-name" />
              </div>

              <div>
                <FieldLabel>ЕГН</FieldLabel>
                <Input
                  value={form.egn}
                  onChange={(e) => setField("egn", String(e.target.value || "").replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric"
                  placeholder="10 цифри"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {/* Пол и дата */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(15,23,42,0.08)" }}>
            <div className="pp-cardTitle" style={{ fontSize: 14, marginBottom: 8 }}>
              Пол и дата на раждане
            </div>

            <div className="pp-grid2">
              <div>
                <FieldLabel>Пол</FieldLabel>
                <Select value={form.gender} onChange={(e) => setField("gender", e.target.value)}>
                  <option value="MALE">Мъж</option>
                  <option value="FEMALE">Жена</option>
                </Select>
              </div>

              <div>
                <FieldLabel>Дата на раждане</FieldLabel>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Select value={form.dobDay} onChange={(e) => setField("dobDay", e.target.value)} style={{ flex: 1, minWidth: 120 }}>
                    <option value="">Ден</option>
                    {dayOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>

                  <Select value={form.dobMonth} onChange={(e) => setField("dobMonth", e.target.value)} style={{ flex: 1, minWidth: 140 }}>
                    <option value="">Месец</option>
                    {monthOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Select>

                  <Select value={form.dobYear} onChange={(e) => setField("dobYear", e.target.value)} style={{ flex: 1, minWidth: 140 }}>
                    <option value="">Година</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="pp-muted" style={{ marginTop: 6, fontSize: 12 }}>
                  (Трябва да си навършил 18 г. — месец/ден се ограничават.)
                </div>
              </div>
            </div>
          </div>

          {/* Парола */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(15,23,42,0.08)" }}>
            <div className="pp-cardTitle" style={{ fontSize: 14, marginBottom: 8 }}>
              Парола
            </div>

            <div className="pp-grid2">
              <div>
                <FieldLabel>Парола</FieldLabel>
                <Input
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  type="password"
                  autoComplete="new-password"
                />
                <div className="pp-muted" style={{ marginTop: 6, fontSize: 12 }}>
                  Поне 10 символа, 1 главна буква и 1 цифра.
                </div>
              </div>

              <div>
                <FieldLabel>Потвърди парола</FieldLabel>
                <Input
                  value={form.confirmPassword}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                  type="password"
                  autoComplete="new-password"
                />
                {mismatchPw && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#dc2626", fontWeight: 800 }}>
                    Паролите не съвпадат.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Контакт */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(15,23,42,0.08)" }}>
            <div className="pp-cardTitle" style={{ fontSize: 14, marginBottom: 8 }}>
              Контакт
            </div>

            <div className="pp-grid2">
              <div>
                <FieldLabel>Телефон</FieldLabel>
                <Input
                  value={form.phone}
                  onChange={(e) => setField("phone", String(e.target.value || "").replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric"
                  placeholder="до 10 цифри"
                  autoComplete="tel"
                />
              </div>

              <div>
                <FieldLabel>Email</FieldLabel>
                <Input
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  type="email"
                  autoComplete="email"
                />
              </div>
            </div>
          </div>

          {/* Лична карта */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(15,23,42,0.08)" }}>
            <div className="pp-cardTitle" style={{ fontSize: 14, marginBottom: 8 }}>
              Лична карта
            </div>

            <div className="pp-grid2">
              <div>
                <FieldLabel>Номер на лична карта</FieldLabel>
                <Input
                  value={form.docNumber}
                  onChange={(e) => setField("docNumber", String(e.target.value || "").replace(/\D/g, "").slice(0, 9))}
                  inputMode="numeric"
                  placeholder="9 цифри"
                  autoComplete="off"
                />
              </div>

              <div>
                <FieldLabel>Валиден до</FieldLabel>
                <Input
                  type="date"
                  value={form.docValidUntil}
                  min={minValidUntil}
                  onChange={(e) => setField("docValidUntil", e.target.value)}
                />
                <div className="pp-muted" style={{ marginTop: 6, fontSize: 12 }}>
                  Минимум: {minValidUntil}
                </div>
              </div>

              {/* МВР- префикс */}
              <div style={{ gridColumn: "1 / -1" }}>
                <FieldLabel>Издаден от</FieldLabel>
                <div
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "1px solid rgba(15,23,42,0.12)",
                    background: "rgba(255,255,255,0.9)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      placeItems: "center",
                      padding: "0 12px",
                      background: "rgba(15,23,42,0.04)",
                      borderRight: "1px solid rgba(15,23,42,0.10)",
                      fontWeight: 900,
                      minWidth: 66,
                      userSelect: "none",
                    }}
                  >
                    МВР-
                  </div>

                  <input
                    value={form.issuedAt}
                    onChange={(e) => setField("issuedAt", e.target.value)}
                    placeholder="София"
                    autoComplete="off"
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      padding: "10px 12px",
                      fontSize: 14,
                      background: "transparent",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Място на раждане</FieldLabel>
                <Input value={form.birthPlace} onChange={(e) => setField("birthPlace", e.target.value)} autoComplete="off" />
              </div>

              <div>
                <FieldLabel>Адрес</FieldLabel>
                <Input value={form.address} onChange={(e) => setField("address", e.target.value)} autoComplete="street-address" />
              </div>
            </div>
          </div>

          {/* Снимки */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(15,23,42,0.08)" }}>
            <div className="pp-cardTitle" style={{ fontSize: 14, marginBottom: 8 }}>
              Снимки на лична карта
            </div>

            <div className="pp-grid2">
              <div className="pp-miniCard">
                <div style={{ fontWeight: 900, marginBottom: 8, fontSize: 13 }}>Предна страна (до 25MB)</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    setField("idFrontFile", f || null);
                  }}
                />
                {form.idFrontFile && (
                  <div className="pp-muted" style={{ marginTop: 6, fontSize: 12 }}>
                    {form.idFrontFile.name} ({formatBytes(form.idFrontFile.size)})
                  </div>
                )}
                {idFrontPreview && (
                  <img
                    src={idFrontPreview}
                    alt="ID card front preview"
                    style={{
                      marginTop: 10,
                      width: "100%",
                      maxHeight: 160,
                      objectFit: "cover",
                      borderRadius: 14,
                      border: "1px solid rgba(15,23,42,0.10)",
                      background: "rgba(15,23,42,0.04)",
                    }}
                  />
                )}
              </div>

              <div className="pp-miniCard">
                <div style={{ fontWeight: 900, marginBottom: 8, fontSize: 13 }}>Задна страна (до 25MB)</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    setField("idBackFile", f || null);
                  }}
                />
                {form.idBackFile && (
                  <div className="pp-muted" style={{ marginTop: 6, fontSize: 12 }}>
                    {form.idBackFile.name} ({formatBytes(form.idBackFile.size)})
                  </div>
                )}
                {idBackPreview && (
                  <img
                    src={idBackPreview}
                    alt="ID card back preview"
                    style={{
                      marginTop: 10,
                      width: "100%",
                      maxHeight: 160,
                      objectFit: "cover",
                      borderRadius: 14,
                      border: "1px solid rgba(15,23,42,0.10)",
                      background: "rgba(15,23,42,0.04)",
                    }}
                  />
                )}
              </div>
            </div>

            <div className="pp-muted" style={{ marginTop: 8, fontSize: 12 }}>
              Снимките са задължителни и трябва да са във формат image/*.
            </div>
          </div>

          <div className="pp-actionsRow" style={{ marginTop: 14 }}>
            <Btn type="button" onClick={() => nav("/login")} disabled={loading}>
              Назад
            </Btn>

            <Btn variant="primary" type="button" onClick={onSubmit} disabled={loading}>
              {loading ? "..." : "Регистрация"}
            </Btn>
          </div>
        </Card>
      </div>
    </PropertyShell>
  );
}
