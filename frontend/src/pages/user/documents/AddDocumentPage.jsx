import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  listMyDocuments,
  listMyDocumentRequests,
  createAddDocumentRequest,
} from "../../../api/documentsApi";

import {
  DOCUMENT_TYPES,
  DOCUMENT_REQUEST_KINDS,
  DOCUMENT_REQUEST_STATUSES,
  DRIVER_CATEGORIES,
  documentTypeLabel,
} from "../../../utils/documents/documentsModel";

import { DocumentsShell } from "../../../ui/documents";
import { useUiAlert } from "../../../ui/UiAlertProvider";

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

function daysInMonth(year, month) {
  const y = Number(year);
  const m = Number(month);
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate(); // month: 1-12
}

function validateImageFile(f) {
  if (!f) return "Липсва файл.";
  if (!(f.type === "image/png" || f.type === "image/jpeg")) return "Файлът трябва да е png или jpg.";
  return "";
}

// styles (само за полето "МВР-" да е като при регистрацията)
const prefixStyles = {
  wrap: {
    display: "flex",
    alignItems: "stretch",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(46, 91, 255, 0.14)",
    background: "rgba(255,255,255,0.85)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
  },
  prefix: {
    display: "grid",
    placeItems: "center",
    padding: "0 12px",
    background: "rgba(58, 141, 255, 0.10)",
    borderRight: "1px solid rgba(46, 91, 255, 0.14)",
    fontWeight: 900,
    color: "#0f172a",
    whiteSpace: "nowrap",
  },
  input: {
    border: "none",
    outline: "none",
    padding: "10px 12px",
    flex: 1,
    fontSize: 14,
    background: "transparent",
  },
};

