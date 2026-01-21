import React from "react";
import { Link } from "react-router-dom";
import "../../styles/property-ui.css";

export function PropertyShell({ children, className = "" }) {
  return <div className={`pp-page ${className}`}>{children}</div>;
}

export function PropertyHead({ title, subtitle }) {
  return (
    <div className="pp-head">
      <h1 className="pp-title">{title}</h1>
      {subtitle ? <p className="pp-subtitle">{subtitle}</p> : null}
    </div>
  );
}

export function HeadRow({ children, className = "" }) {
  return <div className={`pp-headRow ${className}`}>{children}</div>;
}

export function Card({ children, className = "", padded = true, ...props }) {
  return (
    <div className={`pp-card ${padded ? "pp-card--pad" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function MiniCard({ children, className = "", ...props }) {
  return (
    <div className={`pp-miniCard ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "default", className = "" }) {
  const toneCls = tone === "neutral" ? "pp-badge--neutral" : "";
  return <span className={`pp-badge ${toneCls} ${className}`}>{children}</span>;
}

export function FieldLabel({ children }) {
  return <div className="pp-label">{children}</div>;
}

export function Input({ className = "", ...props }) {
  return <input className={`pp-input ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`pp-input ${className}`} {...props}>
      {children}
    </select>
  );
}

/**
 * Btn:
 * - If `to` is set -> renders <Link>
 * - else renders <button>
 * ✅ Handles disabled for Link using aria-disabled + preventDefault
 */
export function Btn({ to, variant = "default", className = "", children, disabled, onClick, ...props }) {
  const cls = `pp-btn ${variant === "primary" ? "pp-btn--primary" : ""} ${to ? "pp-linkBtn" : ""} ${className}`;

  if (to) {
    return (
      <Link
        to={to}
        className={cls}
        aria-disabled={disabled ? "true" : "false"}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} disabled={disabled} onClick={onClick} {...props}>
      {children}
    </button>
  );
}