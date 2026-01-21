import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

import { isValidEGN } from "../../../utils/auth/validators";
import { FINE_TYPES, getFineBaseAmount } from "../../../utils/transport/vehiclesModel";

import { createAdminFine } from "../../../api/adminTransportApi";

// ✅ Property UI (коригирай пътя при нужда)
import { PropertyShell, PropertyHead, Card, HeadRow, Btn, FieldLabel, Input, Select } from "../../../ui/property/PropertyUI";

// ✅ UiAlert
import { useUiAlert } from "../../../ui/UiAlertProvider";

export default function AdminAddFinePage() {
  const navigate = useNavigate();
  const { showAlert } = useUiAlert();

  const [egn, setEgn] = useState("");
  const [fineType, setFineType] = useState("");
  const [sending, setSending] = useState(false);

  const amount = useMemo(() => {
    if (!fineType) return 0;
    return getFineBaseAmount(fineType);
  }, [fineType]);

  const canSend = useMemo(() => {
    return isValidEGN(egn) && !!fineType;
  }, [egn, fineType]);

  async function submit(e) {
    e.preventDefault();

    if (!isValidEGN(egn)) {
      showAlert("ЕГН трябва да е 10 цифри.", { title: "Грешка" });
      return;
    }
    if (!fineType) {
      showAlert("Избери вид глоба.", { title: "Грешка" });
      return;
    }

    setSending(true);
    try {
      await createAdminFine({
        egn: String(egn).trim(),
        type: fineType,
        amount: Number(amount) || 0,
      });

      showAlert("Глобата е изпратена успешно.", { title: "Съобщение" });
      setFineType("");
      // оставяме ЕГН попълнено
    } catch (e2) {
      showAlert(e2?.message || "Грешка при изпращане на глобата.", { title: "Грешка" });
    } finally {
      setSending(false);
    }
  }

  return (
    <PropertyShell>
      <HeadRow style={{ justifyContent: "space-between" }}>
        <PropertyHead
          title="Добави глоба"
          subtitle="Въведи ЕГН, избери вид глоба и системата ще попълни стойността автоматично."
        />
        <Btn to="/admin/transport">← Назад</Btn>
      </HeadRow>

      <Card style={{ marginTop: 12, maxWidth: 720 }}>
        <form onSubmit={submit} className="pp-form" style={{ display: "grid", gap: 12 }}>
          <div>
            <FieldLabel>ЕГН на потребителя *</FieldLabel>
            <Input
              value={egn}
              onChange={(e) => setEgn(e.target.value)}
              placeholder="10 цифри"
              inputMode="numeric"
            />
          </div>

          <div>
            <FieldLabel>Вид глоба *</FieldLabel>
            <Select value={fineType} onChange={(e) => setFineType(e.target.value)}>
              <option value="">-- Избери --</option>
              {FINE_TYPES.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>

          <div style={{ borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 10 }}>
            <div className="pp-muted" style={{ fontSize: 13 }}>
              Стойност:
            </div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>{amount.toFixed(2)} лв.</div>
          </div>

          <Btn
            variant="primary"
            type="submit"
            disabled={!canSend || sending}
            style={!canSend || sending ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
            title={!canSend ? "Попълни ЕГН и избери глоба" : "Изпрати глобата"}
          >
            {sending ? "Изпращане..." : "Изпрати глобата"}
          </Btn>

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            * При потребителя ще се визуализира -20% за първите 14 дни (логиката е в User страницата).
          </div>
        </form>
      </Card>
    </PropertyShell>
  );
}