export default function AddDocumentPage() {
  const navigate = useNavigate();
  const { showAlert } = useUiAlert();

  const [docType, setDocType] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    egn: "",
    gender: "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
    validUntil: "",
    docNumber: "",
    birthPlace: "",
    address: "",
    issuedAtSuffix: "",
  });

  const [categories, setCategories] = useState([]); // for DRIVER_LICENSE only
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);

  const [existingDocs, setExistingDocs] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  const minValidUntil = useMemo(() => todayISO(), []);

  // 18+ cutoff (същата логика като регистрацията)
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setFullYear(d.getFullYear() - 18);
    return d;
  }, []);

  const minYear = 1908;
  const maxYear = cutoff.getFullYear();
  const cutoffMonth = cutoff.getMonth() + 1; // 1-12
  const cutoffDay = cutoff.getDate();

  const yearOptions = useMemo(() => {
    const arr = [];
    for (let y = maxYear; y >= minYear; y -= 1) arr.push(y);
    return arr;
  }, [maxYear]);

  const monthOptions = useMemo(() => {
    const y = Number(form.dobYear);
    const maxM = y === maxYear ? cutoffMonth : 12;
    return Array.from({ length: maxM }, (_, i) => i + 1);
  }, [form.dobYear, maxYear, cutoffMonth]);

  const maxAllowedDay = useMemo(() => {
    if (!form.dobYear || !form.dobMonth) return 31;
    const y = Number(form.dobYear);
    const m = Number(form.dobMonth);
    const dim = daysInMonth(y, m);
    if (y === maxYear && m === cutoffMonth) return Math.min(dim, cutoffDay);
    return dim;
  }, [form.dobYear, form.dobMonth, maxYear, cutoffMonth, cutoffDay]);

  const dayOptions = useMemo(() => {
    return Array.from({ length: maxAllowedDay }, (_, i) => i + 1);
  }, [maxAllowedDay]);

  const dobISO = useMemo(() => {
    if (!form.dobYear || !form.dobMonth || !form.dobDay) return "";
    return `${form.dobYear}-${pad2(form.dobMonth)}-${pad2(form.dobDay)}`;
  }, [form.dobYear, form.dobMonth, form.dobDay]);

  useEffect(() => {
    (async () => {
      try {
        const [docs, reqs] = await Promise.all([listMyDocuments(), listMyDocumentRequests()]);
        setExistingDocs(Array.isArray(docs) ? docs : []);
        setMyRequests(Array.isArray(reqs) ? reqs : []);
      } catch (e) {
        setError(e?.message || "Грешка при зареждане.");
      }
    })();
  }, []);

  // ако сменим година/месец да не остава невалиден ден (както при регистрацията)
  useEffect(() => {
    setForm((p) => {
      const next = { ...p };
      let changed = false;

      if (next.dobYear && Number(next.dobYear) === maxYear) {
        if (next.dobMonth && Number(next.dobMonth) > cutoffMonth) {
          next.dobMonth = "";
          next.dobDay = "";
          changed = true;
        } else if (
          next.dobMonth &&
          Number(next.dobMonth) === cutoffMonth &&
          next.dobDay &&
          Number(next.dobDay) > cutoffDay
        ) {
          next.dobDay = "";
          changed = true;
        }
      }

      if (next.dobYear && next.dobMonth && next.dobDay) {
        const dim = daysInMonth(next.dobYear, next.dobMonth);
        const maxDay =
          Number(next.dobYear) === maxYear && Number(next.dobMonth) === cutoffMonth
            ? Math.min(dim, cutoffDay)
            : dim;

        if (Number(next.dobDay) > maxDay) {
          next.dobDay = "";
          changed = true;
        }
      }

      return changed ? next : p;
    });
  }, [form.dobYear, form.dobMonth, form.dobDay, maxYear, cutoffMonth, cutoffDay]);

  const hasApprovedOfType = useMemo(() => {
    if (!docType) return false;
    return existingDocs.some((d) => d.type === docType);
  }, [existingDocs, docType]);

  const hasPendingAddOfType = useMemo(() => {
    if (!docType) return false;
    return myRequests.some(
      (r) =>
        r.kind === DOCUMENT_REQUEST_KINDS.ADD_DOCUMENT &&
        r.status === DOCUMENT_REQUEST_STATUSES.PENDING &&
        r.payload?.type === docType
    );
  }, [myRequests, docType]);

  const typeBlocked = hasApprovedOfType || hasPendingAddOfType;

  function onChange(e) {
    setError("");
    const { name, value } = e.target;

    // ЕГН: само цифри, max 10
    if (name === "egn") {
      const digits = String(value || "").replace(/\D/g, "").slice(0, 10);
      setForm((p) => ({ ...p, egn: digits }));
      return;
    }

    // № документ: само цифри, max 9
    if (name === "docNumber") {
      const digits = String(value || "").replace(/\D/g, "").slice(0, 9);
      setForm((p) => ({ ...p, docNumber: digits }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  }

  function toggleCategory(cat) {
    setError("");
    setCategories((prev) => (prev.includes(cat) ? prev.filter((x) => x !== cat) : [...prev, cat]));
  }

  function validate() {
    if (!docType) return "Моля, избери вид документ.";

    if (typeBlocked) {
      return "Вече имаш добавен документ от този тип (или има чакаща заявка). Не може да създадеш нов.";
    }

    if (!String(form.firstName).trim()) return "Име е задължително.";
    if (!String(form.middleName).trim()) return "Презиме е задължително.";
    if (!String(form.lastName).trim()) return "Фамилия е задължително.";

    if (!/^\d{10}$/.test(String(form.egn || "").trim())) return "ЕГН трябва да е точно 10 цифри.";

    // само Мъж / Жена
    if (!(form.gender === "male" || form.gender === "female")) return "Пол: избери Мъж или Жена.";

    // DOB dropdowns (18+)
    if (!form.dobDay || !form.dobMonth || !form.dobYear) return "Дата на раждане е задължително поле.";
    const dobDate = new Date(dobISO + "T00:00:00");
    if (Number.isNaN(dobDate.getTime())) return "Невалидна дата на раждане.";
    if (dobDate.getTime() > cutoff.getTime()) return "Трябва да си навършил 18 г.";

    // validUntil >= today
    if (!form.validUntil) return "Валидност е задължително поле.";
    const vDate = new Date(form.validUntil + "T00:00:00");
    if (Number.isNaN(vDate.getTime())) return "Невалидна дата за валидност.";
    if (form.validUntil < minValidUntil) return "Валидност не може да е по-ранна дата от днешния ден.";

    if (!/^\d{9}$/.test(String(form.docNumber || "").trim())) return "Номерът на документа трябва да е точно 9 цифри.";

    if (!String(form.birthPlace).trim()) return "Място на раждане е задължително.";
    if (!String(form.address).trim()) return "Постоянен адрес е задължително.";

    const suffix = String(form.issuedAtSuffix || "").trim().replace(/^-+/, "");
    if (!suffix) return "Издадено от е задължително.";

    // шофьорска: поне 1 категория
    if (docType === DOCUMENT_TYPES.DRIVER_LICENSE && categories.length === 0) {
      return "За шофьорска книжка трябва да избереш поне 1 категория.";
    }

    const f1e = validateImageFile(file1);
    if (f1e) return `Снимка 1: ${f1e}`;
    const f2e = validateImageFile(file2);
    if (f2e) return `Снимка 2: ${f2e}`;

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
      const suffix = String(form.issuedAtSuffix || "").trim().replace(/^-+/, "");
      const payload = {
        type: docType,

        firstName: String(form.firstName).trim(),
        middleName: String(form.middleName).trim(),
        lastName: String(form.lastName).trim(),

        egn: String(form.egn).trim(),
        gender: form.gender,
        dob: dobISO,

        validUntil: form.validUntil,
        docNumber: String(form.docNumber).trim(),

        birthPlace: String(form.birthPlace).trim(),
        address: String(form.address).trim(),
        issuedAt: `МВР-${suffix}`,

        categories: docType === DOCUMENT_TYPES.DRIVER_LICENSE ? categories : [],
      };

      await createAddDocumentRequest(payload, file1, file2);

      await showAlert("Заявката за добавяне на документ е изпратена към администратор.", { title: "Успешно" });
      navigate("/user/documents");
    } catch (ex) {
      setError(ex?.message || "Грешка при изпращане на заявката.");
    }
  }

  return (
    <DocumentsShell>
      <div style={{ textAlign: "left" }}>
        <h1>Добави документ</h1>
        <p className="dc-muted" style={{ marginTop: 6 }}>
          Подай заявка за добавяне на документ. Администраторът ще я обработи.
        </p>

        {error && (
          <div className="dc-alert dc-alert--error" style={{ marginBottom: 10 }}>
            <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ maxWidth: 720, display: "grid", gap: 10 }}>
          <label>
            <div style={{ fontSize: 13, marginBottom: 6, opacity: 0.8 }}>Вид документ</div>
            <select
              className="input"
              value={docType}
              onChange={(e) => {
                setError("");
                setDocType(e.target.value);
                setCategories([]);
              }}
            >
              <option value="">-- избери --</option>
              <option value={DOCUMENT_TYPES.ID_CARD}>Лична карта</option>
              <option value={DOCUMENT_TYPES.PASSPORT}>Паспорт</option>
              <option value={DOCUMENT_TYPES.DRIVER_LICENSE}>Шофьорска книжка</option>
            </select>
          </label>

          {docType && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontWeight: 900 }}>Избран документ: {documentTypeLabel(docType)}</div>

              {typeBlocked && (
                <div style={{ marginTop: 8, color: "#991b1b", fontWeight: 800 }}>
                  ⚠️ Вече има добавен/чакащ документ от този тип. Не може да създадеш нов.
                </div>
              )}
            </div>
          )}

          <input className="input" name="firstName" placeholder="Име" value={form.firstName} onChange={onChange} />
          <input className="input" name="middleName" placeholder="Презиме" value={form.middleName} onChange={onChange} />
          <input className="input" name="lastName" placeholder="Фамилия" value={form.lastName} onChange={onChange} />

          <input
            className="input"
            name="egn"
            placeholder="ЕГН (10 цифри)"
            value={form.egn}
            onChange={onChange}
            inputMode="numeric"
            maxLength={10}
          />

          <label>
            <div style={{ fontSize: 13, marginBottom: 6, opacity: 0.8 }}>Пол</div>
            <select className="input" name="gender" value={form.gender} onChange={onChange}>
              <option value="">-- избери --</option>
              <option value="male">Мъж</option>
              <option value="female">Жена</option>
            </select>
          </label>

          <label>
            <div style={{ fontSize: 13, marginBottom: 6, opacity: 0.8 }}>Дата на раждане</div>
            <div style={{ display: "flex", gap: 8 }}>
              <select className="input" name="dobDay" value={form.dobDay} onChange={onChange}>
                <option value="">Ден</option>
                {dayOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select className="input" name="dobMonth" value={form.dobMonth} onChange={onChange}>
                <option value="">Месец</option>
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select className="input" name="dobYear" value={form.dobYear} onChange={onChange}>
                <option value="">Година</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
              (Трябва да си навършил 18 г. — месец/ден се ограничават.)
            </div>
          </label>

          <label>
            <div style={{ fontSize: 13, marginBottom: 6, opacity: 0.8 }}>Валидност</div>
            <input
              className="input"
              name="validUntil"
              type="date"
              value={form.validUntil}
              onChange={onChange}
              min={minValidUntil}
            />
          </label>

          <input
            className="input"
            name="docNumber"
            placeholder="Номер на документа (9 цифри)"
            value={form.docNumber}
            onChange={onChange}
            inputMode="numeric"
            maxLength={9}
          />

          <input
            className="input"
            name="birthPlace"
            placeholder="Място на раждане"
            value={form.birthPlace}
            onChange={onChange}
          />
          <input className="input" name="address" placeholder="Постоянен адрес" value={form.address} onChange={onChange} />

          <label>
            <div style={{ fontSize: 13, marginBottom: 6, opacity: 0.8 }}>Издадено от</div>
            <div style={prefixStyles.wrap}>
              <div style={prefixStyles.prefix}>МВР-</div>
              <input
                style={prefixStyles.input}
                name="issuedAtSuffix"
                value={form.issuedAtSuffix}
                onChange={onChange}
                placeholder="София"
                autoComplete="off"
              />
            </div>
          </label>

          {docType === DOCUMENT_TYPES.DRIVER_LICENSE && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Категории (отбележи с тикче)</div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8 }}>
                {DRIVER_CATEGORIES.map((cat) => (
                  <label key={cat} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox" checked={categories.includes(cat)} onChange={() => toggleCategory(cat)} />
                    <span style={{ fontWeight: 800 }}>{cat}</span>
                  </label>
                ))}
              </div>

              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
                (Заявката няма да се приеме без поне 1 избрана категория.)
              </div>
            </div>
          )}

          <label className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Прикачи 2 снимки (png/jpg)</div>

            <input
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              onChange={(e) => {
                setError("");
                setFile1(e.target.files?.[0] || null);
              }}
            />
            <div style={{ marginTop: 8 }} />
            <input
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              onChange={(e) => {
                setError("");
                setFile2(e.target.files?.[0] || null);
              }}
            />

            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
              Файловете се изпращат към сървъра като част от заявката.
            </div>
          </label>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={!docType || typeBlocked}
              style={!docType || typeBlocked ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
            >
              Изпрати заявка
            </button>

            <button className="btn" type="button" onClick={() => navigate("/user/documents")}>
              Отказ
            </button>
          </div>
        </form>
      </div>
    </DocumentsShell>
  );
}
