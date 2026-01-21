import "../../styles/transport-ui.css";
import { Link } from "react-router-dom";

export function TransportShell({ children, className = "" }) {
  return <div className={`tp-page ${className}`}>{children}</div>;
}

/* Optional helpers (ако искаш да ползваш компоненти вместо div/button) */
export function TransportHead({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <h1 style={{ margin: 0 }}>{title}</h1>
      {subtitle ? <p className="tp-muted" style={{ marginTop: 6 }}>{subtitle}</p> : null}
    </div>
  );
}

export function Card({ className = "", children, ...props }) {
  return (
    <div className={`card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function MiniCard({ className = "", children, ...props }) {
  return (
    <div className={`card ${className}`.trim()} style={{ borderRadius: 18, padding: 10, ...props.style }} {...props}>
      {children}
    </div>
  );
}

export function Badge({ className = "", children, ...props }) {
  return (
    <span className={`badge ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

export function Btn({ to, variant, className = "", children, ...props }) {
  const cls = [
    "btn",
    variant === "primary" ? "primary" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} type={props.type || "button"} {...props}>
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }) {
  return <input className={`input ${className}`.trim()} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`select ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}

export function FieldLabel({ children }) {
  return <div style={{ fontWeight: 800, marginBottom: 6 }}>{children}</div>;
}
