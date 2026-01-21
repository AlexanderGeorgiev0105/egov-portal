import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getMyDocument, downloadMyDocumentPhoto } from "../../../api/documentsApi";
import {
  DOCUMENT_TYPES,
  documentTypeLabel,
  genderLabel,
  isExpired,
  formatDateBG,
} from "../../../utils/documents/documentsModel";

import { useUiAlert } from "../../../ui/UiAlertProvider";

export default function DocumentDetailsPage() {
  const { id } = useParams();
  const { showAlert } = useUiAlert();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [previews, setPreviews] = useState([]); // [{url,name,type}]
  const [viewer, setViewer] = useState(null); // {url,name} | null

  const expired = useMemo(() => isExpired(doc?.validUntil), [doc?.validUntil]);

  // ESC closes viewer
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setViewer(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // load doc
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const d = await getMyDocument(id);
        if (!alive) return;
        setDoc(d || null);
      } catch (e) {
        if (!alive) return;
        const msg = e?.message || "Грешка при зареждане на документа.";
        setError(msg);
        setDoc(null);
        showAlert(msg, { title: "Грешка" });
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, showAlert]);

  // load photos as blobs (auth header required => fetch via api)
  useEffect(() => {
    let alive = true;

    // cleanup old blob urls
    previews.forEach((p) => {
      if (p.url?.startsWith("blob:")) URL.revokeObjectURL(p.url);
    });
    setPreviews([]);

    async function loadPhotos() {
      if (!doc?.id) return;

      const out = [];
      // photo-1
      try {
        const b1 = await downloadMyDocumentPhoto(doc.id, 1);
        if (b1 && alive) out.push({ url: URL.createObjectURL(b1), name: "Снимка 1", type: b1.type || "image/*" });
      } catch {
        // ignore (404 or no link)
      }
      // photo-2
      try {
        const b2 = await downloadMyDocumentPhoto(doc.id, 2);
        if (b2 && alive) out.push({ url: URL.createObjectURL(b2), name: "Снимка 2", type: b2.type || "image/*" });
      } catch {
        // ignore
      }

      if (!alive) {
        out.forEach((p) => p.url?.startsWith("blob:") && URL.revokeObjectURL(p.url));
        return;
      }
      setPreviews(out);
    }

    loadPhotos();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => p.url?.startsWith("blob:") && URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="dc-page">
        <div className="dc-container">
          <h1 className="dc-title">Детайли за документ</h1>
          <p className="dc-muted">Зареждане…</p>
          <Link className="btn" to="/user/documents">
            ← Назад
          </Link>
        </div>

        <style>{docDetailsStyles}</style>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="dc-page">
        <div className="dc-container">
          <h1 className="dc-title">Детайли за документ</h1>
          <p className="dc-muted">{error || "Документът не е намерен."}</p>
          <Link className="btn" to="/user/documents">
            ← Назад
          </Link>
        </div>

        <style>{docDetailsStyles}</style>
      </div>
    );
  }

  const categoriesArr = Array.isArray(doc.categories) ? doc.categories : [];

  return (
    <div className="dc-page">
      <div className="dc-container">
        <div className="dc-headRow">
          <Link className="btn" to="/user/documents">
            ← Назад
          </Link>
          <h1 className="dc-title" style={{ margin: 0 }}>
            Детайли за документ
          </h1>
        </div>

        <div className="card dc-card" style={{ marginTop: 12 }}>
          <h3 className="dc-cardTitle" style={{ marginTop: 0 }}>
            Основна информация
          </h3>

          <div className="dc-kv">
            <div>
              <strong>Тип:</strong> {documentTypeLabel(doc.type)}
            </div>
            <div>
              <strong>Номер:</strong> {doc.docNumber || "—"}
            </div>

            <div>
              <strong>Статус:</strong>{" "}
              <span className={`dc-status ${expired ? "dc-status--bad" : "dc-status--ok"}`}>
                {expired ? "Невалиден" : "Валиден"}
              </span>
            </div>

            <div>
              <strong>Валиден до:</strong> {doc.validUntil ? formatDateBG(doc.validUntil) : "—"}
            </div>

            <div className="dc-sep" />

            <div>
              <strong>Име:</strong> {doc.firstName}
            </div>
            <div>
              <strong>Презиме:</strong> {doc.middleName}
            </div>
            <div>
              <strong>Фамилия:</strong> {doc.lastName}
            </div>

            <div>
              <strong>ЕГН:</strong> {doc.egn}
            </div>
            <div>
              <strong>Пол:</strong> {genderLabel(doc.gender)}
            </div>
            <div>
              <strong>Дата на раждане:</strong> {doc.dob || "—"}
            </div>
            <div>
              <strong>Място на раждане:</strong> {doc.birthPlace}
            </div>
            <div>
              <strong>Постоянен адрес:</strong> {doc.address}
            </div>
            <div>
              <strong>Издаден от:</strong> {doc.issuedAt}
            </div>

            {doc.type === DOCUMENT_TYPES.DRIVER_LICENSE && (
              <div>
                <strong>Категории:</strong> {categoriesArr.length > 0 ? categoriesArr.join(", ") : "—"}
              </div>
            )}
          </div>
        </div>

        <div className="card dc-card" style={{ marginTop: 12 }}>
          <h3 className="dc-cardTitle" style={{ marginTop: 0 }}>
            Снимки
          </h3>

          {previews.length === 0 ? (
            <p className="dc-muted" style={{ marginBottom: 0 }}>
              Няма намерени снимки за визуализация.
            </p>
          ) : (
            <>
              <div className="dc-photoGrid" style={{ marginTop: 10 }}>
                {previews.map((p, i) => (
                  <div key={i} className="dc-photoCard">
                    <div className="dc-photoLabel">{p.name}</div>

                    <img
                      src={p.url}
                      alt={p.name}
                      title="Кликни за цял екран"
                      onClick={() => setViewer({ url: p.url, name: p.name })}
                      className="dc-photoImg"
                    />
                  </div>
                ))}
              </div>

              <div className="dc-hint">* Клик върху снимка = цял екран. ESC или ✕ затваря.</div>
            </>
          )}
        </div>

        {viewer && (
          <div className="dc-viewerOverlay" onClick={() => setViewer(null)} role="dialog" aria-modal="true">
            <div className="dc-viewerBox" onClick={(e) => e.stopPropagation()}>
              <div className="dc-viewerHeader">
                <div className="dc-viewerTitle" title={viewer.name}>
                  {viewer.name}
                </div>
                <button className="dc-viewerClose" onClick={() => setViewer(null)} type="button" aria-label="Затвори">
                  ✕
                </button>
              </div>

              <img src={viewer.url} alt={viewer.name} className="dc-viewerImg" />
            </div>
          </div>
        )}
      </div>

      <style>{docDetailsStyles}</style>
    </div>
  );
}

