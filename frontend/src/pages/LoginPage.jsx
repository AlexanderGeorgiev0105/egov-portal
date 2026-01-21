import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginAdmin, loginUser } from "../auth/mockAuth";

// ✅ Property UI (ако пътят е различен – коригирай само import-а)
import {
  PropertyShell,
  Card,
  HeadRow,
  Btn,
  FieldLabel,
  Input,
} from "../ui/property/PropertyUI";

// ✅ UiAlert
import { useUiAlert } from "../ui/UiAlertProvider";

export default function LoginPage() {
  const nav = useNavigate();
  const { showAlert } = useUiAlert();

  const [mode, setMode] = useState(null); // null | "user" | "admin"
  const [egn, setEgn] = useState("");
  const [password, setPassword] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function validateUserLogin() {
    if (!/^\d{10}$/.test(egn)) return "ЕГН трябва да е точно 10 цифри.";
    if (!password) return "Паролата е задължителна.";
    return "";
  }

  async function onUserLogin(e) {
    e.preventDefault();

    const v = validateUserLogin();
    if (v) {
      showAlert(v, { title: "Грешка" });
      return;
    }

    setLoading(true);
    try {
      await loginUser({ egn, password });
      nav("/user");
    } catch (ex) {
      if (ex?.status === 403) {
        showAlert(ex?.message || "Профилът ти още не е одобрен от администратор.", {
          title: "Грешка",
        });
      } else if (ex?.status === 401) {
        showAlert("Грешно ЕГН или парола.", { title: "Грешка" });
      } else {
        showAlert(ex?.message || "Грешка при вход.", { title: "Грешка" });
      }
    } finally {
      setLoading(false);
    }
  }

  function validateAdminLogin() {
    if (!adminUsername.trim()) return "Username е задължителен.";
    if (!adminPassword) return "Паролата е задължителна.";
    return "";
  }

  async function onAdminLogin(e) {
    e.preventDefault();

    const v = validateAdminLogin();
    if (v) {
      showAlert(v, { title: "Грешка" });
      return;
    }

    setLoading(true);
    try {
      await loginAdmin({ username: adminUsername, password: adminPassword });
      nav("/admin");
    } catch (ex) {
      if (ex?.status === 401) {
        showAlert("Грешен username или парола.", { title: "Грешка" });
      } else if (ex?.status === 403) {
        showAlert(ex?.message || "Админ профилът е неактивен.", { title: "Грешка" });
      } else {
        showAlert(ex?.message || "Грешка при вход.", { title: "Грешка" });
      }
    } finally {
      setLoading(false);
    }
  }

  function resetAndBack() {
    setMode(null);
    setEgn("");
    setPassword("");
    setAdminUsername("");
    setAdminPassword("");
  }

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
        {/* ✅ Малко по-голям прозорец */}
        <div style={{ width: "min(640px, 100%)" }}>
          <Card style={{ padding: 18 }}>
            {/* ✅ Черно + центрирано */}
            <div
              className="pp-cardTitle"
              style={{
                fontSize: 28,
                marginBottom: 6,
                fontWeight: 900,
                color: "#0f172a",
                textAlign: "center",
              }}
            >
              Държавни услуги
            </div>

            <div className="pp-muted" style={{ marginBottom: 12, textAlign: "center" }}>
              {mode === null
                ? "Избери как искаш да влезеш."
                : mode === "user"
                ? "Въведи ЕГН и парола."
                : "Въведи Admin username и парола."}
            </div>

            {mode === null ? (
              <div style={{ display: "grid", gap: 10 }}>
                <HeadRow style={{ gap: 10 }}>
                  <Btn
                    variant="primary"
                    disabled={loading}
                    onClick={() => setMode("user")}
                    type="button"
                    style={{ flex: 1 }}
                  >
                    Потребител
                  </Btn>

                  <Btn
                    disabled={loading}
                    onClick={() => setMode("admin")}
                    type="button"
                    style={{ flex: 1 }}
                  >
                    Администратор
                  </Btn>
                </HeadRow>

                <div className="pp-muted" style={{ fontSize: 12, textAlign: "center" }}>
                  Ако нямаш акаунт, направи регистрация и изчакай одобрение.
                </div>
              </div>
            ) : mode === "user" ? (
              <form onSubmit={onUserLogin} style={{ display: "grid", gap: 12 }}>
                <div>
                  <FieldLabel>ЕГН</FieldLabel>
                  <Input
                    value={egn}
                    onChange={(e) => setEgn(e.target.value.trim())}
                    inputMode="numeric"
                    placeholder="10 цифри"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <FieldLabel>Парола</FieldLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="************"
                    autoComplete="off"
                  />
                </div>

                <Btn variant="primary" type="submit" disabled={loading}>
                  {loading ? "Влизане..." : "Влез"}
                </Btn>

                <div style={{ textAlign: "center", fontSize: 14 }}>
                  Нямаш акаунт? <Link to="/register">Регистрация</Link>
                </div>

                <Btn type="button" disabled={loading} onClick={resetAndBack}>
                  Назад
                </Btn>
              </form>
            ) : (
              <form onSubmit={onAdminLogin} style={{ display: "grid", gap: 12 }}>
                <div>
                  <FieldLabel>Username</FieldLabel>
                  <Input
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <FieldLabel>Парола</FieldLabel>
                  <Input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="************"
                    autoComplete="off"
                  />
                </div>

                <Btn variant="primary" type="submit" disabled={loading}>
                  {loading ? "Влизане..." : "Влез"}
                </Btn>

                <Btn type="button" disabled={loading} onClick={resetAndBack}>
                  Назад
                </Btn>
              </form>
            )}
          </Card>
        </div>
      </div>
    </PropertyShell>
  );
}
