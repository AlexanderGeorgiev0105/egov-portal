import { useEffect, useMemo, useState } from "react";

import {
  listAdminProblemReports,
  rejectAdminProblemReport,
  resolveAdminProblemReport,
} from "../../../api/adminReportsApi";

import {
  PROBLEM_REPORT_STATUSES,
  statusLabel,
  categoryLabel,
  formatDateTimeBG,
} from "../../../utils/reports/problemReportsModel";

// ✅ Property UI (ако пътят при теб е различен – коригирай само import-а)
import {
  PropertyShell,
  PropertyHead,
  Card,
  HeadRow,
  Btn,
  Badge,
  Select,
} from "../../../ui/property/PropertyUI";

// ✅ UiAlert
import { useUiAlert } from "../../../ui/UiAlertProvider";

export default function AdminReportsPage() {
  const { showAlert } = useUiAlert();

  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selected, setSelected] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  async function refresh() {
    setLoadError("");
    setLoading(true);
    try {
      // Fetch ALL to keep "чакащи" counter accurate
      const list = await listAdminProblemReports();
      setReports(Array.isArray(list) ? list : []);
    } catch (e) {
      setReports([]);
      const msg = e?.message || "Грешка при зареждане на сигналите.";
      setLoadError(msg);
      showAlert(msg, { title: "Грешка" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSorted = useMemo(() => {
    const list = Array.isArray(reports) ? [...reports] : [];
    const filtered =
      statusFilter === "ALL" ? list : list.filter((r) => r.status === statusFilter);
    return filtered.sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );
  }, [reports, statusFilter]);

  const inReviewCount = useMemo(() => {
    return (Array.isArray(reports) ? reports : []).filter(
      (r) => r.status === PROBLEM_REPORT_STATUSES.IN_REVIEW
    ).length;
  }, [reports]);

  function openDetails(r) {
    setSelected(r);
    setAdminNote(String(r.adminNote || ""));
    setActionError("");
    setIsOpen(true);
  }

  function closeDetails() {
    if (actionLoading) return;
    setIsOpen(false);
    setSelected(null);
    setAdminNote("");
    setActionError("");
  }

  async function rejectSelected() {
    if (!selected) return;
    setActionError("");
    setActionLoading(true);
    try {
      await rejectAdminProblemReport(selected.id, adminNote);
      await refresh();
      closeDetails();
    } catch (e) {
      const msg = e?.message || "Грешка при отхвърляне.";
      setActionError(msg);
      showAlert(msg, { title: "Грешка" });
    } finally {
      setActionLoading(false);
    }
  }

  async function resolveSelected() {
    if (!selected) return;
    setActionError("");
    setActionLoading(true);
    try {
      await resolveAdminProblemReport(selected.id, adminNote);
      await refresh();
      closeDetails();
    } catch (e) {
      const msg = e?.message || "Грешка при маркиране като решен.";
      setActionError(msg);
      showAlert(msg, { title: "Грешка" });
    } finally {
      setActionLoading(false);
    }
  }

  const canAct =
    selected && selected.status === PROBLEM_REPORT_STATUSES.IN_REVIEW;

  return (
    <PropertyShell>
      <HeadRow style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <PropertyHead title="Сигнали" subtitle={`${inReviewCount} чакащи за преглед`} />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="pp-muted" style={{ fontSize: 13 }}>
              Филтър:
            </span>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={loading}
              style={{ minWidth: 170 }}
            >
              <option value="ALL">Всички</option>
              <option value={PROBLEM_REPORT_STATUSES.IN_REVIEW}>Преглежда се</option>
              <option value={PROBLEM_REPORT_STATUSES.RESOLVED}>Решени</option>
              <option value={PROBLEM_REPORT_STATUSES.REJECTED}>Отхвърлени</option>
            </Select>
          </label>

          <Btn variant="primary" onClick={refresh} title="Обнови" disabled={loading}>
            ↻
          </Btn>
        </div>
      </HeadRow>

      {loadError ? (
        <div className="pp-alert pp-alert--error" style={{ marginTop: 12 }}>
          <strong style={{ color: "#991b1b" }}>Грешка:</strong> {loadError}
        </div>
      ) : null}

      <Card style={{ marginTop: 12 }}>
        {loading ? (
          <div className="pp-muted">Зареждане...</div>
        ) : filteredSorted.length === 0 ? (
          <div className="pp-muted">Няма сигнали за показване.</div>
        ) : (
          <table className="pp-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Дата</th>
                <th style={{ textAlign: "left" }}>Категория</th>
                <th style={{ textAlign: "left" }}>Потребител</th>
                <th style={{ textAlign: "left" }}>Статус</th>
                <th style={{ width: 170 }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((r) => (
                <tr key={r.id}>
                  <td>{formatDateTimeBG(r.createdAt)}</td>
                  <td>{categoryLabel(r.category)}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>
                      {String(r.userName || r.userFullName || "—")}
                    </div>
                    <div className="pp-muted" style={{ fontSize: 12 }}>
                      ЕГН: {String(r.userEgn || "—")}
                    </div>
                  </td>

                  {/* ✅ статус само като текст (без балончета), на 1 ред */}
                  <td>
                    <span style={{ whiteSpace: "nowrap", fontWeight: 800 }}>
                      {statusLabel(r.status)}
                    </span>
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <Btn variant="primary" onClick={() => openDetails(r)}>
                      Прегледай
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modal */}
      {isOpen && selected && (
        <div className="pp-overlay" onClick={closeDetails} role="dialog" aria-modal="true" style={{ zIndex: 9999 }}>
          <div
            className="pp-modal"
            style={{
              width: "min(820px, 100%)",
              maxHeight: "85vh",
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
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className="pp-modalHead"
                style={{ borderTopLeftRadius: 26, borderTopRightRadius: 26 }}
              >
                <div style={{ fontWeight: 950 }}>Детайли за сигнал</div>

                <button
                  className="pp-btn"
                  onClick={closeDetails}
                  title="Затвори"
                  disabled={actionLoading}
                  type="button"
                  style={{ padding: "8px 10px", borderRadius: 14 }}
                >
                  ✕
                </button>
              </div>

              <div className="pp-modalBody" style={{ overflow: "auto", maxHeight: "calc(85vh - 58px)" }}>
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <Badge tone="neutral">{categoryLabel(selected.category)}</Badge>
                    <Badge tone={selected.status === PROBLEM_REPORT_STATUSES.IN_REVIEW ? "default" : "neutral"}>
                      {statusLabel(selected.status)}
                    </Badge>
                    <span className="pp-muted" style={{ fontSize: 12 }}>
                      {formatDateTimeBG(selected.createdAt)}
                    </span>
                  </div>

                  <Card>
                    <div className="pp-muted" style={{ fontSize: 13 }}>
                      Потребител
                    </div>
                    <div style={{ marginTop: 6, fontWeight: 900 }}>
                      {String(selected.userName || selected.userFullName || "—")}
                    </div>
                    <div className="pp-muted" style={{ marginTop: 2, fontSize: 13 }}>
                      ЕГН: {String(selected.userEgn || "—")}
                    </div>
                  </Card>

                  <Card>
                    <div className="pp-muted" style={{ fontSize: 13 }}>
                      Описание
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>
                      {String(selected.description || "").trim() || "—"}
                    </div>
                  </Card>

                  <Card>
                    <div className="pp-muted" style={{ fontSize: 13, marginBottom: 8 }}>
                      Коментар към потребителя (по желание)
                    </div>

                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={4}
                      placeholder="Например: Прието, ще бъде обработено / Отказ поради ... / Решено на дата ..."
                      style={{
                        width: "100%",
                        resize: "vertical",
                        borderRadius: 16,
                        border: "1px solid rgba(15,23,42,0.12)",
                        padding: "10px 12px",
                        outline: "none",
                        font: "inherit",
                        background: "rgba(255,255,255,0.9)",
                      }}
                      disabled={actionLoading}
                    />
                  </Card>

                  {actionError ? (
                    <div style={{ color: "#b91c1c", fontSize: 13 }}>
                      {actionError}
                    </div>
                  ) : null}

                  <div
                    className="pp-actionsRow"
                    style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}
                  >
                    <Btn onClick={closeDetails} disabled={actionLoading}>
                      Затвори
                    </Btn>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Btn
                        onClick={rejectSelected}
                        disabled={actionLoading || !canAct}
                        title={!canAct ? "Вече е обработен" : ""}
                      >
                        {actionLoading ? "..." : "Отхвърли"}
                      </Btn>

                      <Btn
                        variant="primary"
                        onClick={resolveSelected}
                        disabled={actionLoading || !canAct}
                        title={!canAct ? "Вече е обработен" : ""}
                      >
                        {actionLoading ? "..." : "Маркирай като решен"}
                      </Btn>
                    </div>
                  </div>

                  {selected.status !== PROBLEM_REPORT_STATUSES.IN_REVIEW ? (
                    <div className="pp-muted" style={{ fontSize: 12 }}>
                      Забележка: Сигналът вече е обработен.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PropertyShell>
  );
}
