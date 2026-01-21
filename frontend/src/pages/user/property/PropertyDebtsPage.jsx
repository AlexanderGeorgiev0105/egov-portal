import { useEffect, useMemo, useState } from "react";
import { listMyProperties, getTaxAssessment, getDebts, payDebt } from "../../../api/propertyApi";
import { useUiAlert } from "../../../ui/UiAlertProvider";
import { PropertyShell, HeadRow, Card, MiniCard, Btn } from "../../../ui/property";

function formatMoney(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("bg-BG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " лв.";
}

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "—";
  }
}

export default function PropertyDebtsPage() {
  const { showAlert } = useUiAlert();

  const [properties, setProperties] = useState([]);
  const [taxById, setTaxById] = useState({});
  const [debtsById, setDebtsById] = useState({});
  const [error, setError] = useState("");

  const [payingKey, setPayingKey] = useState(""); // "propertyId|year|KIND"

  async function refresh() {
    setError("");
    try {
      const props = await listMyProperties();
      const list = Array.isArray(props) ? props : [];
      setProperties(list);

      const taxMap = {};
      const debtsMap = {};

      await Promise.all(
        list.map(async (p) => {
          try {
            taxMap[p.id] = await getTaxAssessment(p.id);
          } catch (e) {
            if (e?.status !== 404) throw e;
            taxMap[p.id] = null;
          }

          try {
            debtsMap[p.id] = await getDebts(p.id);
          } catch {
            debtsMap[p.id] = null;
          }
        })
      );

      setTaxById(taxMap);
      setDebtsById(debtsMap);
    } catch (e) {
      setError(e?.message || "Грешка при зареждане.");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = useMemo(() => new Date(), []);
  const nextYear = now.getFullYear() + 1;
  const nextPayDateLabel = `05.01.${nextYear}`;

  async function pay(propertyId, year, kind) {
    const key = `${propertyId}|${year}|${kind}`;
    setPayingKey(key);

    try {
      await payDebt(propertyId, year, kind);

      const updated = await getDebts(propertyId);
      setDebtsById((prev) => ({ ...prev, [propertyId]: updated }));
    } catch (e) {
      console.error("PAY ERROR:", e);
      await showAlert(e?.message || "Грешка при плащане.", { title: "Грешка" });
    } finally {
      setPayingKey("");
    }
  }

  if (properties.length === 0) {
    return (
      <PropertyShell>
        <HeadRow>
          <h1 className="pp-title" style={{ margin: 0 }}>
            Задължения
          </h1>
          <div className="pp-subtitle">Нямаш одобрени имоти.</div>
        </HeadRow>

        <Btn to="/user/property">← Назад към Имущество</Btn>
      </PropertyShell>
    );
  }

  return (
    <PropertyShell>
      <HeadRow>
        <Btn to="/user/property">← Назад</Btn>
        <h1 className="pp-title" style={{ margin: 0 }}>
          Задължения
        </h1>
      </HeadRow>

      {error && (
        <div className="pp-alert pp-alert--error" style={{ marginTop: 12 }}>
          <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
        </div>
      )}

      <div style={{ marginTop: 10 }} className="pp-subtitle">
        Следващо плащане: <strong>{nextPayDateLabel}</strong>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {properties.map((p) => {
          const assessment = taxById?.[p.id] || null;
          const debts = debtsById?.[p.id] || null;

          const years = Array.isArray(debts)
            ? debts
                .map((d) => d.year)
                .filter((y) => Number.isFinite(Number(y)))
                .sort((a, b) => b - a)
            : [];

          return (
            <Card key={p.id} padded className="">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 900 }}>
                    {p.type} • {p.oblast} • {p.place}
                  </div>
                  <div className="pp-muted">{p.address}</div>

                  <div style={{ marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13 }}>
                    <span>
                      <strong>Квадратура:</strong> {p.areaSqm} m²
                    </span>
                    <span>
                      <strong>Област:</strong> {p.oblast}
                    </span>
                    <span>
                      <strong>Квартал:</strong> {assessment ? assessment.neighborhood || assessment.district || "—" : "—"}
                    </span>
                    <span>
                      <strong>Данъчна оценка:</strong> {assessment ? formatMoney(assessment.price) : "Няма"}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 12, opacity: 0.75 }}>ID: {p.id}</div>
              </div>

              {!assessment ? (
                <div className="pp-alert pp-alert--warn" style={{ marginTop: 12 }}>
                  <strong>Няма данъчна оценка.</strong> Задължения не могат да се изчислят без нея.
                </div>
              ) : !debts || years.length === 0 ? (
                <MiniCard style={{ marginTop: 12 }}>
                  Все още няма генерирани задължения (ще се появят на 05.01, когато дойде падежът).
                </MiniCard>
              ) : (
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {years.map((y) => {
                    const row = debts.find((d) => d.year === y);
                    const yearlyTax = row?.yearlyTax;
                    const trashFee = row?.trashFee;

                    const yearlyKey = `${p.id}|${y}|YEARLY_TAX`;
                    const trashKey = `${p.id}|${y}|TRASH_FEE`;

                    return (
                      <MiniCard key={y}>
                        <div style={{ fontWeight: 900, marginBottom: 8 }}>
                          Задължения за {y} (падеж: {row?.dueDate ? formatDateTime(row.dueDate) : "—"})
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div>
                            <strong>Годишен данък:</strong> {formatMoney(yearlyTax?.amount)}
                            {yearlyTax?.isPaid ? (
                              <span style={{ marginLeft: 10, color: "#16a34a", fontWeight: 800 }}>
                                Платен ({formatDateTime(yearlyTax?.paidAt)})
                              </span>
                            ) : (
                              <span style={{ marginLeft: 10, color: "#dc2626", fontWeight: 800 }}>Неплатен</span>
                            )}
                          </div>

                          {!yearlyTax?.isPaid && (
                            <Btn
                              variant="primary"
                              onClick={() => pay(p.id, y, "YEARLY_TAX")}
                              disabled={payingKey === yearlyKey}
                              style={payingKey === yearlyKey ? { opacity: 0.7, cursor: "not-allowed" } : undefined}
                            >
                              {payingKey === yearlyKey ? "..." : "Плати"}
                            </Btn>
                          )}
                        </div>

                        <div style={{ height: 10 }} />

                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div>
                            <strong>Такса смет:</strong> {formatMoney(trashFee?.amount)}
                            {trashFee?.isPaid ? (
                              <span style={{ marginLeft: 10, color: "#16a34a", fontWeight: 800 }}>
                                Платена ({formatDateTime(trashFee?.paidAt)})
                              </span>
                            ) : (
                              <span style={{ marginLeft: 10, color: "#dc2626", fontWeight: 800 }}>Неплатена</span>
                            )}
                          </div>

                          {!trashFee?.isPaid && (
                            <Btn
                              variant="primary"
                              onClick={() => pay(p.id, y, "TRASH_FEE")}
                              disabled={payingKey === trashKey}
                              style={payingKey === trashKey ? { opacity: 0.7, cursor: "not-allowed" } : undefined}
                            >
                              {payingKey === trashKey ? "..." : "Плати"}
                            </Btn>
                          )}
                        </div>

                        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 10 }}>
                          Следващо плащане: <strong>{nextPayDateLabel}</strong>
                        </div>
                      </MiniCard>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </PropertyShell>
  );
}
