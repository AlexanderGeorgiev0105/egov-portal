import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import ChatBot from "../ChatBot/ChatBot";
import { UiAlertProvider } from "../../ui/UiAlertProvider";

export default function MainLayout({ role }) {
  return (
    <UiAlertProvider>
      <div className="app-shell">
        <Navbar role={role} />

        <main className="app-main">
          <div className="container app-container">
            <Outlet />
          </div>
        </main>

        {role === "user" ? <ChatBot /> : null}

        <style>{`
          .app-shell{
            min-height: 100vh;
            background:
              radial-gradient(1200px 600px at 85% 0%, rgba(123,199,255,0.10), rgba(255,255,255,0) 60%),
              radial-gradient(1000px 520px at 10% 20%, rgba(58,141,255,0.08), rgba(255,255,255,0) 55%),
              linear-gradient(180deg, rgba(245,248,255,0.55), rgba(255,255,255,0.35));

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

          .app-main{
            padding: 16px 0 32px 0;
          }

          .app-container{
            padding-top: 4px;
          }
        `}</style>
      </div>
    </UiAlertProvider>
  );
}
