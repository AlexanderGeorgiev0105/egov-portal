import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAddPropertyRequest } from "../../../api/propertyRequestsApi";
import { useUiAlert } from "../../../ui/UiAlertProvider";
import { PropertyShell, PropertyHead, Card, MiniCard, Btn, Input, Select, FieldLabel } from "../../../ui/property";

const PROPERTY_TYPES = ["Апартамент", "Къща", "Земя", "Гараж", "Друг"];
const OBLASTI = [
  "Благоевград",
  "Бургас",
  "Варна",
  "Велико Търново",
  "Видин",
  "Враца",
  "Габрово",
  "Добрич",
  "Кърджали",
  "Кюстендил",
  "Ловеч",
  "Монтана",
  "Пазарджик",
  "Перник",
  "Плевен",
  "Пловдив",
  "Разград",
  "Русе",
  "Силистра",
  "Сливен",
  "Смолян",
  "София (град)",
  "София (област)",
  "Стара Загора",
  "Търговище",
  "Хасково",
  "Шумен",
  "Ямбол",
];

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME = ["application/pdf"];

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const { showAlert } = useUiAlert();

  const [form, setForm] = useState({
    type: PROPERTY_TYPES[0],
    otherType: "",
    oblast: OBLASTI[0],
    place: "",
    address: "",
    areaSqm: "",
    purchaseYear: "",
    ownershipDoc: null,
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function onChange(e) {
    setError("");
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  function onFileChange(e) {
    setError("");
    const file = e.target.files?.[0] || null;
    if (!file) {
      setForm((p) => ({ ...p, ownershipDoc: null }));
      return;
    }

    if (!ALLOWED_MIME.includes(file.type) && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Позволен е само PDF файл.");
      e.target.value = "";
      setForm((p) => ({ ...p, ownershipDoc: null }));
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError("Файлът е твърде голям. Максимум 25MB.");
      e.target.value = "";
      setForm((p) => ({ ...p, ownershipDoc: null }));
      return;
    }

    setForm((p) => ({ ...p, ownershipDoc: file }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const finalType = form.type === "Друг" ? (form.otherType || "").trim() : form.type;

    if (!finalType) {
      setError("Моля, попълни вид имот (ако е 'Друг', напиши какъв).");
      return;
    }

    if (!form.place.trim() || !form.address.trim() || !form.areaSqm || !form.purchaseYear) {
      setError("Моля, попълни всички полета.");
      return;
    }

    const area = Number(form.areaSqm);
    const year = Number(form.purchaseYear);

    if (!Number.isFinite(area) || area <= 0) {
      setError("Квадратурата трябва да е положително число.");
      return;
    }

    const currentYear = new Date().getFullYear();
    if (!Number.isFinite(year) || year < 1900 || year > currentYear) {
      setError(`Годината на закупуване трябва да е между 1900 и ${currentYear}.`);
      return;
    }

    if (!form.ownershipDoc) {
      setError("Документ за собственост (PDF) е задължителен.");
      return;
    }

    setSubmitting(true);
    try {
      await createAddPropertyRequest(
        {
          type: finalType,
          oblast: form.oblast,
          place: form.place.trim(),
          address: form.address.trim(),
          areaSqm: area,
          purchaseYear: year,
        },
        form.ownershipDoc
      );

      await showAlert("Заявката за добавяне на имот е изпратена към администратор.", { title: "Успешно" });
      navigate("/user/property");
    } catch (e2) {
      setError(e2?.message || "Грешка при изпращане към сървъра.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PropertyShell>
      <PropertyHead
        title="Добави имот"
        subtitle="Подай заявка за добавяне на имот. Администраторът ще я обработи."
      />

      {error && (
        <div className="pp-alert pp-alert--error" style={{ marginBottom: 10 }}>
          <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
        </div>
      )}

      <Card style={{ maxWidth: 720 }}>
        <form onSubmit={onSubmit} className="pp-form">
          <label>
            <FieldLabel>Вид имот</FieldLabel>
            <Select name="type" value={form.type} onChange={onChange} disabled={submitting}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </label>

          {form.type === "Друг" && (
            <Input
              name="otherType"
              placeholder="Опиши вида имот"
              value={form.otherType}
              onChange={onChange}
              disabled={submitting}
            />
          )}

          <label>
            <FieldLabel>Област</FieldLabel>
            <Select name="oblast" value={form.oblast} onChange={onChange} disabled={submitting}>
              {OBLASTI.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </label>

          <Input
            name="place"
            placeholder="Населено място"
            value={form.place}
            onChange={onChange}
            disabled={submitting}
          />
          <Input name="address" placeholder="Адрес" value={form.address} onChange={onChange} disabled={submitting} />

          <div className="pp-grid2">
            <Input
              name="areaSqm"
              placeholder="Квадратура (m²)"
              value={form.areaSqm}
              onChange={onChange}
              disabled={submitting}
            />
            <Input
              name="purchaseYear"
              placeholder="Година на закупуване"
              value={form.purchaseYear}
              onChange={onChange}
              disabled={submitting}
            />
          </div>

          <MiniCard>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Документ за собственост (PDF, до 25MB)</div>
            <input type="file" accept=".pdf,application/pdf" onChange={onFileChange} disabled={submitting} />
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
              Файлът се качва към backend-а като част от заявката.
            </div>
          </MiniCard>

          <div className="pp-actionsRow">
            <Btn variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Изпращане..." : "Изпрати заявка"}
            </Btn>

            <Btn type="button" onClick={() => navigate("/user/property")} disabled={submitting}>
              Отказ
            </Btn>
          </div>
        </form>
      </Card>
    </PropertyShell>
  );
}
