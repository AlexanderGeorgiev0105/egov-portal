import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout, getRole } from "../../auth/mockAuth";

export default function Navbar({ role }) {
  const navigate = useNavigate();

  const effectiveRole = useMemo(() => role || getRole(), [role]);
  const showLogout = effectiveRole === "user" || effectiveRole === "admin";
  const dashboardPath = effectiveRole === "admin" ? "/admin" : "/user";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="app-topbar">
      <div className="app-topbar__inner">
        <Link to={dashboardPath} className="app-topbar__brand" aria-label="Държавни услуги">
          Държавни услуги
        </Link>

        <div className="app-topbar__right">
          {showLogout && (
            <button onClick={handleLogout} className="app-ghostBtn" type="button">
              Изход
            </button>
          )}
        </div>
      </div>

      <style>{`
        .app-topbar{
          position: sticky;
          top: 0;
          z-index: 50;

          /* Lighter blue gradient */
          background: linear-gradient(90deg, #3a8dff 0%, #5aaeff 55%, #7bc7ff 100%);
          box-shadow: 0 12px 28px rgba(16, 24, 40, 0.14);
        }

        /* FULL WIDTH so logout can go maximum right */
        .app-topbar__inner{
          width: 100%;
          padding: 18px 24px; /* taller stripe */
          display: flex;
          align-items: center;
          justify-content: space-between;

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

        .app-topbar__brand{
          color: rgba(255,255,255,0.97);
          font-weight: 950;
          letter-spacing: 0.35px;
          text-decoration: none;
          font-size: 22px; /* bigger text */
          line-height: 1;
          padding: 10px 12px;
          border-radius: 16px;
          transition: background 140ms ease, transform 140ms ease;
        }

        .app-topbar__brand:hover{
          background: rgba(255,255,255,0.14);
          transform: translateY(-1px);
        }

        .app-topbar__right{
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .app-ghostBtn{
          border: 1px solid rgba(255,255,255,0.36);
          background: rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.96);
          padding: 10px 16px; /* slightly bigger */
          border-radius: 16px;
          cursor: pointer;
          font-weight: 850;
          letter-spacing: 0.2px;
          transition: transform 140ms ease, background 140ms ease, border-color 140ms ease;
        }

        .app-ghostBtn:hover{
          background: rgba(255,255,255,0.18);
          border-color: rgba(255,255,255,0.48);
          transform: translateY(-1px);
        }

        .app-ghostBtn:active{
          transform: translateY(0px);
        }
      `}</style>
    </header>
  );
}
