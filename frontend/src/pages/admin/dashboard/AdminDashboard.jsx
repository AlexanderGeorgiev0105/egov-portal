import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { getRegistrationRequests } from "../../../auth/mockAuth";

export default function AdminDashboard() {
  const regCount = useMemo(() => {
    try {
      return getRegistrationRequests().length;
    } catch {
      return 0;
    }
  }, []);

  const docCount = useMemo(() => {
    try {
      return getPendingDocumentRequestsCount();
    } catch {
      return 0;
    }
  }, []);

  const healthPendingCount = useMemo(() => {
    try {
      return loadHealthRequests().filter((r) => r.status === HEALTH_REQUEST_STATUSES.PENDING).length;
    } catch {
      return 0;
    }
  }, []);

  const transportPendingCount = useMemo(() => {
    try {
      return getPendingVehicleRequestsCount();
    } catch {
      return 0;
    }
  }, []);

  const reportsPendingCount = useMemo(() => {
    try {
      return getPendingProblemReportsCount();
    } catch {
      return 0;
    }
  }, []);

  return (
    <div className="ud-page">
      <div className="ud-container">
        <div className="ud-headline">Административен панел</div>

        <div className="ud-grid">
          <Link to="/admin/property-requests" className="ud-card" style={{ textDecoration: "none" }}>
            <div className="ud-card__text">
              <h3 className="ud-card__title">Имотни заявки</h3>
              <div className="ud-card__desc">Преглед и обработка на заявки, свързани с имущество.</div>
            </div>
          </Link>

          <Link to="/admin/document-requests" className="ud-card" style={{ textDecoration: "none" }}>
            {docCount > 0 ? <div className="ad-badge">{docCount}</div> : null}
            <div className="ud-card__text">
              <h3 className="ud-card__title">Документи за самоличност</h3>
              <div className="ud-card__desc">
                Преглед и обработка на заявки за лична карта, паспорт и шофьорска книжка.
              </div>
            </div>
          </Link>

          <Link to="/admin/transport" className="ud-card" style={{ textDecoration: "none" }}>
            {transportPendingCount > 0 ? <div className="ad-badge">{transportPendingCount}</div> : null}
            <div className="ud-card__text">
              <h3 className="ud-card__title">Превозни средства и глоби</h3>
              <div className="ud-card__desc">Заявки за МПС/ГТП + изпращане на глоби към потребители.</div>
            </div>
          </Link>

          <Link to="/admin/reports" className="ud-card" style={{ textDecoration: "none" }}>
            {reportsPendingCount > 0 ? <div className="ad-badge">{reportsPendingCount}</div> : null}
            <div className="ud-card__text">
              <h3 className="ud-card__title">Сигнали</h3>
              <div className="ud-card__desc">
                Подадени проблеми от потребители (преглед, отхвърляне или маркиране като решени).
              </div>
            </div>
          </Link>

          <Link to="/admin/health" className="ud-card" style={{ textDecoration: "none" }}>
            {healthPendingCount > 0 ? <div className="ad-badge">{healthPendingCount}</div> : null}
            <div className="ud-card__text">
              <h3 className="ud-card__title">Здраве</h3>
              <div className="ud-card__desc">
                Лични лекари + обработка на заявки (чрез бутона „Заявки“ в страницата).
              </div>
            </div>
          </Link>

          <Link to="/admin/register-requests" className="ud-card" style={{ textDecoration: "none" }}>
            {regCount > 0 ? <div className="ad-badge">{regCount}</div> : null}
            <div className="ud-card__text">
              <h3 className="ud-card__title">Заявки за регистрация</h3>
              <div className="ud-card__desc">
                Преглед на регистрационни заявки, снимки и одобрение/отказ.
              </div>
            </div>
          </Link>
        </div>
      </div>

      <style>{`
        .ud-page{
          background: transparent;
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
        }

        .ud-container{
          width: min(1200px, calc(100% - 32px));
          margin: 0 auto;
        }

        .ud-headline{
          margin: 6px 0 16px 0;
          font-size: 26px;
          font-weight: 950;
          letter-spacing: 0.35px;
          color: #0f172a;
        }

        .ud-grid{
          width: 100%;
          display: grid;
          grid-template-columns: repeat(3, minmax(330px, 1fr));
          gap: 18px;
        }

        @media (max-width: 1120px){
          .ud-grid{ grid-template-columns: repeat(2, minmax(310px, 1fr)); }
        }
        @media (max-width: 680px){
          .ud-grid{ grid-template-columns: 1fr; }
        }

        .ud-card{
          position: relative;
          overflow: hidden;

          display: flex;
          align-items: center;

          border-radius: 26px;
          padding: 28px 28px;
          min-height: 160px;

          background: linear-gradient(180deg, rgba(252,253,255,0.97), rgba(245,248,255,0.92));
          border: 1px solid rgba(46, 91, 255, 0.10);
          box-shadow:
            0 10px 26px rgba(16, 24, 40, 0.08),
            inset 0 1px 0 rgba(255,255,255,0.82);

          transition:
            transform 140ms ease,
            box-shadow 140ms ease,
            background 140ms ease,
            border-color 140ms ease,
            filter 140ms ease;
          color: inherit;
        }

        .ud-card::after{
          content: "";
          position: absolute;
          right: -70px;
          top: -70px;
          width: 190px;
          height: 190px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(58,141,255,0.14), rgba(58,141,255,0.0) 65%);
          opacity: 0.45;
          transition: opacity 140ms ease, transform 140ms ease;
          pointer-events: none;
        }

        .ud-card:hover{
          border-color: rgba(46, 91, 255, 0.15);
          box-shadow:
            0 14px 34px rgba(16, 24, 40, 0.12),
            inset 0 1px 0 rgba(255,255,255,0.82);
          transform: translateY(-2px);
          filter: saturate(1.02);
          background: linear-gradient(180deg, rgba(248,251,255,0.98), rgba(238,246,255,0.95));
        }

        .ud-card:hover::after{
          opacity: 0.60;
          transform: translateY(6px);
        }

        .ud-card:active{ transform: translateY(-1px); }

        .ud-card__text{ min-width: 0; width: 100%; }

        .ud-card__title{
          margin: 0;
          font-size: 19px;
          line-height: 1.15;
          letter-spacing: 0.25px;
          color: #0f172a;
          font-weight: 950;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ud-card__desc{
          margin-top: 10px;
          color: #5a6576;
          font-size: 14px;
          line-height: 1.45;
          letter-spacing: 0.15px;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .ad-badge{
          position: absolute;
          top: 16px;
          right: 16px;
          min-width: 30px;
          height: 30px;
          padding: 0 10px;
          border-radius: 999px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.12px;

          border: 1px solid rgba(46, 91, 255, 0.14);
          background: rgba(238, 244, 255, 0.92);
          color: #1e3a8a;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.85);
        }
      `}</style>
    </div>
  );
}
