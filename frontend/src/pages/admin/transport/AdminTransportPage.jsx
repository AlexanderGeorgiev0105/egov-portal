import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { listAdminTransportRequests } from "../../../api/adminTransportApi";

// ✅ Property UI (коригирай пътя при нужда)
import { PropertyShell, PropertyHead, Card, HeadRow, Btn } from "../../../ui/property/PropertyUI";

export default function AdminTransportPage() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const items = await listAdminTransportRequests("PENDING");
        if (!alive) return;
        setPendingCount(Array.isArray(items) ? items.length : 0);
      } catch {
        if (!alive) return;
        setPendingCount(0);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <PropertyShell>
      <HeadRow style={{ justifyContent: "space-between" }}>
        <PropertyHead
          title="Превозни средства и глоби"
          subtitle="Оттук администраторът може да изпраща глоби и да обработва заявки за МПС/ГТП."
        />
      </HeadRow>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 14,
          marginTop: 12,
          alignItems: "stretch", // ✅ да се разтягат еднакво
        }}
      >
        <Link
          to="/admin/transport/add-fine"
          style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
        >
          <Card style={{ height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div className="pp-cardTitle" style={{ marginBottom: 6 }}>
                Добави глоба
              </div>

              <div className="pp-muted" style={{ fontSize: 13, lineHeight: 1.35 }}>
                Изпрати глоба по ЕГН, избери вид нарушение и стойността се попълва автоматично.
              </div>

              {/* ✅ бутонът винаги долу */}
              <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end", paddingTop: 12 }}>
                <Btn variant="primary" type="button">
                  Отвори →
                </Btn>
              </div>
            </div>
          </Card>
        </Link>

        <Link
          to="/admin/transport/requests"
          style={{ textDecoration: "none", color: "inherit", display: "block", height: "100%" }}
        >
          <Card style={{ height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div className="pp-cardTitle" style={{ marginBottom: 6 }}>
                Заявки
              </div>

              <div className="pp-muted" style={{ fontSize: 13, lineHeight: 1.35 }}>
                Преглед и обработка на заявки за добавяне на МПС и технически преглед.
              </div>

              {/* ✅ бутонът и чакащи са винаги долу, в една линия */}
              <div
                style={{
                  marginTop: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  paddingTop: 12,
                }}
              >
                <span style={{ fontWeight: 800, fontSize: 13 }}>{pendingCount} чакащи</span>

                <div style={{ marginLeft: "auto" }}>
                  <Btn variant="primary" type="button">
                    Отвори →
                  </Btn>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </PropertyShell>
  );
}