const docDetailsStyles = `
  .dc-page{
    padding: 18px 0 34px 0;
    font-family:
      ui-rounded,
      "SF Pro Rounded",
      "Segoe UI Rounded",
      "Nunito",
      "Poppins",
      "Rubik",
      system-ui,
      -apple-system,
      "Segoe UI",
      Arial,
      sans-serif;
    color: #0f172a;
  }

  .dc-container{
    width: min(1100px, calc(100% - 32px));
    margin: 0 auto;
  }

  .dc-headRow{
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .dc-title{
    font-size: 34px;
    font-weight: 950;
    letter-spacing: 0.2px;
    margin: 0;
  }

  .dc-muted{
    color: #5a6576;
  }

  .dc-card{
    border-radius: 26px;
    background: linear-gradient(180deg, rgba(252,253,255,0.97), rgba(245,248,255,0.92));
    border: 1px solid rgba(46, 91, 255, 0.10);
    box-shadow:
      0 10px 26px rgba(16, 24, 40, 0.08),
      inset 0 1px 0 rgba(255,255,255,0.82);
    padding: 16px;
  }

  .dc-cardTitle{
    font-weight: 950;
    letter-spacing: 0.15px;
  }

  .dc-kv{
    display: grid;
    gap: 8px;
    color: #0f172a;
  }

  .dc-sep{
    height: 1px;
    background: rgba(15, 23, 42, 0.08);
    margin: 6px 0;
  }

  .dc-status{
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(46, 91, 255, 0.14);
    background: rgba(58, 141, 255, 0.10);
    font-weight: 900;
    letter-spacing: 0.15px;
  }
  .dc-status--ok{
    color: #0b3a1b;
    background: rgba(34, 197, 94, 0.10);
    border-color: rgba(34, 197, 94, 0.18);
  }
  .dc-status--bad{
    color: #7f1d1d;
    background: rgba(239, 68, 68, 0.10);
    border-color: rgba(239, 68, 68, 0.18);
  }

  .dc-photoGrid{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  @media (max-width: 760px){
    .dc-photoGrid{ grid-template-columns: 1fr; }
  }

  .dc-photoCard{
    border-radius: 20px;
    border: 1px solid rgba(46, 91, 255, 0.10);
    box-shadow: 0 10px 22px rgba(16, 24, 40, 0.06), inset 0 1px 0 rgba(255,255,255,0.78);
    background: linear-gradient(180deg, rgba(252,253,255,0.96), rgba(245,248,255,0.92));
    padding: 10px;
    transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, filter 140ms ease;
  }

  .dc-photoCard:hover{
    transform: translateY(-1px);
    border-color: rgba(46, 91, 255, 0.14);
    box-shadow: 0 14px 28px rgba(16, 24, 40, 0.10), inset 0 1px 0 rgba(255,255,255,0.78);
    filter: saturate(1.02);
  }

  .dc-photoLabel{
    font-size: 12px;
    font-weight: 900;
    color: #334155;
    margin-bottom: 8px;
  }

  .dc-photoImg{
    width: 100%;
    border-radius: 16px;
    display: block;
    max-height: 260px;
    object-fit: contain;
    background: rgba(15, 23, 42, 0.05);
    cursor: zoom-in;
  }

  .dc-hint{
    margin-top: 10px;
    font-size: 12px;
    color: #5a6576;
  }

  .dc-viewerOverlay{
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(6px);
    display: grid;
    place-items: center;
    padding: 18px;
    z-index: 9999;
  }

  .dc-viewerBox{
    width: min(1100px, 100%);
    max-height: 90vh;
    border-radius: 26px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.22);
    box-shadow: 0 26px 70px rgba(0,0,0,0.22);
    background: linear-gradient(180deg, rgba(252,253,255,0.98), rgba(245,248,255,0.95));
    display: flex;
    flex-direction: column;
  }

  .dc-viewerHeader{
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  }

  .dc-viewerTitle{
    font-weight: 950;
    color: #0f172a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dc-viewerClose{
    margin-left: auto;
    border: 1px solid rgba(46, 91, 255, 0.14);
    background: rgba(255,255,255,0.75);
    border-radius: 14px;
    width: 38px;
    height: 38px;
    cursor: pointer;
    font-weight: 950;
    color: #0f172a;
    transition: transform 140ms ease, box-shadow 140ms ease;
  }
  .dc-viewerClose:hover{
    transform: translateY(-1px);
    box-shadow: 0 12px 22px rgba(16, 24, 40, 0.10);
  }

  .dc-viewerImg{
    width: 100%;
    height: 100%;
    max-height: calc(90vh - 64px);
    object-fit: contain;
    background: rgba(15, 23, 42, 0.06);
    display: block;
  }
`;
