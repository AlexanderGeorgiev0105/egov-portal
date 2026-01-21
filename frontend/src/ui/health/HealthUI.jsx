import "../../styles/health-ui.css";

export function HealthShell({ children, className = "" }) {
  return <div className={`hp-page ${className}`}>{children}</div>;
}
