import "../../styles/documents-ui.css";

export function DocumentsShell({ children, className = "" }) {
  return <div className={`dc-page ${className}`}>{children}</div>;
}

export function DocumentsHead({ title, subtitle }) {
  return (
    <div className="dc-head">
      <h1 className="dc-title">{title}</h1>
      {subtitle ? <p className="dc-subtitle">{subtitle}</p> : null}
    </div>
  );
}
