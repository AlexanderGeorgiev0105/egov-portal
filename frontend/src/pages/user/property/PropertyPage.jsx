import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { servicesByCategory } from "../../../data/mockData";
import { listMyProperties, hasTaxAssessment } from "../../../api/propertyApi";
import { listMyPropertyRequests, createRemovePropertyRequest } from "../../../api/propertyRequestsApi";
import { useUiAlert } from "../../../ui/UiAlertProvider";
import { PropertyShell, PropertyHead, Card, MiniCard, Btn, Badge, Select, FieldLabel } from "../../../ui/property";

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString("bg-BG");
  } catch {
    return iso;
  }
}

function getReqStatusLabel(status) {
  switch (status) {
    case "PENDING":
      return "Чака проверка";
    case "APPROVED":
      return "Одобрена";
    case "REJECTED":
      return "Отказана";
    default:
      return status;
  }
}

function getRequestKindLabel(r) {
  if (r.kind === "REMOVE_PROPERTY") return "Премахване на имот";
  if (r.kind === "ADD_PROPERTY") return "Добавяне на имот";
  if (r.kind === "TAX_ASSESSMENT") return "Данъчна оценка";
  if (r.kind === "SKETCH") return "Скица на имот";
  return "Заявка";
}

export default function PropertyPage() {
  const navigate = useNavigate();
  const { showAlert } = useUiAlert();

  const [properties, setProperties] = useState([]);
  const [propRequests, setPropRequests] = useState([]);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);

  const [confirmedMap, setConfirmedMap] = useState({});
  const [error, setError] = useState("");

  // Remove modal state
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [removeProperty, setRemoveProperty] = useState(null);
  const [removeReason, setRemoveReason] = useState("Покупко-продажба");
  const [submittingRemove, setSubmittingRemove] = useState(false);

  async function refresh() {
    setError("");
    try {
      const [props, reqs] = await Promise.all([listMyProperties(), listMyPropertyRequests()]);

      setProperties(Array.isArray(props) ? props : []);
      setPropRequests(Array.isArray(reqs) ? reqs : []);

      const list = Array.isArray(props) ? props : [];
      const settled = await Promise.allSettled(list.map((p) => hasTaxAssessment(p.id)));

      const map = {};
      for (let i = 0; i < list.length; i++) {
        map[list[i].id] = settled[i].status === "fulfilled" ? !!settled[i].value : false;
      }
      setConfirmedMap(map);
    } catch (e) {
      setError(e?.message || "Грешка при зареждане.");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasProperties = properties.length > 0;
  const pendingCount = propRequests.filter((r) => r.status === "PENDING").length;

  function hasPendingRemoveRequest(propertyId) {
    return propRequests.some(
      (r) =>
        r.kind === "REMOVE_PROPERTY" &&
        r.status === "PENDING" &&
        (r.propertyId === propertyId || r.payload?.propertyId === propertyId)
    );
  }

  const propertyServices = useMemo(() => {
    const base = servicesByCategory.property || [];

    const wanted = [
      { title: "Данъчна оценка", id: "property_tax_assessment", description: "Издаване на данъчна оценка за имот." },
      { title: "Скица на имот", id: "property_sketch", description: "Заявка за скица/схема на имот." },
      { title: "Задължения", id: "property_debts", description: "Преглед на задължения по имот (изисква данъчна оценка)." },
    ];

    return wanted.map((w) => {
      const exact = base.find((s) => (s.title || "").trim() === w.title);
      return {
        ...(exact || {}),
        id: w.id,
        title: w.title,
        description: exact?.description || w.description,
      };
    });
  }, []);

  async function openService(serviceId) {
    if (!hasProperties) return;

    if (serviceId === "property_tax_assessment") {
      navigate("/user/property/tax");
      return;
    }

    if (serviceId === "property_sketch") {
      navigate("/user/property/sketch");
      return;
    }

    if (serviceId === "property_debts") {
      const anyConfirmed = properties.some((p) => confirmedMap?.[p.id]);
      if (!anyConfirmed) {
        await showAlert("За да видиш задължения, първо трябва да имаш поне 1 имот с издадена данъчна оценка.", {
          title: "Важно",
        });
        return;
      }
      navigate("/user/property/debts");
      return;
    }

    navigate("/user/property");
  }

  function openRequests() {
    refresh();
    setIsRequestsOpen(true);
  }

  function closeRequests() {
    setIsRequestsOpen(false);
  }

  function openPropertyDetails(propertyId) {
    navigate(`/user/property/details/${propertyId}`);
  }

  function openRemoveModal(p, e) {
    e?.stopPropagation?.();
    setRemoveProperty(p);
    setRemoveReason("Покупко-продажба");
    setIsRemoveOpen(true);
  }

  function closeRemoveModal() {
    setIsRemoveOpen(false);
    setRemoveProperty(null);
  }

  async function submitRemoveRequest(e) {
    e.preventDefault();
    if (!removeProperty) return;

    if (hasPendingRemoveRequest(removeProperty.id)) {
      await showAlert("Вече има подадена заявка за премахване за този имот и се чака проверка.", { title: "Важно" });
      closeRemoveModal();
      return;
    }

    setSubmittingRemove(true);
    try {
      await createRemovePropertyRequest({ propertyId: removeProperty.id, reason: removeReason });
      closeRemoveModal();
      await refresh();
      await showAlert("Заявката за премахване е изпратена към администратор.", { title: "Успешно" });
    } catch (err) {
      await showAlert(err?.message || "Грешка при изпращане на заявката.", { title: "Грешка" });
    } finally {
      setSubmittingRemove(false);
    }
  }

  return (
    <PropertyShell>
      <PropertyHead
        title="Имущество"
        subtitle="Услугите по-долу работят върху избран/одобрен имот. Последните заявки се виждат вдясно."
      />

      {error && (
        <div className="pp-alert pp-alert--error" style={{ marginTop: 10 }}>
          <strong style={{ color: "#991b1b" }}>Грешка:</strong> {error}
        </div>
      )}

      <div className="pp-layout" style={{ marginTop: 12 }}>
        {/* Left */}
        <div>
          <div className="pp-actions">
            <Btn variant="primary" to="/user/property/add">
              Добави имот
            </Btn>

            {propertyServices.map((s) => (
              <Btn
                key={s.id}
                onClick={() => openService(s.id)}
                disabled={!hasProperties}
                title={!hasProperties ? "Първо добави и одобри имот" : s.description}
                style={!hasProperties ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              >
                {s.title}
              </Btn>
            ))}
          </div>

          {!hasProperties && (
            <div className="pp-alert pp-alert--warn" style={{ marginBottom: 12 }}>
              <strong>Важно:</strong> Нямаш одобрени имоти. Подай заявка за добавяне на имот и изчакай одобрение от
              администратор.
            </div>
          )}

          <Card>
            <h3 className="pp-cardTitle" style={{ marginTop: 0 }}>
              Моите имоти
            </h3>

            {properties.length === 0 ? (
              <p className="pp-muted" style={{ marginBottom: 0 }}>
                Все още нямаш одобрени имоти.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {properties.map((p) => {
                  const confirmed = !!confirmedMap?.[p.id];
                  const statusText = confirmed ? "Потвърден" : "Непотвърден";
                  const pendingRemove = hasPendingRemoveRequest(p.id);

                  return (
                    <Card
                      key={p.id}
                      className="pp-itemCard"
                      onClick={() => openPropertyDetails(p.id)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 10,
                        alignItems: "start",
                        cursor: "pointer",
                      }}
                      title="Преглед на детайли за имота"
                    >
                      <div>
                        <div style={{ fontWeight: 800 }}>
                          {p.type} • {p.oblast} • {p.place}
                        </div>
                        <div className="pp-muted">{p.address}</div>

                        <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <span>Кв.: {p.areaSqm} m²</span>
                          <span>Година: {p.purchaseYear}</span>
                          <span style={{ color: "#6b7280" }}>Документ: —</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                        <div
                          className="pp-status"
                          style={{ color: confirmed ? "#16a34a" : "#dc2626" }}
                          title={
                            confirmed
                              ? "Имотът е потвърден (има данъчна оценка)"
                              : "Имотът е непотвърден (няма данъчна оценка)"
                          }
                        >
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: confirmed ? "#16a34a" : "#dc2626",
                              display: "inline-block",
                            }}
                          />
                          {statusText}
                        </div>

                        {pendingRemove ? (
                          <Btn
                            disabled
                            onClick={(e) => e.stopPropagation()}
                            title="Вече има подадена заявка за премахване и се чака проверка."
                          >
                            Заявен за премахване
                          </Btn>
                        ) : (
                          <Btn onClick={(e) => openRemoveModal(p, e)}>Премахни</Btn>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right */}
        <Card className="pp-right">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <h3 style={{ margin: 0 }} className="pp-cardTitle">
              Заявки
            </h3>
            <Badge>{pendingCount} чакащи</Badge>
          </div>

          <div className="pp-muted" style={{ marginTop: 10, fontSize: 13 }}>
            Последни заявки за секцията „Имущество“.
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {propRequests.length === 0 ? (
              <div className="pp-muted">Нямаш подадени заявки за тази секция.</div>
            ) : (
              propRequests.slice(0, 8).map((r) => (
                <MiniCard key={r.id}>
                  <div style={{ fontWeight: 900 }}>{getRequestKindLabel(r)}</div>

                  {r.payload?.address ? (
                    <div style={{ marginTop: 6 }} className="pp-muted">
                      {r.payload?.type ? `${r.payload.type} • ${r.payload.oblast} • ${r.payload.place}` : "—"}
                      {r.kind === "REMOVE_PROPERTY" && r.payload?.reason ? ` • ${r.payload.reason}` : ""}
                    </div>
                  ) : null}

                  <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge>{getReqStatusLabel(r.status)}</Badge>
                    <Badge tone="neutral">{formatDateTime(r.createdAt)}</Badge>
                  </div>
                </MiniCard>
              ))
            )}
          </div>

          <div style={{ marginTop: 10 }}>
            <Btn variant="primary" onClick={openRequests} title="Виж всички заявки">
              Виж всички →
            </Btn>
          </div>
        </Card>
      </div>

      {/* Requests modal */}
      {isRequestsOpen && (
        <div className="pp-overlay" onClick={closeRequests}>
          <div className="pp-card pp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pp-modalHead">
              <div style={{ fontWeight: 900 }}>Заявки</div>
              <Btn onClick={closeRequests} title="Затвори">
                ✕
              </Btn>
            </div>

            <div className="pp-modalBody">
              {propRequests.length === 0 ? (
                <p className="pp-muted">Нямаш подадени заявки.</p>
              ) : (
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Вид заявка</th>
                      <th>Детайли</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propRequests.map((r) => (
                      <tr key={r.id}>
                        <td>{formatDateTime(r.createdAt)}</td>
                        <td>{getRequestKindLabel(r)}</td>
                        <td>
                          {r.payload?.type ? `${r.payload.type} • ${r.payload.oblast} • ${r.payload.place}` : "—"}
                          {r.payload?.address && (
                            <div style={{ fontSize: 12, opacity: 0.8 }}>
                              {r.payload.address}
                              {r.payload?.areaSqm ? ` • ${r.payload.areaSqm} m²` : ""}
                              {r.payload?.purchaseYear ? ` • ${r.payload.purchaseYear}` : ""}
                              {r.kind === "REMOVE_PROPERTY" && r.payload?.reason ? ` • Причина: ${r.payload.reason}` : ""}
                            </div>
                          )}
                        </td>
                        <td>{getReqStatusLabel(r.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 10 }}>
                Всички услуги, свързани с имоти, се обработват като заявки.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove request modal */}
      {isRemoveOpen && removeProperty && (
        <div className="pp-overlay" onClick={closeRemoveModal} style={{ zIndex: 1100 }}>
          <div className="pp-card pp-modal pp-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="pp-modalHead">
              <div style={{ fontWeight: 900 }}>Заявка за премахване</div>
              <Btn onClick={closeRemoveModal} title="Затвори" disabled={submittingRemove}>
                ✕
              </Btn>
            </div>

            <div className="pp-modalBody">
              <Card className="pp-itemCard" style={{ cursor: "default" }}>
                <div style={{ fontWeight: 900 }}>
                  {removeProperty.type} • {removeProperty.oblast} • {removeProperty.place}
                </div>
                <div className="pp-muted">{removeProperty.address}</div>
                <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span>Кв.: {removeProperty.areaSqm} m²</span>
                  <span>Година: {removeProperty.purchaseYear}</span>
                  <span style={{ color: "#6b7280" }}>Документ: —</span>
                </div>
              </Card>

              <form onSubmit={submitRemoveRequest} style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <label>
                  <FieldLabel>Причина</FieldLabel>
                  <Select value={removeReason} onChange={(e) => setRemoveReason(e.target.value)} disabled={submittingRemove}>
                    <option value="Покупко-продажба">Покупко-продажба</option>
                    <option value="Дарение">Дарение</option>
                  </Select>
                </label>

                <Btn variant="primary" type="submit" disabled={submittingRemove}>
                  {submittingRemove ? "Изпращане..." : "Изпрати към админ"}
                </Btn>

                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Админът ще види заявката в „Admin: Property Requests“ и ще я обработи с Review.
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PropertyShell>
  );
}
